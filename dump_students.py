from dotenv import load_dotenv
import os
from supabase import create_client
load_dotenv()
s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
r = s.table('students').select('enrollment, name').execute()
for student in r.data:
    print(f"Enrollment: '{student['enrollment']}', Name: '{student['name']}'")
