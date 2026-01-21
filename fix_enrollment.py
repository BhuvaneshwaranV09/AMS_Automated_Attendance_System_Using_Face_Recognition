from dotenv import load_dotenv
import os
load_dotenv()

from supabase import create_client

s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

print("Before update:")
r = s.table('students').select('*').execute()
for student in r.data:
    print(f"  {student}")

r = s.table('students').update({'enrollment': '02'}).eq('enrollment', '01').execute()
print(f"\nUpdated: {r.data}")

print("\nAfter update:")
r = s.table('students').select('*').execute()
for student in r.data:
    print(f"  {student}")
