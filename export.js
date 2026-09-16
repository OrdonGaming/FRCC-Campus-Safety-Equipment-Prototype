const exportLibraryStatus = document.getElementById('export-library-status');

function excelAvailable() {
    const available = typeof XLSX !== 'undefined';

    if (exportLibraryStatus) {
        exportLibraryStatus.textContent = available
            ? 'Excel export ready · files are generated in this browser'
            : 'Excel export library could not load';
        exportLibraryStatus.classList.toggle('ready', available);
        exportLibraryStatus.classList.toggle('error', !available);
    }

    if (!available) {
        showToast('Excel export is temporarily unavailable because the browser could not load the export library.');
    }

    return available;
}

function exportTimestamp() {
    return new Date().toLocaleString();
}

function exportDateSlug() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function safeFileSegment(value) {
    return String(value || 'Report')
        .trim()
        .replace(/[^a-z0-9-_]+/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'Report';
}

function setColumnWidths(sheet, widths) {
    sheet['!cols'] = widths.map(width => ({ wch: width }));
}

function addJsonSheet(workbook, name, rows, widths = []) {
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'No data available' }]);
    if (widths.length) setColumnWidths(sheet, widths);
    if (rows.length && sheet['!ref']) {
        const range = XLSX.utils.decode_range(sheet['!ref']);
        sheet['!autofilter'] = {
            ref: XLSX.utils.encode_range({ r: 0, c: 0 }, { r: range.e.r, c: range.e.c })
        };
    }
    XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function addAoaSheet(workbook, name, rows, widths = []) {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    if (widths.length) setColumnWidths(sheet, widths);
    XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function inventoryRows(items = state.inventory) {
    return items.map(item => ({
        'Asset ID': item.id,
        'Item': item.name,
        'Category': item.category,
        'Equipment Slot': getSlot(item.slotId)?.label || item.slotId,
        'Status': item.status,
        'Condition': item.condition,
        'Assigned To': item.assignedTo || '',
        'Campus': 'Larimer'
    }));
}

function technicianRows() {
    return state.technicians.map(technician => {
        const loadout = getTechnicianDisplayLoadout(technician);
        return {
            'Technician': technician.name,
            'Role': technician.role,
            'Status': technician.status,
            'Active Loadout': technician.loadout,
            'Loadout Type': loadout.type === 'issued' ? 'Issued' : 'Saved / Hypothetical',
            'Equipped Items': Object.values(loadout.assignments || {}).filter(Boolean).length,
            'Campus': 'Larimer'
        };
    });
}

function currentLoadoutRows() {
    const technician = getCurrentTechnician();
    const loadout = getCurrentLoadout();
    const useDraft = isDirty();
    const assignments = useDraft ? draftAssignments : (loadout?.assignments || {});
    const beltLayout = useDraft ? draftBeltLayout : (loadout?.beltLayout || state.defaultBeltLayout || {});

    return state.equipmentSlots.map(slot => {
        const itemId = assignments[slot.id];
        const item = itemId ? getInventoryItem(itemId) : null;
        return {
            'Technician': technician?.name || '',
            'Role': technician?.role || '',
            'Loadout': currentLoadoutName,
            'Loadout Type': loadout?.type === 'issued' ? 'Issued' : 'Saved / Hypothetical',
            'Export State': useDraft ? 'Current Unsaved Draft' : 'Saved',
            'Equipment Slot': slot.label,
            'Item': item?.name || '',
            'Asset ID': item?.id || '',
            'Category': item?.category || slot.category || '',
            'Status': item?.status || '',
            'Condition': item?.condition || '',
            'Belt Position': slot.beltMounted ? (beltLayout[slot.id] || '') : ''
        };
    });
}

function allLoadoutRows() {
    const rows = [];

    state.technicians.forEach(technician => {
        const technicianLoadouts = state.loadouts[technician.id] || {};

        Object.entries(technicianLoadouts).forEach(([loadoutName, loadout]) => {
            state.equipmentSlots.forEach(slot => {
                const itemId = loadout.assignments?.[slot.id];
                const item = itemId ? getInventoryItem(itemId) : null;

                rows.push({
                    'Technician': technician.name,
                    'Role': technician.role,
                    'Loadout': loadoutName,
                    'Loadout Type': loadout.type === 'issued' ? 'Issued' : 'Saved / Hypothetical',
                    'Active Loadout': technician.loadout === loadoutName ? 'Yes' : 'No',
                    'Equipment Slot': slot.label,
                    'Item': item?.name || '',
                    'Asset ID': item?.id || '',
                    'Belt Position': slot.beltMounted ? (loadout.beltLayout?.[slot.id] || '') : ''
                });
            });
        });
    });

    return rows;
}

function teamPositionRows() {
    const { arranged } = arrangeTeamPositions();

    return arranged.map((entry, index) => {
        if (entry.type === 'open') {
            return {
                'Lineup Order': index + 1,
                'Position Status': 'Open Position',
                'Technician': '',
                'Role': entry.role || 'Technician III',
                'Duty Status': '',
                'Active Loadout': 'Open Position',
                'Loadout Type': '',
                'Equipped Items': 0
            };
        }

        const loadout = getTechnicianDisplayLoadout(entry.tech);
        return {
            'Lineup Order': index + 1,
            'Position Status': 'Filled',
            'Technician': entry.tech.name,
            'Role': entry.tech.role,
            'Duty Status': entry.tech.status,
            'Active Loadout': entry.tech.loadout,
            'Loadout Type': loadout.type === 'issued' ? 'Issued' : 'Saved / Hypothetical',
            'Equipped Items': Object.values(loadout.assignments || {}).filter(Boolean).length
        };
    });
}

function teamEquipmentRows() {
    const { arranged } = arrangeTeamPositions();
    const rows = [];

    arranged.forEach((entry, lineupIndex) => {
        if (entry.type === 'open') {
            rows.push({
                'Lineup Order': lineupIndex + 1,
                'Technician': 'Open Position',
                'Role': entry.role || 'Technician III',
                'Loadout': 'Open Position',
                'Equipment Slot': '',
                'Item': '',
                'Asset ID': '',
                'Belt Position': ''
            });
            return;
        }

        const loadout = getTechnicianDisplayLoadout(entry.tech);

        state.equipmentSlots.forEach(slot => {
            const itemId = loadout.assignments?.[slot.id];
            const item = itemId ? getInventoryItem(itemId) : null;
            rows.push({
                'Lineup Order': lineupIndex + 1,
                'Technician': entry.tech.name,
                'Role': entry.tech.role,
                'Loadout': entry.tech.loadout,
                'Equipment Slot': slot.label,
                'Item': item?.name || '',
                'Asset ID': item?.id || '',
                'Belt Position': slot.beltMounted ? (loadout.beltLayout?.[slot.id] || '') : ''
            });
        });
    });

    return rows;
}

function overviewRows(reportName) {
    const actingTechnician = typeof getActingTechnician === 'function' ? getActingTechnician() : null;
    return [
        ['FRCC Campus Safety Equipment Dashboard Prototype'],
        [reportName],
        [],
        ['Campus', 'Larimer'],
        ['Prototype Build', '0.8.0'],
        ['Exported', exportTimestamp()],
        ['Demo Role', roleSelect?.value || ''],
        ['Acting As', actingTechnician?.name || (roleSelect?.value === 'Admin' ? 'Prototype Administrator' : '')],
        ['Current Technician', getCurrentTechnician()?.name || ''],
        ['Current Loadout', currentLoadoutName || ''],
        [],
        ['Data Notice', 'Prototype demonstration data only. No live Campus Safety asset records are included.']
    ];
}

function writeWorkbook(workbook, filename) {
    try {
        XLSX.writeFile(workbook, filename, { compression: true });
        showToast(`${filename} downloaded.`);
    } catch (error) {
        console.error('Excel export failed.', error);
        showToast('Excel export failed. Please try again.');
    }
}

function exportFullWorkbook() {
    if (!excelAvailable()) return;

    const workbook = XLSX.utils.book_new();
    addAoaSheet(workbook, 'Overview', overviewRows('Full Prototype Workbook'), [28, 62]);
    addJsonSheet(workbook, 'Inventory', inventoryRows(), [16, 28, 22, 24, 16, 18, 24, 12]);
    addJsonSheet(workbook, 'Available Inventory', inventoryRows(state.inventory.filter(item => item.status === 'Available')), [16, 28, 22, 24, 16, 18, 24, 12]);
    addJsonSheet(workbook, 'Technicians', technicianRows(), [24, 18, 14, 22, 22, 16, 12]);
    addJsonSheet(workbook, 'Team Positions', teamPositionRows(), [14, 18, 24, 18, 14, 22, 22, 16]);
    addJsonSheet(workbook, 'Team Equipment', teamEquipmentRows(), [14, 24, 18, 22, 24, 28, 18, 16]);
    addJsonSheet(workbook, 'All Loadouts', allLoadoutRows(), [24, 18, 22, 22, 14, 24, 28, 18, 16]);

    writeWorkbook(workbook, `FRCC-Larimer-Equipment-Dashboard-${exportDateSlug()}.xlsx`);
}

function exportInventoryWorkbook() {
    if (!excelAvailable()) return;

    const workbook = XLSX.utils.book_new();
    addAoaSheet(workbook, 'Overview', overviewRows('Larimer Inventory Report'), [28, 62]);
    addJsonSheet(workbook, 'Inventory', inventoryRows(), [16, 28, 22, 24, 16, 18, 24, 12]);
    addJsonSheet(workbook, 'Available Inventory', inventoryRows(state.inventory.filter(item => item.status === 'Available')), [16, 28, 22, 24, 16, 18, 24, 12]);

    writeWorkbook(workbook, `FRCC-Larimer-Inventory-${exportDateSlug()}.xlsx`);
}

function exportCurrentLoadoutWorkbook() {
    if (!excelAvailable()) return;

    const technician = getCurrentTechnician();
    const workbook = XLSX.utils.book_new();
    addAoaSheet(workbook, 'Overview', overviewRows('Current Technician Loadout'), [28, 62]);
    addJsonSheet(workbook, 'Loadout', currentLoadoutRows(), [24, 18, 22, 22, 20, 24, 28, 18, 22, 16, 18, 16]);

    const filename = `FRCC-${safeFileSegment(technician?.name)}-${safeFileSegment(currentLoadoutName)}-${exportDateSlug()}.xlsx`;
    writeWorkbook(workbook, filename);
}

function exportTeamWorkbook() {
    if (!excelAvailable()) return;

    const workbook = XLSX.utils.book_new();
    addAoaSheet(workbook, 'Overview', overviewRows('Larimer Team Loadout Report'), [28, 62]);
    addJsonSheet(workbook, 'Team Positions', teamPositionRows(), [14, 18, 24, 18, 14, 22, 22, 16]);
    addJsonSheet(workbook, 'Team Equipment', teamEquipmentRows(), [14, 24, 18, 22, 24, 28, 18, 16]);

    writeWorkbook(workbook, `FRCC-Larimer-Team-Loadouts-${exportDateSlug()}.xlsx`);
}

const exportButtons = {
    'export-full-workbook': exportFullWorkbook,
    'export-inventory-workbook': exportInventoryWorkbook,
    'export-current-loadout-workbook': exportCurrentLoadoutWorkbook,
    'export-team-workbook': exportTeamWorkbook
};

Object.entries(exportButtons).forEach(([buttonId, handler]) => {
    const button = document.getElementById(buttonId);
    if (button) button.addEventListener('click', handler);
});

excelAvailable();
