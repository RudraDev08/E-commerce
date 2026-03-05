# Dynamic Enterprise Dashboard Architecture

The dashboard has been architected as a modular "Widget System" where each analytic or functional component is isolated, allowing for user-level personalization and high performance.

## Key Components

### 1. The Controller: `DashboardLayout.jsx`
- **State Management**: Centralizes `dateRange` and `widgetVisibility` states. 
- **Data Orchestration**: Uses a custom `useDashboardAnalytics` hook simulation that handles parallel data fetching for KPIs, Revenue, and Inventory datasets.
- **Responsive Layout**: Orchestrates a 12-column grid that snaps to card layouts on mobile and side-by-side analytics on ultra-wide monitors.

### 2. High-Performance Visuals: `Charts.jsx`
- **Library**: `recharts` for declarative, responsive SVG charts.
- **Features**: Includes custom tooltips with `#1e293b` backgrounds, interactive legends, and "innerRadius" donut charts for inventory distribution.
- **Skeleton States**: Every chart component exports a matching skeleton loader to prevent layout shifts during initialization.

### 3. Metric Engine: `KPICard.jsx`
- Uses individual trend indicators (ArrowUp/Down) with conditional `emerald` and `rose` color palettes.
- Implements `framer-motion` (implied by previous setup) or standard transitions for hover scaling.

### 4. Personalization: `DashboardCustomizer.jsx`
- Exposes a ⌘-style customization panel where administrators can hide/show specific widgets (e.g., hiding "Revenue" if their role is Inventory Manager).
- Persistence ready: Current layout state can be serialized straight to the `UserMaster` model or `localStorage`.

### 5. Time-Series Filtering: `DateRangePicker.jsx`
- Integrates `date-fns` for accurate calculation of sub-period bounds (Today, Last 7 Days, Last 30 Days).
- Triggers a global re-fetch across all widgets when changed.

## UI/UX Highlights
- **Color Contrast**: Compliant with dark/light mode standards using Tailwind `slate` and `blue` pallets.
- **Aesthetics**: Premium shadows (`shadow-sm` and `hover:shadow-md`), large border-radius (`rounded-2xl`), and subtle micro-animations (`animate-pulse` for live indicators).

## Folder Structure
```bash
src/components/dashboard/
├── KPICard.jsx           # Metric summary tiles
├── Charts.jsx            # Revenue, Orders, Pie charts
├── QuickActions.jsx      # Functional shortcuts
├── DateRangePicker.jsx   # Global temporal filter
└── DashboardLayout.jsx   # Main view orchestrator
```
