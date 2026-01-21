from dotenv import load_dotenv
import os
load_dotenv()

from supabase import create_client

s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

print("--- Students in database ---")
r = s.table('students').select('*').execute()
for student in r.data:
    print(f"  Enrollment: '{student['enrollment']}', Name: '{student['name']}'")

print("\n--- Files in TrainingImage ---")
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent
TRAINING_IMAGE_DIR = BASE_DIR / "TrainingImage"
files = list(TRAINING_IMAGE_DIR.glob("*.jpg"))[:5]
for f in files:
    print(f"  {f.name}")
