# ShopTrack

## 02 — Navigation Map

**Document:** `docs/02_navigation_map.md`  
**Project:** ShopTrack  
**Purpose:** Define how users move between screens in the ShopTrack web application.

---

# 1. Navigation Overview

ShopTrack has three main user roles:

1. **Business Owner**
2. **Inventory Manager**
3. **Super Admin**

The screens available to a user depend on their role and permissions.

For a **small business**, the Business Owner may also perform the Inventory Manager functions.

For a **larger business**, the Business Owner and Inventory Manager can have separate accounts and permissions.

---

# 2. Main Application Navigation

After authentication, the main ShopTrack business application contains the following navigation:

- Dashboard
- Products
- Suppliers
- Inventory
- Sales
- Customers
- Reports
- Smart Assistant
- Settings
- Logout

Main flow:

**Login → Dashboard → Select Feature → Perform Action → Save/Complete → Return to Dashboard or Feature**

---

# 3. Authentication Navigation

```text
START
  │
  ▼
Login
  │
  ├── New User ──────► Register Business
  │                         │
  │                         ▼
  │                   Business Setup
  │                         │
  │                         ▼
  │                     Dashboard
  │
  ├── Valid Login ─────► Dashboard
  │
  └── Forgot Password ─► Password Recovery
```

---

# 4. Business Owner Navigation

```text
Login
  │
  ▼
Dashboard
  │
  ├── Products
  │     ├── View Products
  │     ├── Search Products
  │     ├── Add Product
  │     ├── Edit Product
  │     └── Product Details
  │
  ├── Suppliers
  │     ├── Supplier List
  │     ├── Add Supplier
  │     ├── Edit Supplier
  │     ├── Supplier Details
  │     └── Supplier Purchase History
  │
  ├── Inventory
  │     ├── View Stock
  │     ├── Add Stock
  │     ├── Update Stock
  │     ├── Stock Movement
  │     ├── Batch History
  │     ├── Low Stock
  │     ├── Expiring Soon
  │     ├── Expired
  │     └── Out of Stock
  │
  ├── Sales
  │     ├── New Sale
  │     ├── Find Product
  │     ├── Add to Cart
  │     ├── Add/Select Customer
  │     ├── Select Payment Method
  │     ├── Complete Sale
  │     ├── Receipt
  │     └── Sales History
  │
  ├── Customers
  │     ├── Customer List
  │     ├── Add Customer
  │     ├── Customer Details
  │     └── Customer Purchase History
  │
  ├── Reports
  │     ├── Sales Report
  │     ├── Inventory Report
  │     ├── Profit/Loss Summary
  │     └── Graphical Overview
  │
  ├── Smart Assistant
  │     └── Business Insights
  │
  ├── Settings
  │     ├── Business Profile
  │     ├── User Management
  │     ├── Permissions
  │     └── Account Settings
  │
  └── Logout
```

---

# 5. Dashboard Navigation

The Dashboard is the main screen after login.

It provides quick access to important business information.

```text
Dashboard
   │
   ├── Total Products ─────► Products
   │
   ├── Current Stock ──────► Inventory
   │
   ├── Low Stock ──────────► Low Stock List
   │
   ├── Out of Stock ───────► Out of Stock List
   │
   ├── Expiring Soon ──────► Inventory Expiry Alerts
   │
   ├── Expired Products ───► Inventory Expired List
   │
   ├── Today's Sales ──────► Sales History
   │
   ├── Revenue ────────────► Reports
   │
   ├── Profit/Loss ────────► Reports
   │
   └── New Sale ───────────► Sales
```

---

# 6. Product Navigation

```text
Dashboard
   │
   ▼
Products
   │
   ├── Search / Filter
   │
   ├── Add Product
   │       │
   │       ▼
   │   Product Form
   │       │
   │       ├── Product Name
   │       ├── Category
   │       ├── Variant
   │       ├── Cost Price
   │       ├── Wholesale Price
   │       ├── Retail Price
   │       ├── Quantity
   │       └── Low-Stock Level
   │
   ├── View Product
   │
   └── Edit Product
```

Product status should be displayed as:

- **In Stock**
- **Low Stock**
- **Out of Stock**

---

# 7. Inventory Navigation

```text
Dashboard
   │
   ▼
Inventory
   │
   ├── All Stock
   │
   ├── Search / Filter
   │
   ├── Add Stock
   │
   ├── Update Quantity
   │
   ├── Stock Movement
   │
   ├── Batch Details
   │
   ├── Low Stock
   │
   ├── Expiring Soon
   │
   ├── Expired
   │
   └── Out of Stock
```

The Inventory screen should allow users to quickly identify products that require attention, including stock running low, products approaching expiry, and products that have already expired.

Inventory filters should include:

- All Stock
- Low Stock
- Out of Stock
- Expiring Soon
- Expired

---

# 8. Supplier Navigation

```text
Dashboard
   │
   ▼
Suppliers
   │
   ├── Supplier List
   │
   ├── Search / Filter Suppliers
   │
   ├── Add Supplier
   │      ├── Supplier Name
   │      ├── Contact Person
   │      ├── Phone
   │      ├── Email
   │      ├── Address
   │      └── Notes
   │
   ├── Supplier Details
   │
   └── Edit Supplier
```

The Suppliers screen should support basic supplier management for business purchasing records and inventory traceability.

---

# 9. Sales Navigation

The Sales screen represents one of the most important ShopTrack workflows.

```text
Dashboard
   │
   ▼
Sales
   │
   ▼
New Sale
   │
   ├── Search Product
   │
   ▼
Select Product
   │
   ▼
Add to Cart
   │
   ├── Change Quantity
   ├── Remove Product
   └── Continue Adding Products
   │
   ▼
Customer
   │
   ├── Select Existing Customer
   ├── Add New Customer
   └── Walk-in Customer
   │
   ▼
Payment
   │
   ├── Cash
   ├── Transfer
   ├── POS
   └── Credit/Owe
   │
   ▼
Amount Paid
   │
   ▼
Complete Sale
   │
   ▼
Update Inventory
   │
   ▼
Generate Receipt
   │
   ▼
Sales History
```

Completing a sale should automatically reduce the appropriate inventory quantity.

---

# 10. Customer Navigation

```text
Dashboard
   │
   ▼
Customers
   │
   ├── Search Customer
   │
   ├── Add Customer
   │       ├── Customer Name
   │       └── Phone Number
   │
   ├── View Customer
   │
   └── Purchase History
```

A customer record may be optional for walk-in sales.

---

# 11. Reports Navigation

```text
Dashboard
   │
   ▼
Reports
   │
   ├── Sales
   │
   ├── Inventory
   │
   ├── Revenue
   │
   ├── Profit/Loss
   │
   └── Product Performance
```

Reports should provide simple graphical and numerical information that helps the Business Owner understand business performance.

---

# 12. Smart Assistant Navigation

```text
Dashboard
   │
   ▼
Smart Assistant
   │
   ├── Ask Business Question
   │
   ▼
Analyze ShopTrack Data
   │
   ▼
Display Insight
```

Example questions may include:

- Which products are running low?
- What are my best-selling products?
- What were my sales today?
- Which products are out of stock?
- What is my estimated profit from recorded sales?

The Smart Assistant should only use business information the logged-in user is authorized to access.

---

# 13. Inventory Manager Navigation

The Inventory Manager has restricted access based on permissions.

```text
Login
  │
  ▼
Dashboard
  │
  ├── Products
  │     ├── View
  │     ├── Add
  │     └── Edit
  │
  ├── Inventory
  │     ├── View Stock
  │     ├── Add Stock
  │     ├── Update Stock
  │     └── Stock Movement
  │
  ├── Sales
  │     └── Record Sale
  │         (if permitted)
  │
  ├── Reports
  │     └── Inventory Reports
  │
  └── Logout
```

The Inventory Manager should not automatically have access to:

- Business ownership settings.
- User role management.
- Platform administration.

---

# 14. Super Admin Navigation

The Super Admin uses a separate administrative area.

```text
Super Admin Login
       │
       ▼
Admin Dashboard
       │
       ├── Businesses
       │     ├── View Businesses
       │     ├── View Business Details
       │     ├── Activate
       │     └── Suspend
       │
       ├── Users
       │     ├── View Users
       │     ├── View User Details
       │     └── Manage Status
       │
       ├── Roles
       │     └── Manage System Roles
       │
       ├── System Activity
       │
       ├── System Errors
       │
       ├── Settings
       │
       └── Logout
```

---

# 14. Role Access Summary

| Screen | Business Owner | Inventory Manager | Super Admin |
|---|---|---|---|
| Business Dashboard | Yes | Limited | No |
| Products | Yes | Yes | No |
| Inventory | Yes | Yes | No |
| Sales | Yes | If permitted | No |
| Customers | Yes | If permitted | No |
| Reports | Yes | Limited | No |
| Smart Assistant | Yes | If permitted | No |
| Business Settings | Yes | No | No |
| User Management | Yes | No | Platform Users |
| Admin Dashboard | No | No | Yes |
| Business Management | No | No | Yes |
| System Settings | No | No | Yes |

---

# 15. Main MVP Navigation Flow

The most important ShopTrack MVP flow is:

```text
Login
  ↓
Dashboard
  ↓
Products
  ↓
Add Product
  ↓
Inventory
  ↓
Record Stock
  ↓
Sales
  ↓
Add Product to Cart
  ↓
Complete Sale
  ↓
Inventory Automatically Updates
  ↓
Sales History
  ↓
Dashboard / Reports
```

This workflow connects the three core parts of ShopTrack:

**Products → Inventory → Sales**

The Dashboard and Reports then use information generated from these activities.

---

# 16. Navigation Design Principles

The ShopTrack navigation should be:

- **Simple:** Users should quickly understand where to go.
- **Consistent:** Main navigation should remain consistent across business screens.
- **Role-based:** Users should only see features they are permitted to use.
- **Responsive:** Navigation should work properly on desktop, tablet, and mobile.
- **Fast:** Common activities such as adding products and recording sales should require as few steps as possible.
- **Clear:** Important actions such as **Add Product**, **Add Stock**, and **New Sale** should be easy to find.

---

# 17. Navigation Map to Wireframe Mapping

This document will guide the next project documentation section:

`docs/03_wireframes/`

The initial wireframes should include:

```text
03_wireframes/
├── 00_index.md
├── 01_login.png
├── 02_dashboard.png
├── 03_products.png
├── 04_inventory.png
├── 05_sales.png
├── 06_customers.png
├── 07_reports.png
├── 08_smart_assistant.png
└── 09_settings.png
```

`00_index.md` will explain the purpose, user, main information, and primary action for each ShopTrack screen.