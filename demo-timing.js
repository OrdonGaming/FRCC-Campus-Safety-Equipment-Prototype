const AUTO_DEMO_TIMING_SCALE = 1;
const AUTO_DEMO_PATCH_BUILD = '0.11.0';

// Build 0.10.2 moved the approximately one-minute pacing into home.js.
// Keep this compatibility layer at 1x so timing is not doubled a second time.
if (typeof waitForDemo === 'function' && AUTO_DEMO_TIMING_SCALE !== 1) {
    const baseWaitForDemoForTiming = waitForDemo;
    waitForDemo = function waitForDemoAtPresentationPace(milliseconds) {
        return baseWaitForDemoForTiming(Math.round(milliseconds * AUTO_DEMO_TIMING_SCALE));
    };
}

// Preserve the corrected second belt demonstration: move the campus key ring
// from 10:00 to the newly open 8:00 position after the radio moves to 9:00.
if (typeof demoStep === 'function') {
    const baseDemoStepForBeltExample = demoStep;
    demoStep = async function demoStepWithKeyRingExample(stepNumber, totalSteps, label, status, target, action, hold = 900) {
        if (stepNumber === 9) {
            return baseDemoStepForBeltExample(
                stepNumber,
                totalSteps,
                'Move Key Ring',
                'Moving the campus key ring from 10:00 to the newly open 8:00 belt position to demonstrate a second belt-layout change.',
                () => document.querySelector('[data-slot-id="keys"]'),
                async () => {
                    selectSlot('keys');
                    await waitForDemo(450);
                    await focusDemoTarget(() => document.querySelector('[data-position="8:00"]'));
                    await waitForDemo(350);
                    moveSelectedBeltItem('8:00');
                },
                hold
            );
        }

        return baseDemoStepForBeltExample(stepNumber, totalSteps, label, status, target, action, hold);
    };
}

function loadMannequinRedesignStyles() {
    const existing = document.querySelector('link[data-mannequin-redesign]');
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `mannequin-v2.css?v=${AUTO_DEMO_PATCH_BUILD}`;
    link.dataset.mannequinRedesign = 'true';
    document.head.appendChild(link);
}

function applyAutoDemoPatchBuildLabel() {
    const homeBuild = document.getElementById('home-build-value');
    if (homeBuild) homeBuild.textContent = AUTO_DEMO_PATCH_BUILD;

    const footerBuild = document.querySelector('.footer span:last-child');
    if (footerBuild) footerBuild.textContent = `Proof of Concept · Local demo data only · Build ${AUTO_DEMO_PATCH_BUILD}`;

    const startButton = document.getElementById('home-start-demo');
    if (startButton) startButton.title = 'Play the approximately one-minute automatic prototype walkthrough';
}

if (typeof renderHomeDashboard === 'function') {
    const baseRenderHomeDashboardForTiming = renderHomeDashboard;
    renderHomeDashboard = function renderHomeDashboardWithTimingPatch() {
        baseRenderHomeDashboardForTiming();
        applyAutoDemoPatchBuildLabel();
    };
}

if (typeof overviewRows === 'function') {
    const baseOverviewRowsForTiming = overviewRows;
    overviewRows = function overviewRowsWithTimingPatch(reportName) {
        const rows = baseOverviewRowsForTiming(reportName);
        const buildRow = rows.find(row => row?.[0] === 'Prototype Build');
        if (buildRow) buildRow[1] = AUTO_DEMO_PATCH_BUILD;
        return rows;
    };
}

loadMannequinRedesignStyles();
applyAutoDemoPatchBuildLabel();