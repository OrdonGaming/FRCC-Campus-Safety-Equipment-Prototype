# FRCC Campus Safety Equipment Dashboard Prototype

A zero-cost proof-of-concept for a videogame-inspired Campus Safety equipment dashboard focused on the Front Range Community College Larimer Campus team.

## Prototype goals

- Visual technician loadouts built around a neutral mannequin
- Saved issued and hypothetical loadouts
- Inventory availability and save-validation concepts
- Duty-belt clock-position slots
- Larimer Campus Team View with variable team sizes
- Supervisor centered in the lineup
- Technician IV positioned to the Supervisor's right
- Technician IIIs arranged evenly around them
- Open positions grouped at the far right of the team lineup
- Demo user roles and permissions
- Local browser storage only
- Client-side Excel export
- Automatic guided demonstration for first-time viewers

## Prototype constraints

This prototype is intentionally designed to cost $0 to build and demonstrate.

It uses plain HTML, CSS, and JavaScript with no paid:

- Hosting
- Database
- API
- Domain
- Framework
- Subscription service

Only fictional or sanitized demonstration personnel and inventory data should be committed to this repository.

## Branding

This prototype uses the approved Front Range Community College color and typography direction. The proof of concept intentionally retains a simple text-based FRCC identifier rather than requiring an official logo asset.

## Current interactive build

Build 0.11.0 includes the Technician Loadout workflow, enhanced Larimer Team View, functional demo role/permission system, client-side Excel reporting, a presentation-ready Home screen, an automatic guided demo, and a stronger concept-art-inspired mannequin visual redesign.

### Mannequin Visual Redesign

Build 0.11.0 substantially reworks the mannequin presentation while keeping the underlying prototype behavior unchanged.

- Taller, cleaner technician silhouette with less blocky proportions
- More dimensional neutral head and body treatment while remaining a non-realistic display mannequin
- Refined LAPD-blue polo with collar, seam, shading, and subtle protective-vest layering
- Improved khaki cargo pants with visible cargo-pocket treatment and leg shaping
- Cleaner black shoes and boot variants
- More polished duty belt with buckle and keeper details
- Refined hats, beanies, badge, mic, patch, and duty-gear presentation
- Improved mannequin stage with a presentation-style floor/platform treatment
- Team mannequins use the same visual language as the individual loadout mannequin
- Open positions now use a deliberate outlined/ghosted mannequin instead of simply dimming a normal team member
- Supervisor hierarchy is visually emphasized without changing body shape or implying a different type of person

The redesign is implemented as a presentation layer only. Loadouts, inventory behavior, permissions, Excel exports, local storage, and the automatic demo continue to use the same data and logic.

### Technician Loadout

- Clickable equipment slots
- Inventory filtering by selected slot
- Click-to-equip equipment swapping
- Basic drag-and-drop from inventory to compatible equipment slots
- Immediate mannequin feedback for selected gear
- Visual representations for radio, mic, name badge, sleeve tools, patch, keys, access card, flashlight, pouches, handcuffs, tourniquet, CPR kit, and baton
- Hat and footwear visual changes, including billed cap, beanie, shoes, and boots
- Visible uniform state for shirt, under-shirt protective vest, pants, and footwear
- Editable duty-belt clock positions from 1:00 through 12:00
- Automatic swapping when equipment is moved onto an occupied clock position
- Belt positions saved independently for each loadout
- Unsaved-change highlighting for both equipment and belt placement
- Required-slot and belt-position validation
- Assigned/available/maintenance inventory validation
- Functional Discard, Save As, New Loadout, and Save Loadout controls
- Issued loadouts that update prototype inventory only when saved
- Hypothetical loadouts that save without reserving or changing inventory
- Browser `localStorage` persistence
- Reset Demo Data

### Team View

- Variable team sizes with the lineup automatically centered
- Supervisor presented at front center
- Technician IV positioned to the Supervisor's right
- Technician IIIs balanced around the two lead positions
- Open positions always placed at the far right of the lineup
- Team mannequins reflect each technician's currently saved loadout
- Hat, vest, mic, badge, sleeve tools, patch, footwear, and belt gear are represented on the team mannequins
- Saved duty-belt clock positions are reflected in each team mannequin
- On-duty and off-duty visual states
- Staffing summary showing filled, on-duty, off-duty, and open positions
- Technician cards showing role, active loadout, status, and equipped-item count
- Clicking a technician mannequin or card opens that technician's loadout directly

### Demo Roles & Permissions

The top-bar Demo Role selector changes actual prototype permissions rather than only changing a label.

- **Technician III** acts as Taylor Reed. Can create and edit personal hypothetical loadouts, but the personal issued loadout is read only and other technicians are read only.
- **Technician IV** acts as Alex Morgan. Can edit personal hypothetical and issued loadouts, while other technicians remain read only.
- **Supervisor** acts as Jordan Davis. Can edit issued and hypothetical loadouts for the entire Larimer team.
- **Admin** has full prototype editing access and is the only demo role allowed to use Reset Demo Data.
- A visible permission banner shows who the role is acting as, who is currently being viewed, whether the current loadout is editable, and the role's major capabilities.
- Switching demo roles automatically opens that role's demo user where applicable.
- Read-only states block inventory swaps, drag-and-drop, belt-position changes, Save, Save As, and New Loadout actions as appropriate.
- Team View, Inventory, and prototype report export remain viewable to all four demo roles.

These permission defaults are for demonstration only. A production version would use configurable user-group permissions backed by real authentication.

### Excel Export

The Excel Export view generates `.xlsx` reports in the user's browser.

- **Full Prototype Workbook** includes overview, inventory, available inventory, technician roster, team positions, team equipment, and every saved/issued loadout.
- **Inventory Report** includes all prototype inventory and a separate available-inventory sheet.
- **Current Technician Loadout** exports the loadout currently being viewed, including item details and duty-belt clock positions. If the user has unsaved staged changes, the export identifies the report as a current unsaved draft.
- **Team Loadout Report** exports lineup order, open positions, role/status information, and detailed equipment for each filled team position.
- Export files are generated locally in the browser. Prototype data is not uploaded to a reporting server during the export process.
- The prototype uses the free SheetJS Community Edition browser library to generate `.xlsx` workbooks.

### Automated Demo

The Home screen's **Start Demo** button plays the major prototype workflow automatically like a short guided movie.

The sequence:

1. Removes any automated demo loadout left by a previous demo run.
2. Switches the prototype to Supervisor permissions.
3. Opens Taylor Reed's Technician III loadout.
4. Creates one temporary `Automated Demo Loadout` cloned from the issued configuration.
5. Changes the billed cap to the available Campus Safety beanie.
6. Changes footwear to the available black laced boots.
7. Moves the belt radio from 8:00 to 9:00, then moves the campus key ring from 10:00 to the newly open 8:00 position.
8. Saves the hypothetical loadout.
9. Opens Team View to show the saved changes on the technician mannequin.
10. Opens Excel Export and simulates preparation of the Current Technician Loadout workbook without forcing a file download.
11. Returns to the Home screen.

The automatic demo displays a progress/status player and animated focus indicator. Viewers can stop the demo at any time. If the demo is stopped early, its temporary loadout is removed. After a completed demo, the single automated loadout remains available for inspection; pressing Start Demo again removes that previous automated example before creating a new one, preventing duplicate demo loadouts from accumulating in browser storage.

## Status

Interactive Larimer Campus proof-of-concept in presentation and demonstration testing. Production authentication, persistent backend storage, real inventory integrations, additional campuses, vehicles, and expanded reporting remain outside the zero-cost prototype scope.
