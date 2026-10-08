# ShopTrack

## 03 — Wireframes

**Document:** `docs/03_wireframes/00_index.md`  
**Project:** ShopTrack  
**Purpose:** Define the screens, layout, content, actions, and navigation required before frontend development begins.

---

# 1. Wireframe Purpose

The ShopTrack wireframes provide a visual plan for the application's user interface before frontend coding begins.

The wireframes define:

- What screens are required.
- What information appears on each screen.
- Where important elements should appear.
- What actions users can perform.
- How screens connect to the navigation map.
- Which role can access each screen.

These wireframes are **low-fidelity designs**. They focus on structure and functionality rather than final colors, fonts, animations, or branding.

---

# 2. Wireframe Files

The wireframe folder should contain:

```text
03_wireframes/
│
├── 00_index.md
├── 01_login.png
├── 02_dashboard.png
├── 03_products.png
├── 04_inventory.png
├── 05_suppliers.png
├── 06_sales.png
├── 07_customers.png
├── 08_reports.png
├── 09_smart_assistant.png
└── 10_settings.png
```

---

# 3. Common Application Layout

After login, the main ShopTrack screens should use a consistent application layout.

```text
┌─────────────────────────────────────────────────────────────┐
│ ShopTrack                         Search     User/Profile    │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│ Dashboard    │                                              │
│ Products     │                                              │
│ Inventory    │              MAIN CONTENT                    │
│ Sales        │                                              │
│ Customers    │                                              │
│ Reports      │                                              │
│ Assistant    │                                              │
│ Settings     │                                              │
│              │                                              │
│ Logout       │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### Main Layout Components

**Sidebar**

Contains the main navigation.

**Top Bar**

Contains:

- ShopTrack/business name.
- Search.
- Notifications.
- Logged-in user.
- User profile.

**Main Content Area**

Changes depending on the selected screen.

---

# 4. Screen 01 — Login

**Filename:** `01_login.png`

**Users:**

- Business Owner
- Inventory Manager
- Super Admin

### Purpose

Allow registered users to securely access ShopTrack.

### Information Required

- ShopTrack logo/name.
- Email address.
- Password.
- Login button.
- Forgot password link.
- Create account link for new Business Owners.

### Primary Action

**Login**

### Wireframe

```text
┌──────────────────────────────────────┐
│                                      │
│              SHOPTRACK               │
│                                      │
│      Manage your business smarter    │
│                                      │
│  Email                               │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  Password                            │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  Forgot Password?                    │
│                                      │
│  ┌────────────────────────────────┐  │
│  │             LOGIN              │  │
│  └────────────────────────────────┘  │
│                                      │
│  New business? Create Account        │
│                                      │
└──────────────────────────────────────┘
```

### Next Screen

`Dashboard`

---

# 5. Screen 02 — Dashboard

**Filename:** `02_dashboard.png`

**Primary User:** Business Owner

**Secondary User:** Inventory Manager with limited information.

### Purpose

Give the user a quick overview of business performance and inventory status.

### Main Information

- Total products.
- Total stock.
- Low-stock products.
- Out-of-stock products.
- Expiring soon items.
- Expired products.
- Today's sales.
- Revenue.
- Estimated profit/loss.
- Recent sales.
- Stock alerts.
- Expiry alerts.
- Sales chart.

### Primary Actions

- New Sale.
- Add Product.
- Add Stock.

### Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ ShopTrack                   Search          🔔 User          │
├────────────┬─────────────────────────────────────────────────┤
│ Dashboard  │ Dashboard                                       │
│ Products   │                                                 │
│ Inventory  │ [Products] [Stock] [Low Stock] [Today's Sales] │
│ Sales      │                                                 │
│ Customers  │ ┌──────────────────┐ ┌───────────────────────┐ │
│ Reports    │ │   SALES GRAPH    │ │    STOCK STATUS       │ │
│ Assistant  │ │                  │ │                       │ │
│ Settings   │ └──────────────────┘ └───────────────────────┘ │
│            │                                                 │
│            │ Recent Sales                                    │
│            │ ┌─────────────────────────────────────────────┐ │
│            │ │ Product | Qty | Amount | Payment | Time    │ │
│            │ └─────────────────────────────────────────────┘ │
│            │                                                 │
│ Logout     │ [+ Add Product] [+ Add Stock] [New Sale]       │
└────────────┴─────────────────────────────────────────────────┘
```

---

# 6. Screen 03 — Products

**Filename:** `03_products.png`

**Users:**

- Business Owner
- Inventory Manager

### Purpose

Manage all products sold by the business.

### Information Displayed

- Product name.
- Category.
- Variant.
- Cost price.
- Wholesale price.
- Retail price.
- Quantity.
- Stock status.
- Batch Number.
- Supplier.
- Date Received.
- Expiry Date.
- Expiry Status.
- Actions.

### Stock Status

- In Stock
- Low Stock
- Out of Stock
- Safe
- Within 6 Months
- Within 3 Months
- Within 1 Month
- Expired

### Primary Action

**Add Product**

### Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Products                                      [+ Add Product]│
│                                                              │
│ Search Product [____________]   Category [▼]   Status [▼]   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Product │Variant│Cost│Wholesale│Retail│Qty│Status│ Action   │
├──────────────────────────────────────────────────────────────┤
│ Dove    │ Big   │    │         │      │20 │Stock │ Edit     │
│ Nivea   │ Small │    │         │      │ 5 │ Low  │ Edit     │
│ Pears   │Medium │    │         │      │ 0 │ Out  │ Edit     │
└──────────────────────────────────────────────────────────────┘
```

### Add Product Form

Should contain:

- Product name.
- Category.
- Variant.
- SKU/code where applicable.
- Cost price.
- Wholesale price.
- Retail price.
- Opening quantity.
- Low-stock threshold.

---

# 7. Screen 04 — Inventory

**Filename:** `04_inventory.png`

**Users:**

- Business Owner
- Inventory Manager

### Purpose

Monitor and update stock quantities.

### Information Displayed

- Product.
- Variant.
- Current quantity.
- Low-stock level.
- Stock status.
- Last updated.
- Stock action.

### Primary Actions

- Add Stock.
- Adjust Stock.
- View Stock Movement.
- View Batch Details.
- Filter by Expiring Soon.
- Filter by Expired.

### Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Inventory                                      [+ Add Stock] │
│                                                              │
│ Search [____________]    Status [All ▼]                      │
│                                                              │
│ [All Stock] [Low Stock] [Out of Stock] [Expiring Soon] [Expired] │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Product │ Variant │ Batch │ Supplier │ Expiry │ Status │ Action │
├──────────────────────────────────────────────────────────────┤
│ Dove    │ Big     │    20    │ Stock  │ Today   │ Adjust    │
│ Nivea   │ Small   │     5    │ Low    │ Today   │ Adjust    │
│ Pears   │ Medium  │     0    │ Out    │ Today   │ Restock   │
└──────────────────────────────────────────────────────────────┘
```

---

# 7.1 Screen — Suppliers

**Filename:** `05_suppliers.png`

**Users:**

- Business Owner
- Inventory Manager

### Purpose

Maintain supplier records and track where inventory was purchased from.

### Information Displayed

- Supplier name.
- Contact person.
- Phone number.
- Email address.
- Address.
- Notes.
- Supplier history or products supplied.

### Primary Actions

- Add Supplier.
- Edit Supplier.
- View Supplier Details.

### Supplier Form Fields

- Supplier Name
- Contact Person
- Phone
- Email
- Address
- Notes

This screen should support supplier management for product traceability and purchasing records.

---

# 8. Screen 05 — Sales

**Filename:** `05_sales.png`

**Users:**

- Business Owner
- Authorized Inventory Manager/Sales Staff

### Purpose

Allow the user to quickly record customer purchases.

### Main Sections

1. Product Search
2. Shopping Cart
3. Customer
4. Payment
5. Sale Actions

### Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ NEW SALE                                                     │
│                                                              │
│ Find Product                                                 │
│ [ Search product........................ ]                   │
│                                                              │
├─────────────────────────────┬────────────────────────────────┤
│ PRODUCTS                    │ CART                           │
│                             │                                │
│ Dove Lotion       [+]       │ Dove Lotion   x2    ₦_____   │
│ Nivea Lotion      [+]       │ Pears Oil     x1    ₦_____   │
│ Pears Oil         [+]       │                                │
│                             │ TOTAL:              ₦_____    │
├─────────────────────────────┴────────────────────────────────┤
│ CUSTOMER                                                     │
│ Name [________________] Phone [________________]             │
│ [+ Add Customer]                                             │
│                                                              │
│ PAYMENT                                                      │
│ [Cash] [Transfer] [POS] [Credit/Owe]                        │
│                                                              │
│ Amount Paid: ₦________________                               │
│                                                              │
│ [Hold Sale] [Receipt]          [ COMPLETE SALE ]             │
└──────────────────────────────────────────────────────────────┘
```

### Smart Sales Features

The screen should support:

- Product search.
- Cart.
- Quantity adjustment.
- Remove item.
- Customer details.
- Payment method.
- Amount paid.
- Credit/owing.
- Hold sale.
- Complete sale.
- Receipt.
- Low-stock warning.
- Sales history.

Completing the sale must automatically reduce inventory.

---

# 9. Screen 06 — Customers

**Filename:** `06_customers.png`

**Users:**

- Business Owner
- Authorized staff

### Purpose

Maintain basic customer information.

### Information Displayed

- Customer name.
- Phone number.
- Number of purchases.
- Amount owed where applicable.
- Last purchase.

### Primary Action

**Add Customer**

### Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Customers                                    [+ Add Customer]│
│                                                              │
│ Search Customer [________________________]                   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Name │ Phone │ Purchases │ Amount Owed │ Last Purchase     │
├──────────────────────────────────────────────────────────────┤
│      │       │           │             │                   │
│      │       │           │             │                   │
└──────────────────────────────────────────────────────────────┘
```

Selecting a customer should open their basic details and purchase history.

---

# 10. Screen 07 — Reports

**Filename:** `07_reports.png`

**Primary User:** Business Owner

### Purpose

Help the Business Owner understand business performance.

### Report Information

- Total sales.
- Revenue.
- Estimated profit.
- Inventory value.
- Low-stock count.
- Out-of-stock count.
- Best-selling products.
- Sales trend.

### Filters

- Today.
- This week.
- This month.
- Custom date.

### Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Reports                                                      │
│                                                              │
│ [Today] [Week] [Month] [Custom Date]                        │
│                                                              │
│ [Revenue]     [Sales]       [Profit]       [Stock Value]    │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │                     SALES GRAPH                          │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────┐ ┌───────────────────────────────┐ │
│ │ BEST SELLING PRODUCTS  │ │ INVENTORY STATUS              │ │
│ │                        │ │                               │ │
│ └────────────────────────┘ └───────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

# 11. Screen 08 — Smart Assistant

**Filename:** `08_smart_assistant.png`

**Primary User:** Business Owner

### Purpose

Allow the Business Owner to ask simple questions about ShopTrack business data.

### Example Questions

- What were my sales today?
- Which products are running low?
- Which products are out of stock?
- What is my best-selling product?
- What is my estimated profit?
- What products should I consider restocking?

### Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Smart Assistant                                              │
│                                                              │
│ Ask ShopTrack about your business                            │
│                                                              │
│ Suggested Questions                                          │
│                                                              │
│ [What are my sales today?]                                  │
│ [Show low-stock products]                                   │
│ [What is my best-selling product?]                          │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Assistant response appears here...                      │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Ask a question...                                           │
│ [______________________________________________] [Send]      │
└──────────────────────────────────────────────────────────────┘
```

The assistant must only access information the logged-in user is permitted to view.

---

# 12. Screen 09 — Settings

**Filename:** `09_settings.png`

**Primary User:** Business Owner

### Purpose

Manage the business account and application preferences.

### Settings Sections

- Business Profile.
- User Account.
- Staff/User Management.
- Permissions.
- Low-stock settings.
- Receipt information.
- Security.

### Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Settings                                                     │
│                                                              │
├───────────────────┬──────────────────────────────────────────┤
│ Business Profile  │ BUSINESS INFORMATION                     │
│ Account           │                                          │
│ Users             │ Business Name [____________________]     │
│ Permissions       │ Phone         [____________________]     │
│ Stock Settings    │ Email         [____________________]     │
│ Receipt Settings  │ Address       [____________________]     │
│ Security          │                                          │
│                   │               [ Save Changes ]           │
└───────────────────┴──────────────────────────────────────────┘
```

---

# 13. Super Admin Wireframes

The Super Admin interface is separate from the normal business interface.

The MVP should eventually include:

- Admin Login.
- Admin Dashboard.
- Business Management.
- User Management.
- System Activity.
- System Settings.

These can be designed separately once the core Business Owner/Inventory Manager workflow has been completed.

---

# 14. Screen Priority

The frontend team should build the screens in approximately this order:

**Login → Dashboard → Products → Inventory → Sales → Customers → Reports → Settings → Smart Assistant**

The most important working flow is:

```text
Login
   ↓
Dashboard
   ↓
Add Product
   ↓
Inventory
   ↓
New Sale
   ↓
Complete Sale
   ↓
Stock Automatically Reduces
   ↓
Dashboard / Reports
```

---

# 15. Responsive Requirements

Every ShopTrack screen should work on:

- Desktop.
- Tablet.
- Mobile phone.

### Desktop

Use a visible sidebar and full content area.

### Tablet

The sidebar may collapse.

### Mobile

Use a collapsible navigation menu and stack cards/forms vertically.

Tables may require simplified columns or horizontal scrolling on smaller screens.

---

# 16. Wireframe Design Rules

When converting these wireframes into the frontend:

1. Keep navigation consistent.
2. Make important buttons easy to find.
3. Avoid overcrowded screens.
4. Use clear labels.
5. Keep forms simple.
6. Show confirmation after important actions.
7. Clearly distinguish In Stock, Low Stock, and Out of Stock.
8. Make the Sales screen fast to operate.
9. Protect screens according to user roles.
10. Design mobile responsiveness from the beginning.

---

# 17. Relationship to Other Documents

The wireframes are based on:

`01_problem_usecases_user_stories.md`

and:

`02_navigation_map.md`

They will guide:

`04_tech_stack.md`

and ultimately the implementation inside:

```text
frontend/
backend/
database/
```

The wireframes define **what the user sees and does**.

The frontend implements those screens.

The backend provides the business logic.

The database stores the information.