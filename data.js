const demoData = {
    technicians: [
        { id: 'tech-001', name: 'Jordan Davis', role: 'Supervisor', loadout: 'Issued Loadout', status: 'On Duty' },
        { id: 'tech-002', name: 'Alex Morgan', role: 'Technician IV', loadout: 'Issued Loadout', status: 'On Duty' },
        { id: 'tech-003', name: 'Taylor Reed', role: 'Technician III', loadout: 'Closing', status: 'On Duty' },
        { id: 'tech-004', name: 'Casey Brooks', role: 'Technician III', loadout: 'Issued Loadout', status: 'On Duty' },
        { id: 'tech-005', name: 'Riley Chen', role: 'Technician III', loadout: 'Event', status: 'Off Duty' },
        { id: 'tech-006', name: 'Morgan Lee', role: 'Technician III', loadout: 'Issued Loadout', status: 'On Duty' }
    ],

    teamPositions: [
        { technicianId: 'tech-003', type: 'filled' },
        { technicianId: 'tech-004', type: 'filled' },
        { technicianId: 'tech-001', type: 'filled' },
        { technicianId: 'tech-002', type: 'filled' },
        { technicianId: 'tech-005', type: 'filled' },
        { technicianId: 'tech-006', type: 'filled' },
        { technicianId: null, type: 'open', role: 'Technician III', label: 'Open Position' }
    ],

    equipmentSlots: [
        { id: 'hat', label: 'Hat', equipped: 'Billed Cap' },
        { id: 'shirt', label: 'Uniform Shirt', equipped: 'Campus Safety Polo' },
        { id: 'vest', label: 'Under Shirt', equipped: 'Protective Vest' },
        { id: 'mic', label: 'Radio Mic', equipped: 'Wireless Mic' },
        { id: 'name-badge', label: 'Name Badge', equipped: 'Name Badge' },
        { id: 'left-sleeve', label: 'Left Sleeve', equipped: 'Pen / Sharpie / Handcuff Key' },
        { id: 'patch', label: 'Right Shoulder', equipped: 'Campus Safety Patch' },
        { id: 'radio', label: 'Belt Radio', equipped: 'Radio LC-R014' },
        { id: 'keys', label: 'Keys', equipped: 'Key Ring LC-K008' },
        { id: 'access-card', label: 'Access Card', equipped: 'Access Card Demo' },
        { id: 'flashlight', label: 'Flashlight', equipped: 'Flashlight LC-F021' },
        { id: 'gloves', label: 'Gloves Pouch', equipped: 'Gloves Pouch' },
        { id: 'handcuffs', label: 'Handcuffs', equipped: 'Handcuffs LC-H011' },
        { id: 'tourniquet', label: 'Tourniquet', equipped: 'Tourniquet Kit' },
        { id: 'cpr', label: 'CPR Kit', equipped: 'CPR Barrier Kit' },
        { id: 'baton', label: 'Baton', equipped: 'Baton LC-B007' },
        { id: 'pants', label: 'Uniform Pants', equipped: 'Khaki 5.11 Cargo Pants' },
        { id: 'footwear', label: 'Footwear', equipped: 'Black Laced Shoes' }
    ],

    beltPositions: [
        { position: '1:00', item: 'Tourniquet' },
        { position: '2:00', item: 'Flashlight' },
        { position: '3:00', item: 'Baton' },
        { position: '4:00', item: 'Gloves' },
        { position: '5:00', item: 'Handcuffs' },
        { position: '6:00', item: 'Open' },
        { position: '7:00', item: 'CPR Kit' },
        { position: '8:00', item: 'Radio' },
        { position: '9:00', item: 'Open' },
        { position: '10:00', item: 'Keys' },
        { position: '11:00', item: 'Access Card' },
        { position: '12:00', item: 'Open' }
    ],

    inventory: [
        { id: 'LC-R014', name: 'Motorola Radio', category: 'Radio', status: 'Assigned', condition: 'Good', assignedTo: 'Jordan Davis' },
        { id: 'LC-R021', name: 'Motorola Radio', category: 'Radio', status: 'Available', condition: 'Excellent', assignedTo: '' },
        { id: 'LC-F021', name: 'Duty Flashlight', category: 'Flashlight', status: 'Assigned', condition: 'Good', assignedTo: 'Jordan Davis' },
        { id: 'LC-F044', name: 'Duty Flashlight', category: 'Flashlight', status: 'Available', condition: 'Good', assignedTo: '' },
        { id: 'LC-H011', name: 'Handcuffs', category: 'Duty Gear', status: 'Assigned', condition: 'Good', assignedTo: 'Jordan Davis' },
        { id: 'LC-H018', name: 'Handcuffs', category: 'Duty Gear', status: 'Available', condition: 'Good', assignedTo: '' },
        { id: 'LC-B007', name: 'Baton', category: 'Duty Gear', status: 'Assigned', condition: 'Good', assignedTo: 'Jordan Davis' },
        { id: 'LC-B012', name: 'Baton', category: 'Duty Gear', status: 'Maintenance', condition: 'Needs Inspection', assignedTo: '' },
        { id: 'LC-K008', name: 'Key Ring', category: 'Access', status: 'Assigned', condition: 'Good', assignedTo: 'Jordan Davis' },
        { id: 'LC-T003', name: 'Tourniquet Kit', category: 'Medical', status: 'Available', condition: 'New', assignedTo: '' },
        { id: 'LC-C006', name: 'CPR Barrier Kit', category: 'Medical', status: 'Available', condition: 'New', assignedTo: '' },
        { id: 'LC-G004', name: 'Gloves Pouch', category: 'Medical', status: 'Available', condition: 'Good', assignedTo: '' },
        { id: 'LC-U101', name: 'Campus Safety Polo', category: 'Uniform', status: 'Available', condition: 'New', assignedTo: '' },
        { id: 'LC-U202', name: 'Khaki 5.11 Cargo Pants', category: 'Uniform', status: 'Available', condition: 'New', assignedTo: '' },
        { id: 'LC-U305', name: 'Black Laced Shoes', category: 'Uniform', status: 'Available', condition: 'New', assignedTo: '' },
        { id: 'LC-CAP09', name: 'Billed Campus Safety Cap', category: 'Uniform', status: 'Available', condition: 'Good', assignedTo: '' },
        { id: 'LC-BEAN04', name: 'Campus Safety Beanie', category: 'Uniform', status: 'Available', condition: 'Good', assignedTo: '' }
    ]
};

const defaultDemoState = JSON.parse(JSON.stringify(demoData));
