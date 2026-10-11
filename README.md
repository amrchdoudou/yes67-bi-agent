# Yes67 BI Agent — AI Reporting & Business Intelligence Agent for SMEs

**Yes67 BI Agent** is a production-quality Business Intelligence and reporting system engineered specifically for SMEs. It turns raw, messy company spreadsheets and CSVs into clean data, deterministic KPIs, anomaly alerts, plain-language executive insights, exportable PDF/Excel reports, and an AI chat agent with full tool transparency.

---

## 🔒 Core Architectural Principle

> **"Code computes. AI explains."**

All business metrics, gross margins, growth rates, rolling standard deviations, Z-scores, and forecasts are **100% computed by deterministic TypeScript functions**. 

The Gemini LLM (`gemini-3.8-flash`) **never calculates numbers in its head**; it only receives pre-computed JSON summaries or calls explicit deterministic tools (`getTopProducts`, `getRevenueAndProfit`, `getAnomaliesAndAlerts`, `getStockStatus`, `compareRegions`, `getMoMGrowthAndForecast`).

- **Raw Data Privacy**: Raw files (transactions, customer details, employee records) are parsed and sanitized **100% locally in the browser memory** using PapaParse and SheetJS.
- **Strict Aggregation Boundary**: Only high-level aggregated KPI/anomaly JSON is sent to the server for natural language synthesis.

---

## 🚀 Key Features & Modules

1. **Multilingual & RTL Support**: Full support for English, French, and Arabic (العربية) with dynamic `dir="rtl"` layout, fonts (Cairo & Plus Jakarta Sans), and translation dictionaries.
2. **Data Import Module**:
   - Drag & drop CSV and Excel (.xlsx, .xls) files for Sales, Expenses, Inventory, and Customers.
   - Automatic column detection with multilingual fuzzy header matching (FR/EN/AR).
   - Live preview of source rows and mapping verification.
3. **Deterministic Data Cleaning Engine**:
   - Purges exact and key duplicates.
   - Trims whitespace and standardizes casing.
   - Normalizes varied date formats (ISO, EU DD/MM/YYYY, US, Excel serials) into ISO YYYY-MM-DD.
   - Sanitizes numeric strings (removes `$`, `€`, `£`, `DA`, `SAR`, thousand commas, and European comma decimals).
   - Handles missing values (drop / median imputation / zero fill).
   - Flags negative quantities, negative prices, and future-dated entries.
   - Comprehensive audit report with downloadable sanitized CSV.
4. **Deterministic KPI Engine**:
   - Total Revenue, Gross Profit, Gross Margin %, Operating Expenses, Net Profit, Net Margin %.
   - Average Order Value (AOV), Total Orders, Active Customers, New vs. Returning Customers.
   - Revenue by Month, Revenue by Region, Top 5 & Bottom 5 Products (by revenue & volume).
   - MoM & YoY growth calculations.
   - Inventory KPIs: Stock Value, Turnover velocity, Days of Supply remaining, Low-stock & Overstock metrics.
   - SVG micro-sparklines and period-over-period trend pills on all cards.
5. **Anomaly & Trend Engine**:
   - Monthly sales spikes and drops via rolling mean + Z-score (configurable threshold).
   - Category-level expense surges.
   - Stockout risk (velocity vs safety stock) and excess capital overstock risk (>180 days).
   - Linear regression trend slope and 3-period deterministic forecast with expected confidence bands.
6. **Executive Dashboard**:
   - Interactive Recharts: Monthly revenue & profit area trajectory, regional donut share, top products horizontal bar, profit vs operating expenses, and inventory health.
   - Multi-dimensional filters: reporting period, region, and product category.
7. **AI Executive Insights (Gemini 3.8 Flash)**:
   - Executive summary, key business findings, critical bottleneck risks, and tactical recommendations synthesized in the user's active language.
   - Copy to clipboard and inclusion in PDF reports.
8. **Ask the Agent (Chat with Tool Calling)**:
   - Natural language queries answered via Gemini function calling.
   - Interactive transparency drawer reveals the exact tool invoked and the underlying deterministic table returned.
9. **Reports & Exports**:
   - **Executive PDF Report**: Built with `jspdf` and `jspdf-autotable`, including branding, cover, executive summary, KPI matrix, product table, and anomaly log.
   - **Multi-Sheet Excel Workbook**: Formatted XLSX with sheets for "KPI Summary", "Cleaned Sales", "Cleaned Expenses", "Inventory", and "Alerts".
   - **Simulated Report Scheduling**: Configure recurring automated delivery (daily/weekly/monthly).

---

## 📁 Project Structure

```
├── server.ts                   # Express server + Vite middlewares + Gemini API routes
├── index.html                  # HTML entry point with Cairo & Plus Jakarta Sans fonts
├── metadata.json               # Application capabilities & metadata
├── src/
│   ├── main.tsx                # React root mount
│   ├── App.tsx                 # Tab navigation, layout shell, and mobile drawer
│   ├── index.css               # Tailwind CSS & RTL typography styles
│   ├── types/                  # Strict TypeScript interfaces for all data structures
│   ├── i18n/                   # Multilingual translation dictionaries (EN, FR, AR)
│   ├── engine/
│   │   ├── dataCleaner.ts      # Deterministic sanitization & audit engine
│   │   ├── kpiEngine.ts        # Pure TypeScript KPI mathematical computations
│   │   ├── anomalyEngine.ts    # Z-scores, linear regression slope, and forecasts
│   │   ├── demoData.ts         # 12-month SME sample generator with injected anomalies
│   │   └── tests.ts            # Standalone unit tests for mathematical engines
│   ├── store/
│   │   └── useBIStore.ts       # Zustand store with reactive state & actions
│   ├── utils/
│   │   ├── fileParser.ts       # PapaParse & SheetJS reader with fuzzy mapping
│   │   └── exporters.ts        # PDF (jsPDF) and multi-sheet Excel (XLSX) generators
│   ├── components/
│   │   ├── Navbar.tsx          # Branding, demo loader, language & dark mode
│   │   ├── Sidebar.tsx         # Navigation modules with status indicators
│   │   ├── FilterBar.tsx       # Date, region, and category filters
│   │   ├── KPICard.tsx         # Card with value, trend pill, and SVG sparkline
│   │   ├── SettingsModal.tsx   # Company name, logo, currency preset & tax
│   │   └── PrivacyModal.tsx    # Transparency and security architecture modal
│   └── pages/
│       ├── DataImportPage.tsx  # Drag & drop upload and column mapping
│       ├── DataCleaningPage.tsx# Cleaning rules and audit report table
│       ├── DashboardPage.tsx   # Recharts charts and KPI matrix
│       ├── AlertsPage.tsx      # Z-score anomalies and deterministic forecast
│       ├── InsightsPage.tsx    # Gemini AI executive briefing
│       ├── ChatAgentPage.tsx   # Transparent function-calling business chat
│       └── ReportsPage.tsx     # PDF, Excel, and automated scheduling
```

---

## 🛠️ How to Run

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run deterministic unit tests**:
   ```bash
   npm test
   ```
   Validates number sanitization, date normalization, duplicate removal, KPI sums, and anomaly detection.

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Starts `server.ts` on port 3000 hosting both the API routes and the client via Vite.

4. **Production Build**:
   ```bash
   npm run build
   npm start
   ```
