
import requests

def test_instructor_subjects(email):
    url = f"http://127.0.0.1:8000/api/instructor/subjects?email={email}"
    print(f"Testing URL: {url}")
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        print(f"Data: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_instructor_subjects("kanni12@gmail.com")
    test_instructor_subjects("bv12@gmail.com")
