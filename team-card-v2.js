// Build 0.11.1 — operator-card Team View renderer.
// This patch is intentionally loaded after the existing team workflow so the
// visual redesign remains independent of inventory, permissions, and exports.

(function installOperatorCardTeamView() {
    if (window.__operatorCardTeamViewInstalled) return;
    window.__operatorCardTeamViewInstalled = true;

    function operatorRoleTagV2(role) {
        if (role === 'Supervisor') return 'SUPV';
        if (role === 'Technician IV') return 'TECH IV';
        if (role === 'Technician III') return 'TECH III';
        return role || 'TEAM';
    }

    enhancedTeamMannequinMarkup = function enhancedOperatorFigureMarkup(technician, loadout) {
        const classes = getTeamMannequinClasses(technician, loadout)
            .split(' ')
            .filter(Boolean);
        if (!classes.includes('operator-figure')) classes.push('operator-figure');

        return `
            <div class="${classes.join(' ')}" aria-hidden="true">
                <div class="figure-shadow"></div>
                <div class="head"><span class="team-cap-label">CS</span></div>
                <div class="neck"></div>
                <div class="torso">
                    <span class="team-shirt-logo">CAMPUS<br>SAFETY</span>
                    <span class="team-vest"></span>
                    <span class="team-patch"></span>
                    <span class="team-mic"></span>
                    <span class="team-badge"></span>
                </div>
                <div class="arm left"><span class="team-sleeve-tools"></span></div>
                <div class="arm right"></div>
                <div class="forearm left"></div>
                <div class="forearm right"></div>
                <div class="hand left"></div>
                <div class="hand right"></div>
                <div class="team-duty-belt"></div>
                ${getTeamBeltGearMarkup(loadout)}
                <div class="leg left"></div>
                <div class="leg right"></div>
                <div class="team-shoe left"></div>
                <div class="team-shoe right"></div>
            </div>
        `;
    };

    openTeamMannequinMarkup = function openOperatorFigureMarkup() {
        return `
            <div class="team-mannequin open-team-mannequin operator-figure" aria-hidden="true">
                <div class="figure-shadow"></div>
                <div class="head"></div>
                <div class="neck"></div>
                <div class="torso"></div>
                <div class="arm left"></div>
                <div class="arm right"></div>
                <div class="forearm left"></div>
                <div class="forearm right"></div>
                <div class="hand left"></div>
                <div class="hand right"></div>
                <div class="team-duty-belt"></div>
                <div class="leg left"></div>
                <div class="leg right"></div>
                <div class="team-shoe left"></div>
                <div class="team-shoe right"></div>
            </div>
        `;
    };

    function operatorCardMarkupV2(item) {
        if (item.type === 'open') {
            const role = item.role || 'Technician III';
            return `
                <article class="team-member operator-card open-position" aria-label="Open ${escapeHtml(role)} position">
                    <div class="operator-card-visual">
                        <span class="operator-loadout-tag">Vacant</span>
                        <span class="operator-rank-tag">${escapeHtml(operatorRoleTagV2(role))}</span>
                        ${openTeamMannequinMarkup()}
                    </div>
                    <div class="operator-info-plate">
                        <div class="operator-name">Open Position</div>
                        <div class="operator-role">${escapeHtml(role)}</div>
                        <div class="operator-meta">
                            <span class="operator-status">Vacant</span>
                            <span class="operator-loadout-name">No loadout assigned</span>
                        </div>
                    </div>
                </article>
            `;
        }

        const loadout = getTechnicianDisplayLoadout(item.tech);
        const loadoutType = loadout.type === 'issued' ? 'Issued' : 'Saved';
        const statusClass = item.tech.status === 'On Duty' ? 'status-on-duty' : 'status-off-duty';

        return `
            <article
                class="team-member operator-card team-member-interactive ${memberClass(item.tech.role, item.type)} ${statusClass}"
                data-technician-id="${escapeHtml(item.tech.id)}"
                tabindex="0"
                role="button"
                aria-label="Open ${escapeHtml(item.tech.name)} ${escapeHtml(item.tech.loadout)} loadout"
            >
                <div class="operator-card-visual">
                    <span class="operator-loadout-tag" title="${escapeHtml(item.tech.loadout)}">${escapeHtml(item.tech.loadout)}</span>
                    <span class="operator-rank-tag">${escapeHtml(operatorRoleTagV2(item.tech.role))}</span>
                    ${enhancedTeamMannequinMarkup(item.tech, loadout)}
                </div>
                <div class="operator-info-plate">
                    <div class="operator-name">${escapeHtml(item.tech.name)}</div>
                    <div class="operator-role">${escapeHtml(item.tech.role)}</div>
                    <div class="operator-meta">
                        <span class="operator-status ${statusClass}">${escapeHtml(item.tech.status)}</span>
                        <span class="operator-loadout-name">${loadoutType} · ${escapeHtml(item.tech.loadout)}</span>
                    </div>
                </div>
            </article>
        `;
    }

    renderTeam = function renderOperatorCardTeam() {
        const { filled, open, arranged } = arrangeTeamPositions();
        const onDuty = filled.filter(item => item.tech.status === 'On Duty').length;
        const offDuty = filled.filter(item => item.tech.status !== 'On Duty').length;

        if (teamSummary) {
            teamSummary.innerHTML = `
                <div class="team-summary-chip"><strong>${filled.length}</strong><span>Filled Positions</span></div>
                <div class="team-summary-chip on-duty"><strong>${onDuty}</strong><span>On Duty</span></div>
                <div class="team-summary-chip off-duty"><strong>${offDuty}</strong><span>Off Duty</span></div>
                <div class="team-summary-chip open"><strong>${open.length}</strong><span>Open Positions</span></div>
            `;
        }

        teamLineup.innerHTML = arranged.map(operatorCardMarkupV2).join('');

        // Retain the legacy detail row in the DOM for compatibility with
        // existing logic; the 0.11.1 stylesheet hides it visually.
        teamCards.innerHTML = arranged.map(item => {
            if (item.type === 'open') {
                return `<article class="team-card open-team-card"><strong>Open Position</strong><br><small>${escapeHtml(item.role || 'Technician III')} · Loadout: Open Position</small></article>`;
            }

            const loadout = getTechnicianDisplayLoadout(item.tech);
            const equipmentCount = Object.values(loadout.assignments || {}).filter(Boolean).length;
            const statusClass = item.tech.status === 'On Duty' ? 'status-on-duty' : 'status-off-duty';
            return `
                <article class="team-card team-card-interactive ${statusClass}" data-technician-id="${escapeHtml(item.tech.id)}" tabindex="0" role="button" aria-label="Open ${escapeHtml(item.tech.name)} loadout">
                    <div class="team-card-topline"><strong>${escapeHtml(item.tech.name)}</strong><span class="team-card-status ${statusClass}">${escapeHtml(item.tech.status)}</span></div>
                    <small>${escapeHtml(item.tech.role)} · ${escapeHtml(item.tech.loadout)}</small>
                    <div class="team-card-detail">${equipmentCount} equipped items · Click to view loadout</div>
                </article>
            `;
        }).join('');

        document.querySelectorAll('[data-technician-id]').forEach(element => {
            const technicianId = element.dataset.technicianId;
            element.addEventListener('click', () => openTechnicianFromTeam(technicianId));
            element.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openTechnicianFromTeam(technicianId);
                }
            });
        });
    };

    renderTeam();
})();
