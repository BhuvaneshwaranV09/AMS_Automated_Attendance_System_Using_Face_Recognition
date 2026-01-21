import requests

r = requests.post('http://localhost:8000/api/students/capture', json={
    'enrollment': 'TEST001', 
    'name': 'Test', 
    'num_images': 5
}, timeout=120)
print(f"Status: {r.status_code}")
try:
    print(f"Response: {r.json()}")
except:
    print(f"Response text: {r.text}")
