

# Full Structural & UX Redesign: Merchant Dashboard Page

Complete information architecture overhaul of the Merchant Dashboard -- transforming it from a basic stats page into a structured operational command center.

---

## Current State Analysis

The current Dashboard (`src/pages/merchant/Dashboard.tsx`) has:
- A welcome text + refresh button header (no PageHeader component)
- Subscription widgets (2/3 + 1/3 grid)
- 4 KPI cards (Properties, Occupancy, Tenants, Escrow)
- A 2-column grid: Property Overview (occupancy bars) + Financial Summary
- No quick actions section
- No charts (InteractiveDashboardCharts exists but is NOT used)
- No VacancyDashboard integration (exists but NOT used)
- No recent activity or alerts section

Two powerful components exist but are completely unused:
- `InteractiveDashboardCharts` -- Revenue, Occupancy, Payment Status charts
- `VacancyDashboard` -- Vacant units management with alerts

---

## Redesigned Information Architecture

```text
Section 1: PageHeader + Welcome + Refresh CTA
Section 2: Alert Strip (Trial Countdown -- conditional)
Section 3: KPI Strip (4 cards -- Properties, Occupancy, Tenants, Revenue)
Section 4: 2-col grid
  [Left 2/3: Quick Actions Panel]
  [Right 1/3: Subscription Widget]
Section 5: Interactive Charts (Revenue, Occupancy, Payment Status)
Section 6: 2-col grid
  [Left 2/3: Property Overview with occupancy bars]
  [Right 1/3: Financial Summary]
Section 7: Vacancy Alerts (VacancyDashboard -- conditional, only if vacancies exist)
```

### Why This Order
1. **PageHeader** -- Establishes context and identity (consistent with all other redesigned pages)
2. **Alert Strip** -- Trial urgency must be immediately visible, not buried in a grid
3. **KPI Strip** -- Executive summary at a glance before diving into details
4. **Quick Actions + Subscription** -- Actionable items paired with account status
5. **Charts** -- Data visualization for trend analysis (leveraging the unused InteractiveDashboardCharts component)
6. **Property + Financial detail** -- Drill-down information
7. **Vacancy Alerts** -- Operational warnings at the bottom (leveraging unused VacancyDashboard)

---

## Changes to Implement

### 1. Add PageHeader
- Use `LayoutDashboard` icon, title "Dashboard", description with welcome message
- Move Refresh button into PageHeader children slot
- Remove the current inline header `div`

### 2. Restructure Alert Strip
- Move `TrialCountdownWidget` out of the grid and into a full-width position below header
- This gives it proper visual weight as an alert, not just a sidebar card

### 3. Enhance KPI Strip
- Keep existing 4 cards but add `gradient-icon-box` class consistency
- Add hover lift: `hover:-translate-y-1 hover:shadow-lg transition-all duration-300`
- Make cards clickable -- navigate to respective module pages (Properties, Tenants, Payments)

### 4. Add Quick Actions Panel
- New card with 4-6 quick action buttons in a responsive grid:
  - Add Property (navigates to /merchant/properties)
  - Create Invoice (navigates to /merchant/invoices)
  - Create Contract (navigates to /merchant/contracts)
  - View Reports (navigates to /merchant/reports)
- Each action: `gradient-icon-box` icon + label, `hover:bg-primary/5 rounded-xl transition-all cursor-pointer`
- Place alongside SubscriptionWidget in a 2-col grid (lg:col-span-4 + lg:col-span-3)

### 5. Integrate InteractiveDashboardCharts
- Import and render `InteractiveDashboardCharts` component (currently unused)
- Full-width section below Quick Actions
- Already has proper glassmorphism, pill tabs, and chart styling

### 6. Keep Property Overview + Financial Summary
- Already well-styled with glassmorphism
- Add `gradient-icon-box` section headers for consistency
- Property rows already have `cursor-pointer` and `hover:bg-primary/5`

### 7. Integrate VacancyDashboard (conditional)
- Import and render `VacancyDashboard` component (currently unused)
- Only show if there are vacant units (the component handles its own empty state)
- Wrap in a collapsible section with a header: "Vacancy Management"

---

## Technical Details

### Files Modified

| File | Changes |
|------|---------|
| `src/pages/merchant/Dashboard.tsx` | PageHeader, layout restructure, integrate Charts + VacancyDashboard, Quick Actions, clickable KPIs |

### Component Mapping

- **PageHeader** -- Dashboard title with LayoutDashboard icon
- **Card** -- KPI cards, Quick Actions, Property Overview, Financial Summary
- **Button** -- Refresh, Quick Action items
- **Progress** -- Occupancy bars (existing)
- **Badge** -- Growth indicators (existing)
- **Tabs** -- Inside InteractiveDashboardCharts (already implemented)

### Tailwind Strategy

- All cards: `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- KPI hover: `hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer`
- Quick action items: `p-4 rounded-xl hover:bg-primary/5 transition-all cursor-pointer`
- Icon boxes: `gradient-icon-box` pattern (h-10 w-10 rounded-xl bg-gradient-to-br)
- Section spacing: `space-y-6` between major sections

### Responsiveness

- KPI strip: `grid-cols-2 md:grid-cols-4` (stacks on mobile)
- Quick Actions + Subscription: `lg:grid-cols-7` (stacks on mobile)
- Charts: Full-width, responsive via Recharts `ResponsiveContainer`
- Property + Financial: `lg:grid-cols-7` (stacks on mobile)

### No Business Logic Changes

- Same `useMerchantDashboardStats` hook
- Same `MerchantDashboardSkeleton` for loading
- Same data shape from `merchantDashboardService`
- InteractiveDashboardCharts and VacancyDashboard use their own hooks internally

