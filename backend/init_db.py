import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import psycopg
from psycopg import sql
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'))

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', '5432'))
DB_NAME = os.getenv('DB_NAME', 'shoptrack')
DB_USER = os.getenv('DB_USER', 'shoptrack')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'shoptrack')


def get_admin_connection():
    return psycopg.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname='postgres',
        user=DB_USER,
        password=DB_PASSWORD,
        connect_timeout=5,
        autocommit=True,
    )


def ensure_role_and_database():
    conn = get_admin_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (DB_USER,))
        if cur.fetchone() is None:
            cur.execute(
                sql.SQL("CREATE ROLE {} WITH LOGIN PASSWORD %s CREATEDB CREATEROLE").format(
                    sql.Identifier(DB_USER)
                ),
                (DB_PASSWORD,),
            )

        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_NAME,))
        if cur.fetchone() is None:
            cur.execute(
                sql.SQL("CREATE DATABASE {} OWNER {}").format(
                    sql.Identifier(DB_NAME),
                    sql.Identifier(DB_USER),
                )
            )

    conn.close()


def create_schema():
    conn = psycopg.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        connect_timeout=5,
        autocommit=True,
    )
    with open(os.path.join(BASE_DIR, 'schema.sql'), 'r', encoding='utf-8') as file:
        schema_sql = file.read()

    with conn.cursor() as cur:
        cur.execute(schema_sql)
    conn.close()


if __name__ == '__main__':
    ensure_role_and_database()
    create_schema()
    print('Database and schema initialized successfully.')
