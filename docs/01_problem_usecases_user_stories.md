# ShopTrack

## 01 — Problem, Use Cases \& User Stories

**Document:** `docs/01_problem_usecases_user_stories.md`  
**Project:** ShopTrack  
**Product Type:** Inventory and Sales Management Web Application  
**Target Users:** Small and growing businesses

---

# 1\. Problem Statement

Many small and growing businesses struggle to maintain accurate records of their products, inventory, and sales.

Manual records, notebooks, spreadsheets, or disconnected systems can make it difficult for business owners to know:

- What products are currently available.
- How much stock is remaining.
- Which products are running low or out of stock.
- What products have been sold.
- How much revenue the business has generated.
- Which products are performing well.
- Whether the business is making a profit or loss.

ShopTrack solves this problem by providing one simple web application where businesses can manage products, monitor inventory, record sales, receive stock alerts, and view useful business information from a dashboard.

---

# 2\. Solution Summary

ShopTrack is a web-based inventory and sales management application designed to help small and growing businesses manage their daily operations.

The system provides:

- Product management.
- Product variants.
- Inventory tracking.
- Cost, wholesale, and retail pricing.
- Sales recording.
- Customer records.
- Multiple payment methods.
- Credit/owing sales tracking.
- Low-stock and out-of-stock alerts.
- Sales history.
- Basic reports.
- Profit and loss information.
- Inventory and sales dashboard.
- Search and filtering.
- Smart business insights.

The goal of the MVP is to provide the essential tools required to answer four important business questions:

**What do I have?**

**What am I running out of?**

**What have I sold?**

**How is my business performing?**

---

# 3\. User Roles

ShopTrack has three main system roles:

## 3.1 Business Owner

The Business Owner has overall control of the business account.

For a **small business**, the Business Owner may also perform the duties of the Inventory Manager.

For a **larger business**, the Business Owner can assign inventory management responsibilities to an Inventory Manager.

---

## 3.2 Inventory Manager

The Inventory Manager manages products and stock on behalf of the Business Owner.

This role is especially useful for larger businesses where the owner does not personally manage daily inventory activities.

Access should be limited according to permissions provided by the Business Owner.

---

## 3.3 Super Admin

The Super Admin manages the ShopTrack platform itself.

The Super Admin is not responsible for the daily inventory or sales operations of individual businesses.

---

# 4\. Use Cases

## 4.1 Small Business Use Cases

### Business Owner / Inventory Manager

For a small business, one person may perform both roles.

The user can:

- Register a ShopTrack account.
- Log in and log out.
- Create a business profile.
- View the dashboard.
- Add products.
- Edit products.
- Search and filter products.
- Add product variants such as small, medium, and large.
- Record cost price.
- Record wholesale price.
- Record retail price.
- Manage suppliers.
- Record supplier information.
- View supplier details and supplier history.
- Record product batches.
- Record batch numbers.
- Record product expiry dates.
- View products approaching expiry.
- View expired products.
- Receive expiry warnings.
- Enter opening stock quantity.
- Add new stock.
- Update inventory quantities.
- View available stock.
- Identify low-stock products.
- Identify out-of-stock products.
- Record sales.
- Add products to a sales cart.
- Calculate the total amount payable.
- Record customer name and phone number.
- Save customer information.
- Select payment methods.
- Record cash payments.
- Record bank transfers.
- Record POS payments.
- Record credit/owing transactions.
- Record amount paid.
- Complete a sale.
- Generate a receipt.
- View sales history.
- View basic sales reports.
- View stock reports.
- View profit and loss information.
- Receive low-stock warnings.
- Receive expiry warnings.
- Use the Smart Assistant for basic business insights.

---

# 4.2 Large Business Use Cases

## Business Owner

The Business Owner can:

- Register and manage the business account.
- View the business dashboard.
- View inventory summaries.
- View sales summaries.
- View revenue information.
- View profit and loss information.
- View low-stock alerts.
- View out-of-stock products.
- View sales history.
- View reports.
- Search and filter business information.
- Create or manage Inventory Manager accounts.
- Control staff permissions.
- Manage business settings.
- Use the Smart Assistant to obtain business insights.

---

## Inventory Manager

The Inventory Manager can:

- Log in to the assigned business.
- View permitted dashboard information.
- Add products.
- Edit product information.
- Add product variants.
- Record cost, wholesale, and retail prices where permitted.
- Record incoming stock.
- Update stock quantities.
- Search and filter inventory.
- Monitor stock movement.
- Identify low-stock products.
- Identify out-of-stock products.
- Record sales where permission is provided.
- View inventory-related reports.
- Maintain accurate inventory records.

The Inventory Manager cannot access restricted administrative functions unless permission is explicitly granted.

---

# 4.3 Super Admin Use Cases

The Super Admin can:

- Log in to the ShopTrack administration system.
- View registered businesses.
- View registered users.
- Manage business accounts.
- Manage user accounts.
- Manage system roles.
- Activate or suspend accounts.
- Monitor application activity.
- Monitor system errors.
- Manage application-wide settings.
- Maintain the ShopTrack platform.

---

# 5\. User Stories

## 5.1 Business Owner User Stories

### Account

**US-BO-01**  
As a Business Owner, I want to create an account so that I can use ShopTrack to manage my business.

**US-BO-02**  
As a Business Owner, I want to log in securely so that unauthorized users cannot access my business information.

### Products

**US-BO-03**  
As a Business Owner, I want to add products so that I can maintain a digital record of my inventory.

**US-BO-04**  
As a Business Owner, I want to edit product information so that my records remain accurate.

**US-BO-05**  
As a Business Owner, I want to create product variants such as small, medium, and large so that different versions of the same product can be tracked.

**US-BO-06**  
As a Business Owner, I want to record cost, wholesale, and retail prices so that I can manage pricing and calculate profit.

**US-BO-06A**  
As a Business Owner, I want to manage suppliers so that I can keep track of who supplies my inventory.

**US-BO-06B**  
As a Business Owner, I want to record supplier information so that I can contact suppliers and maintain a reliable purchasing record.

### Inventory

**US-BO-07**  
As a Business Owner, I want to see available stock quantities so that I know what products I currently have.

**US-BO-08**  
As a Business Owner, I want to receive low-stock warnings so that I can replenish products before they run out.

**US-BO-09**  
As a Business Owner, I want out-of-stock products to be clearly identified so that I know what needs urgent restocking.

**US-BO-09A**  
As a Business Owner, I want to record product batches and expiry dates so that stock can be tracked accurately by lot and shelf life.

**US-BO-09B**  
As a Business Owner, I want to view products approaching expiry so that I can sell, rotate, or remove items before they become unusable.

**US-BO-09C**  
As a Business Owner, I want to view expired products so that I can manage losses and take corrective action.

**US-BO-09D**  
As a Business Owner, I want expiry warnings so that I can act before products become unsafe or unsellable.

### Sales

**US-BO-10**  
As a Business Owner, I want to record a sale so that ShopTrack automatically updates my sales and inventory records.

**US-BO-11**  
As a Business Owner, I want to add several products to a sales cart so that I can process a customer's purchase in one transaction.

**US-BO-12**  
As a Business Owner, I want ShopTrack to calculate the total amount payable so that sales totals are accurate.

**US-BO-13**  
As a Business Owner, I want to record cash, transfer, POS, or credit payments so that I can track how customers pay.

**US-BO-14**  
As a Business Owner, I want to record the amount paid by a customer so that I can identify outstanding balances.

**US-BO-15**  
As a Business Owner, I want to generate a receipt after completing a sale so that the customer has proof of purchase.

### Customers

**US-BO-16**  
As a Business Owner, I want to save a customer's name and phone number so that I can maintain basic customer records and issue receipts.

### Reports

**US-BO-17**  
As a Business Owner, I want to view sales reports so that I can understand how my business is performing.

**US-BO-18**  
As a Business Owner, I want to view profit and loss information so that I can understand the financial performance of my sales.

**US-BO-19**  
As a Business Owner, I want to view graphical summaries of sales and inventory so that I can understand business performance quickly.

### Management

**US-BO-20**  
As a Business Owner of a larger business, I want to create an Inventory Manager account so that another person can manage stock without having full control of my business account.

---

# 5.2 Inventory Manager User Stories

**US-IM-01**  
As an Inventory Manager, I want to log in to my assigned business so that I can perform my inventory duties.

**US-IM-02**  
As an Inventory Manager, I want to add products so that new stock can be recorded.

**US-IM-03**  
As an Inventory Manager, I want to edit product information so that incorrect information can be corrected.

**US-IM-04**  
As an Inventory Manager, I want to add product variants so that different sizes or versions can be tracked separately.

**US-IM-05**  
As an Inventory Manager, I want to record incoming stock so that inventory quantities remain accurate.

**US-IM-06**  
As an Inventory Manager, I want to search for products so that I can quickly find inventory information.

**US-IM-07**  
As an Inventory Manager, I want to see low-stock products so that I can notify the Business Owner or replenish them.

**US-IM-08**  
As an Inventory Manager, I want to identify out-of-stock products so that urgent restocking can be arranged.

**US-IM-09**  
As an Inventory Manager, I want to view stock movement so that I can understand how inventory quantities change.

**US-IM-10**  
As an Inventory Manager, I want my access to be limited by permissions so that sensitive business functions remain under the Business Owner's control.

**US-IM-11**  
As an Inventory Manager, I want to record supplier details and batch information so that incoming stock can be tracked accurately.

**US-IM-12**  
As an Inventory Manager, I want to view products that are expiring soon or already expired so that I can prioritize stock checks and reduce waste.

---

# 5.3 Super Admin User Stories

**US-SA-01**  
As a Super Admin, I want to view registered businesses so that I can manage businesses using ShopTrack.

**US-SA-02**  
As a Super Admin, I want to view and manage user accounts so that I can maintain platform access.

**US-SA-03**  
As a Super Admin, I want to activate or suspend accounts so that I can control access when necessary.

**US-SA-04**  
As a Super Admin, I want to manage system roles so that users have appropriate permissions.

**US-SA-05**  
As a Super Admin, I want to monitor application activity so that I can identify problems affecting users.

**US-SA-06**  
As a Super Admin, I want to monitor system errors so that technical problems can be identified and resolved.

**US-SA-07**  
As a Super Admin, I want to manage application-wide settings so that ShopTrack can be maintained centrally.

---

# 6\.  MVP Functional Requirement

1. user authentication/login
2. Role-based access
3. Add and manage products
4. Manage product variants
5. Record inventory quantities
6. Record cost, wholesale and retail prices
7. Manage suppliers
8. Record supplier information
9. Track product batches
10. Track expiry dates
11. Display stock status
12. search and filter products
13. Record sales
14. Shopping cart functionality
15. Customer information
16. multiple payment methods
17. Generate payment
18. Low-stock alert
19. Out-of-stock alerts
20. Expiry warnings for products approaching expiry
21. View products with expiring soon and expired status
22. Inventory and sales dashboard
23. Basic sales reports
24. Inventory reports
25. Estimated profit/loss reporting 

---
# 7\. Explicitly Out of Scope for MVP

To keep the first version achievable, the following features are **not part of the initial ShopTrack MVP**:

- Native Android application.
- Native iOS application.
- Full accounting system.
- Payroll management.
- Employee attendance management.
- Advanced CRM.
- E-commerce marketplace.
- Supplier marketplace.
- Automatic supplier purchasing.
- Multi-country taxation.
- Multi-currency accounting.
- Advanced warehouse management.
- Complex multi-branch management.
- Advanced barcode hardware integration.
- Advanced AI demand forecasting.
- Automatic AI purchasing decisions.
- Enterprise ERP integrations.
- Complex third-party integrations.
- Advanced audit/compliance systems.
- Fully synchronized offline operation across multiple devices.

These features can be considered after the MVP has been built, tested, and validated.

---

# 

# 8/. MVP Success Criteria

The ShopTrack MVP will be considered functional when a Business Owner can:

1. Log in.
2. Add a product.
3. Add its price and quantity.
4. Manage supplier information.
5. Record a product batch with a supplier, date received, and expiry date.
6. View the product in inventory.
7. Record a sale.
8. Have the sold quantity deducted from stock.
9. See a low-stock warning when appropriate.
10. See an expiry warning for products approaching expiry.
11. View expiring soon and expired products in inventory.
12. View the completed sale in sales history.
13. View basic sales and inventory information on the dashboard.

This represents the core ShopTrack workflow:

**Product → Supplier & Batch → Inventory → Sale → Stock Update → Dashboard/Reports**

# &#32;

---

# 7\. Explicitly Out of Scope for MVP

To keep the first version achievable, the following features are **not part of the initial ShopTrack MVP**:

- Native Android application.
- Native iOS application.
- Full accounting system.
- Payroll management.
- Employee attendance management.
- Advanced CRM.
- E-commerce marketplace.
- Supplier marketplace.
- Automatic supplier purchasing.
- Multi-country taxation.
- Multi-currency accounting.
- Advanced warehouse management.
- Complex multi-branch management.
- Advanced barcode hardware integration.
- Advanced AI demand forecasting.
- Automatic AI purchasing decisions.
- Enterprise ERP integrations.
- Complex third-party integrations.
- Advanced audit/compliance systems.
- Fully synchronized offline operation across multiple devices.

These features can be considered after the MVP has been built, tested, and validated.

---

# 