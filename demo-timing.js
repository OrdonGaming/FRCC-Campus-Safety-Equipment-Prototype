const AUTO_DEMO_TIMING_SCALE = 2;
const AUTO_DEMO_PATCH_BUILD = '0.10.1';

// The original automatic walkthrough was intentionally brisk. This patch
// doubles every scripted pause so the same sequence plays at a presentation-
// friendly pace of roughly one minute without changing the demonstrated steps.
if (typeof waitForDemo === 'function') {
    const baseWaitForDemoForTiming = waitForDemo;
    waitForDemo = function waitForDemoAtPresentationPace(milliseconds) {
        return baseWaitForDemoForTiming(Math.round(milliseconds * AUTO_DEMO_TIMING_SCALE));
    };
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

applyAutoDemoPatchBuildLabel();