import psycopg2
from dotenv import load_dotenv
import os
load_dotenv()

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

cur.execute('ALTER TABLE attendance DROP CONSTRAINT attendance_enrollment_fkey')
conn.commit()
print('Foreign key constraint dropped successfully!')

cur.close()
conn.close()
