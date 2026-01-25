
import os
import requests
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000"

def test_add_instructor():
    payload = {
        "name": "Test Instructor",
        "email": "test_instr@example.com",
        "password": "password123",
        "subjects": ["New Subject A", "Mathematics"]
    }
    
    print(f"Adding instructor with subjects: {payload['subjects']}")
    response = requests.post(f"{BASE_URL}/api/admin/instructors", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    test_add_instructor()
