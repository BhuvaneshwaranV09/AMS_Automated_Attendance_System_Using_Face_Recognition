import requests
import json

BASE_URL = "http://localhost:8000"

def test_add_instructor():
    payload = {
        "name": "Test Instructor",
        "email": "test_instr@example.com",
        "password": "password123",
        "subjects": ["Mathematics", "New Subject " + str(json.dumps(True))] # Mix of existing and new
    }
    
    response = requests.post(f"{BASE_URL}/api/admin/instructors", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    test_add_instructor()
