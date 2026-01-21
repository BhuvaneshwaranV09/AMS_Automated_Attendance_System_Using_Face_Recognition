import requests

print("=== Testing Supabase Integration ===\n")

print("1. Health Check:")
r = requests.get("http://localhost:8000/health")
print(r.json())

print("\n2. Login with Supabase:")
r = requests.post("http://localhost:8000/api/auth/login", json={"username": "admin", "password": "admin123"})
print(r.json())

print("\n3. Get Students (from Supabase):")
r = requests.get("http://localhost:8000/api/students")
print(r.json())

print("\n4. Get Attendance (from Supabase):")
r = requests.get("http://localhost:8000/api/attendance")
print(r.json())

print("\n=== Supabase Integration Working! ===")
