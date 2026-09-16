const DEMO_ROLE_PROFILES = {
    'Technician III': {
        actingTechnicianId: 'tech-003',
        editOwnHypothetical: true,
        editOwnIssued: false,
        editOthers: false,
        resetDemo: false,
        label: 'Self-service planning'
    },
    'Technician IV': {
        actingTechnicianId: 'tech-002',
        editOwnHypothetical: true,
        editOwnIssued: true,
        editOthers: false,
        resetDemo: false,
        label: 'Advanced self-service'
    },
    'Supervisor': {
        actingTechnicianId: 'tech-001',
        editOwnHypothetical: true,
        editOwnIssued: true,
        editOthers: true,
        resetDemo: false,
        label: 'Team equipment management'
    },
    'Admin': {
        actingTechnicianId: null,
        editOwnHypothetical: true,
        editOwnIssued: true,
        editOthers: true,
        resetDemo: true,
        label: 'Full prototype administration'
    }
};

const permissionBanner = document.getElementById('permission-banner');
const resetDemoButton = document.getElementById('reset-demo-button');
const newLoadoutButton = document.getElementById('new-loadout-button');
let previousDemoRole = roleSelect.value;

function getActiveRoleProfile() {
    return DEMO_ROLE_PROFILES[roleSelect.value] || DEMO_ROLE_PROFILES['Technician III'];
}

function getActingTechnician() {
    const id = getActiveRoleProfile().actingTechnicianId;
    return id ? state.technicians.find(technician => technician.id === id) || null : null;
}

function isViewingOwnTechnician() {
    const profile = getActiveRoleProfile();
    return Boolean(profile.actingTechnicianId && profile.actingTechnicianId === currentTechnicianId);
}

function canEditCurrentLoadout() {
    const profile = getActiveRoleProfile();
    const loadout = getCurrentLoadout();

    if (!loadout) return false;
    if (profile.editOthers) return true;
    if (!isViewingOwnTechnician()) return false;

    if (loadout.type === 'issued') return profile.editOwnIssued;
    return profile.editOwnHypothetical;
}

function canCreateHypotheticalLoadout() {
    const profile = getActiveRoleProfile();
    if (profile.editOthers) return true;
    return isViewingOwnTechnician() && profile.editOwnHypothetical;
}

function permissionModeText() {
    const technician = getCurrentTechnician();
    const loadout = getCurrentLoadout();
    const profile = getActiveRoleProfile();

    if (profile.editOthers) return 'Editable';
    if (!isViewingOwnTechnician()) return `Read only · ${technician?.name || 'Other technician'}`;
    if (loadout?.type === 'issued' && !profile.editOwnIssued) return 'Read only · Issued loadout';
    return 'Editable';
}

function renderPermissionBanner() {
    if (!permissionBanner) return;

    const profile = getActiveRoleProfile();
    const actingTechnician = getActingTechnician();
    const viewedTechnician = getCurrentTechnician();
    const editable = canEditCurrentLoadout();
    const admin = roleSelect.value === 'Admin';

    permissionBanner.classList.toggle('read-only', !editable);
    permissionBanner.classList.toggle('admin-access', admin);

    const identityText = actingTechnician
        ? `Acting as <strong>${escapeHtml(actingTechnician.name)}</strong>`
        : 'Acting as <strong>Prototype Administrator</strong>';

    const selfButton = actingTechnician && actingTechnician.id !== currentTechnicianId
        ? '<button type="button" class="permission-self-button" id="permission-view-self">View my loadout</button>'
        : '';

    const capability = (label, allowed) => `<span class="permission-capability ${allowed ? 'allowed' : 'denied'}">${escapeHtml(label)}</span>`;

    permissionBanner.innerHTML = `
        <div class="permission-banner-main">
            <span class="permission-role-pill">${escapeHtml(roleSelect.value)}</span>
            <span>${identityText}</span>
            <span class="permission-context-separator">•</span>
            <span>Viewing <strong>${escapeHtml(viewedTechnician?.name || 'No technician')}</strong></span>
            <span class="permission-mode-pill ${editable ? 'editable' : 'read-only'}">${escapeHtml(permissionModeText())}</span>
            ${selfButton}
        </div>
        <div class="permission-capabilities" aria-label="Demo role capabilities">
            ${capability('Create saved loadouts', profile.editOwnHypothetical || profile.editOthers)}
            ${capability('Edit own issued loadout', profile.editOwnIssued || profile.editOthers)}
            ${capability('Edit other technicians', profile.editOthers)}
            ${capability('View team & inventory', true)}
            ${capability('Reset demo data', profile.resetDemo)}
        </div>
    `;

    const viewSelfButton = document.getElementById('permission-view-self');
    if (viewSelfButton) {
        viewSelfButton.addEventListener('click', () => {
            const acting = getActingTechnician();
            if (!acting || acting.id === currentTechnicianId) return;

            if (isDirty() && !window.confirm('Discard unsaved changes and open your demo user loadout?')) return;
            if (isDirty()) discardChanges();

            technicianSelect.value = acting.id;
            technicianSelect.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }
}

function applyPermissionState() {
    const profile = getActiveRoleProfile();
    const editable = canEditCurrentLoadout();
    const canCreate = canCreateHypotheticalLoadout();
    const loadoutLayout = document.querySelector('.loadout-layout');

    loadoutLayout?.classList.toggle('permission-read-only', !editable);

    if (saveButton) {
        saveButton.disabled = !isDirty() || !editable;
        saveButton.title = editable ? '' : 'This demo role cannot save changes to this loadout.';
    }

    if (discardButton) {
        discardButton.disabled = !isDirty();
    }

    if (saveAsButton) {
        saveAsButton.disabled = !canCreate;
        saveAsButton.title = canCreate ? '' : 'This demo role cannot create a saved loadout for this technician.';
    }

    if (newLoadoutButton) {
        newLoadoutButton.disabled = !canCreate;
        newLoadoutButton.title = canCreate ? '' : 'This demo role cannot create a loadout for this technician.';
    }

    if (resetDemoButton) {
        resetDemoButton.disabled = !profile.resetDemo;
        resetDemoButton.title = profile.resetDemo ? '' : 'Reset Demo Data is restricted to the Admin demo role.';
    }

    document.querySelectorAll('.interactive-inventory').forEach(card => {
        card.classList.toggle('permission-locked', !editable);
        if (!editable) {
            card.setAttribute('aria-disabled', 'true');
            card.setAttribute('draggable', 'false');
        }
    });

    document.querySelectorAll('.clock-chip:not(:disabled)').forEach(chip => {
        chip.classList.toggle('permission-locked', !editable);
        chip.setAttribute('aria-disabled', editable ? 'false' : 'true');
    });

    const clearButton = document.getElementById('clear-selected-slot');
    if (clearButton) {
        clearButton.disabled = !editable;
        clearButton.title = editable ? '' : 'This loadout is read only for the selected demo role.';
    }

    renderPermissionBanner();
}

function permissionBlockedMessage() {
    const profile = getActiveRoleProfile();
    const technician = getCurrentTechnician();
    const loadout = getCurrentLoadout();

    if (!profile.editOthers && !isViewingOwnTechnician()) {
        return `${roleSelect.value} can view ${technician?.name || 'this technician'} but cannot edit another technician's loadout in this prototype.`;
    }

    if (loadout?.type === 'issued' && !profile.editOwnIssued && isViewingOwnTechnician()) {
        return `${roleSelect.value} can plan saved loadouts, but the issued loadout is read only.`;
    }

    return `${roleSelect.value} does not have permission for that action in this prototype.`;
}

function blockPermissionEvent(event, message = permissionBlockedMessage()) {
    event.preventDefault();
    event.stopImmediatePropagation();
    showToast(message);
}

function switchDemoRole(nextRole) {
    const profile = DEMO_ROLE_PROFILES[nextRole];
    if (!profile) return;

    if (isDirty()) {
        const shouldDiscard = window.confirm('Switching demo roles will discard unsaved loadout changes. Continue?');
        if (!shouldDiscard) {
            roleSelect.value = previousDemoRole;
            applyPermissionState();
            return;
        }
        discardChanges();
    }

    previousDemoRole = nextRole;

    if (profile.actingTechnicianId && profile.actingTechnicianId !== currentTechnicianId) {
        const actingTechnician = state.technicians.find(technician => technician.id === profile.actingTechnicianId);
        if (actingTechnician) {
            currentTechnicianId = actingTechnician.id;
            currentLoadoutName = actingTechnician.loadout || 'Issued Loadout';
            populateTechnicians();
            populateLoadouts();
            loadDraftFromSelection();
        }
    } else {
        applyPermissionState();
    }

    const actingName = getActingTechnician()?.name || 'Prototype Administrator';
    showToast(`Demo role switched to ${nextRole} · ${actingName}.`);
}

roleSelect.addEventListener('change', event => {
    event.stopImmediatePropagation();
    switchDemoRole(event.target.value);
}, true);

document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (target.closest('#reset-demo-button') && !getActiveRoleProfile().resetDemo) {
        blockPermissionEvent(event, 'Reset Demo Data is restricted to the Admin demo role.');
        return;
    }

    if ((target.closest('#new-loadout-button') || target.closest('#save-as-button')) && !canCreateHypotheticalLoadout()) {
        blockPermissionEvent(event);
        return;
    }

    if (target.closest('#save-button') && !canEditCurrentLoadout()) {
        blockPermissionEvent(event);
        return;
    }

    if ((target.closest('.interactive-inventory') || target.closest('#clear-selected-slot') || target.closest('.clock-chip')) && !canEditCurrentLoadout()) {
        blockPermissionEvent(event);
    }
}, true);

document.addEventListener('keydown', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || !['Enter', ' '].includes(event.key)) return;

    if ((target.closest('.interactive-inventory') || target.closest('.clock-chip')) && !canEditCurrentLoadout()) {
        blockPermissionEvent(event);
    }
}, true);

document.addEventListener('dragstart', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('.interactive-inventory') && !canEditCurrentLoadout()) {
        blockPermissionEvent(event);
    }
}, true);

document.addEventListener('drop', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('.interactive-slot') && !canEditCurrentLoadout()) {
        blockPermissionEvent(event);
    }
}, true);

const baseRenderDraftUI = renderDraftUI;
renderDraftUI = function renderDraftUIWithPermissions() {
    baseRenderDraftUI();
    applyPermissionState();
};

const baseRenderInventory = renderInventory;
renderInventory = function renderInventoryWithPermissions(filter = '') {
    baseRenderInventory(filter);
    applyPermissionState();
};

applyPermissionState();
