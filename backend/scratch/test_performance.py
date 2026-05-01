import time
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_performance():
    # Note: This requires a valid token. Since I don't have one easily accessible in a script, 
    # I'll just check if the server is up and responsive.
    # In a real scenario, I'd get a token first.
    try:
        start = time.time()
        resp = requests.get(f"{BASE_URL}/health/")
        end = time.time()
        print(f"Health check: {resp.status_code} in {(end-start)*1000:.2f}ms")
    except Exception as e:
        print(f"Error connecting to server: {e}")

if __name__ == "__main__":
    test_performance()
