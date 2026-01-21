import requests
r = requests.get("http://localhost:8000/")
print(r.json())
r2 = requests.post("http://localhost:8000/api/auth/login", json={"username": "admin", "password": "admin123"})
print(r2.json())
