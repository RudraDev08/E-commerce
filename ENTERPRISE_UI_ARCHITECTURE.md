# Enterprise UI Component Architecture

## Component Structure
The UI upgrades have been modularized into `src/components/ui` and `src/hooks`, targeting state-of-the-art enterprise paradigms inspired by Shopify, Stripe, and Vercel.

### 1. Global Components (Layout/Root)

**`GlobalLoading.jsx`**
- Uses `nprogress` bound to React Router (`useLocation`) to show a thin, global progress indicator along the top edge of the browser during page transitions and API requests.
- **Pattern:** Render `<GlobalLoading />` inside the main `AdminLayout` just below the `<GlobalErrorBoundary>`.

**`ErrorBoundaryUI.jsx`**
- Provides structural failsafes. When an application crash happens inside a widget or table, the rest of the application remains operable.
- **Pattern:** Wrap sub-routes or heavy widgets (Charts, Virtualized Tables) with `<GlobalErrorBoundary>`.

**`CommandPalette.jsx`** (Ctrl+K)
- Uses `cmdk` to provide an instantly accessible global spotlight search. 
- Features routing shortcuts mapped directly into the UI.
- **Pattern:** Render as a hidden global singleton in `AdminLayout`.

**`NotificationCenter.jsx`**
- Anchored to the header navbar. Tracks read/unread states with soft animations via `framer-motion`.

### 2. Powerful Data Handling (Tables)

**`VirtualizedDataTable.jsx`**
- Combines `@tanstack/react-table` with `@tanstack/react-virtual` to handle 10k+ rows entirely in the browser DOM footprint of ~20 rows.
- Checks off: Range Filters, Checkbox bulk selection, Toolbar visibility triggers depending on selection state, and inline loading indicators (progress bar) during batch execution.

### 3. Contextual Feedback Mechanisms

**`UndoToast.jsx`**
- Advanced UX pattern via `react-hot-toast` allowing deferred execution of destructive actions.
- Implements optimistic UI rendering (removing the user locally immediately), giving a 10s grace period to reverse it before committing to the API.

**`EmptyState.jsx`**
- Standardized UI for 0-result filter views or unpopulated core models. Expects visual anchors (Icons) and primary CTAs.

### 4. Dashboard Enhancements

**`AdminActivityLog.jsx`**
- Vertically mapped visual timeline replacing plain grids, giving "at a glance" knowledge of the team's operational rhythm over the last 24h.

**`SystemStatusWidget.jsx`**
- Micro-widget querying the backend to provide heartbeat status on `bullmq` and Database health flags.

**`DashboardCustomizer.jsx`**
- Exposes user-preference controls over what widgets belong on the dashboard space. Supports writing JSON blobs mapping to `User.preferences` on the backend.

### 5. Utilities

**`useKeyboardShortcut.js`**
- Traps user keystrokes natively while bypassing inputs/textareas securely.

## Implementation Example: AdminLayout.jsx

```jsx
import { Toaster } from 'react-hot-toast';
import { GlobalErrorBoundary } from '../components/ui/ErrorBoundaryUI';
import { GlobalLoading } from '../components/ui/GlobalLoading';
import { CommandPalette } from '../components/ui/CommandPalette';
import { NotificationCenter } from '../components/ui/NotificationCenter';

export const AdminLayout = ({ children }) => {
  return (
    <GlobalErrorBoundary>
      <GlobalLoading />
      <Toaster position="bottom-right" />
      <CommandPalette />
      
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header>
            <div className="flex items-center gap-4">
               {/* ⌘K trigger hint button */}
               <button className="bg-gray-100 flex gap-2 text-sm text-gray-500 rounded px-3 py-1.5">
                 Search... <kbd className="font-mono bg-white px-1">⌘K</kbd>
               </button>
               <NotificationCenter />
               <ProfileDropdown />
            </div>
          </Header>
          
          <main className="p-6">
            <GlobalErrorBoundary>
              {children}
            </GlobalErrorBoundary>
          </main>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
};
```
