import requests
import time
import sys

payload = {
    "roll_number": "2411200010023",
    "student_name": "UJJWAL KUMAR",
    "university_name": "SISTER NIVEDITA UNIVERSITY",
    "degree": "BACHELOR OF TECHNOLOGY (COMPUTER SCIENCE & ENGINEERING) (ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING)",
    "file_hash": "c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890"
}

print("Waiting for backend to be ready...")
for i in range(30):
    try:
        r = requests.get("http://localhost:8000/")
        if r.status_code == 200:
            print("Backend ready!")
            break
    except:
        pass
    time.sleep(2)
else:
    print("Backend failed to start")
    sys.exit(1)

print("Issuing certificate...")
try:
    response = requests.post("http://localhost:8000/api/issue", json=payload)
    print("Status:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error:", e)
