const STORAGE_KEY = 'frcc-campus-safety-equipment-prototype-v3';

let state = loadState();
let currentView = 'loadout-view';
let currentTechnicianId = state.technicians[0]?.id || null;
let currentLoadoutName = state.technicians[0]?.loadout || 'Issued Loadout';
let selectedSlotId = null;
let draftAssignments = {};
let savedAssignmentsSnapshot = {};
let draftBeltLayout = {};
let savedBeltLayoutSnapshot = {};

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

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return deepClone(defaultDemoState);

    try {
        const parsed = JSON.parse(saved);
        if (!parsed.loadouts || !parsed.inventory || !parsed.equipmentSlots || !parsed.beltPositions) {
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
    showToast.timeoutId = window.setTimeout(() => toast.classList.remove('show'), 2800);
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
    return JSON.stringify(draftAssignments) !== JSON.stringify(savedAssignmentsSnapshot)
        || JSON.stringify(draftBeltLayout) !== JSON.stringify(savedBeltLayoutSnapshot);
}

function slotIsDirty(slotId) {
    return draftAssignments[slotId] !== savedAssignmentsSnapshot[slotId]
        || draftBeltLayout[slotId] !== savedBeltLayoutSnapshot[slotId];
}

function isBeltSlot(slotId) {
    return Boolean(getSlot(slotId)?.beltMounted);
}

function getBeltOccupant(position) {
    const match = Object.entries(draftBeltLayout)
        .find(([slotId, clockPosition]) => clockPosition === position && draftAssignments[slotId]);
    return match?.[0] || null;
}

function getBeltSlotLabel(slotId) {
    const labels = {
        radio: 'Radio',
        keys: 'Keys',
        'access-card': 'Access',
        flashlight: 'Light',
        gloves: 'Gloves',
        handcuffs: 'Cuffs',
        tourniquet: 'TQ',
        cpr: 'CPR',
        baton: 'Baton'
    };
    return labels[slotId] || getSlot(slotId)?.label || slotId;
}

function clockPositionClass(position) {
    return `belt-pos-${String(position).split(':')[0]}`;
}

function populateTechnicians() {
    technicianSelect.innerHTML = state.technicians
        .map(tech => `<option value="${escapeHtml(tech.id)}">${escapeHtml(tech.name)} · ${escapeHtml(tech.role)}</option>`)
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
            return `<option value="${escapeHtml(name)}">${escapeHtml(name)} · ${type}</option>`;
        })
        .join('');
    loadoutSelect.value = currentLoadoutName;
}

function loadDraftFromSelection() {
    const loadout = getCurrentLoadout();
    draftAssignments = deepClone(loadout?.assignments || {});
    savedAssignmentsSnapshot = deepClone(draftAssignments);
    draftBeltLayout = deepClone(loadout?.beltLayout || state.defaultBeltLayout || {});
    savedBeltLayoutSnapshot = deepClone(draftBeltLayout);
    selectedSlotId = null;
    inventorySearch.value = '';
    renderDraftUI();
}

function selectSlot(slotId) {
    const slot = getSlot(slotId);
    if (!slot) return;

    selectedSlotId = slotId;
    renderDraftUI();

    if (slot.beltMounted) {
        showToast(`Selected ${slot.label}. Choose equipment, then click a clock position to move it on the belt.`);
    } else {
        showToast(`Selected ${slot.label}. Choose compatible equipment from the inventory.`);
    }
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

    if (slot.beltMounted && !draftBeltLayout[slot.id]) {
        const openPosition = state.beltPositions.find(entry => !entry.reserved && !getBeltOccupant(entry.position));
        if (openPosition) draftBeltLayout[slot.id] = openPosition.position;
    }

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

function moveSelectedBeltItem(position) {
    const slot = getSlot(selectedSlotId);
    if (!slot?.beltMounted) {
        const occupant = getBeltOccupant(position);
        if (occupant) {
            selectSlot(occupant);
            return;
        }
        showToast('Select a belt-mounted equipment slot first, then choose a clock position.');
        return;
    }

    const positionDefinition = state.beltPositions.find(entry => entry.position === position);
    if (positionDefinition?.reserved) {
        showToast(`${position} is reserved and cannot hold equipment.`);
        return;
    }

    const currentPosition = draftBeltLayout[selectedSlotId];
    if (currentPosition === position) {
        showToast(`${slot.label} is already at ${position}.`);
        return;
    }

    const occupant = getBeltOccupant(position);
    if (occupant && occupant !== selectedSlotId) {
        if (currentPosition) {
            draftBeltLayout[occupant] = currentPosition;
        } else {
            delete draftBeltLayout[occupant];
        }
    }

    draftBeltLayout[selectedSlotId] = position;
    renderDraftUI();

    if (occupant && occupant !== selectedSlotId) {
        showToast(`${slot.label} moved to ${position}; ${getSlot(occupant)?.label || 'equipment'} swapped to ${currentPosition || 'an open position'}.`);
    } else {
        showToast(`${slot.label} moved to ${position}.`);
    }
}

function renderSlots() {
    slotGrid.innerHTML = state.equipmentSlots
        .map(slot => {
            const assignment = draftAssignments[slot.id];
            const dirtyClass = slotIsDirty(slot.id) ? ' dirty-slot' : '';
            const selectedClass = selectedSlotId === slot.id ? ' selected-slot' : '';
            const emptyClass = !assignment ? ' empty-slot' : '';
            const positionText = slot.beltMounted && draftBeltLayout[slot.id]
                ? ` · ${draftBeltLayout[slot.id]}`
                : '';
            return `
                <article
                    class="slot-card interactive-slot${dirtyClass}${selectedClass}${emptyClass}"
                    data-slot-id="${slot.id}"
                    tabindex="0"
                    role="button"
                    aria-pressed="${selectedSlotId === slot.id ? 'true' : 'false'}"
                    title="Select ${escapeHtml(slot.label)}"
                >
                    <strong>${escapeHtml(slot.label)}</strong>
                    <span>${escapeHtml(getAssignmentLabel(assignment))}</span>
                    <small>${slotIsDirty(slot.id) ? 'Unsaved change' : 'Click to select'}${positionText}</small>
                    ${selectedSlotId === slot.id ? '<b class="selected-slot-badge">Selected</b>' : ''}
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
    const selectedSlot = getSlot(selectedSlotId);
    const selectedBeltSlot = selectedSlot?.beltMounted ? selectedSlot : null;

    beltClockRow.innerHTML = state.beltPositions
        .map(positionDefinition => {
            const position = positionDefinition.position;
            const occupant = getBeltOccupant(position);
            const selectedClass = selectedBeltSlot && draftBeltLayout[selectedBeltSlot.id] === position
                ? ' selected-clock-chip'
                : '';
            const occupiedClass = occupant ? ' occupied-clock-chip' : ' empty-clock-chip';
            const dirtyClass = occupant && draftBeltLayout[occupant] !== savedBeltLayoutSnapshot[occupant]
                ? ' dirty-clock-chip'
                : '';
            const reservedClass = positionDefinition.reserved ? ' reserved-clock-chip' : '';
            const label = positionDefinition.reserved
                ? 'Reserved'
                : occupant
                    ? getBeltSlotLabel(occupant)
                    : 'Open';
            const title = positionDefinition.reserved
                ? `${position} is reserved`
                : occupant
                    ? `${getSlot(occupant)?.label || occupant} at ${position}`
                    : `${position} is open`;

            return `
                <button
                    type="button"
                    class="clock-chip${selectedClass} ${occupiedClass}${dirtyClass}${reservedClass}"
                    data-position="${position}"
                    ${positionDefinition.reserved ? 'disabled' : ''}
                    title="${escapeHtml(title)}"
                >
                    <strong>${position}</strong><br>
                    <span>${escapeHtml(label)}</span>
                </button>
            `;
        })
        .join('');

    beltClockRow.querySelectorAll('.clock-chip[data-position]:not(:disabled)').forEach(button => {
        button.addEventListener('click', () => moveSelectedBeltItem(button.dataset.position));
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

    const beltHint = slot?.beltMounted
        ? `<span class="belt-position-hint">Current belt position: <strong>${draftBeltLayout[slot.id] || 'Not set'}</strong>. Use the clock below the mannequin to move it.</span>`
        : '';

    const hint = slot
        ? `<div class="inventory-hint"><strong>${escapeHtml(slot.label)}</strong><span>Click an item or drag it onto the selected slot.</span>${beltHint}<button type="button" id="clear-selected-slot">Clear Slot</button></div>`
        : '<div class="inventory-hint"><strong>Select an equipment slot</strong><span>Then choose a compatible inventory item. You can also click any available item below to target its matching slot.</span></div>';

    const cards = filtered.map(item => {
        const usable = canUseItem(item);
        const selected = draftAssignments[item.slotId] === item.id;
        const statusClass = usable ? 'availability' : 'availability unavailable';
        return `
            <article
                class="inventory-card interactive-inventory${usable ? '' : ' blocked-item'}${selected ? ' selected-item' : ''}"
                data-item-id="${escapeHtml(item.id)}"
                data-slot-id="${escapeHtml(item.slotId)}"
                ${usable ? 'tabindex="0" role="button" draggable="true"' : 'aria-disabled="true"'}
            >
                <div class="item-name">${escapeHtml(item.name)}</div>
                <div class="item-meta">
                    <span>${escapeHtml(item.id)}</span>
                    <span class="${statusClass}">${escapeHtml(inventoryStatusLabel(item))}</span>
                </div>
                <div class="item-meta">
                    <span>${escapeHtml(item.category)}</span>
                    <span>${escapeHtml(item.condition)}</span>
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

function iconMarkup(slotId) {
    const icons = {
        mic: '<span class="mic-body"></span><span class="mic-grill"></span>',
        'name-badge': '<span class="badge-plate">ID</span>',
        'left-sleeve': '<span class="pen pen-one"></span><span class="pen pen-two"></span><span class="pen pen-three"></span>',
        patch: '<span class="patch-shield"></span>',
        radio: '<span class="radio-antenna"></span><span class="radio-body"></span><span class="radio-screen"></span>',
        keys: '<span class="key-ring"></span><span class="key-stem key-one"></span><span class="key-stem key-two"></span>',
        'access-card': '<span class="card-body"><i></i></span>',
        flashlight: '<span class="flashlight-head"></span><span class="flashlight-body"></span>',
        gloves: '<span class="pouch-body">G</span>',
        handcuffs: '<span class="cuff cuff-one"></span><span class="cuff cuff-two"></span><span class="cuff-link"></span>',
        tourniquet: '<span class="pouch-body medical">TQ</span>',
        cpr: '<span class="pouch-body medical wide">CPR</span>',
        baton: '<span class="baton-body"></span>'
    };
    return icons[slotId] || '<span class="generic-gear"></span>';
}

function createGearVisual(slotId, className, clockPosition = null) {
    const assignment = draftAssignments[slotId];
    if (!assignment) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `gear-item ${className}${selectedSlotId === slotId ? ' selected-gear-item' : ''}`;
    button.dataset.slotId = slotId;
    button.title = clockPosition
        ? `${getAssignmentLabel(assignment)} · ${clockPosition}`
        : getAssignmentLabel(assignment);
    button.setAttribute('aria-label', button.title);
    button.innerHTML = iconMarkup(slotId);
    button.addEventListener('click', event => {
        event.stopPropagation();
        selectSlot(slotId);
    });
    mannequin.appendChild(button);
}

function renderMannequin() {
    if (!mannequin) return;

    mannequin.classList.remove(
        'has-cap', 'has-beanie', 'has-boots', 'has-shirt', 'has-vest',
        'has-pants', 'has-footwear', 'has-patch', 'has-sleeve-gear'
    );
    mannequin.querySelectorAll('.gear-item').forEach(marker => marker.remove());

    if (draftAssignments.shirt) mannequin.classList.add('has-shirt');
    if (draftAssignments.vest) mannequin.classList.add('has-vest');
    if (draftAssignments.pants) mannequin.classList.add('has-pants');
    if (draftAssignments.footwear) mannequin.classList.add('has-footwear');
    if (draftAssignments.patch) mannequin.classList.add('has-patch');
    if (draftAssignments['left-sleeve']) mannequin.classList.add('has-sleeve-gear');

    const hatName = getShortAssignmentLabel(draftAssignments.hat).toLowerCase();
    if (hatName.includes('beanie')) mannequin.classList.add('has-beanie');
    else if (draftAssignments.hat) mannequin.classList.add('has-cap');

    const footwearName = getShortAssignmentLabel(draftAssignments.footwear).toLowerCase();
    if (footwearName.includes('boot')) mannequin.classList.add('has-boots');

    createGearVisual('mic', 'gear-static gear-mic');
    createGearVisual('name-badge', 'gear-static gear-name-badge');
    createGearVisual('left-sleeve', 'gear-static gear-left-sleeve');
    createGearVisual('patch', 'gear-static gear-patch');

    state.equipmentSlots
        .filter(slot => slot.beltMounted && draftAssignments[slot.id])
        .forEach(slot => {
            const position = draftBeltLayout[slot.id];
            if (!position) return;
            const rearClass = ['5:00', '6:00', '7:00'].includes(position) ? ' rear-belt-item' : '';
            createGearVisual(slot.id, `gear-belt ${clockPositionClass(position)}${rearClass}`, position);
        });
}

function updateLoadoutStatus() {
    const missing = state.equipmentSlots.filter(slot => slot.required && !draftAssignments[slot.id]);
    const missingBeltPositions = state.equipmentSlots.filter(slot => slot.beltMounted && draftAssignments[slot.id] && !draftBeltLayout[slot.id]);
    const dirty = isDirty();

    loadoutStatusPill.classList.remove('success', 'warning', 'danger');

    if (missing.length || missingBeltPositions.length) {
        loadoutStatusPill.textContent = `${missing.length + missingBeltPositions.length} Missing`;
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
                        <td>${escapeHtml(item.id)}</td>
                        <td>${escapeHtml(item.name)}</td>
                        <td>${escapeHtml(getSlot(item.slotId)?.label || item.slotId)}</td>
                        <td>${escapeHtml(item.category)}</td>
                        <td>${escapeHtml(item.status)}</td>
                        <td>${escapeHtml(item.condition)}</td>
                        <td>${escapeHtml(item.assignedTo || '—')}</td>
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
                    <div class="member-role">${escapeHtml(item.role || 'Technician III')}</div>
                </article>
            `;
        }

        return `
            <article class="team-member ${memberClass(item.tech.role, item.type)}">
                ${mannequinMarkup()}
                <div class="member-name">${escapeHtml(item.tech.name)}</div>
                <div class="member-role">${escapeHtml(item.tech.role)}</div>
            </article>
        `;
    }).join('');

    teamCards.innerHTML = arranged.map(item => {
        if (item.type === 'open') {
            return `
                <article class="team-card">
                    <strong>Open Position</strong><br>
                    <small>${escapeHtml(item.role || 'Technician III')} · Loadout: Open Position</small>
                </article>
            `;
        }

        return `
            <article class="team-card">
                <strong>${escapeHtml(item.tech.name)}</strong><br>
                <small>${escapeHtml(item.tech.role)} · ${escapeHtml(item.tech.loadout)} · ${escapeHtml(item.tech.status)}</small>
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
    const usedBeltPositions = {};

    state.equipmentSlots.forEach(slot => {
        const assignment = draftAssignments[slot.id];
        if (slot.required && !assignment) {
            errors.push(`${slot.label} is empty.`);
            return;
        }

        const item = assignment ? getInventoryItem(assignment) : null;
        if (assignment && !item) {
            errors.push(`${slot.label} references an unknown inventory item.`);
            return;
        }

        if (item?.status === 'Maintenance') {
            errors.push(`${item.name} (${item.id}) is in maintenance.`);
        } else if (item?.status === 'Assigned' && item.assignedTo !== technician?.name) {
            errors.push(`${item.name} (${item.id}) is assigned to ${item.assignedTo}.`);
        }

        if (slot.beltMounted && assignment) {
            const position = draftBeltLayout[slot.id];
            if (!position) {
                errors.push(`${slot.label} does not have a belt clock position.`);
                return;
            }
            if (usedBeltPositions[position] && usedBeltPositions[position] !== slot.id) {
                errors.push(`${slot.label} and ${getSlot(usedBeltPositions[position])?.label || 'another item'} both use ${position}.`);
                return;
            }
            const definition = state.beltPositions.find(entry => entry.position === position);
            if (!definition || definition.reserved) {
                errors.push(`${slot.label} uses an unavailable belt position (${position}).`);
                return;
            }
            usedBeltPositions[position] = slot.id;
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
    loadout.beltLayout = deepClone(draftBeltLayout);
    technician.loadout = currentLoadoutName;
    savedAssignmentsSnapshot = deepClone(draftAssignments);
    savedBeltLayoutSnapshot = deepClone(draftBeltLayout);
    saveState();
    renderInventoryTable();
    renderTeam();
    renderDraftUI();

    if (loadout.type === 'issued') {
        showToast('Issued loadout saved. Larimer prototype inventory and belt layout have been updated.');
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
        assignments: deepClone(draftAssignments),
        beltLayout: deepClone(draftBeltLayout)
    };
    currentLoadoutName = name;
    technician.loadout = name;
    savedAssignmentsSnapshot = deepClone(draftAssignments);
    savedBeltLayoutSnapshot = deepClone(draftBeltLayout);
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
        assignments: deepClone(draftAssignments),
        beltLayout: deepClone(draftBeltLayout)
    };
    currentLoadoutName = name;
    technician.loadout = name;
    savedAssignmentsSnapshot = deepClone(draftAssignments);
    savedBeltLayoutSnapshot = deepClone(draftBeltLayout);
    saveState();
    populateLoadouts();
    renderTeam();
    renderDraftUI();
    showToast(`${name} created from the current loadout.`);
}

function discardChanges() {
    draftAssignments = deepClone(savedAssignmentsSnapshot);
    draftBeltLayout = deepClone(savedBeltLayoutSnapshot);
    renderDraftUI();
    showToast('Unsaved loadout and belt-position changes discarded.');
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
