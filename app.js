const STORAGE_KEY = 'frcc-campus-safety-equipment-prototype-v2';

let state = loadState();
let currentView = 'loadout-view';
let currentTechnicianId = state.technicians[0]?.id || null;
let currentLoadoutName = state.technicians[0]?.loadout || 'Issued Loadout';
let selectedSlotId = null;
let draftAssignments = {};
let savedAssignmentsSnapshot = {};

const technicianSelect = document.getElementById('technician-select');
const roleSelect = document.getElementById('role-select');
const loadoutSelect = document.getElementById('loadout-select');
const slotGrid = document.getElementById('slot-grid');
const beltClockRow = document.getElementById('belt-clock-row');
const inventoryList = document.getElementById('inventory-list');
const inventorySearch = document.getElementById('inventory-search');
const inventoryCount = document.getElementById('inventory-count');
const inventoryTable = document.getElementById('inventory-table');
const teamLineup = document.getElementById('team-lineup');
const teamCards = document.getElementById('team-cards');
const toast = document.getElementById('toast');
const loadoutStatusPill = document.querySelector('.equipment-panel .status-pill');
const saveButton = document.getElementById('save-button');
const discardButton = document.getElementById('discard-button');
const saveAsButton = document.getElementById('save-as-button');
const mannequin = document.querySelector('.mannequin');

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return deepClone(defaultDemoState);

    try {
        const parsed = JSON.parse(saved);
        if (!parsed.loadouts || !parsed.inventory || !parsed.equipmentSlots) {
            throw new Error('Saved data is from an older prototype version.');
        }
        return parsed;
    } catch (error) {
        console.warn('Saved prototype data could not be read. Resetting to defaults.', error);
        return deepClone(defaultDemoState);
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function getCurrentTechnician() {
    return state.technicians.find(tech => tech.id === currentTechnicianId) || null;
}

function getCurrentLoadout() {
    return state.loadouts[currentTechnicianId]?.[currentLoadoutName] || null;
}

function getSlot(slotId) {
    return state.equipmentSlots.find(slot => slot.id === slotId) || null;
}

function getInventoryItem(itemId) {
    return state.inventory.find(item => item.id === itemId) || null;
}

function getAssignmentLabel(assignment) {
    if (!assignment) return 'Empty';
    const item = getInventoryItem(assignment);
    return item ? `${item.name} · ${item.id}` : assignment;
}

function getShortAssignmentLabel(assignment) {
    if (!assignment) return 'Open';
    const item = getInventoryItem(assignment);
    return item ? item.name : assignment;
}

function isDirty() {
    return JSON.stringify(draftAssignments) !== JSON.stringify(savedAssignmentsSnapshot);
}

function slotIsDirty(slotId) {
    return draftAssignments[slotId] !== savedAssignmentsSnapshot[slotId];
}

function populateTechnicians() {
    technicianSelect.innerHTML = state.technicians
        .map(tech => `<option value="${tech.id}">${tech.name} · ${tech.role}</option>`)
        .join('');
    technicianSelect.value = currentTechnicianId;
}

function populateLoadouts() {
    const loadouts = state.loadouts[currentTechnicianId] || {};
    const names = Object.keys(loadouts);

    if (!names.includes(currentLoadoutName)) {
        currentLoadoutName = names[0] || 'Issued Loadout';
    }

    loadoutSelect.innerHTML = names
        .map(name => {
            const type = loadouts[name]?.type === 'issued' ? 'Issued' : 'Saved';
            return `<option value="${name}">${name} · ${type}</option>`;
        })
        .join('');
    loadoutSelect.value = currentLoadoutName;
}

function loadDraftFromSelection() {
    const loadout = getCurrentLoadout();
    draftAssignments = deepClone(loadout?.assignments || {});
    savedAssignmentsSnapshot = deepClone(draftAssignments);
    selectedSlotId = null;
    inventorySearch.value = '';
    renderDraftUI();
}

function selectSlot(slotId) {
    const slot = getSlot(slotId);
    if (!slot) return;

    selectedSlotId = slotId;
    renderDraftUI();
    showToast(`Selected ${slot.label}. Choose compatible equipment from the inventory.`);
}

function canUseItem(item) {
    const technician = getCurrentTechnician();
    if (!technician) return false;
    return item.status === 'Available' || item.assignedTo === technician.name;
}

function equipItem(itemId, destinationSlotId = null) {
    const item = getInventoryItem(itemId);
    if (!item) return;

    const slotId = destinationSlotId || selectedSlotId || item.slotId;
    const slot = getSlot(slotId);
    if (!slot) return;

    if (item.slotId !== slot.id) {
        showToast(`${item.name} is not compatible with the ${slot.label} slot.`);
        return;
    }

    if (!canUseItem(item)) {
        showToast(`${item.name} is currently assigned to ${item.assignedTo || 'another user'} and cannot be selected.`);
        return;
    }

    selectedSlotId = slot.id;
    draftAssignments[slot.id] = item.id;
    renderDraftUI();
    showToast(`${item.name} staged in ${slot.label}. Inventory will not change until you save.`);
}

function clearSlot(slotId) {
    const slot = getSlot(slotId);
    if (!slot) return;
    draftAssignments[slotId] = null;
    selectedSlotId = slotId;
    renderDraftUI();
    showToast(`${slot.label} cleared in the draft. Save validation will require a replacement.`);
}

function renderSlots() {
    slotGrid.innerHTML = state.equipmentSlots
        .map(slot => {
            const assignment = draftAssignments[slot.id];
            const dirtyClass = slotIsDirty(slot.id) ? ' dirty-slot' : '';
            const selectedClass = selectedSlotId === slot.id ? ' selected-slot' : '';
            const emptyClass = !assignment ? ' empty-slot' : '';
            return `
                <article
                    class="slot-card interactive-slot${dirtyClass}${selectedClass}${emptyClass}"
                    data-slot-id="${slot.id}"
                    tabindex="0"
                    role="button"
                    aria-pressed="${selectedSlotId === slot.id ? 'true' : 'false'}"
                    title="Select ${slot.label}"
                >
                    <strong>${slot.label}</strong>
                    <span>${getAssignmentLabel(assignment)}</span>
                    <small>${slotIsDirty(slot.id) ? 'Unsaved change' : 'Click to select'}</small>
                </article>
            `;
        })
        .join('');

    slotGrid.querySelectorAll('.interactive-slot').forEach(card => {
        const slotId = card.dataset.slotId;
        card.addEventListener('click', () => selectSlot(slotId));
        card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectSlot(slotId);
            }
        });
        card.addEventListener('dragover', event => {
            event.preventDefault();
            card.classList.add('drag-over');
        });
        card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
        card.addEventListener('drop', event => {
            event.preventDefault();
            card.classList.remove('drag-over');
            const itemId = event.dataTransfer.getData('text/plain');
            equipItem(itemId, slotId);
        });
    });
}

function renderBeltClock() {
    beltClockRow.innerHTML = state.beltPositions
        .map(position => {
            const assignment = position.slotId ? draftAssignments[position.slotId] : null;
            const selectedClass = position.slotId && position.slotId === selectedSlotId ? ' selected-clock-chip' : '';
            return `
                <button
                    class="clock-chip${selectedClass}"
                    ${position.slotId ? `data-slot-id="${position.slotId}"` : 'disabled'}
                    title="${position.slotId ? getAssignmentLabel(assignment) : 'Open belt position'}"
                >
                    <strong>${position.position}</strong><br>
                    <span>${position.slotId ? getShortAssignmentLabel(assignment) : 'Open'}</span>
                </button>
            `;
        })
        .join('');

    beltClockRow.querySelectorAll('.clock-chip[data-slot-id]').forEach(button => {
        button.addEventListener('click', () => selectSlot(button.dataset.slotId));
    });
}

function inventoryStatusLabel(item) {
    const technician = getCurrentTechnician();
    if (item.assignedTo === technician?.name) return 'Assigned to this technician';
    if (item.status === 'Available') return 'Available';
    if (item.status === 'Maintenance') return 'Maintenance';
    return `Assigned to ${item.assignedTo || 'another technician'}`;
}

function renderInventory(filter = '') {
    const normalized = filter.trim().toLowerCase();
    const slot = selectedSlotId ? getSlot(selectedSlotId) : null;

    const filtered = state.inventory.filter(item => {
        if (slot && item.slotId !== slot.id) return false;
        const haystack = `${item.id} ${item.name} ${item.category} ${item.status} ${item.condition} ${item.assignedTo}`.toLowerCase();
        return haystack.includes(normalized);
    });

    inventoryCount.textContent = slot ? `${slot.label} · ${filtered.length}` : `${filtered.length} items`;

    const hint = slot
        ? `<div class="inventory-hint"><strong>${slot.label}</strong><span>Click an item or drag it onto the selected slot.</span><button type="button" id="clear-selected-slot">Clear Slot</button></div>`
        : '<div class="inventory-hint"><strong>Select an equipment slot</strong><span>Then choose a compatible inventory item. You can also click any available item below to target its matching slot.</span></div>';

    const cards = filtered.map(item => {
        const usable = canUseItem(item);
        const selected = draftAssignments[item.slotId] === item.id;
        const statusClass = usable ? 'availability' : 'availability unavailable';
        return `
            <article
                class="inventory-card interactive-inventory${usable ? '' : ' blocked-item'}${selected ? ' selected-item' : ''}"
                data-item-id="${item.id}"
                data-slot-id="${item.slotId}"
                ${usable ? 'tabindex="0" role="button" draggable="true"' : 'aria-disabled="true"'}
            >
                <div class="item-name">${item.name}</div>
                <div class="item-meta">
                    <span>${item.id}</span>
                    <span class="${statusClass}">${inventoryStatusLabel(item)}</span>
                </div>
                <div class="item-meta">
                    <span>${item.category}</span>
                    <span>${item.condition}</span>
                </div>
                ${selected ? '<div class="equipped-badge">Staged in loadout</div>' : ''}
            </article>
        `;
    }).join('') || '<p>No compatible equipment matches that search.</p>';

    inventoryList.innerHTML = hint + cards;

    const clearButton = document.getElementById('clear-selected-slot');
    if (clearButton) clearButton.addEventListener('click', () => clearSlot(selectedSlotId));

    inventoryList.querySelectorAll('.interactive-inventory:not(.blocked-item)').forEach(card => {
        const itemId = card.dataset.itemId;
        card.addEventListener('click', () => equipItem(itemId, card.dataset.slotId));
        card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                equipItem(itemId, card.dataset.slotId);
            }
        });
        card.addEventListener('dragstart', event => {
            event.dataTransfer.setData('text/plain', itemId);
            event.dataTransfer.effectAllowed = 'move';
            card.classList.add('dragging-item');
        });
        card.addEventListener('dragend', () => card.classList.remove('dragging-item'));
    });
}

function renderMannequin() {
    if (!mannequin) return;

    mannequin.classList.remove('has-cap', 'has-beanie', 'has-boots');
    mannequin.querySelectorAll('.gear-marker').forEach(marker => marker.remove());

    const hatName = getShortAssignmentLabel(draftAssignments.hat).toLowerCase();
    if (hatName.includes('beanie')) mannequin.classList.add('has-beanie');
    else if (draftAssignments.hat) mannequin.classList.add('has-cap');

    const footwearName = getShortAssignmentLabel(draftAssignments.footwear).toLowerCase();
    if (footwearName.includes('boot')) mannequin.classList.add('has-boots');

    const markerConfig = {
        mic: { label: 'MIC', className: 'gear-mic' },
        'name-badge': { label: 'ID', className: 'gear-name-badge' },
        radio: { label: 'R', className: 'gear-radio' },
        keys: { label: 'K', className: 'gear-keys' },
        'access-card': { label: 'AC', className: 'gear-access-card' },
        flashlight: { label: 'F', className: 'gear-flashlight' },
        gloves: { label: 'G', className: 'gear-gloves' },
        handcuffs: { label: 'HC', className: 'gear-handcuffs' },
        tourniquet: { label: 'TQ', className: 'gear-tourniquet' },
        cpr: { label: 'CPR', className: 'gear-cpr' },
        baton: { label: 'B', className: 'gear-baton' }
    };

    Object.entries(markerConfig).forEach(([slotId, config]) => {
        const assignment = draftAssignments[slotId];
        if (!assignment) return;
        const marker = document.createElement('span');
        marker.className = `gear-marker ${config.className}${selectedSlotId === slotId ? ' selected-gear-marker' : ''}`;
        marker.textContent = config.label;
        marker.title = getAssignmentLabel(assignment);
        marker.dataset.slotId = slotId;
        marker.addEventListener('click', event => {
            event.stopPropagation();
            selectSlot(slotId);
        });
        mannequin.appendChild(marker);
    });
}

function updateLoadoutStatus() {
    const missing = state.equipmentSlots.filter(slot => slot.required && !draftAssignments[slot.id]);
    const dirty = isDirty();

    loadoutStatusPill.classList.remove('success', 'warning', 'danger');

    if (missing.length) {
        loadoutStatusPill.textContent = `${missing.length} Missing`;
        loadoutStatusPill.classList.add('danger');
    } else if (dirty) {
        loadoutStatusPill.textContent = 'Unsaved';
        loadoutStatusPill.classList.add('warning');
    } else {
        loadoutStatusPill.textContent = 'Complete';
        loadoutStatusPill.classList.add('success');
    }

    discardButton.disabled = !dirty;
    saveButton.disabled = !dirty;
}

function renderDraftUI() {
    renderSlots();
    renderBeltClock();
    renderInventory(inventorySearch.value || '');
    renderMannequin();
    updateLoadoutStatus();
}

function renderInventoryTable() {
    inventoryTable.innerHTML = `
        <table class="inventory-table">
            <thead>
                <tr>
                    <th>Asset</th>
                    <th>Item</th>
                    <th>Slot</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Condition</th>
                    <th>Assigned To</th>
                </tr>
            </thead>
            <tbody>
                ${state.inventory.map(item => `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.name}</td>
                        <td>${getSlot(item.slotId)?.label || item.slotId}</td>
                        <td>${item.category}</td>
                        <td>${item.status}</td>
                        <td>${item.condition}</td>
                        <td>${item.assignedTo || '—'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function memberClass(role, type) {
    if (type === 'open') return 'open-position';
    if (role === 'Supervisor') return 'supervisor';
    if (role === 'Technician IV') return 'tech-iv';
    return 'tech-iii';
}

function mannequinMarkup() {
    return `
        <div class="team-mannequin" aria-hidden="true">
            <div class="head"></div>
            <div class="torso"></div>
            <div class="arm left"></div>
            <div class="arm right"></div>
            <div class="leg left"></div>
            <div class="leg right"></div>
        </div>
    `;
}

function renderTeam() {
    const filled = [];
    const open = [];

    state.teamPositions.forEach(position => {
        if (position.type === 'open') {
            open.push(position);
            return;
        }

        const tech = state.technicians.find(item => item.id === position.technicianId);
        if (tech) filled.push({ ...position, tech });
    });

    const supervisor = filled.find(item => item.tech.role === 'Supervisor');
    const techIV = filled.find(item => item.tech.role === 'Technician IV');
    const techIIIs = filled.filter(item => item.tech.role === 'Technician III');

    const leftSide = [];
    const rightSide = [];

    techIIIs.forEach((item, index) => {
        if (index % 2 === 0) leftSide.unshift(item);
        else rightSide.push(item);
    });

    const arranged = [
        ...leftSide,
        ...(supervisor ? [supervisor] : []),
        ...(techIV ? [techIV] : []),
        ...rightSide,
        ...open
    ];

    teamLineup.innerHTML = arranged.map(item => {
        if (item.type === 'open') {
            return `
                <article class="team-member open-position">
                    ${mannequinMarkup()}
                    <div class="member-name">Open Position</div>
                    <div class="member-role">${item.role || 'Technician III'}</div>
                </article>
            `;
        }

        return `
            <article class="team-member ${memberClass(item.tech.role, item.type)}">
                ${mannequinMarkup()}
                <div class="member-name">${item.tech.name}</div>
                <div class="member-role">${item.tech.role}</div>
            </article>
        `;
    }).join('');

    teamCards.innerHTML = arranged.map(item => {
        if (item.type === 'open') {
            return `
                <article class="team-card">
                    <strong>Open Position</strong><br>
                    <small>${item.role || 'Technician III'} · Loadout: Open Position</small>
                </article>
            `;
        }

        return `
            <article class="team-card">
                <strong>${item.tech.name}</strong><br>
                <small>${item.tech.role} · ${item.tech.loadout} · ${item.tech.status}</small>
            </article>
        `;
    }).join('');
}

function switchView(viewId) {
    currentView = viewId;

    document.querySelectorAll('.view').forEach(view => {
        view.classList.toggle('active-view', view.id === viewId);
    });

    document.querySelectorAll('.nav-button[data-view]').forEach(button => {
        button.classList.toggle('active', button.dataset.view === viewId);
    });
}

function validateDraft() {
    const technician = getCurrentTechnician();
    const errors = [];

    state.equipmentSlots.forEach(slot => {
        const assignment = draftAssignments[slot.id];
        if (slot.required && !assignment) {
            errors.push(`${slot.label} is empty.`);
            return;
        }

        const item = getInventoryItem(assignment);
        if (!item) {
            errors.push(`${slot.label} references an unknown inventory item.`);
            return;
        }

        if (item.status === 'Maintenance') {
            errors.push(`${item.name} (${item.id}) is in maintenance.`);
        } else if (item.status === 'Assigned' && item.assignedTo !== technician?.name) {
            errors.push(`${item.name} (${item.id}) is assigned to ${item.assignedTo}.`);
        }
    });

    return errors;
}

function applyIssuedInventoryChanges() {
    const technician = getCurrentTechnician();
    if (!technician) return;

    state.equipmentSlots.forEach(slot => {
        const oldId = savedAssignmentsSnapshot[slot.id];
        const newId = draftAssignments[slot.id];
        if (oldId === newId) return;

        const oldItem = getInventoryItem(oldId);
        const newItem = getInventoryItem(newId);

        if (oldItem && oldItem.assignedTo === technician.name) {
            oldItem.status = 'Available';
            oldItem.assignedTo = '';
        }

        if (newItem) {
            newItem.status = 'Assigned';
            newItem.assignedTo = technician.name;
        }
    });
}

function saveCurrentLoadout() {
    if (!isDirty()) return;

    const errors = validateDraft();
    if (errors.length) {
        showToast(`Unable to save: ${errors[0]}`);
        return;
    }

    const loadout = getCurrentLoadout();
    const technician = getCurrentTechnician();
    if (!loadout || !technician) return;

    if (loadout.type === 'issued') {
        applyIssuedInventoryChanges();
    }

    loadout.assignments = deepClone(draftAssignments);
    technician.loadout = currentLoadoutName;
    savedAssignmentsSnapshot = deepClone(draftAssignments);
    saveState();
    renderInventoryTable();
    renderTeam();
    renderDraftUI();

    if (loadout.type === 'issued') {
        showToast('Issued loadout saved. Larimer prototype inventory has been updated.');
    } else {
        showToast('Hypothetical loadout saved. Inventory was not changed.');
    }
}

function saveLoadoutAs() {
    const technician = getCurrentTechnician();
    if (!technician) return;

    const proposedName = window.prompt('Name this hypothetical loadout:', `${currentLoadoutName} Copy`);
    if (!proposedName) return;

    const name = proposedName.trim();
    if (!name) return;

    if (state.loadouts[currentTechnicianId][name]) {
        showToast('A loadout with that name already exists.');
        return;
    }

    state.loadouts[currentTechnicianId][name] = {
        type: 'hypothetical',
        assignments: deepClone(draftAssignments)
    };
    currentLoadoutName = name;
    technician.loadout = name;
    savedAssignmentsSnapshot = deepClone(draftAssignments);
    saveState();
    populateLoadouts();
    renderTeam();
    renderDraftUI();
    showToast(`${name} saved as a hypothetical loadout. Inventory was not changed.`);
}

function createNewLoadout() {
    const technician = getCurrentTechnician();
    if (!technician) return;

    const proposedName = window.prompt('Name the new hypothetical loadout:', 'New Loadout');
    if (!proposedName) return;

    const name = proposedName.trim();
    if (!name) return;

    if (state.loadouts[currentTechnicianId][name]) {
        showToast('A loadout with that name already exists.');
        return;
    }

    state.loadouts[currentTechnicianId][name] = {
        type: 'hypothetical',
        assignments: deepClone(draftAssignments)
    };
    currentLoadoutName = name;
    technician.loadout = name;
    savedAssignmentsSnapshot = deepClone(draftAssignments);
    saveState();
    populateLoadouts();
    renderTeam();
    renderDraftUI();
    showToast(`${name} created from the current loadout.`);
}

function discardChanges() {
    draftAssignments = deepClone(savedAssignmentsSnapshot);
    renderDraftUI();
    showToast('Unsaved loadout changes discarded.');
}

function resetDemoData() {
    state = deepClone(defaultDemoState);
    localStorage.removeItem(STORAGE_KEY);
    currentTechnicianId = state.technicians[0]?.id || null;
    currentLoadoutName = state.technicians[0]?.loadout || 'Issued Loadout';
    selectedSlotId = null;
    populateTechnicians();
    populateLoadouts();
    loadDraftFromSelection();
    renderInventoryTable();
    renderTeam();
    showToast('Demo data reset to the original Larimer prototype state.');
}

function confirmDiscardIfNeeded() {
    if (!isDirty()) return true;
    return window.confirm('Discard your unsaved loadout changes?');
}

document.querySelectorAll('.nav-button[data-view]').forEach(button => {
    button.addEventListener('click', () => switchView(button.dataset.view));
});

inventorySearch.addEventListener('input', event => renderInventory(event.target.value));

roleSelect.addEventListener('change', () => {
    showToast(`Demo permissions switched to ${roleSelect.value}.`);
});

technicianSelect.addEventListener('change', event => {
    if (!confirmDiscardIfNeeded()) {
        technicianSelect.value = currentTechnicianId;
        return;
    }

    currentTechnicianId = event.target.value;
    const selected = getCurrentTechnician();
    currentLoadoutName = selected?.loadout || 'Issued Loadout';
    populateLoadouts();
    loadDraftFromSelection();
    showToast(`Viewing ${selected?.name || 'technician'}.`);
});

loadoutSelect.addEventListener('change', event => {
    const previous = currentLoadoutName;
    if (!confirmDiscardIfNeeded()) {
        loadoutSelect.value = previous;
        return;
    }

    currentLoadoutName = event.target.value;
    loadDraftFromSelection();
    const type = getCurrentLoadout()?.type === 'issued' ? 'issued' : 'hypothetical';
    showToast(`Viewing ${currentLoadoutName} (${type}). Inventory has not changed.`);
});

document.getElementById('new-loadout-button').addEventListener('click', createNewLoadout);
discardButton.addEventListener('click', discardChanges);
saveAsButton.addEventListener('click', saveLoadoutAs);
saveButton.addEventListener('click', saveCurrentLoadout);
document.getElementById('reset-demo-button').addEventListener('click', resetDemoData);

populateTechnicians();
populateLoadouts();
loadDraftFromSelection();
renderInventoryTable();
renderTeam();
switchView(currentView);
