const HOME_BUILD = '0.10.0';
const AUTO_DEMO_TECHNICIAN_ID = 'tech-003';
const AUTO_DEMO_LOADOUT_NAME = 'Automated Demo Loadout';

const homeFilledCount = document.getElementById('home-filled-count');
const homeOpenCount = document.getElementById('home-open-count');
const homeAvailableCount = document.getElementById('home-available-count');
const homeLoadoutCount = document.getElementById('home-loadout-count');
const homeRoleValue = document.getElementById('home-role-value');
const homeTechValue = document.getElementById('home-tech-value');
const homeInventoryValue = document.getElementById('home-inventory-value');
const homeBuildValue = document.getElementById('home-build-value');
const startDemoButton = document.getElementById('home-start-demo');

let autoDemoRunning = false;
let autoDemoCancelled = false;
let autoDemoOverlay = null;
let autoDemoCursor = null;
let autoDemoStatus = null;
let autoDemoStepLabel = null;
let autoDemoProgress = null;
let autoDemoStopButton = null;

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
    if (homeBuildValue) homeBuildValue.textContent = HOME_BUILD;

    const footerBuild = document.querySelector('.footer span:last-child');
    if (footerBuild) footerBuild.textContent = `Proof of Concept · Local demo data only · Build ${HOME_BUILD}`;
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
        if (autoDemoRunning) return;
        const targetView = button.dataset.homeView;
        if (targetView) switchView(targetView);
    });
});

const baseSaveStateForHome = saveState;
saveState = function saveStateWithHomeRefresh() {
    baseSaveStateForHome();
    renderHomeDashboard();
};

if (typeof overviewRows === 'function') {
    const baseOverviewRowsForBuild = overviewRows;
    overviewRows = function overviewRowsWithCurrentBuild(reportName) {
        const rows = baseOverviewRowsForBuild(reportName);
        const buildRow = rows.find(row => row?.[0] === 'Prototype Build');
        if (buildRow) buildRow[1] = HOME_BUILD;
        return rows;
    };
}

function installAutoDemoStyles() {
    if (document.getElementById('auto-demo-styles')) return;

    const style = document.createElement('style');
    style.id = 'auto-demo-styles';
    style.textContent = `
        body.auto-demo-running .workspace,
        body.auto-demo-running .sidebar {
            pointer-events: none;
        }

        .auto-demo-player {
            position: fixed;
            left: 50%;
            bottom: 22px;
            transform: translate(-50%, 20px);
            width: min(720px, calc(100vw - 34px));
            z-index: 1000;
            border: 1px solid rgba(255,255,255,.18);
            border-radius: 16px;
            background: rgba(13,45,108,.96);
            color: #fff;
            box-shadow: 0 18px 48px rgba(13,45,108,.28);
            padding: 13px 15px;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 10px 16px;
            align-items: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity .22s ease, transform .22s ease;
            backdrop-filter: blur(10px);
        }

        .auto-demo-player.visible {
            opacity: 1;
            transform: translate(-50%, 0);
            pointer-events: auto;
        }

        .auto-demo-player-main {
            min-width: 0;
            display: grid;
            gap: 3px;
        }

        .auto-demo-player-main strong {
            font-family: 'Roboto Condensed', Arial, sans-serif;
            font-size: .92rem;
            letter-spacing: .03em;
        }

        .auto-demo-player-status {
            font-size: .78rem;
            color: rgba(255,255,255,.78);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .auto-demo-step-label {
            font-size: .7rem;
            color: #ffe399;
            font-weight: 800;
        }

        .auto-demo-stop {
            border: 1px solid rgba(255,255,255,.28);
            border-radius: 9px;
            background: rgba(255,255,255,.09);
            color: #fff;
            padding: 8px 11px;
            font-weight: 800;
            cursor: pointer;
        }

        .auto-demo-stop:hover,
        .auto-demo-stop:focus-visible {
            background: rgba(255,255,255,.16);
            outline: 3px solid rgba(236,182,22,.35);
        }

        .auto-demo-progress-track {
            grid-column: 1 / -1;
            height: 4px;
            border-radius: 999px;
            overflow: hidden;
            background: rgba(255,255,255,.15);
        }

        .auto-demo-progress-bar {
            display: block;
            width: 0;
            height: 100%;
            border-radius: inherit;
            background: #ecb616;
            transition: width .35s ease;
        }

        .auto-demo-focus {
            position: relative !important;
            z-index: 80 !important;
            outline: 4px solid rgba(236,182,22,.9) !important;
            outline-offset: 5px !important;
            box-shadow: 0 0 0 9px rgba(236,182,22,.18), 0 15px 32px rgba(13,45,108,.18) !important;
            transition: outline .2s ease, box-shadow .2s ease !important;
        }

        .auto-demo-exporting {
            animation: autoDemoExportPulse .7s ease-in-out infinite alternate;
        }

        @keyframes autoDemoExportPulse {
            from { transform: scale(1); }
            to { transform: scale(1.025); }
        }

        .auto-demo-cursor {
            position: fixed;
            left: 0;
            top: 0;
            width: 22px;
            height: 22px;
            margin: -11px 0 0 -11px;
            border-radius: 50%;
            border: 3px solid #ecb616;
            background: rgba(255,255,255,.88);
            box-shadow: 0 4px 14px rgba(13,45,108,.28);
            z-index: 1100;
            pointer-events: none;
            opacity: 0;
            transform: translate3d(-40px,-40px,0) scale(.75);
            transition: transform .55s cubic-bezier(.2,.8,.2,1), opacity .18s ease;
        }

        .auto-demo-cursor.visible {
            opacity: 1;
        }

        .auto-demo-cursor::after {
            content: '';
            position: absolute;
            inset: 4px;
            border-radius: 50%;
            background: #0d2d6c;
        }

        @media (prefers-reduced-motion: reduce) {
            .auto-demo-cursor,
            .auto-demo-player,
            .auto-demo-progress-bar {
                transition: none;
            }
            .auto-demo-exporting {
                animation: none;
            }
        }
    `;
    document.head.appendChild(style);
}

function ensureAutoDemoUi() {
    installAutoDemoStyles();

    if (!autoDemoOverlay) {
        autoDemoOverlay = document.createElement('div');
        autoDemoOverlay.className = 'auto-demo-player';
        autoDemoOverlay.setAttribute('role', 'status');
        autoDemoOverlay.setAttribute('aria-live', 'polite');
        autoDemoOverlay.innerHTML = `
            <div class="auto-demo-player-main">
                <strong>Automated Prototype Demo</strong>
                <span class="auto-demo-step-label" id="auto-demo-step-label">Preparing demo...</span>
                <span class="auto-demo-player-status" id="auto-demo-status">The interface will demonstrate the workflow automatically.</span>
            </div>
            <button type="button" class="auto-demo-stop" id="auto-demo-stop">Stop Demo</button>
            <div class="auto-demo-progress-track"><span class="auto-demo-progress-bar" id="auto-demo-progress"></span></div>
        `;
        document.body.appendChild(autoDemoOverlay);
        autoDemoStatus = autoDemoOverlay.querySelector('#auto-demo-status');
        autoDemoStepLabel = autoDemoOverlay.querySelector('#auto-demo-step-label');
        autoDemoProgress = autoDemoOverlay.querySelector('#auto-demo-progress');
        autoDemoStopButton = autoDemoOverlay.querySelector('#auto-demo-stop');
        autoDemoStopButton.addEventListener('click', () => stopAutomatedDemo(true));
    }

    if (!autoDemoCursor) {
        autoDemoCursor = document.createElement('div');
        autoDemoCursor.className = 'auto-demo-cursor';
        autoDemoCursor.setAttribute('aria-hidden', 'true');
        document.body.appendChild(autoDemoCursor);
    }
}

function waitForDemo(milliseconds) {
    return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

function throwIfDemoCancelled() {
    if (autoDemoCancelled) throw new Error('AUTO_DEMO_CANCELLED');
}

function clearDemoFocus() {
    document.querySelectorAll('.auto-demo-focus').forEach(element => element.classList.remove('auto-demo-focus'));
}

function resolveDemoTarget(target) {
    if (!target) return null;
    if (typeof target === 'function') return target();
    if (typeof target === 'string') return document.querySelector(target);
    return target;
}

async function focusDemoTarget(target) {
    clearDemoFocus();
    const element = resolveDemoTarget(target);
    if (!element) {
        if (autoDemoCursor) autoDemoCursor.classList.remove('visible');
        return null;
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    await waitForDemo(350);
    throwIfDemoCancelled();

    const currentElement = resolveDemoTarget(target) || element;
    currentElement.classList.add('auto-demo-focus');
    const rect = currentElement.getBoundingClientRect();
    const x = Math.min(window.innerWidth - 18, Math.max(18, rect.left + rect.width / 2));
    const y = Math.min(window.innerHeight - 18, Math.max(18, rect.top + rect.height / 2));

    if (autoDemoCursor) {
        autoDemoCursor.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;
        autoDemoCursor.classList.add('visible');
    }

    return currentElement;
}

async function demoStep(stepNumber, totalSteps, label, status, target, action, hold = 900) {
    throwIfDemoCancelled();
    if (autoDemoStepLabel) autoDemoStepLabel.textContent = `Step ${stepNumber} of ${totalSteps} · ${label}`;
    if (autoDemoStatus) autoDemoStatus.textContent = status;
    if (autoDemoProgress) autoDemoProgress.style.width = `${Math.round((stepNumber - 1) / totalSteps * 100)}%`;

    await focusDemoTarget(target);
    throwIfDemoCancelled();
    await waitForDemo(420);
    throwIfDemoCancelled();

    if (typeof action === 'function') await action();
    throwIfDemoCancelled();
    await waitForDemo(hold);
}

function removePreviousAutomatedDemoLoadouts() {
    let removed = 0;

    state.technicians.forEach(technician => {
        const technicianLoadouts = state.loadouts[technician.id] || {};
        Object.entries(technicianLoadouts).forEach(([loadoutName, loadout]) => {
            if (!loadout?.autoDemo) return;

            if (technician.loadout === loadoutName) {
                const previous = loadout.previousActiveLoadout;
                technician.loadout = previous && technicianLoadouts[previous]
                    ? previous
                    : technicianLoadouts['Issued Loadout']
                        ? 'Issued Loadout'
                        : Object.keys(technicianLoadouts).find(name => name !== loadoutName) || 'Issued Loadout';
            }

            delete technicianLoadouts[loadoutName];
            removed += 1;
        });
    });

    const currentTechnician = getCurrentTechnician();
    if (currentTechnician && !state.loadouts[currentTechnician.id]?.[currentLoadoutName]) {
        currentLoadoutName = currentTechnician.loadout || 'Issued Loadout';
        populateLoadouts();
        loadDraftFromSelection();
    }

    saveState();
    renderInventoryTable();
    renderTeam();
    return removed;
}

function openAutomatedDemoTechnician() {
    const technician = state.technicians.find(item => item.id === AUTO_DEMO_TECHNICIAN_ID);
    if (!technician) return;

    currentTechnicianId = technician.id;
    currentLoadoutName = technician.loadout || 'Issued Loadout';
    populateTechnicians();
    populateLoadouts();
    loadDraftFromSelection();
    switchView('loadout-view');
}

function createAutomatedDemoLoadout() {
    const technician = state.technicians.find(item => item.id === AUTO_DEMO_TECHNICIAN_ID);
    if (!technician) return;

    const technicianLoadouts = state.loadouts[technician.id] || (state.loadouts[technician.id] = {});
    const baseLoadout = technicianLoadouts['Issued Loadout']
        || technicianLoadouts[technician.loadout]
        || Object.values(technicianLoadouts)[0];
    if (!baseLoadout) return;

    const previousActiveLoadout = technician.loadout;
    technicianLoadouts[AUTO_DEMO_LOADOUT_NAME] = {
        type: 'hypothetical',
        autoDemo: true,
        previousActiveLoadout,
        assignments: deepClone(baseLoadout.assignments || {}),
        beltLayout: deepClone(baseLoadout.beltLayout || state.defaultBeltLayout || {})
    };

    technician.loadout = AUTO_DEMO_LOADOUT_NAME;
    currentLoadoutName = AUTO_DEMO_LOADOUT_NAME;
    populateLoadouts();
    loadDraftFromSelection();
    saveState();
    renderTeam();
}

async function simulateCurrentLoadoutExport() {
    const button = document.getElementById('export-current-loadout-workbook');
    const status = document.getElementById('export-library-status');
    const originalButtonText = button?.textContent || 'Download Current Loadout';
    const originalStatus = status?.textContent || '';
    const rows = typeof currentLoadoutRows === 'function' ? currentLoadoutRows() : [];

    if (button) {
        button.classList.add('auto-demo-exporting');
        button.textContent = 'Preparing Workbook...';
    }
    if (status) status.textContent = `Preparing ${AUTO_DEMO_LOADOUT_NAME} in the browser...`;
    await waitForDemo(900);
    throwIfDemoCancelled();

    if (button) button.textContent = 'Export Complete ✓';
    if (status) status.textContent = `Simulation complete · ${rows.length} equipment rows prepared · no file downloaded during automatic demo`;
    showToast('Simulated Excel export complete. The automatic demo does not download a file.');
    await waitForDemo(1200);

    if (button) {
        button.classList.remove('auto-demo-exporting');
        button.textContent = originalButtonText;
    }
    if (status) status.textContent = originalStatus;
}

async function startAutomatedDemo() {
    if (autoDemoRunning) return;

    if (isDirty()) {
        const shouldContinue = window.confirm('Starting the automated demo will discard unsaved loadout changes. Continue?');
        if (!shouldContinue) return;
        discardChanges();
    }

    autoDemoRunning = true;
    autoDemoCancelled = false;
    ensureAutoDemoUi();
    document.body.classList.add('auto-demo-running');
    autoDemoOverlay?.classList.add('visible');
    if (startDemoButton) startDemoButton.disabled = true;

    const totalSteps = 13;

    try {
        await demoStep(1, totalSteps, 'Reset Demo Example', 'Removing the automated example from any previous viewing session so only one demo loadout is ever created.', '#home-start-demo', async () => {
            const removed = removePreviousAutomatedDemoLoadouts();
            if (removed) showToast(`Removed ${removed} previous automated demo loadout${removed === 1 ? '' : 's'}.`);
        }, 700);

        await demoStep(2, totalSteps, 'Supervisor Access', 'Switching the prototype to Supervisor permissions so the demo can manage another technician.', '#role-select', async () => {
            if (roleSelect.value !== 'Supervisor') {
                roleSelect.value = 'Supervisor';
                switchDemoRole('Supervisor');
            } else {
                applyPermissionState();
            }
        }, 800);

        await demoStep(3, totalSteps, 'Open Technician', 'Opening Taylor Reed, a Technician III, to demonstrate team-level loadout management.', '#technician-select', async () => {
            openAutomatedDemoTechnician();
        }, 900);

        await demoStep(4, totalSteps, 'Create Demo Loadout', 'Creating one temporary hypothetical loadout from the technician’s issued equipment.', '#loadout-select', async () => {
            createAutomatedDemoLoadout();
        }, 900);

        await demoStep(5, totalSteps, 'Change Headwear', 'Selecting the Hat slot and preparing to swap the billed cap for the available Campus Safety beanie.', () => document.querySelector('[data-slot-id="hat"]'), async () => {
            selectSlot('hat');
        }, 550);

        await demoStep(6, totalSteps, 'Equip Beanie', 'Staging an available beanie. The mannequin updates immediately, while inventory remains unchanged until an issued loadout is saved.', () => document.querySelector('[data-item-id="LC-CAP-SP02"]'), async () => {
            equipItem('LC-CAP-SP02', 'hat');
        }, 900);

        await demoStep(7, totalSteps, 'Change Footwear', 'Swapping the technician’s footwear to the available black laced boots.', () => document.querySelector('[data-slot-id="footwear"]'), async () => {
            selectSlot('footwear');
            await waitForDemo(350);
            equipItem('LC-S-SP02', 'footwear');
        }, 900);

        await demoStep(8, totalSteps, 'Move Belt Radio', 'Repositioning the radio from its default clock position to 9:00.', () => document.querySelector('[data-slot-id="radio"]'), async () => {
            selectSlot('radio');
            await waitForDemo(450);
            await focusDemoTarget(() => document.querySelector('[data-position="9:00"]'));
            await waitForDemo(350);
            moveSelectedBeltItem('9:00');
        }, 850);

        await demoStep(9, totalSteps, 'Move Flashlight', 'Moving the flashlight to the open 6:00 belt position to demonstrate a second belt-layout change.', () => document.querySelector('[data-slot-id="flashlight"]'), async () => {
            selectSlot('flashlight');
            await waitForDemo(450);
            await focusDemoTarget(() => document.querySelector('[data-position="6:00"]'));
            await waitForDemo(350);
            moveSelectedBeltItem('6:00');
        }, 850);

        await demoStep(10, totalSteps, 'Save Loadout', 'Saving the hypothetical loadout. Because this is a saved planning loadout, it does not reserve or reassign inventory.', '#save-button', async () => {
            saveCurrentLoadout();
        }, 1000);

        await demoStep(11, totalSteps, 'Team View', 'Switching to Team View so the updated beanie, boots, and belt arrangement appear on Taylor Reed’s team mannequin.', '[data-view="team-view"]', async () => {
            switchView('team-view');
            renderTeam();
            await waitForDemo(500);
            await focusDemoTarget(() => document.querySelector('[data-technician-id="tech-003"]'));
        }, 1200);

        await demoStep(12, totalSteps, 'Simulated Excel Export', 'Opening reporting and simulating the current technician loadout export without forcing a file download on the viewer.', '[data-view="export-view"]', async () => {
            switchView('export-view');
            await waitForDemo(650);
            await focusDemoTarget('#export-current-loadout-workbook');
            await simulateCurrentLoadoutExport();
        }, 700);

        await demoStep(13, totalSteps, 'Demo Complete', 'Returning to the Home screen. The single automated demo loadout remains available to inspect and will be removed automatically before the next demo run.', '[data-view="home-view"]', async () => {
            switchView('home-view');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 850);

        clearDemoFocus();
        if (autoDemoCursor) autoDemoCursor.classList.remove('visible');
        if (autoDemoProgress) autoDemoProgress.style.width = '100%';
        if (autoDemoStepLabel) autoDemoStepLabel.textContent = 'Demo complete';
        if (autoDemoStatus) autoDemoStatus.textContent = 'Automated Demo Loadout is available for review. Starting the demo again will replace it rather than creating another copy.';
        if (autoDemoStopButton) autoDemoStopButton.textContent = 'Close';
        await waitForDemo(2200);
    } catch (error) {
        if (error?.message !== 'AUTO_DEMO_CANCELLED') {
            console.error('Automated demo failed.', error);
            showToast('The automated demo stopped unexpectedly. You can restart it from Home.');
        }
    } finally {
        if (!autoDemoCancelled) finishAutomatedDemo();
    }
}

function finishAutomatedDemo() {
    autoDemoRunning = false;
    autoDemoCancelled = false;
    document.body.classList.remove('auto-demo-running');
    clearDemoFocus();
    autoDemoCursor?.classList.remove('visible');
    autoDemoOverlay?.classList.remove('visible');
    if (autoDemoStopButton) autoDemoStopButton.textContent = 'Stop Demo';
    if (startDemoButton) startDemoButton.disabled = false;
    renderHomeDashboard();
}

function stopAutomatedDemo(cleanup = true) {
    if (!autoDemoRunning) {
        autoDemoOverlay?.classList.remove('visible');
        return;
    }

    autoDemoCancelled = true;
    if (cleanup) {
        removePreviousAutomatedDemoLoadouts();
        showToast('Automated demo stopped. Its temporary example loadout was removed.');
    }

    switchView('home-view');
    finishAutomatedDemo();
}

if (startDemoButton) {
    startDemoButton.addEventListener('click', startAutomatedDemo);
}

ensureAutoDemoUi();
renderHomeDashboard();
switchView('home-view');
