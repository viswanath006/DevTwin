# User Repository - FIXED
import sqlite3
from typing import Optional

def find_user_by_id(user_id: int) -> Optional[dict]:
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    # Fix: use correct column name 'id' instead of 'user_id'
    cursor.execute('SELECT id, email FROM users WHERE id = ?', (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {'id': row[0], 'email': row[1]}
