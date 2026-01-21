import requests

BASE_URL = "http://localhost:3001"

print("Testing Express.js endpoints (proxying to FastAPI)...")

print("\n1. Root endpoint:")
r = requests.get(f"{BASE_URL}/")
print(r.json())

print("\n2. Health check:")
r = requests.get(f"{BASE_URL}/health")
print(r.json())

print("\n3. Get students:")
r = requests.get(f"{BASE_URL}/api/students")
print(r.json())

print("\n4. Get attendance:")
r = requests.get(f"{BASE_URL}/api/attendance")
print(r.json())

print("\n5. Login test:")
r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "admin", "password": "admin123"})
print(r.json())

print("\n6. Login with wrong password:")
r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "admin", "password": "wrong"})
print(r.status_code, r.json())

print("\nAll Express.js tests completed!")
