---
name: Hospitality Operations Mobile
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#43474f'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3d5f93'
  primary: '#001a3b'
  on-primary: '#ffffff'
  primary-container: '#002f61'
  on-primary-container: '#7798d0'
  inverse-primary: '#a9c7ff'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#121a2d'
  on-tertiary: '#ffffff'
  tertiary-container: '#272f43'
  on-tertiary-container: '#8f96af'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#23477a'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-ticket:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  timer-display:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system is engineered for fast-paced, high-volume outdoor and resort hospitality staff: pool attendants, beach runners, cabana servers, and outdoor bar teams operating under direct sun and wet conditions. The aesthetic combines maritime executive utility with industrial clarity. It pairs crisp, deep marine foundations with high-legibility slate surfaces.

The emotional signature is unflappable operational command: clean, authoritative, lightning-quick, and tactile. Interface elements prioritize zero-friction thumb operation, instantaneous visual triaging, and extreme daylight legibility. White-label structural zones seamlessly frame tenant-specific branding (`[TENANT LOGO]`, `[BUSINESS NAME]`) without compromising core operational clarity.

## Colors

The palette is strictly locked to high-contrast Light Mode to maintain 100% legibility under direct sunlight on mobile and handheld POS devices.

### Functional & Surface Roles
- **Primary Navy (`#002F61`)**: Primary app bars, hero CTA buttons, active state indicators, and order ticket priority anchors.
- **Secondary Pure White (`#FFFFFF`)**: Base container for order tickets, modal sheets, and active form inputs.
- **Canvas Base (`#F8FAFC`)**: App background canvas, providing clean separation behind white order cards.
- **Muted Surface (`#F1F5F9`)**: Neutral wells, inactive chips, and nested sub-items.
- **Structural Stroke (`#E2E8F0`)**: Crisp 1px borders across cards, dividers, and table splits.
- **Content Primary (`#0F172A`)**: Critical text, numbers, table tags, and item quantities.
- **Content Secondary (`#475569`)**: Modifiers, elapsed labels, order timestamps, and metadata.

### Strict Status Semantics
Color is used with rigorous functional intent—never decoratively:
- **Green (`#16A34A`)**: Completed on time, order fulfilled, bill paid, active connection.
- **Amber (`#F59E0B`)**: Pending action, active preparation inside target window, warning state.
- **Red (`#DC2626`)**: Overdue prep/runner time, payment declined, urgent alert, out of stock.
- **Grey (`#64748B`)**: Completed late, inactive station, archived ticket, voided transaction.

## Typography

The typographic engine uses `Inter` to deliver native-feel parity across React Native platforms (iOS/Android).

Scale emphasis is placed on immediate, glanceable data:
- `display-ticket`: Large cabana, chair, and order IDs readable at full arm's length (e.g., **CABANA 14**, **#1084**).
- `timer-display`: Real-time order age counter with tabular numbers (`tnum`) to eliminate layout jitter.
- `label-sm` & `label-md`: Uppercase operational badges (`PREP`, `RUSH`, `DELIVERED`) with expanded letter tracking for quick peripheral recognition.

## Layout & Spacing

The system runs on a strict 4pt baseline rhythm tailored for mobile portrait screens (375pt to 430pt viewport widths).

### Layout Geometry
- **Outer Canvas Margin (`margin`)**: Fixed at `16px` (`1rem`) to maximize screen area for ticket lanes while avoiding thumb-drag off edges.
- **Vertical Card Gap (`space-md`)**: Consistent `12px` (`0.75rem`) between order tickets to maintain strong group cohesion.
- **Touch Target Safeguard**: No interactive element may fall below `48x48pt`. If visual icons are `20px` or `24px`, wrap them in an explicit `minHeight: 48, minWidth: 48` touch wrapper.
- **Zone Structure**:
  1. Sticky Top Navigation (Height: 56pt) containing tenant brand elements and fast network/sync status.
  2. Sub-Header Filter Bar (Height: 48pt) horizontal scroll for order lanes (All, Urgent, Cabanas, Beach, Bars).
  3. Single-column vertical scroll feed for active operations.
  4. Floating Action / Summary Bar locked at bottom with safe-area insets.

## Elevation & Depth

To prevent wash-out in bright sunlight, depth relies primarily on crisp structural outlines backed by light, directional ambient shadows. Avoid heavy blurs or low-contrast neumorphism.

- **Level 0 (Canvas)**: `#F8FAFC`, flat.
- **Level 1 (Order Tickets & Surface Cards)**: `#FFFFFF` fill, 1px solid border `#E2E8F0`, with `shadowColor: '#0F172A'`, `shadowOffset: { width: 0, height: 2 }`, `shadowOpacity: 0.05`, `shadowRadius: 4`, `elevation: 2`.
- **Level 2 (Urgent / Active Action Sheets & Modals)**: `#FFFFFF` fill, 1px solid `#CBD5E1`, with `shadowColor: '#0F172A'`, `shadowOffset: { width: 0, height: 6 }`, `shadowOpacity: 0.10`, `shadowRadius: 12`, `elevation: 6`.
- **Level 3 (Sticky Bottom Trays & Heads-Up Alerts)**: `#FFFFFF` surface with top border 1px solid `#E2E8F0`, `shadowColor: '#0F172A'`, `shadowOffset: { width: 0, height: -4 }`, `shadowOpacity: 0.06`, `shadowRadius: 8`, `elevation: 8`.

## Shapes

The design uses balanced, rounded geometry (Level 2) that feels sturdy and modern without wasting corner canvas space.

- **Cards & Order Modules**: Explicitly bound between `14px` and `16px` corner radii (`rounded-lg` / `rounded-xl`).
- **Action Buttons & Key Touch Surfaces**: `12px` to `14px` border radius to match the cards.
- **Status Pills, Tags, and Table Identifiers**: Full pill shape (`9999px`) to create clear differentiation between actionable surfaces and static indicators.
- **Form Controls & Steppers**: `10px` to `12px` radius.

## Components

### 1. White-Label Header
- Structure: Left: `[TENANT LOGO]` (max height 28pt) next to `[BUSINESS NAME]` in `headline-sm` (`#0F172A`). Right: Offline/Online sync status dot and active staff avatar.
- Border: Bottom 1px solid `#E2E8F0`.

### 2. Order Ticket Card (Core Workhorse)
- **Container**: White background, 16px radius, 1px solid `#E2E8F0`.
- **Urgent Accent**: If status is OVERDUE, card left border turns to 6px solid `#DC2626`. If on target prep, 6px solid `#F59E0B`.
- **Header Line**: Location/Table (e.g., "CABANA 04") in `display-ticket` (`#0F172A`), elapsed timer badge right-aligned with status background.
- **Body**: Order line items in `body-lg` with quantities highlighted in bold `#002F61`. Modifiers/notes in `body-md` italic (`#475569`).
- **Footer Actions**: Full-width split buttons minimum 48pt height.

### 3. Action Buttons
- **Primary Action (Fulfill / Pay)**: Background `#002F61`, text `#FFFFFF`, typography `label-lg`, height 48pt to 52pt, active press opacity `0.85`.
- **Secondary Action (Print / Edit)**: Background `#F1F5F9`, text `#0F172A`, 1px solid `#E2E8F0`, height 48pt.
- **Destructive / Void Action**: Ghost or flat background `#FEE2E2`, text `#DC2626`, 1px solid `#FECACA`.

### 4. Status Chips & Badges
- Strict color matrix:
  - **Completed/Paid**: Background `#DCFCE7`, text `#16A34A`, border `#BBF7D0`.
  - **Pending/Prep**: Background `#FEF3C7`, text `#B45309`, border `#FDE68A`.
  - **Overdue**: Background `#FEE2E2`, text `#DC2626`, border `#FECACA`.
  - **Late/Archived**: Background `#F1F5F9`, text `#64748B`, border `#E2E8F0`.
- Minimum text style: `label-sm` uppercase.

### 5. Quantity Steppers & Inputs
- Increment/Decrement controllers with dedicated 48x48pt touch targets.
- Value displayed in `timer-display` font weight for immediate visibility under glare.
- Text inputs use `#FFFFFF` fill with 1.5px border `#E2E8F0`, focusing to 2px solid `#002F61`.

### 6. Quick Action Bottom Bar
- Pinned to bottom portrait safe area.
- Hosts critical operational shortcuts: "New Order (+)", "Batch Deliver", and quick filter counter chips showing count of active overdue tickets in bright `#DC2626`.