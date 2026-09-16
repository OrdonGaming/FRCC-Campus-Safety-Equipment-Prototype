const STORAGE_KEY = 'frcc-campus-safety-equipment-prototype-v1';

let state = loadState();
let currentView = 'loadout-view';

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

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return JSON.parse(JSON.stringify(defaultDemoState));

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.warn('Saved prototype data could not be read. Resetting to defaults.', error);
        return JSON.parse(JSON.stringify(defaultDemoState));
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => toast.classList.remove('show'), 2300);
}

function populateTechnicians() {
    technicianSelect.innerHTML = state.technicians
        .map(tech => `<option value="${tech.id}">${tech.name} · ${tech.role}</option>`)
        .join('');
}

function renderSlots() {
    slotGrid.innerHTML = state.equipmentSlots
        .map(slot => `
            <article class="slot-card" data-slot-id="${slot.id}">
                <strong>${slot.label}</strong>
                <span>${slot.equipped}</span>
            </article>
        `)
        .join('');
}

function renderBeltClock() {
    beltClockRow.innerHTML = state.beltPositions
        .map(position => `
            <div class="clock-chip" title="${position.item}">
                <strong>${position.position}</strong><br>
                <span>${position.item}</span>
            </div>
        `)
        .join('');
}

function renderInventory(filter = '') {
    const normalized = filter.trim().toLowerCase();
    const filtered = state.inventory.filter(item => {
        const haystack = `${item.id} ${item.name} ${item.category} ${item.status} ${item.condition}`.toLowerCase();
        return haystack.includes(normalized);
    });

    inventoryCount.textContent = `${filtered.length} items`;

    inventoryList.innerHTML = filtered.map(item => {
        const unavailable = item.status !== 'Available';
        return `
            <article class="inventory-card">
                <div class="item-name">${item.name}</div>
                <div class="item-meta">
                    <span>${item.id}</span>
                    <span class="availability ${unavailable ? 'unavailable' : ''}">${item.status}</span>
                </div>
                <div class="item-meta">
                    <span>${item.category}</span>
                    <span>${item.condition}</span>
                </div>
            </article>
        `;
    }).join('') || '<p>No equipment matches that search.</p>';
}

function renderInventoryTable() {
    inventoryTable.innerHTML = `
        <table class="inventory-table">
            <thead>
                <tr>
                    <th>Asset</th>
                    <th>Item</th>
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

function validateLoadout() {
    const requiredIds = ['LC-R014', 'LC-F021', 'LC-H011', 'LC-B007'];
    const invalid = requiredIds
        .map(id => state.inventory.find(item => item.id === id))
        .filter(item => item && item.status === 'Maintenance');

    return invalid;
}

function resetDemoData() {
    state = JSON.parse(JSON.stringify(defaultDemoState));
    localStorage.removeItem(STORAGE_KEY);
    populateTechnicians();
    renderAll();
    showToast('Demo data reset to the original prototype state.');
}

function renderAll() {
    renderSlots();
    renderBeltClock();
    renderInventory(inventorySearch.value || '');
    renderInventoryTable();
    renderTeam();
}

document.querySelectorAll('.nav-button[data-view]').forEach(button => {
    button.addEventListener('click', () => switchView(button.dataset.view));
});

inventorySearch.addEventListener('input', event => renderInventory(event.target.value));

roleSelect.addEventListener('change', () => {
    showToast(`Demo permissions switched to ${roleSelect.value}.`);
});

technicianSelect.addEventListener('change', () => {
    const selected = state.technicians.find(tech => tech.id === technicianSelect.value);
    if (selected) {
        loadoutSelect.value = selected.loadout;
        showToast(`Viewing ${selected.name}.`);
    }
});

loadoutSelect.addEventListener('change', () => {
    showToast(`Previewing ${loadoutSelect.value}. Inventory has not changed.`);
});

document.getElementById('new-loadout-button').addEventListener('click', () => {
    showToast('New hypothetical loadout workflow will be added in the next build step.');
});

document.getElementById('discard-button').addEventListener('click', () => {
    renderAll();
    showToast('Unsaved prototype changes discarded.');
});

document.getElementById('save-as-button').addEventListener('click', () => {
    showToast('Save As is scaffolded and will gain editable loadout names next.');
});

document.getElementById('save-button').addEventListener('click', () => {
    const invalid = validateLoadout();

    if (invalid.length) {
        showToast(`Unable to save: ${invalid[0].name} is unavailable.`);
        return;
    }

    const selected = state.technicians.find(tech => tech.id === technicianSelect.value);
    if (selected) selected.loadout = loadoutSelect.value;

    saveState();
    renderTeam();
    showToast('Loadout saved to local prototype storage.');
});

document.getElementById('reset-demo-button').addEventListener('click', resetDemoData);

populateTechnicians();
renderAll();
switchView(currentView);
