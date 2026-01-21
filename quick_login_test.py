import requests

r = requests.post('http://localhost:3001/api/auth/login', json={'username':'admin','password':'admin123'})
print(f"Status: {r.status_code}")
print(f"Response: {r.text}")