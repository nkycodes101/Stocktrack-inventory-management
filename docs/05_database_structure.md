# ShopTrack

## 05 — Database Structure

**Document:** `docs/05_database_structure.md`  
**Project:** ShopTrack  
**Database:** PostgreSQL  
**Database Name:** `shoptrack_db`  
**Purpose:** Define the database tables, fields, keys, relationships, and business rules required for the ShopTrack MVP.

---

# 1. Database Overview

ShopTrack uses PostgreSQL as its relational database.

The database stores information about:

- Businesses
- Users
- Suppliers
- Products
- Product variants
- Inventory batches
- Inventory
- Stock movements
- Customers
- Sales
- Sale items
- Payments

The database must support the core ShopTrack workflow:

**Business → Product → Inventory → Sale → Stock Update → Reports**

---

# 2. Core Database Tables

The MVP requires the following main tables:

```text
businesses
users
suppliers
products
product_variants
inventory_batches
inventory
stock_movements
customers
sales
sale_items
payments
```

---

# 3. Database Relationship Overview

```text
BUSINESSES
    │
    ├──────── USERS
    │
    ├──────── SUPPLIERS
    │
    ├──────── PRODUCTS
    │             │
    │             └──── PRODUCT_VARIANTS
    │                        │
    │                        ├──── INVENTORY_BATCHES
    │                        │        │
    │                        │        └──── SUPPLIERS
    │                        │
    │                        ├──── INVENTORY
    │                        │
    │                        └──── STOCK_MOVEMENTS
    │
    ├──────── CUSTOMERS
    │
    └──────── SALES
                  │
                  ├──── SALE_ITEMS
                  │        │
                  │        └──── PRODUCT_VARIANTS
                  │
                  └──── PAYMENTS
```

A business owns its operational data.

This is important because ShopTrack may eventually serve multiple businesses from the same application.

---

# 4. Table 1 — Businesses

## Table Name

`businesses`

## Purpose

Stores information about every business registered on ShopTrack.

## Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| id | SERIAL | PK | Unique business ID |
| business_name | VARCHAR(150) | | Business name |
| phone | VARCHAR(30) | | Business phone |
| email | VARCHAR(150) | | Business email |
| address | TEXT | | Business address |
| status | VARCHAR(20) | | active/suspended |
| created_at | TIMESTAMP | | Account creation time |
| updated_at | TIMESTAMP | | Last update |

Example:

```text
id: 1
business_name: Cactus Supplies Agency
phone: 080XXXXXXXX
email: business@example.com
status: active
```

---

# 5. Table 2 — Users

## Table Name

`users`

## Purpose

Stores people who can log into ShopTrack.

## Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| id | SERIAL | PK | User ID |
| business_id | INTEGER | FK | Business user belongs to |
| full_name | VARCHAR(150) | | User's name |
| email | VARCHAR(150) | UNIQUE | Login email |
| password_hash | TEXT | | Hashed password |
| role | VARCHAR(30) | | User role |
| status | VARCHAR(20) | | active/inactive |
| created_at | TIMESTAMP | | Creation time |
| updated_at | TIMESTAMP | | Last update |

Possible roles:

```text
business_owner
inventory_manager
super_admin
```

### Relationship

```text
businesses.id
      ↓
users.business_id
```

A business can have multiple users.

For a Super Admin, `business_id` may be NULL because the Super Admin manages the ShopTrack platform rather than one specific business.

Passwords must never be stored as plain text.

---

# 6. Table 3 — Products

## Table Name

`products`

## Purpose

Stores the general product information.

## Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| id | SERIAL | PK | Product ID |
| business_id | INTEGER | FK | Business that owns product |
| name | VARCHAR(150) | | Product name |
| category | VARCHAR(100) | | Product category |
| description | TEXT | | Optional description |
| created_at | TIMESTAMP | | Creation time |
| updated_at | TIMESTAMP | | Last update |

Example:

```text
Product:
Nivea Lotion

Category:
Adult Lotion
```

### Relationship

```text
businesses
     │
     └──── products
```

---

# 7. Table 4 — Suppliers

## Table Name

`suppliers`

## Purpose

Stores supplier information for products purchased by the business.

## Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| id | SERIAL | PK | Supplier ID |
| business_id | INTEGER | FK | Business that owns the supplier record |
| name | VARCHAR(150) | | Supplier name |
| contact_person | VARCHAR(150) | | Main contact person |
| phone | VARCHAR(30) | | Supplier phone number |
| email | VARCHAR(150) | | Supplier email |
| address | TEXT | | Supplier address |
| notes | TEXT | | Optional notes or purchase remarks |
| created_at | TIMESTAMP | | Creation time |
| updated_at | TIMESTAMP | | Last update |

### Relationship

```text
businesses.id
      ↓
suppliers.business_id
```

A business can have multiple suppliers.

This table supports supplier traceability for incoming inventory and purchasing records.

---

# 8. Table 5 — Product Variants

## Table Name

`product_variants`

## Purpose

Stores different versions, sizes, or types of a product.

Example:

```text
Nivea Lotion
   │
   ├── 200ml
   ├── 400ml
   └── 625ml
```

## Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| id | SERIAL | PK | Variant ID |
| product_id | INTEGER | FK | Parent product |
| variant_name | VARCHAR(100) | | Variant/size |
| sku | VARCHAR(100) | | Product code |
| cost_price | NUMERIC(12,2) | | Purchase cost |
| wholesale_price | NUMERIC(12,2) | | Wholesale selling price |
| retail_price | NUMERIC(12,2) | | Retail selling price |
| low_stock_level | INTEGER | | Low-stock threshold |
| created_at | TIMESTAMP | | Creation time |
| updated_at | TIMESTAMP | | Last update |

### Relationship

```text
products.id
     ↓
product_variants.product_id
```

One product can have multiple variants.

---

# 9. Why Product and Product Variant Are Separate

Instead of storing this:

```text
Nivea 200ml
Nivea 400ml
Nivea 625ml
```

as completely unrelated products, ShopTrack can store:

```text
PRODUCT
Nivea Lotion

       ↓

VARIANTS

200ml
400ml
625ml
```

Each variant can have its own:

- Cost price.
- Wholesale price.
- Retail price.
- Stock quantity.
- SKU.
- Low-stock threshold.

This makes inventory management cleaner.

---

# 10. Table 6 — Inventory Batches

## Table Name

`inventory_batches`

## Purpose

Stores batches of stock received for a product variant.

This allows the business to track multiple lots of the same product, each with its own quantity and expiry date.

Important rule:

A product can have multiple batches with different expiry dates.

Example:

```text
Nivea Lotion

Batch A = 50 units, expires March 2027
Batch B = 100 units, expires August 2027
```

The product itself should not store only one expiry date directly. Instead, expiry is tracked per batch.

## Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| id | SERIAL | PK | Batch ID |
| product_variant_id | INTEGER | FK | Product variant that received the batch |
| supplier_id | INTEGER | FK | Supplier associated with the batch |
| batch_number | VARCHAR(100) | | Supplier or internal batch number |
| quantity | INTEGER | | Quantity in the batch |
| date_received | DATE | | Date the stock arrived |
| expiry_date | DATE | | Expiry date for this batch |
| created_at | TIMESTAMP | | Batch creation time |
| updated_at | TIMESTAMP | | Last update |

### Relationship

```text
product_variants.id
      ↓
inventory_batches.product_variant_id

suppliers.id
      ↓
inventory_batches.supplier_id
```

One product variant can have many batches.

Each batch can represent a different supplier, date received, or expiry date.

---

# 11. Expiry Status Rules

Expiry status should be derived from batch-level expiry dates rather than a single product-level field.

Supported expiry statuses:

- Safe
- Within 6 months
- Within 3 months
- Within 1 month
- Expired

### Example Status Logic

```text
If expiry_date > 6 months away: SAFE
If expiry_date is within 6 months: WITHIN 6 MONTHS
If expiry_date is within 3 months: WITHIN 3 MONTHS
If expiry_date is within 1 month: WITHIN 1 MONTH
If expiry_date is before today: EXPIRED
```

This status should be visible in inventory screens and dashboard alerts so users can act before stock becomes unusable.

---

# 12. Table 7 — Inventory

## Table Name

`inventory`

## Purpose

Stores the current available quantity for each product variant.

## Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| id | SERIAL | PK | Inventory ID |
| variant_id | INTEGER | FK | Product variant |
| quantity | INTEGER | | Current stock |
| updated_at | TIMESTAMP | | Last update |

### Relationship

```text
product_variants.id
        ↓
inventory.variant_id
```

Each variant should normally have one current inventory record.

Example:

```text
Nivea Lotion 400ml

Quantity = 15
Low-stock level = 5

Status = IN STOCK
```

---

# 13. Stock Status

Stock status does not necessarily need to be permanently stored.

It can be calculated from inventory quantity and the low-stock level.

### In Stock

```text
quantity > low_stock_level
```

### Low Stock

```text
quantity > 0
AND
quantity <= low_stock_level
```

### Out of Stock

```text
quantity = 0
```

Example:

```text
Quantity: 20
Threshold: 5

IN STOCK


Quantity: 4
Threshold: 5

LOW STOCK


Quantity: 0

OUT OF STOCK
```

---

# 14. Table 8 — Stock Movements

## Table Name

`stock_movements`

## Purpose

Keeps a history of why inventory quantities changed.

This is different from the `inventory` table.

`inventory` tells us:

**How much stock do we have now?**

`stock_movements` tells us:

**Why did the stock change?**

## Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| id | SERIAL | PK | Movement ID |
| variant_id | INTEGER | FK | Product variant |
| user_id | INTEGER | FK | User responsible |
| movement_type | VARCHAR(30) | | Type of movement |
| quantity | INTEGER | | Quantity moved |
| reference_type | VARCHAR(30) | | Source of movement |
| reference_id | INTEGER | | Related record ID |
| notes | TEXT | | Optional explanation |
| created_at | TIMESTAMP | | Movement time |

Possible movement types:

```text
stock_in
sale
adjustment
return
damage
```

Example:

```text
Nivea 400ml

+20 Stock In
-2 Sale
-1 Damaged

Current quantity = 17
```

---

# 15. Table 9 — Customers

## Table Name

`customers`

## Purpose

Stores basic customer information.

## Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| id | SERIAL | PK | Customer ID |
| business_id | INTEGER | FK | Business |
| name | VARCHAR(150) | | Customer name |
| phone | VARCHAR(30) | | Phone number |
| email | VARCHAR(150) | | Optional email |
| created_at | TIMESTAMP | | Creation time |
| updated_at | TIMESTAMP | | Last update |

Customer information may be optional.

ShopTrack should allow:

```text
Walk-in Customer
```

without requiring a customer record for every sale.

---

# 16. Table 10 — Sales

## Table Name

`sales`

## Purpose

Stores the main information about each completed sale.

## Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| id | SERIAL | PK | Sale ID |
| business_id | INTEGER | FK | Business |
| customer_id | INTEGER | FK | Customer, optional |
| user_id | INTEGER | FK | User who processed sale |
| sale_number | VARCHAR(50) | UNIQUE | Receipt/reference number |
| total_amount | NUMERIC(12,2) | | Total sale value |
| amount_paid | NUMERIC(12,2) | | Amount customer paid |
| balance | NUMERIC(12,2) | | Outstanding amount |
| payment_status | VARCHAR(20) | | paid/partial/unpaid |
| sale_status | VARCHAR(20) | | completed/held/cancelled |
| created_at | TIMESTAMP | | Sale time |

Example:

```text
Sale Number:
ST-000001

Total:
₦15,000

Amount Paid:
₦10,000

Balance:
₦5,000

Payment Status:
PARTIAL
```

---

# 14. Table 9 — Sale Items

## Table Name

`sale_items`

## Purpose

Stores every product included in a sale.

One sale may contain several products.

Example:

```text
SALE ST-000001

2 × Nivea Lotion
1 × Dove Spray
3 × Pears Oil
```

## Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| id | SERIAL | PK | Sale item ID |
| sale_id | INTEGER | FK | Parent sale |
| variant_id | INTEGER | FK | Product sold |
| quantity | INTEGER | | Quantity sold |
| unit_price | NUMERIC(12,2) | | Selling price |
| unit_cost | NUMERIC(12,2) | | Cost at time of sale |
| subtotal | NUMERIC(12,2) | | Quantity × price |

### Relationship

```text
sales
  │
  └──── sale_items
             │
             └──── product_variants
```

---

# 15. Why Store Unit Cost and Unit Price in Sale Items?

Product prices can change later.

For example:

```text
January

Cost Price = ₦3,000
Retail Price = ₦4,000


March

Cost Price = ₦3,500
Retail Price = ₦4,500
```

An old January sale should not suddenly use March's prices.

Therefore, ShopTrack records the price and cost **at the moment the sale occurs**.

This also helps calculate historical profit correctly.

---

# 16. Table 10 — Payments

## Table Name

`payments`

## Purpose

Stores payment information associated with sales.

## Fields

| Field | Data Type | Key | Description |
|---|---|---|---|
| id | SERIAL | PK | Payment ID |
| sale_id | INTEGER | FK | Related sale |
| payment_method | VARCHAR(30) | | Payment method |
| amount | NUMERIC(12,2) | | Amount paid |
| reference | VARCHAR(100) | | Transfer/POS reference |
| created_at | TIMESTAMP | | Payment time |

Possible payment methods:

```text
cash
transfer
pos
credit
```

Separating payments from sales makes it possible to support multiple payments against the same sale later.

Example:

```text
Sale Total
₦20,000

Payment 1
Cash = ₦5,000

Payment 2
Transfer = ₦15,000
```

---

# 17. Complete Database Relationship

```text
                        BUSINESSES
                             │
           ┌─────────────────┼───────────────────┐
           │                 │                   │
           ▼                 ▼                   ▼
         USERS            PRODUCTS           CUSTOMERS
                              │
                              ▼
                      PRODUCT_VARIANTS
                              │
                   ┌──────────┼──────────┐
                   │          │          │
                   ▼          ▼          │
               INVENTORY   STOCK         │
                           MOVEMENTS      │
                                         │
                                         │
BUSINESSES ───────────────► SALES         │
                              │           │
                       ┌──────┴──────┐    │
                       ▼             ▼    │
                  SALE_ITEMS      PAYMENTS│
                       │                  │
                       └──────────────────┘
                              │
                              ▼
                      PRODUCT_VARIANTS
```

---

# 18. Simplified Relationship Types

```text
Business
1 ─────── Many Users

Business
1 ─────── Many Products

Business
1 ─────── Many Customers

Business
1 ─────── Many Sales


Product
1 ─────── Many Product Variants


Product Variant
1 ─────── 1 Inventory


Product Variant
1 ─────── Many Stock Movements


Sale
1 ─────── Many Sale Items


Sale
1 ─────── Many Payments


Customer
1 ─────── Many Sales
```

---

# 19. Sales Transaction Flow

When the user clicks:

**COMPLETE SALE**

the backend should perform the following operation:

```text
START TRANSACTION
       ↓
Create Sale
       ↓
Create Sale Items
       ↓
Create Payment
       ↓
Reduce Inventory
       ↓
Create Stock Movement
       ↓
COMMIT TRANSACTION
```

If one important operation fails:

```text
ROLLBACK
```

This prevents ShopTrack from recording a sale without correctly updating inventory.

---

# 20. Example Sale

Suppose a customer buys:

```text
2 × Nivea Lotion

Retail Price = ₦4,500

Cost Price = ₦3,500
```

Calculation:

```text
Sale Revenue

2 × ₦4,500
= ₦9,000


Cost

2 × ₦3,500
= ₦7,000


Gross Profit

₦9,000 - ₦7,000
= ₦2,000
```

ShopTrack can calculate this from `sale_items`.

---

# 21. Low-Stock Logic

Suppose:

```text
Product:
Nivea Lotion 400ml

Current quantity:
5

Low-stock level:
5
```

ShopTrack should identify the product as:

```text
LOW STOCK
```

If quantity becomes:

```text
0
```

the status becomes:

```text
OUT OF STOCK
```

---

# 22. Dashboard Data Sources

The dashboard does not require a separate table for most MVP information.

It can calculate information from existing tables.

Example:

```text
Total Products
      ↓
products


Current Stock
      ↓
inventory


Low Stock
      ↓
inventory + product_variants


Today's Sales
      ↓
sales


Revenue
      ↓
sales


Profit
      ↓
sale_items


Recent Sales
      ↓
sales + sale_items
```

---

# 23. Reports Data Sources

Reports will mainly use:

```text
sales
sale_items
payments
inventory
products
product_variants
stock_movements
```

Examples:

### Sales Report

```text
sales
+
sale_items
```

### Inventory Report

```text
products
+
product_variants
+
inventory
```

### Profit Report

```text
sale_items.unit_price
-
sale_items.unit_cost
```

### Payment Report

```text
payments
```

---

# 24. Multi-Business Data Protection

Because ShopTrack may contain several businesses, one business must never see another business's information.

For example:

```text
Business A
    ↓
Products A
Sales A
Customers A


Business B
    ↓
Products B
Sales B
Customers B
```

The backend must always verify the logged-in user's `business_id` before retrieving or changing business data.

---

# 25. Important Database Constraints

The database should enforce basic rules.

Examples:

### Quantity

```text
quantity >= 0
```

### Prices

```text
cost_price >= 0

wholesale_price >= 0

retail_price >= 0
```

### Sale Quantity

```text
quantity > 0
```

### Payment

```text
amount >= 0
```

### Low-Stock Level

```text
low_stock_level >= 0
```

---

# 26. Primary Keys

Every main table should have its own unique primary key.

Example:

```text
businesses.id

users.id

products.id

product_variants.id

inventory.id

stock_movements.id

customers.id

sales.id

sale_items.id

payments.id
```

---

# 27. Foreign Keys

Important foreign-key relationships include:

```text
users.business_id
        ↓
businesses.id


products.business_id
        ↓
businesses.id


product_variants.product_id
        ↓
products.id


inventory.variant_id
        ↓
product_variants.id


stock_movements.variant_id
        ↓
product_variants.id


stock_movements.user_id
        ↓
users.id


customers.business_id
        ↓
businesses.id


sales.business_id
        ↓
businesses.id


sales.customer_id
        ↓
customers.id


sales.user_id
        ↓
users.id


sale_items.sale_id
        ↓
sales.id


sale_items.variant_id
        ↓
product_variants.id


payments.sale_id
        ↓
sales.id
```

---

# 28. Indexes

Indexes should be added to fields that will frequently be searched or used in relationships.

Important examples include:

```text
users.email

users.business_id

products.business_id

products.name

product_variants.product_id

product_variants.sku

customers.business_id

customers.phone

sales.business_id

sales.created_at

sale_items.sale_id

inventory.variant_id
```

Indexes improve database search performance as ShopTrack grows.

---

# 29. Data That Should Not Be Duplicated

Avoid unnecessarily storing the same information in several places.

For example:

Do not repeatedly store:

```text
business_name
```

inside every product.

Instead:

```text
product.business_id
        ↓
businesses.id
```

Do not repeatedly store product names in sale items.

Instead:

```text
sale_items.variant_id
        ↓
product_variants
        ↓
products
```

However, historical sale prices and costs should be stored in `sale_items` because those values must remain unchanged even when current product prices change.

---

# 30. MVP Database Tables Summary

| Table | Main Purpose |
|---|---|
| businesses | Business accounts |
| users | Login users and roles |
| products | General product information |
| product_variants | Size/variant and pricing |
| inventory | Current stock quantity |
| stock_movements | Inventory history |
| customers | Customer information |
| sales | Sales transactions |
| sale_items | Products contained in each sale |
| payments | Sale payments |

Total core MVP tables:

**10 tables**

---

# 31. MVP Database Flow

The most important database workflow is:

```text
BUSINESS
   ↓
USER
   ↓
PRODUCT
   ↓
PRODUCT VARIANT
   ↓
INVENTORY
   ↓
SALE
   ↓
SALE ITEMS
   ↓
PAYMENT
   ↓
STOCK MOVEMENT
   ↓
UPDATED INVENTORY
```

---

# 32. Recommended Database Folder

The documentation file remains:

```text
docs/
└── 05_database_structure.md
```

The actual SQL files should go into the project root `database/` folder:

```text
database/
│
├── 01_create_tables.sql
├── 02_constraints.sql
├── 03_indexes.sql
├── 04_seed_data.sql
└── 05_test_queries.sql
```

The difference is:

```text
docs/05_database_structure.md
        ↓
DESIGNS and EXPLAINS the database


database/
        ↓
CONTAINS the SQL that actually creates it
```

---

# 33. Final MVP Database Architecture

```text
                   SHOPTRACK
                       │
                       ▼
                  businesses
                       │
       ┌───────────────┼──────────────┐
       ▼               ▼              ▼
     users          products       customers
                       │              │
                       ▼              │
               product_variants      │
                  │         │         │
                  ▼         ▼         │
             inventory   stock       │
                         movements    │
                                      │
                       sales ◄────────┘
                         │
                  ┌──────┴──────┐
                  ▼             ▼
              sale_items     payments
                  │
                  ▼
          product_variants
```

This structure provides the database foundation required for the ShopTrack MVP while leaving room for the application to grow later.