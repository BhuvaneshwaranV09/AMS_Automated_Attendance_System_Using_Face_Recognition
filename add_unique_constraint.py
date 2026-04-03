import psycopg2
from dotenv import load_dotenv
import os
load_dotenv()

try:
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    # Try to add unique constraint. If it fails due to existing duplicates, we might need to clean them first.
    # conname: unique_attendance_per_day
    print("Checking for existing duplicates...")
    cur.execute("""
        DELETE FROM attendance a
        USING attendance b
        WHERE a.id < b.id
        AND a.enrollment = b.enrollment
        AND a.subject = b.subject
        AND a.date = b.date
    """)
    print(f"Deleted {cur.rowcount} duplicates.")
    
    print("Adding unique constraint...")
    cur.execute("""
        ALTER TABLE attendance 
        ADD CONSTRAINT unique_attendance_per_day 
        UNIQUE (enrollment, subject, date)
    """)
    conn.commit()
    print("Unique constraint added successfully.")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cur' in locals(): cur.close()
    if 'conn' in locals(): conn.close()
