# OBDII Diagnostic App - Design Guidelines

## Design Approach
**Selected System**: Material Design 3 with automotive-focused customization
**Rationale**: Diagnostic tools require clear data visualization, robust component patterns, and professional polish. Material Design's emphasis on elevation, structured information hierarchy, and proven mobile patterns makes it ideal for a technical application.

**Key Principles**:
- Data clarity over decoration
- Professional technical aesthetic
- Efficient scanning workflows
- Print-optimized reporting

## Typography

**Font Stack**: Inter (via Google Fonts CDN)
- Display/Headers: 600 weight, 24-32px
- Diagnostic Data/Metrics: 500 weight, 18-24px (monospace numbers)
- Body Text: 400 weight, 14-16px
- Labels/Captions: 500 weight, 12-14px uppercase tracking-wide
- Print Reports: 400-600 weight, 11-14px

## Layout System

**Tailwind Spacing Units**: 2, 4, 6, 8, 12, 16
- Card padding: p-6
- Section spacing: space-y-6 or gap-6
- Component margins: mb-4, mt-8
- Print margins: Generous whitespace for professional look

## Component Library

### App Interface (Dark Mode)

**Navigation**
- Persistent bottom navigation with 4 primary actions: Scan, History, Reports, Settings
- Top app bar: Honda logo left, connection status indicator right, session timer center
- Icons: Heroicons via CDN

**Dashboard/Home Screen**
- Large "Connect to Bike" CTA button with pulsing connection indicator
- Quick stats cards (3-column grid): Last Scan, Total Sessions, Active Warnings
- Recent session preview list with swipe actions

**Diagnostic Scan Interface**
- Full-screen real-time data view
- Metric cards in 2-column responsive grid showing: RPM, Speed, Coolant Temp, Throttle Position, Fuel Trim, Error Codes
- Each metric: Large number display, label, unit, min/max indicators, trend spark line
- Floating action button: "Save Session" (bottom-right)
- Error code alerts: Prominent red accent cards at top when present

**Session History**
- Filterable list with date grouping headers
- Session cards displaying: Date/Time, Duration, Bike Model, Error Count badge, Quick Preview Button
- Each card: Tap to expand inline or navigate to detail view
- Top toolbar: Search field, Filter by date/error type, Sort options
- Print icon on each session card

**Session Detail View**
- Header: Session metadata (date, duration, bike VIN)
- Tabbed interface: Overview, Error Codes, Live Data Snapshot, Notes
- Error Codes tab: Expandable accordion with code, description, severity indicator, recommended action
- Live Data tab: Same metric cards as scan interface but frozen snapshot
- Notes section: Text area for technician observations
- Action buttons bar: Share, Print Report, Delete Session

**Print Report View** (White Background)
- Clean header: Honda logo, Shop info placeholder, Report title
- Session summary table: Clean borders, alternating row backgrounds (light gray)
- Error codes: Formatted table with severity icons
- Data metrics: Professional grid layout
- Footer: Page numbers, generation timestamp, technician signature line
- QR code linking to digital copy

### Forms & Inputs
- Material-style text fields with floating labels
- Select dropdowns with chevron indicators
- Date/time pickers for filtering
- Toggle switches for settings

### Data Visualization
- Minimal line charts for trends (use Chart.js)
- Gauge components for real-time metrics
- Color-coded severity indicators: Green (normal), Yellow (warning), Red (critical)

### Overlays
- Bottom sheets for quick actions
- Modal dialogs for confirmations
- Toast notifications for connection status changes

## Images

**No hero images required** - This is a functional diagnostic tool, not a marketing application.

**Optional imagery**:
- Honda motorcycle silhouette in empty states ("No sessions yet" screen)
- Small bike model icons in session cards if bike model data available
- Connection illustration for "Connect to Bike" empty state

## Animations

**Minimal, purposeful only**:
- Connection pulse indicator (subtle)
- Real-time metric updates (smooth number transitions)
- Loading spinners during OBD communication
- Success checkmarks on save actions
- No scroll animations or decorative transitions

## Print-Specific Considerations

- Complete CSS reset for print media queries
- White backgrounds, black text throughout
- Remove all navigation and interactive elements
- Expand all collapsed sections
- Page break optimization for long reports
- High-contrast text for readability
- Professional table formatting with borders