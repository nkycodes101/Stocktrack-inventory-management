# ShopTrack

## 04 — Technology Stack

**Document:** `docs/04_tech_stack.md`  
**Project:** ShopTrack  
**Application Type:** Full-Stack Inventory and Sales Management Web Application  
**Architecture:** Frontend + REST API Backend + Relational Database

---

# 1. Purpose

This document defines the technologies that will be used to build the ShopTrack MVP.

The technology stack is intentionally kept simple so that the application can be built, tested, deployed, and maintained without unnecessary complexity.

ShopTrack will use three major layers:

```text
Frontend
    ↓
Backend REST API
    ↓
PostgreSQL Database
```

---

# 2. Technology Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML5 | Page structure |
| Frontend | CSS3 | Styling and responsive design |
| Frontend | JavaScript | Interactivity and API communication |
| Backend | Python | Server-side programming |
| Backend | Flask | Web framework and REST API |
| Backend | Flask-CORS | Frontend/backend communication |
| Backend | Werkzeug | Password hashing/security utilities |
| Database | PostgreSQL | Relational data storage |
| Database Driver | Psycopg | Python/PostgreSQL connection |
| Environment | python-dotenv | Environment variables |
| API Format | JSON | Data exchange |
| API Testing | Postman | Testing backend endpoints |
| Version Control | Git | Track code changes |
| Repository | GitHub | Store and collaborate on code |
| Code Editor | VS Code | Development environment |

---

# 3. Frontend

## Technologies

### HTML5

HTML will provide the structure of ShopTrack pages.

It will be used for:

- Login forms.
- Dashboard.
- Product forms.
- Inventory tables.
- Sales interface.
- Customer forms.
- Reports.
- Settings.
- Smart Assistant interface.

---

## CSS3

CSS will control the visual appearance of ShopTrack.

It will provide:

- Page layouts.
- Sidebar navigation.
- Dashboard cards.
- Forms.
- Tables.
- Buttons.
- Status badges.
- Responsive design.
- Mobile layouts.

Stock status should be visually distinguishable:

- **In Stock — Green**
- **Low Stock — Yellow**
- **Out of Stock — Red**

---

## JavaScript

JavaScript will provide frontend functionality.

It will handle:

- Form validation.
- Product searching.
- Product filtering.
- Shopping cart operations.
- Quantity changes.
- Sales calculations.
- API requests.
- Dashboard data.
- User interaction.
- Dynamic page updates.

JavaScript will communicate with Flask using HTTP requests.

Example:

```text
JavaScript
    ↓
HTTP Request
    ↓
Flask API
    ↓
PostgreSQL
```

---

# 4. Frontend Structure

The frontend can initially use:

```text
frontend/
│
├── index.html
├── login.html
├── dashboard.html
├── products.html
├── inventory.html
├── sales.html
├── customers.html
├── reports.html
├── assistant.html
├── settings.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── auth.js
│   ├── dashboard.js
│   ├── products.js
│   ├── inventory.js
│   ├── sales.js
│   ├── customers.js
│   └── reports.js
│
└── assets/
    ├── images/
    └── icons/
```

For the MVP, a frontend framework such as React is **not required**.

HTML, CSS, and JavaScript are sufficient for building the first version.

---

# 5. Backend

## Python

Python will provide the server-side application logic.

It will handle:

- Authentication.
- Business rules.
- Product management.
- Inventory management.
- Sales processing.
- Customer management.
- Reports.
- Role permissions.
- Database communication.

---

# 6. Flask

Flask will be the backend web framework.

Flask will provide REST API endpoints that allow the frontend to communicate with the backend.

Example:

```text
Frontend
   │
   │ HTTP Request
   ▼
Flask API
   │
   │ SQL Query
   ▼
PostgreSQL
   │
   ▼
Flask
   │
   │ JSON Response
   ▼
Frontend
```

---

# 7. REST API

ShopTrack will use REST-style API endpoints.

Example endpoints:

```text
/auth/login

/products
/products/<id>

/inventory
/inventory/<id>

/sales
/sales/<id>

/customers
/customers/<id>

/reports
```

HTTP methods will include:

```text
GET     → Retrieve information

POST    → Create information

PUT     → Update information

DELETE  → Delete information
```

---

# 8. Flask-CORS

Flask-CORS will allow the frontend and backend to communicate when they are running from different development origins or deployment domains.

Example:

```text
Frontend
http://localhost:5500

        ↓

Flask API
http://localhost:5000
```

---

# 9. Authentication and Security

ShopTrack should never store user passwords as plain text.

Passwords should be securely hashed.

For the MVP, Werkzeug password utilities can be used.

Examples:

```text
generate_password_hash()
check_password_hash()
```

Authentication should protect private API routes.

Role checks should control what users are allowed to access.

---

# 10. Role-Based Access Control

ShopTrack has three primary roles:

```text
Business Owner
Inventory Manager
Super Admin
```

Permissions will be enforced by the backend.

Example:

```text
Business Owner
    ↓
Products
Inventory
Sales
Customers
Reports
Settings
User Management


Inventory Manager
    ↓
Products
Inventory
Selected Sales Functions
Limited Reports


Super Admin
    ↓
Platform Administration
Business Management
User Management
System Settings
```

The frontend may hide unavailable features, but the backend must also enforce the permissions.

---

# 11. Database

## PostgreSQL

PostgreSQL will be the main ShopTrack database.

It will store information such as:

- Users.
- Businesses.
- Products.
- Product variants.
- Inventory.
- Stock movements.
- Sales.
- Sale items.
- Customers.
- Payments.

PostgreSQL is appropriate because ShopTrack contains strongly related business information.

For example:

```text
Business
   │
   ├── Users
   ├── Products
   ├── Customers
   └── Sales
```

---

# 12. Python–PostgreSQL Connection

The Flask backend will communicate with PostgreSQL using a PostgreSQL Python driver such as Psycopg.

Example architecture:

```text
Flask Route
     ↓
Business Logic
     ↓
Database Query
     ↓
PostgreSQL
```

SQL queries will be executed only from the backend.

The frontend should **never connect directly to PostgreSQL**.

---

# 13. Environment Variables

Sensitive configuration should be stored in:

```text
.env
```

Example:

```text
DB_HOST=localhost
DB_NAME=shoptrack_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432

SECRET_KEY=your_secret_key
```

The `.env` file must **not** be pushed to GitHub.

Therefore `.gitignore` should contain:

```text
.env
__pycache__/
*.pyc
```

---

# 14. Database Development Tool

A PostgreSQL administration tool such as **pgAdmin** can be used during development.

It can help the team:

- Create the database.
- View tables.
- Run SQL queries.
- Insert test data.
- Inspect records.
- Debug database problems.

The development database can be called:

```text
shoptrack_db
```

---

# 15. API Data Format

The frontend and backend will exchange information using JSON.

Example product:

```json
{
  "id": 1,
  "name": "Nivea Lotion",
  "variant": "400ml",
  "cost_price": 3500,
  "wholesale_price": 4000,
  "retail_price": 4500,
  "quantity": 10,
  "status": "in_stock"
}
```

---

# 16. API Testing

## Postman

Postman can be used to test the backend before connecting it to the frontend.

Example tests:

```text
POST /products
GET /products
PUT /products/1
DELETE /products/1
POST /sales
GET /reports
```

This helps the backend developer confirm that the API works independently of the frontend.

---

# 17. Development Environment

## Visual Studio Code

VS Code will be the main code editor.

Recommended project structure:

```text
Shoptrack/
│
├── docs/
├── frontend/
├── backend/
├── database/
├── .gitignore
└── README.md
```

Each team member can work primarily inside their assigned section.

---

# 18. Version Control

## Git

Git will track changes made to ShopTrack.

Each team member should work on a separate branch.

Example:

```text
main

frontend

backend

database
```

Typical workflow:

```text
git checkout frontend

      ↓

Make changes

      ↓

git add .

      ↓

git commit

      ↓

git push

      ↓

Merge into main after review
```

---

# 19. GitHub

GitHub will serve as the central repository for ShopTrack.

It will allow the team to:

- Store project files.
- Collaborate.
- Track changes.
- Review code.
- Merge team members' work.
- Maintain project documentation.

The `docs/` folder should also be committed to GitHub.

---

# 20. Smart Assistant

The ShopTrack architecture reserves a Smart Assistant feature.

For the MVP, the Smart Assistant should remain simple.

It can initially answer questions using data already stored by ShopTrack, such as:

- Which products are low in stock?
- Which products are out of stock?
- What are today's sales?
- What is the best-selling product?
- What is the estimated profit?

Advanced AI capabilities are not required for the first MVP.

---

# 21. Reports and Charts

ShopTrack reports should display information such as:

- Sales.
- Revenue.
- Profit.
- Inventory.
- Best-selling products.
- Low-stock products.

Basic charts can be created on the frontend.

A lightweight JavaScript chart library may be introduced when the reports screen is implemented.

This should only be added if required rather than increasing the initial technology stack unnecessarily.

---

# 22. Deployment

ShopTrack should eventually have three deployed components:

```text
Frontend
     │
     ▼
Backend API
     │
     ▼
PostgreSQL Database
```

The specific hosting providers can be selected when the MVP is ready for deployment.

Development should first work locally before deployment.

---

# 23. Development Architecture

The complete MVP architecture is:

```text
              USER
                │
                ▼
       ┌─────────────────┐
       │    FRONTEND     │
       │ HTML/CSS/JS     │
       └────────┬────────┘
                │
             HTTP/JSON
                │
                ▼
       ┌─────────────────┐
       │     BACKEND     │
       │ Python + Flask  │
       └────────┬────────┘
                │
              SQL
                │
                ▼
       ┌─────────────────┐
       │    DATABASE     │
       │   PostgreSQL    │
       └─────────────────┘
```

---

# 24. Team Responsibility

For a three-person development team:

| Team Member | Main Responsibility |
|---|---|
| Frontend Developer | HTML, CSS, JavaScript, UI and API integration |
| Backend Developer | Python, Flask, REST API, authentication and business logic |
| Database Developer | PostgreSQL, tables, relationships and SQL |

The team must still communicate regularly because the three sections depend on each other.

---

# 25. Frontend–Backend–Database Example

When a user records a sale:

```text
1. User selects product
          ↓
2. JavaScript adds product to cart
          ↓
3. User clicks Complete Sale
          ↓
4. Frontend sends sale data to Flask
          ↓
5. Flask validates the sale
          ↓
6. PostgreSQL stores the sale
          ↓
7. PostgreSQL stock quantity is updated
          ↓
8. Flask returns successful response
          ↓
9. Frontend displays receipt/confirmation
          ↓
10. Dashboard shows updated information
```

This demonstrates how all three team members' work connects.

---

# 26. MVP Technology Decision

The approved core technology stack for ShopTrack is:

```text
FRONTEND
HTML5
CSS3
JavaScript

        ↓

BACKEND
Python
Flask
REST API
Flask-CORS

        ↓

DATABASE
PostgreSQL
Psycopg

        +

TOOLS
VS Code
Git
GitHub
Postman
pgAdmin
python-dotenv
```

This stack should remain stable during the MVP unless the team identifies a clear technical reason to change it.

---

# 27. Next Technical Document

The next ShopTrack document is:

`docs/05_database_structure.md`

It will translate the requirements, user stories, screens, and technology choices into the database tables and relationships required by ShopTrack.

Expected core entities include:

```text
Businesses
Users
Products
Product Variants
Inventory
Stock Movements
Customers
Sales
Sale Items
Payments
```