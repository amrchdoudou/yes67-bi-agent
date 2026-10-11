import { RawDataset } from '../types';

export function generateDemoDatasets(): {
  sales: RawDataset;
  expenses: RawDataset;
  inventory: RawDataset;
  customers: RawDataset;
} {
  const products = [
    { name: 'UltraBook Pro 15', category: 'Hardware', price: 1250, cost: 820 },
    { name: 'ErgoDesk Electric', category: 'Furniture', price: 680, cost: 390 },
    { name: 'Cloud ERP SME License', category: 'Software', price: 290, cost: 60 },
    { name: '4K Designer Monitor 27"', category: 'Hardware', price: 450, cost: 280 },
    { name: 'Pro Wireless Headset', category: 'Accessories', price: 180, cost: 85 },
    { name: 'Mesh Executive Chair', category: 'Furniture', price: 340, cost: 190 },
    { name: 'CyberShield Antivirus (Annual)', category: 'Software', price: 120, cost: 25 },
    { name: 'Gigabit Switch 24-Port', category: 'Hardware', price: 220, cost: 130 },
    { name: 'Smart Video Bar Studio', category: 'Hardware', price: 890, cost: 540 },
    { name: 'Heavy-Duty Storage Shelf', category: 'Furniture', price: 210, cost: 110 },
    { name: 'CRM Pro Cloud Multi-Seat', category: 'Software', price: 490, cost: 95 },
    { name: 'Ergonomic Mechanical Keyboard', category: 'Accessories', price: 140, cost: 65 },
    { name: 'USB-C Docking Triple Display', category: 'Accessories', price: 195, cost: 95 },
    { name: 'Conference Speakerphone', category: 'Accessories', price: 260, cost: 140 },
    { name: 'Managed Backup Service', category: 'Services', price: 350, cost: 110 },
    { name: 'On-Site IT Maintenance Visit', category: 'Services', price: 500, cost: 260 },
    { name: 'Biometric Access Scanner', category: 'Hardware', price: 420, cost: 230 },
    { name: 'Paper Shredder Cross-Cut', category: 'Office', price: 160, cost: 80 },
    { name: 'Label Printer Thermal', category: 'Office', price: 210, cost: 105 },
    { name: 'Legacy USB Cable Pack', category: 'Accessories', price: 25, cost: 8 },
  ];

  const customers = [
    'Apex Logistics Ltd', 'BlueWave Consulting', 'Caspian Tech Labs', 'Delta Manufacturing',
    'Echo Media Group', 'Falcon Horizon Co', 'GreenLeaf Organics', 'Horizon Retailers',
    'Infinity Real Estate', 'Jupiter Financials', 'Krypton Security', 'Lumina Health Care',
    'Monarch Legal Services', 'Nexus Design Agency', 'Omega Food Distribution', 'Pioneer Engineering',
    'Quantum Software Inc', 'Redwood Craft Breweries', 'Summit Supply Chain', 'Titan Heavy Industries',
    'Unified Trade Corp', 'Vanguard BioTech', 'WestEnd Hospitality', 'Xenon Clean Energy',
    'Yosemite Eco Tours', 'Zenith Global Shipping', 'Atlas Architecture', 'Beacon Maritime',
    'Crestview Academy', 'Dovetail Woodworks', 'Elysium Wellness', 'Frontier Mining',
    'Granite Construction', 'Highland Coffee Roasters', 'Ironclad Hardware', 'Jade Palace Bistro',
    'Keystone Logistics', 'Lighthouse Telecom', 'Magna Automotive', 'Nirvana Spa Resort',
    'Orion Telecom Group', 'Paladin Defense Systems', 'Quasar Analytics', 'Radiant Energy Ltd',
    'Sterling Dental Clinic', 'TerraFirma Agrotech', 'Union Warehousing', 'Valiant Freight',
    'Windmill Power Systems', 'Xpress Parcel Delivery', 'Yellowstone Hospitality', 'Zephyr Aviation',
    'Alpha Dental Care', 'Bravo Fitness Gyms', 'Charlie Auto Parts', 'Delta Force Security',
    'Echo Sound Studios', 'Foxtrot Bakeries', 'Golf Club Resorter', 'Hotel Miramar Deluxe'
  ];

  const regions = ['North', 'South', 'East', 'West', 'Central'];

  // Base dates from 2024-01-01 to 2024-12-31
  const salesRows: any[] = [];
  let orderSeq = 1000;

  // Monthly order volume seasonality:
  // Jan: normal (50)
  // Feb: sharp dip (16) -> ANOMALY 1 (Supply disruption)
  // Mar-Oct: growing steadily (60 to 80)
  // Nov: massive spike (165) -> ANOMALY 2 (Black Friday promotion surge)
  // Dec: strong holiday closing (105)
  const monthlyVolumes = [50, 12, 58, 62, 68, 72, 75, 78, 82, 88, 165, 105];

  for (let m = 0; m < 12; m++) {
    const monthNum = m + 1;
    const monthStr = String(monthNum).padStart(2, '0');
    const ordersInMonth = monthlyVolumes[m];

    for (let i = 0; i < ordersInMonth; i++) {
      orderSeq++;
      const day = Math.min(28, Math.floor(Math.random() * 28) + 1);
      const dayStr = String(day).padStart(2, '0');

      // Random product with weighted selection (UltraBook and Pro Headset sell more)
      const pIndex = Math.floor(Math.random() * products.length);
      const prod = products[pIndex];
      const cust = customers[Math.floor(Math.random() * customers.length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const qty = Math.floor(Math.random() * 4) + 1;

      // Realistic dirty data injection:
      // Mix date format for 10% of rows (DD/MM/YYYY instead of YYYY-MM-DD)
      let dateField: string = `2024-${monthStr}-${dayStr}`;
      if (orderSeq % 9 === 0) {
        dateField = `${dayStr}/${monthStr}/2024`;
      }

      // Mix currency strings on unit_price for 15% of rows
      let priceField: any = prod.price;
      if (orderSeq % 7 === 0) {
        priceField = `$${prod.price.toLocaleString('en-US')}`;
      } else if (orderSeq % 11 === 0) {
        priceField = ` ${prod.price} € `;
      }

      // Untrimmed strings for customer
      let customerField = cust;
      if (orderSeq % 8 === 0) {
        customerField = `   ${cust}  `;
      }

      salesRows.push({
        'Order ID': `SO-${orderSeq}`,
        'Date': dateField,
        'Product Name': prod.name,
        'Category': prod.category,
        'Quantity': qty,
        'Unit Price': priceField,
        'Unit Cost': prod.cost,
        'Customer Name': customerField,
        'Sales Region': region,
      });
    }
  }

  // Intentionally inject dirty rows into sales:
  // 1. Exact duplicates (4 rows)
  salesRows.push({ ...salesRows[10] });
  salesRows.push({ ...salesRows[45] });
  salesRows.push({ ...salesRows[120] });
  salesRows.push({ ...salesRows[200] });

  // 2. Negative quantity row (Mistake / return)
  salesRows.push({
    'Order ID': 'SO-9991-ERR',
    'Date': '2024-05-14',
    'Product Name': 'UltraBook Pro 15',
    'Category': 'Hardware',
    'Quantity': -3,
    'Unit Price': 1250,
    'Unit Cost': 820,
    'Customer Name': 'Apex Logistics Ltd',
    'Sales Region': 'North',
  });

  // 3. Negative price row
  salesRows.push({
    'Order ID': 'SO-9992-ERR',
    'Date': '2024-06-20',
    'Product Name': 'Pro Wireless Headset',
    'Category': 'Accessories',
    'Quantity': 2,
    'Unit Price': -180,
    'Unit Cost': 85,
    'Customer Name': 'Beacon Maritime',
    'Sales Region': 'West',
  });

  // 4. Future dated row (> 30 days into future)
  salesRows.push({
    'Order ID': 'SO-9993-FUTURE',
    'Date': '2027-11-15',
    'Product Name': 'ErgoDesk Electric',
    'Category': 'Furniture',
    'Quantity': 1,
    'Unit Price': 680,
    'Unit Cost': 390,
    'Customer Name': 'Highland Coffee Roasters',
    'Sales Region': 'Central',
  });

  // 5. Incomplete row with missing product & empty price
  salesRows.push({
    'Order ID': 'SO-9994-NULL',
    'Date': '2024-08-01',
    'Product Name': '',
    'Category': '',
    'Quantity': 2,
    'Unit Price': '',
    'Unit Cost': '',
    'Customer Name': 'Delta Manufacturing',
    'Sales Region': 'East',
  });

  // EXPENSES DATASET (Monthly operating expenses)
  const expenseCategories = ['Salaries & Benefits', 'Office Rent', 'Marketing & Ads', 'Software & Cloud', 'Logistics & Freight', 'Utilities & Admin'];
  const expenseRows: any[] = [];
  let expId = 500;

  for (let m = 0; m < 12; m++) {
    const monthNum = m + 1;
    const monthStr = String(monthNum).padStart(2, '0');

    // Standard fixed expenses
    expenseRows.push({
      'Expense ID': `EXP-${++expId}`,
      'Date': `2024-${monthStr}-01`,
      'Category': 'Office Rent',
      'Description': 'HQ Office Lease',
      'Amount': 4200,
    });
    expenseRows.push({
      'Expense ID': `EXP-${++expId}`,
      'Date': `2024-${monthStr}-05`,
      'Category': 'Salaries & Benefits',
      'Description': 'Staff Payroll & Social Taxes',
      'Amount': 11500,
    });
    expenseRows.push({
      'Expense ID': `EXP-${++expId}`,
      'Date': `2024-${monthStr}-15`,
      'Category': 'Software & Cloud',
      'Description': 'AWS Infrastructure & SaaS tooling',
      'Amount': m === 6 ? '$16,800.00' : 2400, // ANOMALY 3 in July (Cloud spike: $16.8k vs usual $2.4k)
    });
    expenseRows.push({
      'Expense ID': `EXP-${++expId}`,
      'Date': `2024-${monthStr}-20`,
      'Category': 'Marketing & Ads',
      'Description': m === 10 ? 8500 : 2200, // Higher marketing in Nov for BF
      'Amount': m === 10 ? 8500 : 2200,
    });
    expenseRows.push({
      'Expense ID': `EXP-${++expId}`,
      'Date': `2024-${monthStr}-25`,
      'Category': 'Logistics & Freight',
      'Description': 'Courier & Warehouse Handling',
      'Amount': 1400 + Math.floor(Math.random() * 400),
    });
  }

  // INVENTORY DATASET
  const inventoryRows = products.map((prod, idx) => {
    let stockQty = 45;
    let minStock = 15;

    // Injected Stockout Anomaly: Pro Wireless Headset (Best-seller with only 4 units left)
    if (prod.name === 'Pro Wireless Headset') {
      stockQty = 4;
      minStock = 25;
    }
    // Injected Overstock Anomaly: Legacy USB Cable Pack (Slow mover with 650 units)
    if (prod.name === 'Legacy USB Cable Pack') {
      stockQty = 650;
      minStock = 20;
    }
    if (prod.name === 'UltraBook Pro 15') {
      stockQty = 18;
      minStock = 12;
    }

    return {
      'SKU ID': `SKU-${100 + idx}`,
      'Product Name': prod.name,
      'Category': prod.category,
      'Stock Quantity': stockQty,
      'Safety Minimum': minStock,
      'Unit Cost': prod.cost,
      'Supplier': 'Primary Certified Supplier',
    };
  });

  // CUSTOMERS DATASET
  const customerRows = customers.map((cName, idx) => ({
    'Customer ID': `CUST-${1000 + idx}`,
    'Customer Name': cName,
    'Region': regions[idx % regions.length],
    'Tier': idx % 3 === 0 ? 'Enterprise VIP' : idx % 2 === 0 ? 'Corporate Standard' : 'Small Business',
  }));

  return {
    sales: {
      id: 'demo-sales',
      name: 'SME Sales Transactions 2024 (Dirty Sample).csv',
      type: 'sales',
      fileName: 'sme_sales_2024.csv',
      fileSize: 42500,
      uploadedAt: new Date().toISOString(),
      headers: ['Order ID', 'Date', 'Product Name', 'Category', 'Quantity', 'Unit Price', 'Unit Cost', 'Customer Name', 'Sales Region'],
      rows: salesRows,
      mapping: {
        order_id: 'Order ID',
        date: 'Date',
        product: 'Product Name',
        category: 'Category',
        quantity: 'Quantity',
        unit_price: 'Unit Price',
        unit_cost: 'Unit Cost',
        customer: 'Customer Name',
        region: 'Sales Region',
      },
    },
    expenses: {
      id: 'demo-expenses',
      name: 'SME Operational Expenses 2024.xlsx',
      type: 'expenses',
      fileName: 'sme_expenses_2024.xlsx',
      fileSize: 18400,
      uploadedAt: new Date().toISOString(),
      headers: ['Expense ID', 'Date', 'Category', 'Description', 'Amount'],
      rows: expenseRows,
      mapping: {
        date: 'Date',
        expense_category: 'Category',
        expense_description: 'Description',
        total_amount: 'Amount',
      },
    },
    inventory: {
      id: 'demo-inventory',
      name: 'Warehouse Stock Audit.xlsx',
      type: 'inventory',
      fileName: 'warehouse_stock.xlsx',
      fileSize: 12100,
      uploadedAt: new Date().toISOString(),
      headers: ['SKU ID', 'Product Name', 'Category', 'Stock Quantity', 'Safety Minimum', 'Unit Cost', 'Supplier'],
      rows: inventoryRows,
      mapping: {
        product: 'Product Name',
        category: 'Category',
        stock_quantity: 'Stock Quantity',
        min_stock: 'Safety Minimum',
        unit_cost: 'Unit Cost',
      },
    },
    customers: {
      id: 'demo-customers',
      name: 'Customer Directory 2024.csv',
      type: 'customers',
      fileName: 'customers_list.csv',
      fileSize: 8500,
      uploadedAt: new Date().toISOString(),
      headers: ['Customer ID', 'Customer Name', 'Region', 'Tier'],
      rows: customerRows,
      mapping: {
        customer: 'Customer Name',
        region: 'Region',
      },
    },
  };
}
