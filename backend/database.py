import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import psycopg

from config import Config


def get_db_connection():
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        return psycopg.connect(
            database_url,
            connect_timeout=5
        )

    return psycopg.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        dbname=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        connect_timeout=5
    )


def test_db_connection():
    connection = get_db_connection()
    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')
    connection.close()
    return True
