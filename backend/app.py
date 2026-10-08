import os
import sys

from flask import Flask, jsonify, request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from database import get_db_connection


app = Flask(__name__)
app.config.from_object(Config)


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin', '*')
    if origin == '*':
        response.headers['Access-Control-Allow-Origin'] = '*'
    else:
        response.headers['Access-Control-Allow-Origin'] = origin
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response


@app.route('/api/<path:path>', methods=['OPTIONS'])
def api_options(path):
    return '', 204
@app.route("/health")
def health():
    return {"status": "ok"}, 200

def ensure_products_table():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS products (
                    product_id SERIAL PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    category VARCHAR(100),
                    variant VARCHAR(100),
                    sku VARCHAR(100) UNIQUE NOT NULL,
                    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
                    wholesale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
                    retail_price NUMERIC(12,2) NOT NULL DEFAULT 0,
                    opening_quantity INTEGER NOT NULL DEFAULT 0,
                    low_stock_threshold INTEGER NOT NULL DEFAULT 0,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            connection.commit()


def normalize_product_payload(data, update=False, existing=None):
    if not isinstance(data, dict):
        raise ValueError('Request body must be a JSON object.')

    payload = dict(data)
    if existing is not None:
        payload.setdefault('name', existing['name'])
        payload.setdefault('category', existing['category'])
        payload.setdefault('variant', existing['variant'])
        payload.setdefault('sku', existing['sku'])
        payload.setdefault('costPrice', existing['cost_price'])
        payload.setdefault('wholesalePrice', existing['wholesale_price'])
        payload.setdefault('retailPrice', existing['retail_price'])
        payload.setdefault('openingQuantity', existing['opening_quantity'])
        payload.setdefault('lowStockThreshold', existing['low_stock_threshold'])

    name = payload.get('name')
    category = payload.get('category')
    variant = payload.get('variant')
    sku = payload.get('sku')

    if update:
        if 'name' in payload and (not name or not str(name).strip()):
            raise ValueError('Product name is required.')
        if 'sku' in payload and (not sku or not str(sku).strip()):
            raise ValueError('Product SKU is required.')
    else:
        if not name or not str(name).strip():
            raise ValueError('Product name is required.')
        if not sku or not str(sku).strip():
            raise ValueError('Product SKU is required.')

    cost_price = payload.get('costPrice', payload.get('cost_price', 0))
    wholesale_price = payload.get('wholesalePrice', payload.get('wholesale_price', 0))
    retail_price = payload.get('retailPrice', payload.get('retail_price', 0))
    opening_quantity = payload.get('openingQuantity', payload.get('opening_quantity', 0))
    low_stock_threshold = payload.get('lowStockThreshold', payload.get('low_stock_threshold', 0))

    for field_name, value in {
        'cost_price': cost_price,
        'wholesale_price': wholesale_price,
        'retail_price': retail_price,
        'opening_quantity': opening_quantity,
        'low_stock_threshold': low_stock_threshold,
    }.items():
        try:
            numeric_value = float(value)
        except (TypeError, ValueError):
            raise ValueError(f'{field_name.replace("_", " ").title()} must be a valid number.')
        if numeric_value < 0:
            raise ValueError(f'{field_name.replace("_", " ").title()} cannot be negative.')

    product_data = {
        'name': str(name).strip(),
        'category': str(category).strip() if category is not None else '',
        'variant': str(variant).strip() if variant is not None else '',
        'sku': str(sku).strip(),
        'cost_price': float(cost_price),
        'wholesale_price': float(wholesale_price),
        'retail_price': float(retail_price),
        'opening_quantity': int(float(opening_quantity)),
        'low_stock_threshold': int(float(low_stock_threshold)),
    }
    return product_data


def row_to_dict(row):
    if row is None:
        return None
    if isinstance(row, dict):
        return row
    if hasattr(row, '_asdict'):
        return row._asdict()
    if hasattr(row, 'keys'):
        return dict(row)
    if isinstance(row, tuple):
        columns = [
            'product_id',
            'name',
            'category',
            'variant',
            'sku',
            'cost_price',
            'wholesale_price',
            'retail_price',
            'opening_quantity',
            'low_stock_threshold',
            'is_active',
            'created_at',
            'updated_at',
        ]
        if len(row) == 11:
            columns = [
                'inventory_id',
                'product_id',
                'stock_quantity',
                'stock_in',
                'stock_out',
                'low_stock_level',
                'product_status',
                'created_at',
                'updated_at',
                'product_name',
                'sku',
            ]
        return dict(zip(columns, row))
    return {}


def to_product_dict(row):
    product = row_to_dict(row)
    if product is None:
        return None
    return {
        'id': product['product_id'],
        'name': product['name'],
        'category': product['category'],
        'variant': product['variant'],
        'sku': product['sku'],
        'costPrice': float(product['cost_price'] or 0),
        'wholesalePrice': float(product['wholesale_price'] or 0),
        'retailPrice': float(product['retail_price'] or 0),
        'openingQuantity': int(product['opening_quantity'] or 0),
        'lowStockThreshold': int(product['low_stock_threshold'] or 0),
        'isActive': bool(product.get('is_active', True)),
        'createdAt': product['created_at'].isoformat() if product.get('created_at') else None,
        'updatedAt': product['updated_at'].isoformat() if product.get('updated_at') else None,
    }


ensure_products_table()


def ensure_inventory_table():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT to_regclass('public.inventory')"
            )
            exists = cursor.fetchone()[0]
            if exists is None:
                cursor.execute(
                    """
                    CREATE TABLE inventory (
                        inventory_id SERIAL PRIMARY KEY,
                        product_id INTEGER NOT NULL UNIQUE REFERENCES products(product_id) ON DELETE CASCADE,
                        stock_quantity INTEGER NOT NULL DEFAULT 0,
                        stock_in INTEGER NOT NULL DEFAULT 0,
                        stock_out INTEGER NOT NULL DEFAULT 0,
                        low_stock_level INTEGER NOT NULL DEFAULT 0,
                        product_status VARCHAR(50) NOT NULL DEFAULT 'Out of Stock' CHECK (product_status IN ('In Stock', 'Low Stock', 'Out of Stock')),
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW()
                    )
                    """
                )
                connection.commit()


def ensure_inventory_for_all_products():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT product_id, opening_quantity, low_stock_threshold FROM products"
            )
            products = cursor.fetchall()
            cursor.execute(
                "SELECT product_id FROM inventory"
            )
            existing = {row[0] for row in cursor.fetchall()}
            for pid, oq, lst in products:
                if pid not in existing:
                    oq = int(oq or 0)
                    lst = int(lst or 0)
                    status = 'In Stock' if oq > 0 else 'Out of Stock'
                    cursor.execute(
                        """
                        INSERT INTO inventory
                        (product_id, stock_quantity, stock_in, stock_out, low_stock_level, product_status)
                        VALUES (%s, %s, %s, 0, %s, %s)
                        """,
                        (pid, oq, oq, lst, status),
                    )
            connection.commit()


def get_inventory_status(stock_quantity, low_stock_level):
    stock_quantity = int(stock_quantity or 0)
    low_stock_level = int(low_stock_level or 0)
    if stock_quantity <= 0:
        return 'Out of Stock'
    if low_stock_level and stock_quantity <= low_stock_level:
        return 'Low Stock'
    return 'In Stock'


def normalize_inventory_payload(data, update=False, existing=None):
    if not isinstance(data, dict):
        raise ValueError('Request body must be a JSON object.')

    payload = dict(data)
    if existing is not None:
        payload.setdefault('productId', existing['product_id'])
        payload.setdefault('product_id', existing['product_id'])
        payload.setdefault('stockQuantity', existing['stock_quantity'])
        payload.setdefault('stock_quantity', existing['stock_quantity'])
        payload.setdefault('lowStockLevel', existing['low_stock_level'])
        payload.setdefault('low_stock_level', existing['low_stock_level'])
        payload.setdefault('stockIn', existing['stock_in'])
        payload.setdefault('stock_in', existing['stock_in'])
        payload.setdefault('stockOut', existing['stock_out'])
        payload.setdefault('stock_out', existing['stock_out'])

    product_id = payload.get('productId', payload.get('product_id'))
    stock_quantity = payload.get('stockQuantity', payload.get('stock_quantity'))
    low_stock_level = payload.get('lowStockLevel', payload.get('low_stock_level', 0))
    stock_in = payload.get('stockIn', payload.get('stock_in', 0))
    stock_out = payload.get('stockOut', payload.get('stock_out', 0))

    if product_id is None:
        raise ValueError('Product ID is required.')
    try:
        product_id = int(product_id)
    except (TypeError, ValueError):
        raise ValueError('Product ID must be a valid integer.')

    if stock_quantity is None:
        if update:
            stock_quantity = existing['stock_quantity'] if existing is not None else 0
        else:
            stock_quantity = 0

    try:
        stock_quantity = int(stock_quantity)
        low_stock_level = int(low_stock_level)
        stock_in = int(stock_in)
        stock_out = int(stock_out)
    except (TypeError, ValueError):
        raise ValueError('Stock quantities and thresholds must be valid integers.')

    if stock_quantity < 0 or low_stock_level < 0 or stock_in < 0 or stock_out < 0:
        raise ValueError('Stock values cannot be negative.')

    if stock_in and not update and stock_quantity == 0:
        stock_quantity += stock_in
    if stock_out and not update:
        stock_quantity -= stock_out
        if stock_quantity < 0:
            stock_quantity = 0

    product_status = get_inventory_status(stock_quantity, low_stock_level)
    return {
        'product_id': product_id,
        'stock_quantity': stock_quantity,
        'low_stock_level': low_stock_level,
        'stock_in': stock_in,
        'stock_out': stock_out,
        'product_status': product_status,
    }


def to_inventory_dict(row):
    if row is None:
        return None
    inventory = row_to_dict(row)
    if not inventory:
        return None
    return {
        'id': inventory['inventory_id'],
        'productId': inventory['product_id'],
        'productName': inventory.get('product_name', ''),
        'sku': inventory.get('sku', ''),
        'stockQuantity': int(inventory.get('stock_quantity', 0) or 0),
        'stockIn': int(inventory.get('stock_in', 0) or 0),
        'stockOut': int(inventory.get('stock_out', 0) or 0),
        'lowStockLevel': int(inventory.get('low_stock_level', 0) or 0),
        'productStatus': inventory.get('product_status', get_inventory_status(inventory.get('stock_quantity', 0), inventory.get('low_stock_level', 0))),
        'createdAt': inventory['created_at'].isoformat() if inventory.get('created_at') else None,
        'updatedAt': inventory['updated_at'].isoformat() if inventory.get('updated_at') else None,
    }


ensure_inventory_table()
ensure_inventory_for_all_products()


def ensure_customer_record(name, phone=None, email=None, address=''):
    cleaned_name = str(name or '').strip()
    if not cleaned_name:
        return None

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT customer_id FROM customers WHERE LOWER(full_name) = LOWER(%s) AND is_active = TRUE LIMIT 1",
                (cleaned_name,),
            )
            existing = cursor.fetchone()
            if existing is not None:
                return existing[0]

            cursor.execute(
                """
                INSERT INTO customers (full_name, phone, email, address)
                VALUES (%s, %s, %s, %s)
                RETURNING customer_id
                """,
                (cleaned_name, phone or None, email or None, address or None),
            )
            row = cursor.fetchone()
            connection.commit()
            return row[0] if row else None


def ensure_sales_tables():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS customers (
                    customer_id SERIAL PRIMARY KEY,
                    full_name VARCHAR(150) NOT NULL,
                    phone VARCHAR(50),
                    email VARCHAR(255),
                    address TEXT,
                    total_owing NUMERIC(12,2) DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS sales (
                    sale_id SERIAL PRIMARY KEY,
                    customer_id INTEGER REFERENCES customers(customer_id) ON DELETE SET NULL,
                    customer_name VARCHAR(150),
                    sale_number VARCHAR(100) UNIQUE NOT NULL,
                    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
                    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
                    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'pos', 'credit')),
                    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'refunded')),
                    sale_date TIMESTAMPTZ DEFAULT NOW(),
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS sale_items (
                    sale_item_id SERIAL PRIMARY KEY,
                    sale_id INTEGER NOT NULL REFERENCES sales(sale_id) ON DELETE CASCADE,
                    product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
                    quantity INTEGER NOT NULL CHECK (quantity > 0),
                    unit_price NUMERIC(12,2) NOT NULL,
                    subtotal NUMERIC(12,2) NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS payments (
                    payment_id SERIAL PRIMARY KEY,
                    sale_id INTEGER NOT NULL REFERENCES sales(sale_id) ON DELETE CASCADE,
                    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'pos', 'credit')),
                    amount NUMERIC(12,2) NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'failed')),
                    paid_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            connection.commit()


def ensure_customer_table_if_missing():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT to_regclass('public.customers')")
            exists = cursor.fetchone()[0]
            if exists is None:
                cursor.execute(
                    """
                    CREATE TABLE customers (
                        customer_id SERIAL PRIMARY KEY,
                        full_name VARCHAR(150) NOT NULL,
                        phone VARCHAR(50),
                        email VARCHAR(255),
                        address TEXT,
                        total_owing NUMERIC(12,2) DEFAULT 0,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMPTZ DEFAULT NOW()
                    )
                    """
                )

            cursor.execute(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'customers' AND column_name = 'updated_at'
                """
            )
            if cursor.fetchone() is None:
                cursor.execute("ALTER TABLE customers ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW()")

            connection.commit()


def ensure_supplier_tables():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS suppliers (
                    supplier_id SERIAL PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    contact_name VARCHAR(150),
                    phone VARCHAR(50),
                    email VARCHAR(255),
                    address TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS product_suppliers (
                    product_supplier_id SERIAL PRIMARY KEY,
                    product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
                    supplier_id INTEGER NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
                    notes TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE (product_id, supplier_id)
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS inventory_batches (
                    batch_id SERIAL PRIMARY KEY,
                    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
                    supplier_id INTEGER REFERENCES suppliers(supplier_id) ON DELETE SET NULL,
                    batch_number VARCHAR(100) NOT NULL,
                    quantity INTEGER NOT NULL CHECK (quantity > 0),
                    date_received DATE NOT NULL,
                    expiry_date DATE,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            connection.commit()


def ensure_settings_table():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS settings (
                    setting_id SERIAL PRIMARY KEY,
                    business_name VARCHAR(200) NOT NULL DEFAULT 'ShopTrack Retail',
                    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
                    enable_low_stock_alerts BOOLEAN NOT NULL DEFAULT TRUE,
                    auto_save_sales_history BOOLEAN NOT NULL DEFAULT TRUE,
                    show_expiry_reminders BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            # Ensure a default row exists
            cursor.execute("SELECT COUNT(*) FROM settings")
            if cursor.fetchone()[0] == 0:
                cursor.execute(
                    """
                    INSERT INTO settings (business_name, currency, enable_low_stock_alerts, auto_save_sales_history, show_expiry_reminders)
                    VALUES ('ShopTrack Retail', 'NGN', TRUE, TRUE, TRUE)
                    """
                )
            connection.commit()


def customer_row_to_dict(row):
    if row is None:
        return None
    if isinstance(row, dict):
        return row
    if hasattr(row, '_asdict'):
        return row._asdict()
    columns = [
        'customer_id',
        'full_name',
        'phone',
        'email',
        'address',
        'total_owing',
        'is_active',
        'created_at',
        'updated_at',
    ]
    return dict(zip(columns, row))


def normalize_customer_payload(data, update=False, existing=None):
    if not isinstance(data, dict):
        raise ValueError('Request body must be a JSON object.')

    payload = dict(data)
    if existing is not None:
        payload.setdefault('name', existing.get('full_name'))
        payload.setdefault('fullName', existing.get('full_name'))
        payload.setdefault('phone', existing.get('phone'))
        payload.setdefault('email', existing.get('email'))
        payload.setdefault('address', existing.get('address'))

    if update:
        name = payload.get('name', payload.get('fullName'))
        if name is not None and (not str(name).strip()):
            raise ValueError('Customer name is required.')
    else:
        name = payload.get('name', payload.get('fullName'))
        if name is None or not str(name).strip():
            raise ValueError('Customer name is required.')

    phone = payload.get('phone', '')
    email = payload.get('email', '')
    address = payload.get('address', '')

    return {
        'full_name': str(name).strip() if name is not None else '',
        'phone': str(phone).strip() if phone is not None else '',
        'email': str(email).strip() if email is not None else '',
        'address': str(address).strip() if address is not None else '',
    }


def to_customer_dict(row):
    customer = customer_row_to_dict(row)
    if customer is None:
        return None
    return {
        'id': customer.get('customer_id'),
        'name': customer.get('full_name') or customer.get('name', ''),
        'phone': customer.get('phone') or '',
        'email': customer.get('email') or '',
        'address': customer.get('address') or '',
        'totalOwing': float(customer.get('total_owing') or 0),
        'isActive': bool(customer.get('is_active', True)),
        'createdAt': customer['created_at'].isoformat() if customer.get('created_at') else None,
        'updatedAt': customer['updated_at'].isoformat() if customer.get('updated_at') else None,
    }


def supplier_row_to_dict(row):
    if row is None:
        return None
    if isinstance(row, dict):
        return row
    if hasattr(row, '_asdict'):
        return row._asdict()
    columns = [
        'supplier_id',
        'name',
        'contact_name',
        'phone',
        'email',
        'address',
        'is_active',
        'created_at',
        'updated_at',
    ]
    return dict(zip(columns, row))


def normalize_supplier_payload(data, update=False, existing=None):
    if not isinstance(data, dict):
        raise ValueError('Request body must be a JSON object.')

    payload = dict(data)
    if existing is not None:
        payload.setdefault('name', existing.get('name'))
        payload.setdefault('contactName', existing.get('contact_name'))
        payload.setdefault('phone', existing.get('phone'))
        payload.setdefault('email', existing.get('email'))
        payload.setdefault('address', existing.get('address'))

    name = payload.get('name')
    if (not update and (name is None or not str(name).strip())) or (update and name is not None and not str(name).strip()):
        raise ValueError('Supplier name is required.')

    return {
        'name': str(name).strip() if name is not None else '',
        'contact_name': str(payload.get('contactName', payload.get('contact_name', ''))).strip(),
        'phone': str(payload.get('phone', '')).strip(),
        'email': str(payload.get('email', '')).strip(),
        'address': str(payload.get('address', '')).strip(),
    }


def to_supplier_dict(row):
    supplier = supplier_row_to_dict(row)
    if supplier is None:
        return None
    return {
        'id': supplier.get('supplier_id'),
        'name': supplier.get('name', ''),
        'contactName': supplier.get('contact_name') or '',
        'phone': supplier.get('phone') or '',
        'email': supplier.get('email') or '',
        'address': supplier.get('address') or '',
        'isActive': bool(supplier.get('is_active', True)),
        'createdAt': supplier['created_at'].isoformat() if supplier.get('created_at') else None,
        'updatedAt': supplier['updated_at'].isoformat() if supplier.get('updated_at') else None,
    }


def get_inventory_alerts():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT i.inventory_id, i.product_id, i.stock_quantity, i.low_stock_level, p.name AS product_name,
                       p.variant, p.sku, p.retail_price
                FROM inventory i
                JOIN products p ON p.product_id = i.product_id
                WHERE i.stock_quantity <= COALESCE(i.low_stock_level, 0)
                ORDER BY i.stock_quantity ASC, p.name ASC
                """
            )
            rows = cursor.fetchall()

    alerts = []
    for row in rows:
        inventory_id, product_id, stock_quantity, low_stock_level, product_name, variant, sku, retail_price = row
        status = 'Out of Stock' if int(stock_quantity or 0) <= 0 else 'Low Stock'
        alerts.append({
            'id': inventory_id,
            'productId': product_id,
            'productName': product_name,
            'variant': variant or '',
            'sku': sku,
            'availableQuantity': int(stock_quantity or 0),
            'lowStockLevel': int(low_stock_level or 0),
            'status': status,
            'unitPrice': float(retail_price or 0),
        })

    return alerts


def build_dashboard_summary():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute('SELECT COUNT(*) FROM products WHERE is_active = TRUE')
            total_products = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM inventory i
                JOIN products p ON p.product_id = i.product_id
                WHERE i.stock_quantity <= COALESCE(i.low_stock_level, 0) AND i.stock_quantity > 0
                """
            )
            low_stock_products = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM inventory i
                JOIN products p ON p.product_id = i.product_id
                WHERE i.stock_quantity <= 0
                """
            )
            out_of_stock_products = cursor.fetchone()[0]

            cursor.execute('SELECT COALESCE(SUM(total_amount), 0) FROM sales')
            total_sales = float(cursor.fetchone()[0] or 0)

            cursor.execute('SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE sale_date::date = CURRENT_DATE')
            todays_sales = float(cursor.fetchone()[0] or 0)

            cursor.execute(
                """
                SELECT COALESCE(SUM(si.quantity * COALESCE(p.cost_price, 0)), 0)
                FROM sale_items si
                JOIN products p ON p.product_id = si.product_id
                """
            )
            total_cogs = float(cursor.fetchone()[0] or 0)
            estimated_profit = total_sales - total_cogs

            cursor.execute(
                """
                SELECT COALESCE(SUM(i.stock_quantity * COALESCE(p.retail_price, 0)), 0)
                FROM inventory i
                JOIN products p ON p.product_id = i.product_id
                """
            )
            inventory_value = float(cursor.fetchone()[0] or 0)

            cursor.execute('SELECT COALESCE(SUM(stock_quantity), 0) FROM inventory')
            current_stock = int(cursor.fetchone()[0] or 0)

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM inventory i
                JOIN products p ON p.product_id = i.product_id
                WHERE i.stock_quantity > 0 AND i.stock_quantity > COALESCE(i.low_stock_level, 0)
                """
            )
            in_stock_products = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM inventory
                WHERE stock_quantity <= low_stock_level AND stock_quantity > 0
                """
            )
            low_stock_products = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM inventory
                WHERE stock_quantity <= 0
                """
            )
            out_of_stock_products = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT i.inventory_id, p.name, p.variant, i.stock_quantity, i.low_stock_level, p.retail_price
                FROM inventory i
                JOIN products p ON p.product_id = i.product_id
                WHERE i.stock_quantity <= COALESCE(i.low_stock_level, 0)
                ORDER BY i.stock_quantity ASC, p.name ASC
                LIMIT 10
                """
            )
            low_stock_rows = cursor.fetchall()

            cursor.execute(
                """
                SELECT s.sale_id, s.sale_number, s.total_amount, s.payment_method, s.sale_date,
                       c.full_name AS customer_name
                FROM sales s
                LEFT JOIN customers c ON c.customer_id = s.customer_id
                ORDER BY s.sale_date DESC
                LIMIT 5
                """
            )
            recent_sales = cursor.fetchall()

    return {
        'summary': [
            {'label': 'Total Products', 'value': total_products, 'note': 'Active products'},
            {'label': 'Current Stock', 'value': current_stock, 'note': 'Units available'},
            {'label': 'Low Stock', 'value': low_stock_products, 'note': 'Needs replenishment'},
            {'label': 'Out of Stock', 'value': out_of_stock_products, 'note': 'Immediate attention'},
            {'label': "Today's Sales", 'value': todays_sales, 'note': 'Current day'},
            {'label': 'Revenue', 'value': total_sales, 'note': 'All time'},
            {'label': 'Estimated Profit/Loss', 'value': estimated_profit, 'note': 'Net profit'},
        ],
        'lowStockItems': [
            {
                'id': row[0],
                'productName': row[1],
                'variant': row[2] or '',
                'stockQuantity': int(row[3] or 0),
                'lowStockLevel': int(row[4] or 0),
                'unitPrice': float(row[5] or 0),
            }
            for row in low_stock_rows
        ],
        'recentSales': [
            {
                'saleId': row[0],
                'saleNumber': row[1],
                'totalAmount': float(row[2] or 0),
                'paymentMethod': row[3],
                'saleDate': row[4].isoformat() if row[4] else None,
                'customerName': row[5] or 'Walk-in',
            }
            for row in recent_sales
        ],
        'inventorySummary': {
            'totalProducts': total_products,
            'inStockProducts': in_stock_products,
            'lowStockProducts': low_stock_products,
            'outOfStockProducts': out_of_stock_products,
            'currentStock': current_stock,
            'inventoryValue': inventory_value,
            'totalSales': total_sales,
            'todaysSales': todays_sales,
            'estimatedProfit': estimated_profit,
        }
    }


def build_reports_data(period='all', report_type='summary', category=None):
    allowed_periods = {'today', 'week', 'month', 'quarter', 'year', 'all'}
    chosen_period = str(period or 'all').lower()
    if chosen_period not in allowed_periods:
        chosen_period = 'all'

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            sales_interval = get_days_for_period(chosen_period)
            where_clause = "s.sale_date >= NOW() - %s::interval" if chosen_period != 'all' else "TRUE"

            cursor.execute(
                f"""
                SELECT DATE(s.sale_date) AS sale_day,
                       COALESCE(SUM(s.total_amount), 0) AS sales
                FROM sales s
                WHERE {where_clause}
                GROUP BY DATE(s.sale_date)
                ORDER BY DATE(s.sale_date) ASC
                """,
                (sales_interval,) if chosen_period != 'all' else (),
            )
            daily_sales = {row[0]: float(row[1] or 0) for row in cursor.fetchall()}

            cogs_where = "s.sale_date >= NOW() - %s::interval" if chosen_period != 'all' else "TRUE"
            cursor.execute(
                f"""
                SELECT DATE(s.sale_date) AS sale_day,
                       COALESCE(SUM(CASE WHEN p.cost_price IS NOT NULL THEN si.quantity * p.cost_price ELSE 0 END), 0) AS cost_of_goods
                FROM sales s
                LEFT JOIN sale_items si ON si.sale_id = s.sale_id
                LEFT JOIN products p ON p.product_id = si.product_id
                WHERE {cogs_where}
                GROUP BY DATE(s.sale_date)
                ORDER BY DATE(s.sale_date) ASC
                """,
                (sales_interval,) if chosen_period != 'all' else (),
            )
            sales_rows = [(day, daily_sales.get(day, 0), 0, daily_sales.get(day, 0)) for day in sorted(daily_sales)]
            cogs_by_day = {row[0]: float(row[1] or 0) for row in cursor.fetchall()}

            sales_rows = []
            for day in sorted(daily_sales):
                sales_val = daily_sales[day]
                cogs_val = cogs_by_day.get(day, 0)
                sales_rows.append((day, sales_val, cogs_val, sales_val - cogs_val))

            cursor.execute(
                """
                SELECT p.name,
                       SUM(COALESCE(i.stock_quantity, 0)) AS units,
                       SUM(COALESCE(i.stock_quantity, 0) * COALESCE(p.retail_price, 0)) AS value
                FROM products p
                LEFT JOIN inventory i ON i.product_id = p.product_id
                WHERE p.is_active = TRUE
                GROUP BY p.name
                ORDER BY value DESC
                """
            )
            stock_rows = cursor.fetchall()

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM inventory
                WHERE stock_quantity <= low_stock_level AND stock_quantity > 0
                """
            )
            low_stock_total = cursor.fetchone()[0]
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM inventory
                WHERE stock_quantity <= 0
                """
            )
            out_of_stock_total = cursor.fetchone()[0]

            cursor.execute(
                "SELECT COUNT(*) FROM products WHERE is_active = TRUE"
            )
            total_products = cursor.fetchone()[0]
            in_stock_total = max(total_products - low_stock_total - out_of_stock_total, 0)

            cursor.execute(
                """
                SELECT COALESCE(SUM(stock_quantity * retail_price), 0)
                FROM inventory i
                JOIN products p ON p.product_id = i.product_id
                """
            )
            inventory_value = float(cursor.fetchone()[0] or 0)

    date_series = []
    summary_sales = 0
    summary_revenue = 0
    summary_profit = 0

    for sale_day, sales, cogs, profit_value in sales_rows:
        sales_amount = float(sales or 0)
        profit_amount = float(profit_value or 0)
        summary_sales += sales_amount
        summary_revenue += sales_amount
        summary_profit += profit_amount
        date_series.append({
            'date': sale_day.isoformat() if hasattr(sale_day, 'isoformat') else str(sale_day),
            'sales': sales_amount,
            'revenue': sales_amount,
            'profit': profit_amount,
            'inventoryValue': inventory_value,
            'lowStock': low_stock_total,
            'outOfStock': out_of_stock_total,
            'totalProducts': total_products,
            'inStock': in_stock_total,
            'productSales': {},
        })

    if not date_series:
        date_series.append({
            'date': 'N/A',
            'sales': 0,
            'revenue': 0,
            'profit': 0,
            'inventoryValue': inventory_value,
            'lowStock': low_stock_total,
            'outOfStock': out_of_stock_total,
            'totalProducts': total_products,
            'inStock': in_stock_total,
            'productSales': {},
        })

    if report_type in ('stock', 'summary'):
        stock_data = []
        for product_name, units, value in stock_rows:
            stock_data.append({
                'productName': product_name,
                'units': int(units or 0),
                'value': float(value or 0),
            })
    else:
        stock_data = []

    if report_type in ('profit', 'profit-loss', 'pnl', 'summary'):
        pnl_summary = {
            'revenue': summary_revenue,
            'costOfGoods': max(summary_revenue - summary_profit, 0),
            'profit': summary_profit,
        }
    else:
        pnl_summary = {'revenue': 0, 'costOfGoods': 0, 'profit': 0}

    response = {
        'type': report_type,
        'period': chosen_period,
        'summary': {
            'sales': summary_sales,
            'revenue': summary_revenue,
            'profit': summary_profit,
            'inventoryValue': inventory_value,
            'lowStock': low_stock_total,
            'outOfStock': out_of_stock_total,
            'totalProducts': total_products,
            'inStock': in_stock_total,
        },
        'data': date_series,
        'stockData': stock_data,
        'profitLoss': pnl_summary,
    }
    return response


def get_days_for_period(period):
    mapping = {
        'today': '1 day',
        'week': '7 days',
        'month': '30 days',
        'quarter': '90 days',
        'year': '365 days',
        'all': '100 years',
    }
    return mapping.get(period, '100 years')


ensure_customer_table_if_missing()
ensure_supplier_tables()
ensure_settings_table()


def sale_row_to_dict(cursor_obj, row):
    if row is None:
        return None
    columns = [column[0] for column in cursor_obj.description]
    return dict(zip(columns, row))


def sale_item_to_dict(item_row):
    if item_row is None:
        return None
    if isinstance(item_row, dict) and 'saleItemId' in item_row:
        return item_row
    if isinstance(item_row, dict) and 'sale_item_id' in item_row:
        return {
            'saleItemId': item_row['sale_item_id'],
            'productId': item_row['product_id'],
            'productName': item_row.get('product_name', ''),
            'sku': item_row.get('sku', ''),
            'quantity': int(item_row['quantity']),
            'unitPrice': float(item_row['unit_price'] or 0),
            'subtotal': float(item_row['subtotal'] or 0),
        }
    return item_row


def sale_to_dict(sale_row, item_rows=None):
    if sale_row is None:
        return None

    if isinstance(sale_row, dict):
        sale = sale_row
    else:
        sale = dict(sale_row)

    if item_rows is None:
        item_rows = []

    normalized_items = []
    for item in item_rows:
        normalized_items.append(sale_item_to_dict(item))

    sale_id = sale.get('sale_id', sale.get('saleId'))
    sale_number = sale.get('sale_number', sale.get('saleNumber'))
    customer_id = sale.get('customer_id', sale.get('customerId'))
    customer_name = sale.get('customer_name') or sale.get('full_name') or sale.get('customerName')
    payment_method = sale.get('payment_method', sale.get('paymentMethod', 'cash'))
    amount_paid = sale.get('amount_paid', sale.get('amountPaid', 0))
    total_amount = sale.get('total_amount', sale.get('totalAmount', 0))
    sale_date = sale.get('sale_date', sale.get('saleDate'))
    created_at = sale.get('created_at', sale.get('createdAt'))
    updated_at = sale.get('updated_at', sale.get('updatedAt'))

    return {
        'saleId': sale_id,
        'saleNumber': sale_number,
        'customerId': customer_id,
        'customerName': customer_name,
        'paymentMethod': payment_method,
        'amountPaid': float(amount_paid or 0),
        'totalAmount': float(total_amount or 0),
        'status': sale.get('status', 'completed'),
        'saleDate': sale_date.isoformat() if hasattr(sale_date, 'isoformat') else sale_date,
        'createdAt': created_at.isoformat() if hasattr(created_at, 'isoformat') else created_at,
        'updatedAt': updated_at.isoformat() if hasattr(updated_at, 'isoformat') else updated_at,
        'items': normalized_items,
    }


ensure_sales_tables()


@app.get('/api/health')
def health_check():
    try:
        connection = get_db_connection()
        connection.close()
    except Exception:
        pass

    return jsonify({
        'status': 'ok',
        'application': 'ShopTrack'
    })


@app.get('/api/products')
def get_products():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                'SELECT * FROM products WHERE is_active = TRUE ORDER BY product_id ASC'
            )
            rows = cursor.fetchall()
    return jsonify([to_product_dict(row) for row in rows])


@app.get('/api/products/<int:product_id>')
def get_product(product_id):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                'SELECT * FROM products WHERE product_id = %s AND is_active = TRUE',
                (product_id,),
            )
            row = cursor.fetchone()

    if row is None:
        return jsonify({'error': 'Product not found.'}), 404

    return jsonify(to_product_dict(row))


@app.post('/api/products')
def create_product():
    payload = request.get_json(silent=True) or {}

    try:
        product_data = normalize_product_payload(payload)
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            try:
                cursor.execute(
                    """
                    INSERT INTO products (
                        name,
                        category,
                        variant,
                        sku,
                        cost_price,
                        wholesale_price,
                        retail_price,
                        opening_quantity,
                        low_stock_threshold
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        product_data['name'],
                        product_data['category'],
                        product_data['variant'],
                        product_data['sku'],
                        product_data['cost_price'],
                        product_data['wholesale_price'],
                        product_data['retail_price'],
                        product_data['opening_quantity'],
                        product_data['low_stock_threshold'],
                    ),
                )
                row = cursor.fetchone()
                product_id = row[0]

                cursor.execute(
                    """
                    INSERT INTO inventory
                    (
                        product_id,
                        stock_quantity,
                        stock_in,
                        stock_out,
                        low_stock_level,
                        product_status
                    )
                    VALUES (%s, %s, %s, 0, %s, %s)
                    """,
                    (
                        product_id,
                        product_data["opening_quantity"],
                        product_data["opening_quantity"],
                        product_data["low_stock_threshold"],
                        "In Stock" if product_data["opening_quantity"] > 0 else "Out of Stock"
                    )
                )
                connection.commit()
            except Exception as exc:
                connection.rollback()
                message = str(exc)
                if 'duplicate key value violates unique constraint' in message.lower() or 'unique constraint' in message.lower():
                    return jsonify({'error': 'Product SKU already exists.'}), 409
                return jsonify({'error': 'Unable to create product.'}), 400

    return jsonify(to_product_dict(row)), 201


@app.put('/api/products/<int:product_id>')
def update_product(product_id):
    payload = request.get_json(silent=True) or {}

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                'SELECT * FROM products WHERE product_id = %s AND is_active = TRUE',
                (product_id,),
            )
            existing_row = cursor.fetchone()
            if existing_row is None:
                return jsonify({'error': 'Product not found.'}), 404

    try:
        product_data = normalize_product_payload(payload, update=True, existing=row_to_dict(existing_row) or {})
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            update_fields = [
                'name = %s',
                'category = %s',
                'variant = %s',
                'sku = %s',
                'cost_price = %s',
                'wholesale_price = %s',
                'retail_price = %s',
                'opening_quantity = %s',
                'low_stock_threshold = %s',
                'updated_at = NOW()',
            ]
            values = [
                product_data['name'],
                product_data['category'],
                product_data['variant'],
                product_data['sku'],
                product_data['cost_price'],
                product_data['wholesale_price'],
                product_data['retail_price'],
                product_data['opening_quantity'],
                product_data['low_stock_threshold'],
                product_id,
            ]

            try:
                cursor.execute(
                    f"UPDATE products SET {', '.join(update_fields)} WHERE product_id = %s RETURNING *",
                    tuple(values),
                )
                row = cursor.fetchone()
                connection.commit()
            except Exception as exc:
                connection.rollback()
                message = str(exc)
                if 'duplicate key value violates unique constraint' in message.lower() or 'unique constraint' in message.lower():
                    return jsonify({'error': 'Product SKU already exists.'}), 409
                return jsonify({'error': 'Unable to update product.'}), 400

    return jsonify(to_product_dict(row))


@app.delete('/api/products/<int:product_id>')
def delete_product(product_id):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                'DELETE FROM products WHERE product_id = %s RETURNING product_id',
                (product_id,),
            )
            deleted = cursor.fetchone()
            connection.commit()

    if deleted is None:
        return jsonify({'error': 'Product not found.'}), 404

    return jsonify({'success': True, 'deletedProductId': product_id})


@app.get('/api/inventory')
def get_inventory():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT i.*, p.name AS product_name, p.sku
                FROM inventory i
                JOIN products p ON p.product_id = i.product_id
                ORDER BY i.inventory_id ASC
                """
            )
            rows = cursor.fetchall()
    return jsonify([to_inventory_dict(row) for row in rows])


@app.get('/api/inventory/<int:inventory_id>')
def get_inventory_item(inventory_id):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT i.*, p.name AS product_name, p.sku
                FROM inventory i
                JOIN products p ON p.product_id = i.product_id
                WHERE i.inventory_id = %s
                """,
                (inventory_id,),
            )
            row = cursor.fetchone()

    if row is None:
        return jsonify({'error': 'Inventory item not found.'}), 404

    return jsonify(to_inventory_dict(row))


@app.get('/api/inventory/product/<int:product_id>')
def get_inventory_by_product(product_id):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT i.*, p.name AS product_name, p.sku
                FROM inventory i
                JOIN products p ON p.product_id = i.product_id
                WHERE i.product_id = %s
                """,
                (product_id,),
            )
            row = cursor.fetchone()

    if row is None:
        return jsonify({'error': 'Inventory item not found for this product.'}), 404

    return jsonify(to_inventory_dict(row))


@app.post('/api/inventory')
def create_inventory_item():
    payload = request.get_json(silent=True) or {}

    try:
        inventory_data = normalize_inventory_payload(payload)
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute('SELECT product_id FROM products WHERE product_id = %s', (inventory_data['product_id'],))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Product not found.'}), 404

            cursor.execute(
                'SELECT inventory_id FROM inventory WHERE product_id = %s',
                (inventory_data['product_id'],),
            )
            if cursor.fetchone() is not None:
                return jsonify({'error': 'Inventory already exists for this product.'}), 409

            try:
                cursor.execute(
                    """
                    INSERT INTO inventory (
                        product_id,
                        stock_quantity,
                        stock_in,
                        stock_out,
                        low_stock_level,
                        product_status,
                        updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, NOW())
                    RETURNING *
                    """,
                    (
                        inventory_data['product_id'],
                        inventory_data['stock_quantity'],
                        inventory_data['stock_in'],
                        inventory_data['stock_out'],
                        inventory_data['low_stock_level'],
                        inventory_data['product_status'],
                    ),
                )
                row = cursor.fetchone()
                connection.commit()
            except Exception as exc:
                connection.rollback()
                return jsonify({'error': f'Unable to create inventory item: {str(exc)}'}), 400

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT i.*, p.name AS product_name, p.sku
                FROM inventory i
                JOIN products p ON p.product_id = i.product_id
                WHERE i.inventory_id = %s
                """,
                (row[0],),
            )
            row = cursor.fetchone()

    return jsonify(to_inventory_dict(row)), 201


@app.put('/api/inventory/<int:inventory_id>')
def update_inventory_item(inventory_id):
    payload = request.get_json(silent=True) or {}

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT i.*, p.name AS product_name, p.sku
                FROM inventory i
                JOIN products p ON p.product_id = i.product_id
                WHERE i.inventory_id = %s
                """,
                (inventory_id,),
            )
            existing_row = cursor.fetchone()
            if existing_row is None:
                return jsonify({'error': 'Inventory item not found.'}), 404

    try:
        existing = row_to_dict(existing_row) or {}
        updated = dict(existing)
        stock_quantity = payload.get('stockQuantity', payload.get('stock_quantity', existing.get('stock_quantity', 0)))
        low_stock_level = payload.get('lowStockLevel', payload.get('low_stock_level', existing.get('low_stock_level', 0)))
        stock_in_value = payload.get('stockIn', payload.get('stock_in', 0))
        stock_out_value = payload.get('stockOut', payload.get('stock_out', 0))

        try:
            stock_quantity = int(stock_quantity)
            low_stock_level = int(low_stock_level)
            stock_in_value = int(stock_in_value)
            stock_out_value = int(stock_out_value)
        except (TypeError, ValueError):
            raise ValueError('Stock values must be valid integers.')

        if stock_quantity < 0 or low_stock_level < 0 or stock_in_value < 0 or stock_out_value < 0:
            raise ValueError('Stock values cannot be negative.')

        if 'stockQuantity' in payload or 'stock_quantity' in payload:
            quantity = stock_quantity
        else:
            quantity = existing.get('stock_quantity', 0) + stock_in_value - stock_out_value

        if quantity < 0:
            quantity = 0

        new_stock_in = existing.get('stock_in', 0) + stock_in_value
        new_stock_out = existing.get('stock_out', 0) + stock_out_value
        product_status = get_inventory_status(quantity, low_stock_level)

        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE inventory
                    SET stock_quantity = %s,
                        stock_in = %s,
                        stock_out = %s,
                        low_stock_level = %s,
                        product_status = %s,
                        updated_at = NOW()
                    WHERE inventory_id = %s
                    RETURNING *
                    """,
                    (
                        quantity,
                        new_stock_in,
                        new_stock_out,
                        low_stock_level,
                        product_status,
                        inventory_id,
                    ),
                )
                row = cursor.fetchone()
                connection.commit()
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT i.*, p.name AS product_name, p.sku
                FROM inventory i
                JOIN products p ON p.product_id = i.product_id
                WHERE i.inventory_id = %s
                """,
                (inventory_id,),
            )
            row = cursor.fetchone()

    return jsonify(to_inventory_dict(row))


@app.get('/api/sales')
def get_sales():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT s.*, c.full_name AS customer_name
                FROM sales s
                LEFT JOIN customers c ON c.customer_id = s.customer_id
                ORDER BY s.sale_id DESC
                """
            )
            sale_rows = cursor.fetchall()
            sales = []
            for sale_row in sale_rows:
                sale_data = sale_row_to_dict(cursor, sale_row)
                cursor.execute(
                    """
                    SELECT si.*, p.name AS product_name, p.sku
                    FROM sale_items si
                    JOIN products p ON p.product_id = si.product_id
                    WHERE si.sale_id = %s
                    ORDER BY si.sale_item_id ASC
                    """,
                    (sale_data['sale_id'],),
                )
                item_rows = cursor.fetchall()
                items = [sale_row_to_dict(cursor, item_row) for item_row in item_rows]
                sales.append(sale_to_dict(sale_data, items))

    return jsonify(sales)


@app.get('/api/sales/<int:sale_id>')
def get_sale(sale_id):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT s.*, c.full_name AS customer_name
                FROM sales s
                LEFT JOIN customers c ON c.customer_id = s.customer_id
                WHERE s.sale_id = %s
                """,
                (sale_id,),
            )
            sale_row = cursor.fetchone()
            if sale_row is None:
                return jsonify({'error': 'Sale not found.'}), 404

            sale_data = sale_row_to_dict(cursor, sale_row)
            cursor.execute(
                """
                SELECT si.*, p.name AS product_name, p.sku
                FROM sale_items si
                JOIN products p ON p.product_id = si.product_id
                WHERE si.sale_id = %s
                ORDER BY si.sale_item_id ASC
                """,
                (sale_id,),
            )
            item_rows = cursor.fetchall()
            items = [sale_row_to_dict(cursor, item_row) for item_row in item_rows]

    return jsonify(sale_to_dict(sale_data, items))


@app.post('/api/sales')
def create_sale():
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return jsonify({'error': 'Request body must be a JSON object.'}), 400

    items = payload.get('items')
    if not isinstance(items, list) or not items:
        return jsonify({'error': 'At least one sale item is required.'}), 400

    customer_name = payload.get('customerName')
    customer_phone = payload.get('customerPhone')
    customer_id = payload.get('customerId')
    payment_method = str(payload.get('paymentMethod', 'cash')).strip().lower()
    valid_payment_methods = {'cash', 'transfer', 'pos', 'credit'}
    if payment_method not in valid_payment_methods:
        return jsonify({'error': 'Payment method must be one of: cash, transfer, pos, credit.'}), 400

    try:
        amount_paid = float(payload.get('amountPaid', 0))
    except (TypeError, ValueError):
        return jsonify({'error': 'Amount paid must be a valid number.'}), 400

    if payload.get('totalAmount') is not None:
        try:
            payload_total = float(payload.get('totalAmount'))
            if payload_total < 0:
                return jsonify({'error': 'Total amount cannot be negative.'}), 400
        except (TypeError, ValueError):
            return jsonify({'error': 'Total amount must be a valid number.'}), 400

    normalized_items = []
    total_amount = 0.0

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            for item in items:
                if not isinstance(item, dict):
                    return jsonify({'error': 'Each sale item must be a JSON object.'}), 400

                product_id = item.get('productId')
                quantity = item.get('quantity')
                unit_price = item.get('unitPrice')

                if product_id is None or quantity is None or unit_price is None:
                    return jsonify({'error': 'Each item requires productId, quantity, and unitPrice.'}), 400

                try:
                    product_id = int(product_id)
                    quantity = int(quantity)
                    unit_price = float(unit_price)
                except (TypeError, ValueError):
                    return jsonify({'error': 'Product ID, quantity, and unit price must be valid numbers.'}), 400

                if quantity <= 0:
                    return jsonify({'error': 'Quantity must be greater than 0.'}), 400
                if unit_price < 0:
                    return jsonify({'error': 'Unit price cannot be negative.'}), 400

                cursor.execute(
                    'SELECT product_id, sku, name, retail_price FROM products WHERE product_id = %s AND is_active = TRUE',
                    (product_id,),
                )
                product_row = cursor.fetchone()
                if product_row is None:
                    return jsonify({'error': f'Product {product_id} not found.'}), 404

                cursor.execute(
                    'SELECT inventory_id, stock_quantity, low_stock_level FROM inventory WHERE product_id = %s',
                    (product_id,),
                )
                inventory_row = cursor.fetchone()
                if inventory_row is None:
                    return jsonify({'error': f'Inventory not found for product {product_id}.'}), 404

                available_quantity = int(inventory_row[1])
                if quantity > available_quantity:
                    return jsonify({'error': f'Insufficient stock for product {product_id}. Available: {available_quantity}, requested: {quantity}.'}), 409

                subtotal = quantity * unit_price
                total_amount += subtotal
                normalized_items.append({
                    'product_id': product_id,
                    'product_name': product_row[2],
                    'sku': product_row[1],
                    'quantity': quantity,
                    'unit_price': unit_price,
                    'subtotal': subtotal,
                    'inventory_id': inventory_row[0],
                })

            if customer_id is not None:
                try:
                    customer_id = int(customer_id)
                except (TypeError, ValueError):
                    return jsonify({'error': 'Customer ID must be a valid integer.'}), 400

            if customer_id is None and customer_name and str(customer_name).strip():
                customer_id = ensure_customer_record(str(customer_name).strip(), phone=customer_phone or None)

            sale_number = f"SALE-{int(__import__('time').time())}"

            try:
                if customer_id is not None:
                    cursor.execute(
                        """
                        INSERT INTO sales (customer_id, customer_name, sale_number, total_amount, amount_paid, payment_method, status, sale_date)
                        VALUES (%s, %s, %s, %s, %s, %s, 'completed', NOW())
                        RETURNING sale_id, sale_number, total_amount, amount_paid, payment_method, status, sale_date, created_at, updated_at
                        """,
                        (customer_id, str(customer_name).strip() if customer_name else None, sale_number, total_amount, amount_paid, payment_method),
                    )
                else:
                    cursor.execute(
                        """
                        INSERT INTO sales (customer_name, sale_number, total_amount, amount_paid, payment_method, status, sale_date)
                        VALUES (%s, %s, %s, %s, %s, 'completed', NOW())
                        RETURNING sale_id, sale_number, total_amount, amount_paid, payment_method, status, sale_date, created_at, updated_at
                        """,
                        (str(customer_name).strip() if customer_name else None, sale_number, total_amount, amount_paid, payment_method),
                    )

                sale_row = cursor.fetchone()
                sale_id = sale_row[0]

                for item in normalized_items:
                    cursor.execute(
                        """
                        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (sale_id, item['product_id'], item['quantity'], item['unit_price'], item['subtotal']),
                    )

                    cursor.execute(
                        'SELECT stock_quantity, low_stock_level FROM inventory WHERE inventory_id = %s',
                        (item['inventory_id'],),
                    )
                    stock_row = cursor.fetchone()
                    current_quantity = int(stock_row[0])
                    low_stock_level = int(stock_row[1])
                    new_quantity = current_quantity - item['quantity']
                    if new_quantity < 0:
                        raise ValueError(f'Inventory quantity below zero for product {item["product_id"]}.')

                    new_status = get_inventory_status(new_quantity, low_stock_level)
                    cursor.execute(
                        """
                        UPDATE inventory
                        SET stock_quantity = %s,
                            stock_out = stock_out + %s,
                            product_status = %s,
                            updated_at = NOW()
                        WHERE inventory_id = %s
                        """,
                        (new_quantity, item['quantity'], new_status, item['inventory_id']),
                    )

                cursor.execute(
                    """
                    INSERT INTO payments (sale_id, payment_method, amount, status)
                    VALUES (%s, %s, %s, 'paid')
                    """,
                    (sale_id, payment_method, amount_paid),
                )
                connection.commit()
            except Exception as exc:
                connection.rollback()
                return jsonify({'error': f'Unable to complete sale: {str(exc)}'}), 500

            cursor.execute(
                """
                SELECT s.*, c.full_name AS customer_name
                FROM sales s
                LEFT JOIN customers c ON c.customer_id = s.customer_id
                WHERE s.sale_id = %s
                """,
                (sale_id,),
            )
            created_sale = sale_row_to_dict(cursor, cursor.fetchone())
            cursor.execute(
                """
                SELECT si.*, p.name AS product_name, p.sku
                FROM sale_items si
                JOIN products p ON p.product_id = si.product_id
                WHERE si.sale_id = %s
                ORDER BY si.sale_item_id ASC
                """,
                (sale_id,),
            )
            created_items = [sale_row_to_dict(cursor, item_row) for item_row in cursor.fetchall()]

    return jsonify(sale_to_dict(created_sale, created_items)), 201


@app.get('/api/customers')
def get_customers():
    search_query = request.args.get('q', '').strip()
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            if search_query:
                query = f"%{search_query.lower()}%"
                cursor.execute(
                    """
                    SELECT *
                    FROM customers
                    WHERE is_active = TRUE
                      AND (
                          LOWER(full_name) LIKE %s OR
                          LOWER(phone) LIKE %s OR
                          LOWER(email) LIKE %s
                      )
                    ORDER BY customer_id ASC
                    """,
                    (query, query, query),
                )
            else:
                cursor.execute('SELECT * FROM customers WHERE is_active = TRUE ORDER BY customer_id ASC')
            rows = cursor.fetchall()

    return jsonify([to_customer_dict(row) for row in rows])


@app.get('/api/customers/search')
def search_customers():
    return get_customers()


@app.get('/api/customers/<int:customer_id>')
def get_customer(customer_id):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute('SELECT * FROM customers WHERE customer_id = %s AND is_active = TRUE', (customer_id,))
            row = cursor.fetchone()

    if row is None:
        return jsonify({'error': 'Customer not found.'}), 404

    return jsonify(to_customer_dict(row))


@app.post('/api/customers')
def create_customer():
    payload = request.get_json(silent=True) or {}
    try:
        customer_data = normalize_customer_payload(payload)
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO customers (full_name, phone, email, address)
                VALUES (%s, %s, %s, %s)
                RETURNING *
                """,
                (
                    customer_data['full_name'],
                    customer_data['phone'] or None,
                    customer_data['email'] or None,
                    customer_data['address'] or None,
                ),
            )
            row = cursor.fetchone()
            connection.commit()

    return jsonify(to_customer_dict(row)), 201


@app.put('/api/customers/<int:customer_id>')
def update_customer(customer_id):
    payload = request.get_json(silent=True) or {}

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute('SELECT * FROM customers WHERE customer_id = %s AND is_active = TRUE', (customer_id,))
            existing = cursor.fetchone()
            if existing is None:
                return jsonify({'error': 'Customer not found.'}), 404

    try:
        customer_data = normalize_customer_payload(payload, update=True, existing=customer_row_to_dict(existing) or {})
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE customers
                SET full_name = %s,
                    phone = %s,
                    email = %s,
                    address = %s,
                    updated_at = NOW()
                WHERE customer_id = %s
                RETURNING *
                """,
                (
                    customer_data['full_name'],
                    customer_data['phone'] or None,
                    customer_data['email'] or None,
                    customer_data['address'] or None,
                    customer_id,
                ),
            )
            row = cursor.fetchone()
            connection.commit()

    return jsonify(to_customer_dict(row))


@app.get('/api/suppliers')
def get_suppliers():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute('SELECT * FROM suppliers WHERE is_active = TRUE ORDER BY supplier_id ASC')
            rows = cursor.fetchall()

    return jsonify([to_supplier_dict(row) for row in rows])


@app.get('/api/suppliers/<int:supplier_id>')
def get_supplier(supplier_id):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute('SELECT * FROM suppliers WHERE supplier_id = %s AND is_active = TRUE', (supplier_id,))
            row = cursor.fetchone()

    if row is None:
        return jsonify({'error': 'Supplier not found.'}), 404

    return jsonify(to_supplier_dict(row))


@app.post('/api/suppliers')
def create_supplier():
    payload = request.get_json(silent=True) or {}
    try:
        supplier_data = normalize_supplier_payload(payload)
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO suppliers (name, contact_name, phone, email, address)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    supplier_data['name'],
                    supplier_data['contact_name'] or None,
                    supplier_data['phone'] or None,
                    supplier_data['email'] or None,
                    supplier_data['address'] or None,
                ),
            )
            row = cursor.fetchone()
            connection.commit()

    return jsonify(to_supplier_dict(row)), 201


@app.put('/api/suppliers/<int:supplier_id>')
def update_supplier(supplier_id):
    payload = request.get_json(silent=True) or {}

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute('SELECT * FROM suppliers WHERE supplier_id = %s AND is_active = TRUE', (supplier_id,))
            existing = cursor.fetchone()
            if existing is None:
                return jsonify({'error': 'Supplier not found.'}), 404

    try:
        supplier_data = normalize_supplier_payload(payload, update=True, existing=supplier_row_to_dict(existing) or {})
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE suppliers
                SET name = %s,
                    contact_name = %s,
                    phone = %s,
                    email = %s,
                    address = %s,
                    updated_at = NOW()
                WHERE supplier_id = %s
                RETURNING *
                """,
                (
                    supplier_data['name'],
                    supplier_data['contact_name'] or None,
                    supplier_data['phone'] or None,
                    supplier_data['email'] or None,
                    supplier_data['address'] or None,
                    supplier_id,
                ),
            )
            row = cursor.fetchone()
            connection.commit()

    return jsonify(to_supplier_dict(row))


@app.get('/api/products/<int:product_id>/suppliers')
def get_product_suppliers(product_id):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT s.*
                FROM product_suppliers ps
                JOIN suppliers s ON s.supplier_id = ps.supplier_id
                WHERE ps.product_id = %s AND s.is_active = TRUE
                ORDER BY s.supplier_id ASC
                """,
                (product_id,),
            )
            rows = cursor.fetchall()

    return jsonify([to_supplier_dict(row) for row in rows])


@app.post('/api/products/<int:product_id>/suppliers')
def link_product_supplier(product_id):
    payload = request.get_json(silent=True) or {}
    supplier_id = payload.get('supplierId')
    notes = payload.get('notes', '')

    if supplier_id is None:
        return jsonify({'error': 'supplierId is required.'}), 400

    try:
        supplier_id = int(supplier_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'supplierId must be a valid integer.'}), 400

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute('SELECT product_id FROM products WHERE product_id = %s AND is_active = TRUE', (product_id,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Product not found.'}), 404

            cursor.execute('SELECT supplier_id FROM suppliers WHERE supplier_id = %s AND is_active = TRUE', (supplier_id,))
            if cursor.fetchone() is None:
                return jsonify({'error': 'Supplier not found.'}), 404

            cursor.execute(
                """
                INSERT INTO product_suppliers (product_id, supplier_id, notes)
                VALUES (%s, %s, %s)
                ON CONFLICT (product_id, supplier_id) DO UPDATE SET notes = EXCLUDED.notes
                RETURNING *
                """,
                (product_id, supplier_id, notes),
            )
            row = cursor.fetchone()
            connection.commit()

    return jsonify({'productId': product_id, 'supplierId': supplier_id, 'notes': notes, 'linked': True}), 201


@app.get('/api/dashboard')
@app.get('/api/dashboard/summary')
def dashboard_summary():
    return jsonify(build_dashboard_summary())


@app.get('/api/alerts')
@app.get('/api/alerts/low-stock')
def low_stock_alerts():
    return jsonify(get_inventory_alerts())


@app.get('/api/reports')
@app.get('/api/reports/summary')
def reports_summary():
    period = request.args.get('period', 'all')
    report_type = request.args.get('type', 'summary')
    category = request.args.get('category')
    return jsonify(build_reports_data(period=period, report_type=report_type, category=category))


@app.get('/api/settings')
def get_settings():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT business_name, currency, enable_low_stock_alerts, auto_save_sales_history, show_expiry_reminders FROM settings ORDER BY setting_id DESC LIMIT 1"
            )
            row = cursor.fetchone()
            if row is None:
                return jsonify({
                    'businessName': 'ShopTrack Retail',
                    'currency': 'NGN',
                    'enableLowStockAlerts': True,
                    'autoSaveSalesHistory': True,
                    'showExpiryReminders': True
                })
            return jsonify({
                'businessName': row[0],
                'currency': row[1],
                'enableLowStockAlerts': row[2],
                'autoSaveSalesHistory': row[3],
                'showExpiryReminders': row[4]
            })


@app.post('/api/settings')
def save_settings():
    payload = request.get_json(silent=True) or {}
    business_name = str(payload.get('businessName', 'ShopTrack Retail')).strip() or 'ShopTrack Retail'
    currency = str(payload.get('currency', 'NGN')).strip().upper() or 'NGN'
    enable_low_stock_alerts = bool(payload.get('enableLowStockAlerts', True))
    auto_save_sales_history = bool(payload.get('autoSaveSalesHistory', True))
    show_expiry_reminders = bool(payload.get('showExpiryReminders', True))

    # Force auto_save_sales_history to True to prevent data loss
    auto_save_sales_history = True

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO settings (business_name, currency, enable_low_stock_alerts, auto_save_sales_history, show_expiry_reminders, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                """,
                (business_name, currency, enable_low_stock_alerts, auto_save_sales_history, show_expiry_reminders),
            )
            connection.commit()

    return jsonify({
        'businessName': business_name,
        'currency': currency,
        'enableLowStockAlerts': enable_low_stock_alerts,
        'autoSaveSalesHistory': auto_save_sales_history,
        'showExpiryReminders': show_expiry_reminders,
        'message': 'Settings saved successfully'
    }), 201


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
