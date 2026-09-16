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
- A polished presentation flow suitable for sharing as a proof of concept

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

This prototype uses approved Front Range Community College branding colors and typography direction.

Official FRCC logo artwork should be added from an approved source file and should not be recreated, distorted, recolored, or modified. Until that asset is supplied, the sidebar uses a temporary text-only FRCC mark.

## Current interactive build

Build 0.9.0 includes the Technician Loadout workflow, enhanced Larimer Team View, functional demo role/permission system, client-side Excel reporting, and a polished prototype landing experience.

### Presentation Home

Build 0.9.0 adds a dedicated Home view designed for demonstrations and external proof-of-concept review.

- Opens as the default page when the prototype loads
- Presents the prototype purpose before exposing operational controls
- Shows filled positions, open positions, available inventory, and saved loadout counts
- Displays the current demo role, currently viewed technician, inventory summary, and build number
- Provides direct navigation into Technician Loadout, Team View, Inventory, and Excel Export
- Includes a **Start Demo** action that switches to Supervisor mode and opens the Larimer Team View
- Includes a short suggested FireFly presentation sequence
- Clearly identifies that the prototype uses fictional/sanitized data and local browser storage
- Uses FRCC blue, white, gold accents, and Roboto/Roboto Condensed as the approved free typography alternative

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

Reports are generated in the user's browser and downloaded as `.xlsx` files.

- **Full Prototype Workbook** includes overview, inventory, available inventory, technician roster, team positions, team equipment, and every saved/issued loadout.
- **Inventory Report** includes all prototype inventory and a separate available-inventory sheet.
- **Current Technician Loadout** exports the loadout currently being viewed, including item details and duty-belt clock positions. If the user has unsaved staged changes, the export identifies the report as a current unsaved draft.
- **Team Loadout Report** exports lineup order, open positions, role/status information, and detailed equipment for each filled team position.
- Export files are generated locally in the browser. Prototype data is not uploaded to a reporting server during the export process.
- The prototype uses the free SheetJS Community Edition browser library to generate `.xlsx` workbooks.

## Status

Build 0.9.0 is presentation-ready for continued prototype review. Remaining polish includes replacing the temporary FRCC text mark with the approved official logo asset and any visual/content refinements identified during demonstration testing.
