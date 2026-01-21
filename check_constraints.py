import psycopg2
from dotenv import load_dotenv
import os
load_dotenv()

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

cur.execute("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'attendance'::regclass")
print("Constraints on attendance table:")
for row in cur.fetchall():
    print(row)

cur.close()
conn.close()
