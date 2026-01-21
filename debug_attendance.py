from dotenv import load_dotenv
import os
load_dotenv()

from supabase import create_client

print("SUPABASE_URL:", os.getenv('SUPABASE_URL'))

s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

print("\n--- Checking attendance table ---")
try:
    r = s.table('attendance').select('*').execute()
    print(f"Found {len(r.data)} attendance records:")
    for rec in r.data:
        print(rec)
except Exception as e:
    print(f"Error: {e}")

print("\n--- Testing insert ---")
try:
    r = s.table('attendance').insert({
        "enrollment": "TEST001",
        "name": "Test Student",
        "subject": "Test Subject",
        "date": "2026-01-20",
        "time": "10:00:00"
    }).execute()
    print(f"Insert success: {r.data}")
except Exception as e:
    print(f"Insert error: {e}")

print("\n--- Checking again ---")
r = s.table('attendance').select('*').execute()
print(f"Found {len(r.data)} attendance records after insert")
