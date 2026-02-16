# ENTERPRISE MASTER DATA UI OVERVIEW
## Premium SaaS Design System for 20M+ Variant Scale

> **Design Philosophy**: Structured, Calm, Data-Dense, Governance-First, Performance-Optimized
> 
> **Target Experience**: Stripe / Shopify Admin Level
> 
> **Scale**: 10,000+ records per master, 20M+ total variants

---

## 🎨 REFINED DESIGN SYSTEM

### **Primary Brand Colors**

| Purpose | Hex | Usage |
|---------|-----|-------|
| **Primary Action** | `#1D4ED8` | Buttons, links, focus states |
| **Primary Hover** | `#1E40AF` | Button hover, active states |
| **Primary Soft** | `#DBEAFE` | Backgrounds, highlights |
| **Success** | `#059669` | Active status, confirmations |
| **Success Soft** | `#D1FAE5` | Success backgrounds |
| **Warning** | `#D97706` | Deprecated, caution states |
| **Warning Soft** | `#FEF3C7` | Warning backgrounds |
| **Danger** | `#DC2626` | Delete, critical actions |
| **Danger Soft** | `#FEE2E2` | Error backgrounds |

### **Neutral Scale (Premium Gray)**

| Purpose | Hex | Usage |
|---------|-----|-------|
| **Background** | `#F9FAFB` | Page background |
| **Card Background** | `#FFFFFF` | Cards, modals, tables |
| **Subtle Background** | `#F3F4F6` | Input backgrounds, hover states |
| **Border** | `#E5E7EB` | Dividers, borders |
| **Hover Surface** | `#F1F5F9` | Row hover, subtle highlights |
| **Text Primary** | `#111827` | Headings, primary text |
| **Text Secondary** | `#4B5563` | Labels, secondary text |
| **Text Muted** | `#6B7280` | Helper text, placeholders |

### **Elevation System**

```css
/* Shadow Small - Inputs, badges */
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

/* Shadow Medium - Cards, dropdowns */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

/* Shadow Large - Modals, popovers */
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
```

### **Typography System**

```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Headings */
.heading-xl { font-size: 28px; font-weight: 600; line-height: 1.2; color: #111827; }
.heading-lg { font-size: 24px; font-weight: 600; line-height: 1.3; color: #111827; }
.heading-md { font-size: 18px; font-weight: 600; line-height: 1.4; color: #111827; }
.heading-sm { font-size: 16px; font-weight: 600; line-height: 1.5; color: #111827; }

/* Body */
.body-lg { font-size: 16px; font-weight: 400; line-height: 1.6; color: #4B5563; }
.body-md { font-size: 14px; font-weight: 400; line-height: 1.6; color: #4B5563; }
.body-sm { font-size: 13px; font-weight: 400; line-height: 1.5; color: #6B7280; }

/* Labels */
.label-md { font-size: 14px; font-weight: 500; line-height: 1.4; color: #111827; }
.label-sm { font-size: 12px; font-weight: 500; line-height: 1.4; color: #4B5563; }
```

### **Spacing System**

```css
/* Base unit: 4px */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

---

## ⚡ PERFORMANCE REQUIREMENTS (CRITICAL)

### **1. Virtualized Rendering**
- **Trigger**: After 100 rows
- **Library**: `react-window` or `@tanstack/react-virtual`
- **Benefit**: Render only visible rows (20-30 at a time)

### **2. Cursor-Based Pagination**
```javascript
// ❌ NEVER USE
const sizes = await SizeMaster.find().skip(page * limit).limit(limit);

// ✅ ALWAYS USE
const sizes = await SizeMaster.find({ _id: { $gt: cursor } })
  .sort({ _id: 1 })
  .limit(limit);
```

### **3. Server-Side Filtering**
- All filters applied on backend
- No client-side array filtering for large datasets
- Debounced search: 300ms

### **4. Lazy Expansion Panels**
- Fetch impact data only when row expanded
- Show inline skeleton during load
- Cache expanded data (5 min TTL)

### **5. Optimistic UI Updates**
- Immediate visual feedback
- Rollback on error
- No blocking spinners for mutations

### **6. Bundle Size Optimization**
- Code splitting per master type
- Lazy load modals
- Tree-shake unused components

---

## 🧊 SKELETON LOADING DESIGN

### **Table Skeleton (8 Rows)**

```jsx
// Skeleton Row Structure
<div className="skeleton-row">
  <div className="skeleton-cell w-24"></div>  {/* Value */}
  <div className="skeleton-cell w-32"></div>  {/* Display Name */}
  <div className="skeleton-cell w-20"></div>  {/* Category */}
  <div className="skeleton-cell w-16"></div>  {/* Gender */}
  <div className="skeleton-cell w-16"></div>  {/* Region */}
  <div className="skeleton-cell w-12"></div>  {/* Rank */}
  <div className="skeleton-cell w-20"></div>  {/* Status */}
  <div className="skeleton-cell w-16"></div>  {/* Actions */}
</div>
```

```css
.skeleton-cell {
  height: 16px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    #F3F4F6 25%,
    #E5E7EB 37%,
    #F3F4F6 63%
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-row {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  border-bottom: 1px solid #F1F5F9;
}
```

### **Filter Bar Skeleton**

```jsx
<div className="filter-skeleton">
  <div className="skeleton-input w-64"></div>
  <div className="skeleton-input w-40"></div>
  <div className="skeleton-input w-40"></div>
  <div className="skeleton-input w-40"></div>
</div>
```

### **Expansion Panel Skeleton**

```jsx
<div className="expansion-skeleton">
  <div className="skeleton-block h-4 w-48 mb-2"></div>
  <div className="skeleton-block h-4 w-64 mb-2"></div>
  <div className="skeleton-block h-4 w-56"></div>
</div>
```

---

## 💎 PREMIUM MICRO-INTERACTIONS

### **Button States**

```css
.btn-primary {
  background: #1D4ED8;
  color: #FFFFFF;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: all 150ms ease;
}

.btn-primary:hover {
  background: #1E40AF;
  box-shadow: 0 4px 12px rgba(29, 78, 216, 0.15);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.15);
}
```

### **Row Hover Effect**

```css
.table-row {
  height: 56px;
  border-bottom: 1px solid #F1F5F9;
  transition: background-color 150ms ease;
}

.table-row:hover {
  background: #F8FAFC;
}
```

### **Expansion Animation**

```css
.expansion-panel {
  overflow: hidden;
  transition: height 200ms ease;
}

.expansion-content {
  opacity: 0;
  animation: fadeIn 150ms ease forwards;
  animation-delay: 50ms;
}

@keyframes fadeIn {
  to { opacity: 1; }
}
```

### **Badge Pulse (State Change)**

```css
.badge {
  animation: badgePulse 300ms ease;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```


## 1️⃣ SIZE MASTER UI - PREMIUM ENTERPRISE LAYOUT

### **Page Structure**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER SECTION (bg: #FFFFFF, border-bottom: 1px solid #E5E7EB)         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Size Master Registry                          [+ Add New Size]        │
│  Manage standardized size definitions across                           │
│  regions and categories                                                │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ FILTER BAR (bg: #FFFFFF, radius: 12px, shadow: medium, padding: 16px)  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🔍 Search sizes...    [Category ▼]  [Gender ▼]  [Region ▼]  [Status ▼]│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ MAIN TABLE (bg: #FFFFFF, radius: 12px, shadow: medium)                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  VALUE  │ DISPLAY NAME  │ CATEGORY  │ GENDER │ REGION │ RANK │ STATUS │
│  ───────────────────────────────────────────────────────────────────── │
│  XS     │ Extra Small   │ CLOTHING  │ WOMEN  │ US     │ 10   │ ●●●●  │
│         │ Usage: 1,234 variants                              │ ACTIVE │
│         │ Conversions: UK: 6, EU: 34, JP: S                  │        │
│         │                                        [✏️] [🔒] [⋮] │        │
│  ───────────────────────────────────────────────────────────────────── │
│  S      │ Small         │ CLOTHING  │ WOMEN  │ US     │ 20   │ ●●●●  │
│         │ Usage: 3,456 variants                              │ ACTIVE │
│         │                                        [✏️] [🔒] [⋮] │        │
│  ───────────────────────────────────────────────────────────────────── │
│  M      │ Medium        │ CLOTHING  │ WOMEN  │ US     │ 30   │ ●●●●  │
│         │ Usage: 5,678 variants                              │ ACTIVE │
│         │                                        [✏️] [🔒] [⋮] │        │
│  ───────────────────────────────────────────────────────────────────── │
│  XXL    │ 2X Large      │ CLOTHING  │ MEN    │ US     │ 60   │ ⚠️⚠️  │
│         │ Usage: 234 variants                                │DEPRECATED│
│         │ Replaced by: 2XL                                   │        │
│         │                                   [📋 View Replacement]      │
│  ───────────────────────────────────────────────────────────────────── │
│                                                                         │
│  Showing 1-20 of 1,247 sizes                   [◀ Previous] [1][2][3][▶]│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### **Premium Status Badges**

```css
/* Active Badge */
.badge-active {
  background: #D1FAE5;
  color: #065F46;
  border: 1px solid #A7F3D0;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.badge-active::before {
  content: '';
  width: 6px;
  height: 6px;
  background: #059669;
  border-radius: 50%;
}

/* Draft Badge */
.badge-draft {
  background: #DBEAFE;
  color: #1E40AF;
  border: 1px solid #BFDBFE;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

/* Deprecated Badge */
.badge-deprecated {
  background: #FEF3C7;
  color: #92400E;
  border: 1px solid #FDE68A;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.badge-deprecated::before {
  content: '⚠️';
  font-size: 10px;
}

/* Archived Badge */
.badge-archived {
  background: #F3F4F6;
  color: #4B5563;
  border: 1px solid #E5E7EB;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

/* Locked Indicator */
.icon-locked {
  color: #1D4ED8;
  font-size: 16px;
  cursor: pointer;
  transition: color 150ms ease;
}

.icon-locked:hover {
  color: #1E40AF;
}
```

### **Header Section (Premium)**

```jsx
<header className="page-header">
  <div className="header-left">
    <h1 className="heading-xl">Size Master Registry</h1>
    <p className="body-md text-secondary">
      Manage standardized size definitions across regions and categories
    </p>
  </div>
  <div className="header-right">
    <button className="btn-primary">
      <PlusIcon /> Add New Size
    </button>
  </div>
</header>
```

```css
.page-header {
  background: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left h1 {
  margin-bottom: 4px;
}

.header-left p {
  color: #6B7280;
}
```

### **Filter Bar (Glass Light Effect)**

```jsx
<div className="filter-bar">
  <div className="search-input">
    <SearchIcon className="search-icon" />
    <input 
      type="text" 
      placeholder="Search sizes..." 
      className="input-search"
    />
  </div>
  
  <select className="filter-select">
    <option>All Categories</option>
    <option>CLOTHING</option>
    <option>FOOTWEAR</option>
    <option>ACCESSORIES</option>
  </select>
  
  <select className="filter-select">
    <option>All Genders</option>
    <option>MEN</option>
    <option>WOMEN</option>
    <option>UNISEX</option>
  </select>
  
  <select className="filter-select">
    <option>All Regions</option>
    <option>US</option>
    <option>UK</option>
    <option>EU</option>
    <option>GLOBAL</option>
  </select>
  
  <select className="filter-select">
    <option>All Statuses</option>
    <option>ACTIVE</option>
    <option>DRAFT</option>
    <option>DEPRECATED</option>
    <option>ARCHIVED</option>
  </select>
</div>
```

```css
.filter-bar {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  margin: 24px 32px;
  display: flex;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.search-input {
  position: relative;
  flex: 1;
  max-width: 320px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9CA3AF;
  width: 18px;
  height: 18px;
}

.input-search {
  width: 100%;
  padding: 10px 12px 10px 40px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  transition: all 150ms ease;
}

.input-search:hover {
  background: #F3F4F6;
}

.input-search:focus {
  outline: none;
  background: #FFFFFF;
  border-color: #1D4ED8;
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.15);
}

.filter-select {
  padding: 10px 12px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  cursor: pointer;
  transition: all 150ms ease;
}

.filter-select:hover {
  background: #F3F4F6;
}

.filter-select:focus {
  outline: none;
  border-color: #1D4ED8;
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.15);
}
```

### **Enterprise Data Grid**

```jsx
<div className="data-table">
  <table className="table">
    <thead className="table-header">
      <tr>
        <th>VALUE</th>
        <th>DISPLAY NAME</th>
        <th>CATEGORY</th>
        <th>GENDER</th>
        <th>REGION</th>
        <th>RANK</th>
        <th>STATUS</th>
        <th>ACTIONS</th>
      </tr>
    </thead>
    <tbody className="table-body">
      {isLoading ? (
        <SkeletonRows count={8} />
      ) : (
        sizes.map(size => (
          <SizeRow key={size._id} size={size} />
        ))
      )}
    </tbody>
  </table>
</div>
```

```css
.data-table {
  background: #FFFFFF;
  border-radius: 12px;
  margin: 0 32px 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  background: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
}

.table-header th {
  padding: 12px 24px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-body tr {
  border-bottom: 1px solid #F1F5F9;
  transition: background-color 150ms ease;
}

.table-body tr:hover {
  background: #F8FAFC;
}

.table-body td {
  padding: 16px 24px;
  font-size: 14px;
  color: #111827;
  vertical-align: top;
}

.table-body td:first-child {
  font-weight: 600;
}
```

### **Size Row Component (with Expansion)**

```jsx
function SizeRow({ size }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [impactData, setImpactData] = useState(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);

  const handleExpand = async () => {
    if (!isExpanded && !impactData) {
      setIsLoadingImpact(true);
      const data = await fetchSizeImpact(size._id);
      setImpactData(data);
      setIsLoadingImpact(false);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <tr className="table-row">
        <td>
          <button onClick={handleExpand} className="expand-btn">
            {isExpanded ? '▼' : '▶'}
          </button>
          {size.value}
        </td>
        <td>{size.displayName}</td>
        <td>{size.category}</td>
        <td>{size.gender}</td>
        <td>{size.primaryRegion}</td>
        <td>{size.normalizedRank}</td>
        <td>
          <span className={`badge-${size.lifecycleState.toLowerCase()}`}>
            {size.lifecycleState}
          </span>
        </td>
        <td>
          <div className="action-buttons">
            <button className="btn-icon" title="Edit">
              <EditIcon />
            </button>
            <button className="btn-icon" title="Lock">
              <LockIcon />
            </button>
            <button className="btn-icon" title="More">
              <MoreIcon />
            </button>
          </div>
        </td>
      </tr>
      
      {isExpanded && (
        <tr className="expansion-row">
          <td colSpan="8">
            <div className="expansion-panel">
              {isLoadingImpact ? (
                <ExpansionSkeleton />
              ) : (
                <div className="expansion-content">
                  <div className="impact-section">
                    <h4>Usage Impact</h4>
                    <p>Used in {impactData.variantCount} variants</p>
                    <p>Regional Conversions:</p>
                    <ul>
                      {size.conversions.map(conv => (
                        <li key={conv.region}>
                          {conv.region}: {conv.equivalentValue}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
```

### **Lazy Loading Behavior**

```jsx
function SizeMasterList() {
  const [sizes, setSizes] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Initial load
  useEffect(() => {
    loadSizes();
  }, []);

  const loadSizes = async () => {
    setIsLoading(true);
    
    const query = cursor 
      ? { _id: { $gt: cursor } }
      : {};
    
    const response = await fetch('/api/sizes', {
      method: 'POST',
      body: JSON.stringify({
        query,
        limit: 20,
        sort: { _id: 1 }
      })
    });
    
    const data = await response.json();
    
    setSizes(prev => [...prev, ...data.sizes]);
    setCursor(data.sizes[data.sizes.length - 1]?._id);
    setHasMore(data.sizes.length === 20);
    setIsLoading(false);
  };

  return (
    <div className="size-master-container">
      <PageHeader />
      <FilterBar />
      <DataTable sizes={sizes} isLoading={isLoading} />
      {hasMore && (
        <div className="load-more">
          <button onClick={loadSizes} className="btn-secondary">
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### **Debounced Search Implementation**

```jsx
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  const performSearch = async (term) => {
    setIsSearching(true);
    // API call
    setIsSearching(false);
  };

  return (
    <div className="search-input">
      <SearchIcon className="search-icon" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search sizes..."
      />
      {isSearching && <Spinner className="search-spinner" />}
    </div>
  );
}
```

---

## 2️⃣ COLOR MASTER UI

### **Layout Structure**

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Dashboard > Masters > Color Master                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Color Master Management                                        │
│  Manage global color palette and brand colors                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [🔍 Search colors...]  [Color Family ▼] [Category ▼]         │
│                                                                 │
│  [Lifecycle ▼] [🎨 Brand Colors Only]      [+ Add New Color]  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │ ████ Midnight Blue                               │   │ │
│  │  │ #1E3A8A  │  RGB(30, 58, 138)  │  HSL(225,64,33) │   │ │
│  │  │ BLUE Family  │  SOLID  │  🟢 Active  │  🔒 Locked │   │ │
│  │  │ Usage: 2,345 variants  │  ⭐ Brand Color         │   │ │
│  │  │                                  [✏️ Edit] [📊 Analytics]│   │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │ ████ Charcoal Grey                               │   │ │
│  │  │ #374151  │  RGB(55, 65, 81)   │  HSL(220,19,27) │   │ │
│  │  │ GREY Family  │  SOLID  │  🟢 Active              │   │ │
│  │  │ Usage: 1,892 variants                            │   │ │
│  │  │                                  [✏️ Edit] [🔒 Lock]   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │ ✨✨ Rose Gold Metallic                          │   │ │
│  │  │ #B76E79  │  RGB(183, 110, 121) │  HSL(351,33,57)│   │ │
│  │  │ PINK Family  │  METALLIC  │  🟢 Active           │   │ │
│  │  │ Usage: 456 variants                              │   │ │
│  │  │                                  [✏️ Edit] [🔒 Lock]   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │ ████ Navy Blue                                   │   │ │
│  │  │ #1E40AF  │  RGB(30, 64, 175)   │  HSL(226,71,40)│   │ │
│  │  │ BLUE Family  │  SOLID  │  🟡 Deprecated          │   │ │
│  │  │ Replaced by: Deep Navy  │  Usage: 89 variants    │   │ │
│  │  │                            [📋 View Replacement]  │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Showing 1-20 of 487 colors         [◀ Previous] [1][2][3][▶] │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Add/Edit Color Modal**

```
┌─────────────────────────────────────────────────────────────┐
│  ✕  Add New Color                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Basic Information                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Name *              │  │ Display Name        │         │
│  │ Midnight Blue       │  │ Midnight Blue       │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Slug (auto)         │  │ Code *              │         │
│  │ midnight-blue       │  │ BLU-MID-001         │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  Color Values                                               │
│  ┌─────────────────────────────────────────────┐           │
│  │ Hex Code *          ████                    │           │
│  │ #1E3A8A             [Color Picker]          │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  Auto-calculated:                                           │
│  RGB: (30, 58, 138)  │  HSL: (225°, 64%, 33%)             │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Pantone Code        │  │ CMYK                │         │
│  │ PMS 289 C           │  │ C:78 M:58 Y:0 K:46  │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  Classification                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Color Family *      │  │ Visual Category *   │         │
│  │ [BLUE          ▼]   │  │ [SOLID         ▼]   │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  Governance                                                 │
│  ☑ Brand Color (requires approval)                         │
│  ☐ Lock after creation (prevent modifications)             │
│                                                             │
│  Availability                                               │
│  ☑ WEB  ☑ POS  ☑ B2B  ☑ APP  ☐ MARKETPLACE               │
│                                                             │
│                           [Cancel]  [Save Color]           │
└─────────────────────────────────────────────────────────────┘
```

### **Key Features**
- ✅ **Visual Swatches**: Large color preview with hex/RGB/HSL
- ✅ **Auto-Calculation**: RGB/HSL computed from hex automatically
- ✅ **Brand Protection**: Lock flag prevents accidental changes
- ✅ **Usage Analytics**: Shows variant count per color
- ✅ **Family Grouping**: Filter by color family (RED, BLUE, etc.)
- ✅ **Visual Categories**: SOLID, METALLIC, PATTERN, GRADIENT
- ✅ **Immutable Slugs**: URL-safe identifiers never change

```

### **Empty State Design**

```jsx
function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="#E5E7EB" strokeWidth="2" />
          <path d="M32 20v24M20 32h24" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="empty-title">No sizes found</h3>
      <p className="empty-description">
        Try adjusting your filters or create a new size to get started.
      </p>
      <button className="btn-primary">
        <PlusIcon /> Add Size
      </button>
    </div>
  );
}
```

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 24px;
  max-width: 400px;
}
```

### **Migration Wizard Modal (Premium)**

```jsx
function MigrationWizard({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [impactData, setImpactData] = useState(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="migration-modal">
      <div className="modal-header">
        <h2>Deprecate Size: XL</h2>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>
      
      <div className="modal-divider" />
      
      <div className="modal-body">
        {step === 1 && (
          <div className="step-content">
            <h3>Impact Analysis</h3>
            
            <div className="warning-box">
              <div className="warning-icon">⚠️</div>
              <div className="warning-content">
                <p className="warning-title">This action will affect 1,234 variants</p>
                <p className="warning-description">
                  All variants using this size will need to be migrated to a replacement size.
                </p>
              </div>
            </div>
            
            <div className="impact-summary">
              <div className="impact-item">
                <span className="impact-label">Affected Variants</span>
                <span className="impact-value">1,234</span>
              </div>
              <div className="impact-item">
                <span className="impact-label">Active Orders</span>
                <span className="impact-value">45</span>
              </div>
              <div className="impact-item">
                <span className="impact-label">Reserved Stock</span>
                <span className="impact-value">89 units</span>
              </div>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="step-content">
            <h3>Select Replacement Size</h3>
            
            <div className="replacement-options">
              <label className="radio-option">
                <input type="radio" name="replacement" value="2XL" />
                <div className="option-content">
                  <span className="option-label">2XL (Extra Extra Large)</span>
                  <span className="option-meta">CLOTHING • MEN • US • Rank: 60</span>
                </div>
              </label>
              
              <label className="radio-option">
                <input type="radio" name="replacement" value="XXL-NEW" />
                <div className="option-content">
                  <span className="option-label">XXL-NEW (Double Extra Large)</span>
                  <span className="option-meta">CLOTHING • MEN • US • Rank: 61</span>
                </div>
              </label>
            </div>
            
            <div className="migration-note">
              <p>All 1,234 variants will be automatically updated to use the selected replacement size.</p>
            </div>
          </div>
        )}
        
        {step === 3 && (
          <div className="step-content">
            <h3>Confirm Migration</h3>
            
            <div className="confirmation-summary">
              <div className="summary-row">
                <span>Deprecating:</span>
                <strong>XL (Extra Large)</strong>
              </div>
              <div className="summary-row">
                <span>Replacing with:</span>
                <strong>2XL (Extra Extra Large)</strong>
              </div>
              <div className="summary-row">
                <span>Variants to update:</span>
                <strong>1,234</strong>
              </div>
            </div>
            
            <div className="warning-box">
              <div className="warning-icon">⚠️</div>
              <div className="warning-content">
                <p className="warning-title">This action cannot be undone</p>
                <p className="warning-description">
                  The size will be marked as deprecated and all variants will be migrated immediately.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="modal-divider" />
      
      <div className="modal-footer">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        {step < 3 ? (
          <button className="btn-primary" onClick={() => setStep(step + 1)}>
            Next Step
          </button>
        ) : (
          <button className="btn-danger" onClick={handleConfirm}>
            Confirm Migration
          </button>
        )}
      </div>
    </Modal>
  );
}
```

```css
.migration-modal {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  max-width: 600px;
  width: 100%;
}

.modal-header {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6B7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 150ms ease;
}

.close-btn:hover {
  background: #F3F4F6;
}

.modal-divider {
  height: 1px;
  background: #E5E7EB;
}

.modal-body {
  padding: 24px;
  max-height: 500px;
  overflow-y: auto;
}

.warning-box {
  background: #FEF3C7;
  border: 1px solid #FDE68A;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.warning-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.warning-title {
  font-size: 14px;
  font-weight: 600;
  color: #92400E;
  margin-bottom: 4px;
}

.warning-description {
  font-size: 13px;
  color: #92400E;
}

.impact-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.impact-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #F9FAFB;
  border-radius: 6px;
}

.impact-label {
  font-size: 14px;
  color: #6B7280;
}

.impact-value {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.radio-option {
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms ease;
  margin-bottom: 12px;
}

.radio-option:hover {
  border-color: #1D4ED8;
  background: #F8FAFC;
}

.radio-option input:checked ~ .option-content {
  color: #1D4ED8;
}

.option-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}

.option-meta {
  display: block;
  font-size: 12px;
  color: #6B7280;
}

.modal-footer {
  padding: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-danger {
  background: #DC2626;
  color: #FFFFFF;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-danger:hover {
  background: #B91C1C;
}
```

---

## 🎯 FINAL ENTERPRISE UI GOALS

### **Performance Targets**

| Metric | Target | Implementation |
|--------|--------|----------------|
| **Initial Load** | <800ms | Cursor pagination, server-side filtering |
| **Search Response** | <300ms | Debounced input, indexed queries |
| **Row Expansion** | <200ms | Lazy load, cached results |
| **Filter Change** | <400ms | Optimistic UI, background fetch |
| **Skeleton Display** | Immediate | Pre-rendered, no layout shift |
| **Virtualization Trigger** | 100 rows | React-window, 20-30 visible rows |

### **User Experience Principles**

1. **Fast Before Data Loads**
   - Skeleton screens appear instantly
   - No blank white screens
   - Preserved layout dimensions

2. **Stable During Loading**
   - No layout shift
   - Smooth transitions
   - Predictable behavior

3. **Structured When Full**
   - Clear visual hierarchy
   - Consistent spacing
   - Logical grouping

4. **Calm Under Heavy Data**
   - Virtualized rendering
   - Progressive loading
   - No performance degradation

5. **Authoritative and Trustworthy**
   - Impact warnings before destructive actions
   - Clear governance indicators
   - Audit trail visibility

### **Governance Safety Features**

- ✅ **Lock Indicators**: Visual lock icon prevents accidental edits
- ✅ **Usage Warnings**: Shows variant count before deprecation
- ✅ **Migration Wizard**: Step-by-step guided flow for replacements
- ✅ **Impact Analysis**: Real-time calculation of affected records
- ✅ **Confirmation Dialogs**: Multi-step confirmation for critical actions
- ✅ **Rollback Support**: Undo capability for recent changes
- ✅ **Audit Visibility**: Who changed what, when

### **Accessibility Compliance**

- ✅ **WCAG 2.1 AA**: All color contrasts meet 4.5:1 ratio
- ✅ **Keyboard Navigation**: Full keyboard support, focus indicators
- ✅ **Screen Readers**: ARIA labels, semantic HTML
- ✅ **Focus Management**: Logical tab order, focus trapping in modals
- ✅ **Error Messaging**: Clear, actionable error descriptions

### **Expected Result**

After implementation, the Size Master UI will:

1. **Feel like Stripe/Shopify admin level** - Premium, polished, professional
2. **Handle 10,000+ size records smoothly** - No performance degradation
3. **Prevent layout shift** - Skeleton loading preserves dimensions
4. **Prevent governance mistakes** - Multi-step confirmations, impact warnings
5. **Surface impact before changes** - Real-time analysis of affected variants
6. **Scale for enterprise operations** - Cursor pagination, virtualization

---



## 3️⃣ ATTRIBUTE MASTER UI

### **Layout Structure (Two-Panel)**

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Dashboard > Masters > Attribute Master                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Attribute Master Management                                    │
│  Manage attribute types and their values                       │
│                                                                 │
├──────────────────────────┬──────────────────────────────────────┤
│ ATTRIBUTE TYPES          │ ATTRIBUTE VALUES                     │
│                          │                                      │
│ [🔍 Search types...]     │ [🔍 Search values...]               │
│ [+ Add Type]             │ [+ Add Value]                        │
│                          │                                      │
│ ┌──────────────────────┐ │ Showing values for: Material        │
│ │ ▶ Size               │ │                                      │
│ │   🟢 Active          │ │ ┌────────────────────────────────┐ │
│ │   12 values          │ │ │ ████ Cotton                    │ │
│ ├──────────────────────┤ │ │ COTTON  │  🟢 Active           │ │
│ │ ▶ Color              │ │ │ Usage: 3,456 variants          │ │
│ │   🟢 Active          │ │ │ Price Modifier: +$0            │ │
│ │   48 values          │ │ │                    [✏️ Edit]    │ │
│ ├──────────────────────┤ │ ├────────────────────────────────┤ │
│ │ ▼ Material           │ │ │ ████ Polyester                 │ │
│ │   🟢 Active          │ │ │ POLYESTER  │  🟢 Active        │ │
│ │   8 values           │ │ │ Usage: 2,134 variants          │ │
│ │   Creates Variant    │ │ │ Price Modifier: -$5            │ │
│ ├──────────────────────┤ │ │                    [✏️ Edit]    │ │
│ │ ▶ Style              │ │ ├────────────────────────────────┤ │
│ │   🟢 Active          │ │ │ ✨ Silk                        │ │
│ │   15 values          │ │ │ SILK  │  🟢 Active             │ │
│ ├──────────────────────┤ │ │ Usage: 892 variants            │ │
│ │ ▶ Fit                │ │ │ Price Modifier: +$25 (fixed)   │ │
│ │   🟢 Active          │ │ │                    [✏️ Edit]    │ │
│ │   6 values           │ │ ├────────────────────────────────┤ │
│ ├──────────────────────┤ │ │ 🔒 Wool                        │ │
│ │ ▶ Pattern            │ │ │ WOOL  │  🟢 Active  │  Locked  │ │
│ │   🟢 Active          │ │ │ Usage: 1,567 variants          │ │
│ │   10 values          │ │ │ Price Modifier: +$15 (fixed)   │ │
│ ├──────────────────────┤ │ │                    [🔓 Unlock]  │ │
│ │ ▶ Processor          │ │ └────────────────────────────────┘ │
│ │   🟢 Active          │ │                                      │
│ │   24 values          │ │ Showing 1-8 of 8 values             │
│ │   🔒 Locked          │ │                                      │
│ └──────────────────────┘ │                                      │
│                          │                                      │
│ Showing 1-12 of 45 types │                                      │
│                          │                                      │
└──────────────────────────┴──────────────────────────────────────┘
```

### **Add Attribute Type Modal**

```
┌─────────────────────────────────────────────────────────────┐
│  ✕  Add Attribute Type                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Basic Information                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Name *              │  │ Display Name        │         │
│  │ Material            │  │ Material            │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Slug (auto)         │  │ Code *              │         │
│  │ material            │  │ ATTR-MAT-001        │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │ Description                                   │         │
│  │ Primary material composition of the product   │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  Configuration                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Input Type *        │  │ Display Style       │         │
│  │ [SINGLE_SELECT ▼]   │  │ [DROPDOWN      ▼]   │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  Variant Behavior                                           │
│  ☑ Creates Variant (changes create new SKU)                │
│  ☐ Required (must be specified for all products)           │
│                                                             │
│  Segmentation                                               │
│  Available Channels:                                        │
│  ☑ WEB  ☑ POS  ☑ B2B  ☑ APP  ☐ MARKETPLACE               │
│                                                             │
│  Available Regions:                                         │
│  ☑ US  ☑ EU  ☑ APAC  ☑ GLOBAL                             │
│                                                             │
│  Applicable Categories                                      │
│  ☑ Clothing  ☑ Footwear  ☐ Electronics  ☐ Accessories     │
│                                                             │
│  Governance                                                 │
│  ☐ Lock after creation                                     │
│  ☐ Requires approval for changes                           │
│                                                             │
│                           [Cancel]  [Save Type]            │
└─────────────────────────────────────────────────────────────┘
```

### **Add Attribute Value Modal**

```
┌─────────────────────────────────────────────────────────────┐
│  ✕  Add Attribute Value (Material)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Basic Information                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Name *              │  │ Display Name        │         │
│  │ COTTON              │  │ 100% Cotton         │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Slug (auto)         │  │ Code *              │         │
│  │ cotton              │  │ MAT-COT-001         │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │ Description                                   │         │
│  │ Natural cotton fiber, breathable and soft     │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  Pricing Modifiers (Optional)                               │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Modifier Type       │  │ Value               │         │
│  │ [FIXED         ▼]   │  │ +0.00               │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  Visual Data (Optional)                                     │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Swatch Image        │  │ Icon URL            │         │
│  │ [Upload]            │  │ [Upload]            │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  Material Properties                                        │
│  ☑ Breathable  ☑ Sustainable  ☐ Waterproof                │
│  ☐ Stretchable  ☐ Wrinkle Resistant                       │
│                                                             │
│  Compatibility Rules                                        │
│  Compatible with:                                           │
│  [+ Add compatible attribute value]                        │
│                                                             │
│  Incompatible with:                                         │
│  [+ Add incompatible attribute value]                      │
│                                                             │
│  Display Order                                              │
│  ┌─────────────────────┐                                   │
│  │ Sort Order          │                                   │
│  │ 10                  │                                   │
│  └─────────────────────┘                                   │
│                                                             │
│                           [Cancel]  [Save Value]           │
└─────────────────────────────────────────────────────────────┘
```

### **Key Features**
- ✅ **Two-Panel Layout**: Types on left, values on right
- ✅ **Hierarchical View**: Expandable type tree
- ✅ **Variant Creation Flag**: Indicates if changes create new SKU
- ✅ **Price Modifiers**: Fixed or percentage adjustments
- ✅ **Compatibility Rules**: Define valid/invalid combinations
- ✅ **Segmentation**: Channel and region availability
- ✅ **Category Mapping**: Applicable product categories
- ✅ **Lock Protection**: Prevent changes to critical attributes

---

## 4️⃣ VARIANT MASTER UI

### **Layout Structure**

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Dashboard > Masters > Variant Master                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Variant Master Registry                                        │
│  Global variant configurations with collision prevention       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [🔍 Search SKU, product, config...]                           │
│                                                                 │
│  [Product Group ▼] [Brand ▼] [Category ▼] [Lifecycle ▼]       │
│                                                                 │
│  [In Stock Only ☐] [Channel ▼] [Region ▼]  [+ Create Variant] │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ NKE-TSH-BLK-XL-A7F9                                       │ │
│  │ ┌────┐                                                    │ │
│  │ │IMG │  Nike Air Max T-Shirt                             │ │
│  │ │    │  Brand: NIKE  │  Category: CLOTHING               │ │
│  │ └────┘                                                    │ │
│  │                                                           │ │
│  │ Configuration:                                            │ │
│  │ ████ COLOR: Black  │  SIZE: XL  │  MATERIAL: Cotton     │ │
│  │                                                           │ │
│  │ Config Hash: a3f8d9e2b1c4...  │  🟢 ACTIVE  │  🔒 Locked │ │
│  │                                                           │ │
│  │ Price: $49.99  │  Compare: $69.99  │  Discount: 29%     │ │
│  │ Stock: 1,234 available  │  Reserved: 45                  │ │
│  │                                                           │ │
│  │ Channels: WEB, POS, APP  │  Regions: US, EU              │ │
│  │ Popularity: ⭐⭐⭐⭐⭐ (4,567 purchases)                   │ │
│  │                                                           │ │
│  │ [📊 Analytics] [📦 Inventory] [✏️ Edit] [🔄 Sync Search] │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ NKE-TSH-WHT-M-B2E4                                        │ │
│  │ ┌────┐                                                    │ │
│  │ │IMG │  Nike Air Max T-Shirt                             │ │
│  │ │    │  Brand: NIKE  │  Category: CLOTHING               │ │
│  │ └────┘                                                    │ │
│  │                                                           │ │
│  │ Configuration:                                            │ │
│  │ ████ COLOR: White  │  SIZE: M  │  MATERIAL: Cotton      │ │
│  │                                                           │ │
│  │ Config Hash: f7a2c8d1e9b3...  │  🟢 ACTIVE               │ │
│  │                                                           │ │
│  │ Price: $49.99  │  Stock: 892 available  │  Reserved: 12  │ │
│  │                                                           │ │
│  │ Channels: WEB, POS  │  Regions: US                       │ │
│  │ Popularity: ⭐⭐⭐⭐ (2,134 purchases)                     │ │
│  │                                                           │ │
│  │ [📊 Analytics] [📦 Inventory] [✏️ Edit] [🔄 Sync Search] │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ADI-SHO-BLU-10-C9F1                                       │ │
│  │ ┌────┐                                                    │ │
│  │ │IMG │  Adidas Ultraboost Running Shoe                   │ │
│  │ │    │  Brand: ADIDAS  │  Category: FOOTWEAR             │ │
│  │ └────┘                                                    │ │
│  │                                                           │ │
│  │ Configuration:                                            │ │
│  │ ████ COLOR: Blue  │  SIZE: 10 (US)  │  WIDTH: Standard  │ │
│  │                                                           │ │
│  │ Config Hash: e4b9f2a7c1d8...  │  🟡 CLEARANCE            │ │
│  │                                                           │ │
│  │ Price: $89.99  │  Compare: $149.99  │  Discount: 40%     │ │
│  │ Stock: 23 available  │  ⚠️ Low Stock                     │ │
│  │                                                           │ │
│  │ Channels: WEB  │  Regions: US                            │ │
│  │ Popularity: ⭐⭐⭐ (456 purchases)                         │ │
│  │                                                           │ │
│  │ [📊 Analytics] [📦 Inventory] [✏️ Edit] [🔄 Sync Search] │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Showing 1-20 of 4,567,892 variants  [◀ Previous] [1][2][3][▶]│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Create Variant Modal (Step 1: Select Product)**

```
┌─────────────────────────────────────────────────────────────┐
│  ✕  Create New Variant (Step 1 of 3)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Select Product                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │ [🔍 Search products...]                       │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │ ○ Nike Air Max T-Shirt                        │         │
│  │   NIKE  │  CLOTHING  │  Group: NKE-TSH-001    │         │
│  │   12 existing variants                        │         │
│  ├───────────────────────────────────────────────┤         │
│  │ ● Adidas Ultraboost Running Shoe              │         │
│  │   ADIDAS  │  FOOTWEAR  │  Group: ADI-SHO-002  │         │
│  │   48 existing variants                        │         │
│  ├───────────────────────────────────────────────┤         │
│  │ ○ Levi's 501 Original Jeans                   │         │
│  │   LEVIS  │  CLOTHING  │  Group: LEV-JEA-003   │         │
│  │   96 existing variants                        │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│                           [Cancel]  [Next: Configure →]    │
└─────────────────────────────────────────────────────────────┘
```

### **Create Variant Modal (Step 2: Configure Attributes)**

```
┌─────────────────────────────────────────────────────────────┐
│  ✕  Create New Variant (Step 2 of 3)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Configure Attributes                                       │
│  Product: Adidas Ultraboost Running Shoe                   │
│                                                             │
│  Required Attributes                                        │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Color *             │  │ Size *              │         │
│  │ ████ [Blue     ▼]   │  │ [10 (US)       ▼]   │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  Optional Attributes                                        │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Width               │  │ Material            │         │
│  │ [Standard      ▼]   │  │ [Mesh          ▼]   │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  Configuration Preview                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │ COLOR: Blue  │  SIZE: 10 (US)  │  WIDTH: Std │         │
│  │ MATERIAL: Mesh                                │         │
│  │                                               │         │
│  │ Config Hash: e4b9f2a7c1d8... (auto-generated)│         │
│  │                                               │         │
│  │ ✅ Configuration is unique                    │         │
│  │ ✅ No conflicts detected                      │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  Compatibility Check                                        │
│  ✅ All attribute combinations are valid                   │
│                                                             │
│                      [← Back]  [Next: Pricing & Stock →]   │
└─────────────────────────────────────────────────────────────┘
```

### **Create Variant Modal (Step 3: Pricing & Stock)**

```
┌─────────────────────────────────────────────────────────────┐
│  ✕  Create New Variant (Step 3 of 3)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Pricing & Inventory                                        │
│  Product: Adidas Ultraboost Running Shoe                   │
│  Config: Blue / 10 (US) / Standard / Mesh                  │
│                                                             │
│  Pricing                                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Base Price *        │  │ Compare At Price    │         │
│  │ $149.99             │  │ $179.99             │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Cost (optional)     │  │ Currency            │         │
│  │ $75.00              │  │ [USD           ▼]   │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  Calculated: Margin: $74.99 (50%)                          │
│                                                             │
│  Initial Inventory                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Warehouse           │  │ Quantity            │         │
│  │ [Main Warehouse▼]   │  │ 500                 │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  Segmentation                                               │
│  Available Channels:                                        │
│  ☑ WEB  ☑ POS  ☐ B2B  ☑ APP  ☐ MARKETPLACE               │
│                                                             │
│  Available Regions:                                         │
│  ☑ US  ☑ EU  ☐ APAC  ☐ GLOBAL                             │
│                                                             │
│  Lifecycle                                                  │
│  ┌─────────────────────┐                                   │
│  │ Initial Status      │                                   │
│  │ ● DRAFT             │                                   │
│  │ ○ PENDING_APPROVAL  │                                   │
│  │ ○ ACTIVE            │                                   │
│  └─────────────────────┘                                   │
│                                                             │
│  Auto-Generated SKU: ADI-SHO-BLU-10-E4B9                   │
│                                                             │
│                      [← Back]  [Create Variant]            │
└─────────────────────────────────────────────────────────────┘
```

### **Variant Detail View (Expanded)**

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Variants                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ADI-SHO-BLU-10-E4B9                                        │
│  Adidas Ultraboost Running Shoe                            │
│                                                             │
│  ┌──────────┐                                              │
│  │          │  🟢 ACTIVE  │  🔒 Locked                     │
│  │  IMAGE   │  Version: 3  │  Last Updated: 2h ago         │
│  │          │                                              │
│  └──────────┘                                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Overview] [Configuration] [Pricing] [Inventory] [Analytics]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Configuration Details                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │ Config Hash (SHA-256)                         │         │
│  │ e4b9f2a7c1d8b3e6f9a2c5d8e1b4f7a0c3d6e9b2f5a8 │         │
│  │                                               │         │
│  │ Config Signature                              │         │
│  │ COLOR:BLUE|SIZE:10|WIDTH:STANDARD|MATERIAL:MESH│        │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  Normalized Attributes                                      │
│  ┌───────────────────────────────────────────────┐         │
│  │ ████ Color: Blue (color-blue-001)             │         │
│  │      Type: COLOR  │  Sort: 1                  │         │
│  ├───────────────────────────────────────────────┤         │
│  │ 📏 Size: 10 (US) (size-footwear-10-us)        │         │
│  │      Type: SIZE  │  Sort: 2                   │         │
│  ├───────────────────────────────────────────────┤         │
│  │ 📐 Width: Standard (width-standard)            │         │
│  │      Type: WIDTH  │  Sort: 3                  │         │
│  ├───────────────────────────────────────────────┤         │
│  │ 🧵 Material: Mesh (material-mesh)             │         │
│  │      Type: MATERIAL  │  Sort: 4               │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  Current Price                                              │
│  ┌───────────────────────────────────────────────┐         │
│  │ Base: $149.99  │  Compare: $179.99            │         │
│  │ Discount: 17%  │  Cost: $75.00                │         │
│  │ Margin: $74.99 (50%)                          │         │
│  │                                               │         │
│  │ Effective: Jan 15, 2026 - Present            │         │
│  │                                [📝 Edit Price]│         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  Inventory Summary                                          │
│  ┌───────────────────────────────────────────────┐         │
│  │ Total: 500  │  Reserved: 12  │  Available: 488│         │
│  │                                               │         │
│  │ Last Synced: 5 minutes ago  │  Version: 47   │         │
│  │                          [🔄 Force Sync]      │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  Audit Log                                                  │
│  ┌───────────────────────────────────────────────┐         │
│  │ 2h ago  │  Price changed by admin@store.com   │         │
│  │ 1d ago  │  Inventory synced (v46 → v47)       │         │
│  │ 3d ago  │  Status changed: DRAFT → ACTIVE     │         │
│  │ 5d ago  │  Variant created by admin@store.com │         │
│  │                            [View Full History]│         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **Key Features**
- ✅ **Config Hash Display**: Shows SHA-256 hash for verification
- ✅ **Collision Prevention**: Real-time uniqueness validation
- ✅ **Normalized Snapshots**: Flattened attributes for fast reads
- ✅ **Lifecycle Badges**: Visual state indicators
- ✅ **Inventory Summary**: Denormalized stock data
- ✅ **Price History**: Track all price changes
- ✅ **Audit Trail**: Complete change history
- ✅ **Bulk Operations**: Select multiple variants for batch updates
- ✅ **Search Sync**: Manual trigger for search index update
- ✅ **Analytics Integration**: Direct link to variant performance

---

## 🎨 DESIGN TOKENS

### **Status Badges**

```css
.badge-active {
  background: #DCFCE7;
  color: #166534;
  border: 1px solid #BBF7D0;
}

.badge-deprecated {
  background: #FEF3C7;
  color: #92400E;
  border: 1px solid #FDE68A;
}

.badge-archived {
  background: #F3F4F6;
  color: #6B7280;
  border: 1px solid #E5E7EB;
}

.badge-locked {
  background: #DBEAFE;
  color: #1E40AF;
  border: 1px solid #BFDBFE;
}
```

### **Action Buttons**

```css
.btn-primary {
  background: #2563EB;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #D1D5DB;
  padding: 8px 16px;
  border-radius: 6px;
}

.btn-danger {
  background: #EF4444;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
}
```

---

## 📱 RESPONSIVE BEHAVIOR

- **Desktop (>1280px)**: Full layout as shown
- **Tablet (768-1280px)**: Stacked filters, condensed table
- **Mobile (<768px)**: Card-based layout, bottom sheet modals

---

## ♿ ACCESSIBILITY

- ✅ WCAG 2.1 AA compliant
- ✅ Keyboard navigation support
- ✅ Screen reader optimized
- ✅ High contrast mode support
- ✅ Focus indicators on all interactive elements

---

**END OF UI OVERVIEW**
