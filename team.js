const teamSummary = document.getElementById('team-summary');

function getTechnicianDisplayLoadout(technician) {
    const technicianLoadouts = state.loadouts[technician.id] || {};
    return technicianLoadouts[technician.loadout]
        || technicianLoadouts['Issued Loadout']
        || Object.values(technicianLoadouts)[0]
        || { type: 'hypothetical', assignments: {}, beltLayout: {} };
}

function getTeamItemName(loadout, slotId) {
    const itemId = loadout?.assignments?.[slotId];
    if (!itemId) return '';
    return getInventoryItem(itemId)?.name || itemId;
}

function getTeamMannequinClasses(technician, loadout) {
    const classes = ['team-mannequin', 'team-loadout-mannequin', 'operator-figure'];
    const assignments = loadout?.assignments || {};

    const hatName = getTeamItemName(loadout, 'hat').toLowerCase();
    const footwearName = getTeamItemName(loadout, 'footwear').toLowerCase();

    if (hatName.includes('beanie')) classes.push('team-has-beanie');
    else if (assignments.hat) classes.push('team-has-cap');

    if (assignments.vest) classes.push('team-has-vest');
    if (assignments.mic) classes.push('team-has-mic');
    if (assignments['name-badge']) classes.push('team-has-badge');
    if (assignments['left-sleeve']) classes.push('team-has-sleeve-tools');
    if (assignments.patch) classes.push('team-has-patch');
    if (footwearName.includes('boot')) classes.push('team-has-boots');
    if (technician.status === 'Off Duty') classes.push('team-off-duty');

    return classes.join(' ');
}

function getTeamBeltGearMarkup(loadout) {
    const assignments = loadout?.assignments || {};
    const beltLayout = loadout?.beltLayout || state.defaultBeltLayout || {};

    return state.equipmentSlots
        .filter(slot => slot.beltMounted && assignments[slot.id] && beltLayout[slot.id])
        .map(slot => {
            const item = getInventoryItem(assignments[slot.id]);
            const position = beltLayout[slot.id];
            const hour = String(position).split(':')[0];
            const rearClass = ['5', '6', '7'].includes(hour) ? ' team-belt-rear' : '';
            return `<span class="team-belt-gear team-belt-${escapeHtml(slot.id)} team-belt-pos-${escapeHtml(hour)}${rearClass}" title="${escapeHtml(item?.name || slot.label)} · ${escapeHtml(position)}"></span>`;
        })
        .join('');
}

function enhancedTeamMannequinMarkup(technician, loadout) {
    const classes = getTeamMannequinClasses(technician, loadout);

    return `
        <div class="${classes}" aria-hidden="true">
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
}

function openTeamMannequinMarkup() {
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
}

function arrangeTeamPositions() {
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
    const otherRoles = filled.filter(item => !['Supervisor', 'Technician IV', 'Technician III'].includes(item.tech.role));

    const leftSide = [];
    const rightSide = [];

    [...techIIIs, ...otherRoles].forEach((item, index) => {
        if (index % 2 === 0) leftSide.unshift(item);
        else rightSide.push(item);
    });

    return {
        filled,
        open,
        arranged: [
            ...leftSide,
            ...(supervisor ? [supervisor] : []),
            ...(techIV ? [techIV] : []),
            ...rightSide,
            ...open
        ]
    };
}

function openTechnicianFromTeam(technicianId) {
    if (!technicianId) return;

    if (technicianId !== currentTechnicianId) {
        if (!confirmDiscardIfNeeded()) return;

        currentTechnicianId = technicianId;
        const technician = getCurrentTechnician();
        currentLoadoutName = technician?.loadout || 'Issued Loadout';
        populateTechnicians();
        populateLoadouts();
        loadDraftFromSelection();
    }

    switchView('loadout-view');
    const technician = getCurrentTechnician();
    showToast(`Opened ${technician?.name || 'technician'} · ${currentLoadoutName}.`);
}

function operatorRoleTag(role) {
    if (role === 'Supervisor') return 'SUPV';
    if (role === 'Technician IV') return 'TECH IV';
    if (role === 'Technician III') return 'TECH III';
    return role || 'TEAM';
}

function operatorCardMarkup(item) {
    if (item.type === 'open') {
        const role = item.role || 'Technician III';
        return `
            <article class="team-member operator-card open-position" aria-label="Open ${escapeHtml(role)} position">
                <div class="operator-card-visual">
                    <span class="operator-loadout-tag">Vacant</span>
                    <span class="operator-rank-tag">${escapeHtml(operatorRoleTag(role))}</span>
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
                <span class="operator-rank-tag">${escapeHtml(operatorRoleTag(item.tech.role))}</span>
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

renderTeam = function renderEnhancedTeam() {
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

    teamLineup.innerHTML = arranged.map(operatorCardMarkup).join('');

    teamCards.innerHTML = arranged.map(item => {
        if (item.type === 'open') {
            return `
                <article class="team-card open-team-card">
                    <strong>Open Position</strong><br>
                    <small>${escapeHtml(item.role || 'Technician III')} · Loadout: Open Position</small>
                </article>
            `;
        }

        const loadout = getTechnicianDisplayLoadout(item.tech);
        const equipmentCount = Object.values(loadout.assignments || {}).filter(Boolean).length;
        const statusClass = item.tech.status === 'On Duty' ? 'status-on-duty' : 'status-off-duty';

        return `
            <article
                class="team-card team-card-interactive ${statusClass}"
                data-technician-id="${escapeHtml(item.tech.id)}"
                tabindex="0"
                role="button"
                aria-label="Open ${escapeHtml(item.tech.name)} loadout"
            >
                <div class="team-card-topline">
                    <strong>${escapeHtml(item.tech.name)}</strong>
                    <span class="team-card-status ${statusClass}">${escapeHtml(item.tech.status)}</span>
                </div>
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
