const demoTechnicians = [
    { id: 'tech-001', name: 'Jordan Davis', role: 'Supervisor', loadout: 'Issued Loadout', status: 'On Duty' },
    { id: 'tech-002', name: 'Alex Morgan', role: 'Technician IV', loadout: 'Issued Loadout', status: 'On Duty' },
    { id: 'tech-003', name: 'Taylor Reed', role: 'Technician III', loadout: 'Closing', status: 'On Duty' },
    { id: 'tech-004', name: 'Casey Brooks', role: 'Technician III', loadout: 'Issued Loadout', status: 'On Duty' },
    { id: 'tech-005', name: 'Riley Chen', role: 'Technician III', loadout: 'Event', status: 'Off Duty' },
    { id: 'tech-006', name: 'Morgan Lee', role: 'Technician III', loadout: 'Issued Loadout', status: 'On Duty' }
];

const demoEquipmentSlots = [
    { id: 'hat', label: 'Hat', defaultItem: 'Billed Campus Safety Cap', category: 'Uniform', assetPrefix: 'CAP', required: true },
    { id: 'shirt', label: 'Uniform Shirt', defaultItem: 'Campus Safety Polo', category: 'Uniform', assetPrefix: 'SH', required: true },
    { id: 'vest', label: 'Under Shirt', defaultItem: 'Protective Vest', category: 'Protective Equipment', assetPrefix: 'VST', required: true },
    { id: 'mic', label: 'Radio Mic', defaultItem: 'Wireless Radio Mic', category: 'Radio', assetPrefix: 'MIC', required: true },
    { id: 'name-badge', label: 'Name Badge', defaultItem: 'Campus Safety Name Badge', category: 'Identification', assetPrefix: 'NB', required: true },
    { id: 'left-sleeve', label: 'Left Sleeve', defaultItem: 'Pen / Sharpie / Handcuff Key Set', category: 'Duty Gear', assetPrefix: 'SL', required: true },
    { id: 'patch', label: 'Right Shoulder', defaultItem: 'Campus Safety Patch', category: 'Uniform', assetPrefix: 'PCH', required: true },
    { id: 'radio', label: 'Belt Radio', defaultItem: 'Motorola Radio', category: 'Radio', assetPrefix: 'R', required: true, beltMounted: true },
    { id: 'keys', label: 'Keys', defaultItem: 'Campus Key Ring', category: 'Access', assetPrefix: 'K', required: true, beltMounted: true },
    { id: 'access-card', label: 'Access Card', defaultItem: 'Campus Access Card', category: 'Access', assetPrefix: 'AC', required: true, beltMounted: true },
    { id: 'flashlight', label: 'Flashlight', defaultItem: 'Duty Flashlight', category: 'Duty Gear', assetPrefix: 'F', required: true, beltMounted: true },
    { id: 'gloves', label: 'Gloves Pouch', defaultItem: 'Gloves Pouch', category: 'Medical', assetPrefix: 'G', required: true, beltMounted: true },
    { id: 'handcuffs', label: 'Handcuffs', defaultItem: 'Handcuffs', category: 'Duty Gear', assetPrefix: 'H', required: true, beltMounted: true },
    { id: 'tourniquet', label: 'Tourniquet', defaultItem: 'Tourniquet Kit', category: 'Medical', assetPrefix: 'TQ', required: true, beltMounted: true },
    { id: 'cpr', label: 'CPR Kit', defaultItem: 'CPR Barrier Kit', category: 'Medical', assetPrefix: 'CPR', required: true, beltMounted: true },
    { id: 'baton', label: 'Baton', defaultItem: 'Duty Baton', category: 'Duty Gear', assetPrefix: 'B', required: true, beltMounted: true },
    { id: 'pants', label: 'Uniform Pants', defaultItem: 'Khaki 5.11 Cargo Pants', category: 'Uniform', assetPrefix: 'P', required: true },
    { id: 'footwear', label: 'Footwear', defaultItem: 'Black Laced Shoes', category: 'Uniform', assetPrefix: 'S', required: true }
];

const demoTeamPositions = [
    { technicianId: 'tech-003', type: 'filled' },
    { technicianId: 'tech-004', type: 'filled' },
    { technicianId: 'tech-001', type: 'filled' },
    { technicianId: 'tech-002', type: 'filled' },
    { technicianId: 'tech-005', type: 'filled' },
    { technicianId: 'tech-006', type: 'filled' },
    { technicianId: null, type: 'open', role: 'Technician III', label: 'Open Position' }
];

const demoBeltPositions = [
    { position: '1:00' },
    { position: '2:00' },
    { position: '3:00' },
    { position: '4:00' },
    { position: '5:00' },
    { position: '6:00' },
    { position: '7:00' },
    { position: '8:00' },
    { position: '9:00' },
    { position: '10:00' },
    { position: '11:00' },
    { position: '12:00' }
];

const demoDefaultBeltLayout = {
    tourniquet: '1:00',
    flashlight: '2:00',
    baton: '3:00',
    gloves: '4:00',
    handcuffs: '5:00',
    cpr: '7:00',
    radio: '8:00',
    keys: '10:00',
    'access-card': '11:00'
};

const demoInventory = [];
const issuedAssignments = {};

function makeAssetId(slot, technicianNumber) {
    return `LC-${slot.assetPrefix}-${String(technicianNumber).padStart(3, '0')}`;
}

demoTechnicians.forEach((technician, technicianIndex) => {
    const technicianNumber = technicianIndex + 1;
    issuedAssignments[technician.id] = {};

    demoEquipmentSlots.forEach(slot => {
        const id = makeAssetId(slot, technicianNumber);
        issuedAssignments[technician.id][slot.id] = id;
        demoInventory.push({
            id,
            name: slot.defaultItem,
            category: slot.category,
            slotId: slot.id,
            status: 'Assigned',
            condition: technicianNumber % 3 === 0 ? 'Fair' : 'Good',
            assignedTo: technician.name
        });
    });
});

demoEquipmentSlots.forEach((slot, slotIndex) => {
    demoInventory.push({
        id: `LC-${slot.assetPrefix}-SP01`,
        name: slot.defaultItem,
        category: slot.category,
        slotId: slot.id,
        status: 'Available',
        condition: slotIndex % 4 === 0 ? 'Excellent' : 'Good',
        assignedTo: ''
    });
});

demoInventory.push(
    { id: 'LC-CAP-SP02', name: 'Campus Safety Beanie', category: 'Uniform', slotId: 'hat', status: 'Available', condition: 'Excellent', assignedTo: '' },
    { id: 'LC-S-SP02', name: 'Black Laced Boots', category: 'Uniform', slotId: 'footwear', status: 'Available', condition: 'Excellent', assignedTo: '' },
    { id: 'LC-B-SP02', name: 'Duty Baton', category: 'Duty Gear', slotId: 'baton', status: 'Maintenance', condition: 'Needs Inspection', assignedTo: '' },
    { id: 'LC-R-SP02', name: 'Motorola Radio', category: 'Radio', slotId: 'radio', status: 'Available', condition: 'Excellent', assignedTo: '' },
    { id: 'LC-F-SP02', name: 'Duty Flashlight', category: 'Duty Gear', slotId: 'flashlight', status: 'Available', condition: 'New', assignedTo: '' }
);

function cloneAssignments(assignments) {
    return JSON.parse(JSON.stringify(assignments));
}

const demoLoadouts = {};

demoTechnicians.forEach(technician => {
    const issued = cloneAssignments(issuedAssignments[technician.id]);
    const closing = cloneAssignments(issued);
    const event = cloneAssignments(issued);
    const winter = cloneAssignments(issued);
    const testSetup = cloneAssignments(issued);

    winter.hat = 'LC-CAP-SP02';
    event.footwear = 'LC-S-SP02';

    demoLoadouts[technician.id] = {
        'Issued Loadout': {
            type: 'issued',
            assignments: issued,
            beltLayout: cloneAssignments(demoDefaultBeltLayout)
        },
        'Closing': {
            type: 'hypothetical',
            assignments: closing,
            beltLayout: cloneAssignments(demoDefaultBeltLayout)
        },
        'Event': {
            type: 'hypothetical',
            assignments: event,
            beltLayout: cloneAssignments(demoDefaultBeltLayout)
        },
        'Winter': {
            type: 'hypothetical',
            assignments: winter,
            beltLayout: cloneAssignments(demoDefaultBeltLayout)
        },
        'Test Setup': {
            type: 'hypothetical',
            assignments: testSetup,
            beltLayout: cloneAssignments(demoDefaultBeltLayout)
        }
    };
});

const demoData = {
    technicians: demoTechnicians,
    teamPositions: demoTeamPositions,
    equipmentSlots: demoEquipmentSlots,
    beltPositions: demoBeltPositions,
    defaultBeltLayout: demoDefaultBeltLayout,
    inventory: demoInventory,
    loadouts: demoLoadouts
};

const defaultDemoState = JSON.parse(JSON.stringify(demoData));
