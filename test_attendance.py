from dotenv import load_dotenv
import os
load_dotenv()

from supabase import create_client

s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

print("Testing attendance table...")
try:
    r = s.table('attendance').select('*').limit(5).execute()
    print("Attendance records:", r.data)
except Exception as e:
    print("Error:", e)

print("\nTesting insert...")
try:
    r = s.table('attendance').insert({
        "enrollment": "TEST123",
        "name": "Test Student",
        "subject": "Test Subject",
        "date": "2026-01-20",
        "time": "10:00:00"
    }).execute()
    print("Insert result:", r.data)
except Exception as e:
    print("Insert error:", e)
