from dotenv import load_dotenv
import os
load_dotenv()
from supabase import create_client

s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
s.table('attendance').delete().neq('id', 0).execute()
s.table('students').delete().neq('id', 0).execute()
s.table('students').insert({'enrollment': 'RA243224010016', 'name': 'Vennilavan'}).execute()
print('Database reset. Student RA243224010016 added.')
