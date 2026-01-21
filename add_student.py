from dotenv import load_dotenv
import os
load_dotenv()

from supabase import create_client

s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
r = s.table('students').insert({'enrollment': '02', 'name': 'Vennilavan'}).execute()
print('Added:', r.data)
