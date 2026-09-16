const homeFilledCount = document.getElementById('home-filled-count');
const homeOpenCount = document.getElementById('home-open-count');
const homeAvailableCount = document.getElementById('home-available-count');
const homeLoadoutCount = document.getElementById('home-loadout-count');
const homeRoleValue = document.getElementById('home-role-value');
const homeTechValue = document.getElementById('home-tech-value');
const homeInventoryValue = document.getElementById('home-inventory-value');
const homeBuildValue = document.getElementById('home-build-value');

function countSavedLoadouts() {
    return Object.values(state.loadouts || {})
        .reduce((total, technicianLoadouts) => total + Object.keys(technicianLoadouts || {}).length, 0);
}

function renderHomeDashboard() {
    const filledPositions = state.teamPositions.filter(position => position.type !== 'open').length;
    const openPositions = state.teamPositions.filter(position => position.type === 'open').length;
    const availableInventory = state.inventory.filter(item => item.status === 'Available').length;
    const totalInventory = state.inventory.length;
    const activeTechnician = getCurrentTechnician();

    if (homeFilledCount) homeFilledCount.textContent = String(filledPositions);
    if (homeOpenCount) homeOpenCount.textContent = String(openPositions);
    if (homeAvailableCount) homeAvailableCount.textContent = String(availableInventory);
    if (homeLoadoutCount) homeLoadoutCount.textContent = String(countSavedLoadouts());
    if (homeRoleValue) homeRoleValue.textContent = roleSelect.value;
    if (homeTechValue) homeTechValue.textContent = activeTechnician?.name || 'None';
    if (homeInventoryValue) homeInventoryValue.textContent = `${availableInventory} of ${totalInventory} available`;
    if (homeBuildValue) homeBuildValue.textContent = '0.9.0';
}

const baseSwitchViewForHome = switchView;
switchView = function switchViewWithHome(viewId) {
    baseSwitchViewForHome(viewId);
    document.body.classList.toggle('home-active', viewId === 'home-view');

    if (viewId === 'home-view') {
        renderHomeDashboard();
    }
};

document.querySelectorAll('[data-home-view]').forEach(button => {
    button.addEventListener('click', () => {
        const targetView = button.dataset.homeView;
        if (targetView) switchView(targetView);
    });
});

const startDemoButton = document.getElementById('home-start-demo');
if (startDemoButton) {
    startDemoButton.addEventListener('click', () => {
        if (roleSelect.value !== 'Supervisor') {
            roleSelect.value = 'Supervisor';
            roleSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        switchView('team-view');
        showToast('Demo started in Supervisor mode. Select any technician to open their loadout.');
    });
}

const baseSaveStateForHome = saveState;
saveState = function saveStateWithHomeRefresh() {
    baseSaveStateForHome();
    renderHomeDashboard();
};

renderHomeDashboard();
switchView('home-view');
