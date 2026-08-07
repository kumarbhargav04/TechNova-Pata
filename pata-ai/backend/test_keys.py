import os
import requests
from dotenv import load_dotenv

# Load env file
load_dotenv()

locationiq_key = os.getenv("LOCATIONIQ_API_KEY")
opencage_key = os.getenv("OPENCAGE_API_KEY")

print(f"LocationIQ key: {locationiq_key}")
print(f"OpenCage key: {opencage_key}")

test_queries = [
    "KFC Machilipatnam 521001",
    "Ameerpet Metro Station Hyderabad 500038"
]

print("\n--- Testing LocationIQ ---")
if locationiq_key:
    for q in test_queries:
        url = "https://us1.locationiq.com/v1/search.php"
        params = {
            "key": locationiq_key,
            "q": f"{q}, India",
            "format": "json",
            "limit": 1
        }
        try:
            r = requests.get(url, params=params, timeout=5)
            print(f"Query: {q} | Status: {r.status_code}")
            if r.status_code == 200:
                print("Result:", r.json()[0]["display_name"], "(Lat:", r.json()[0]["lat"], "Lon:", r.json()[0]["lon"], ")")
            else:
                print("Error Details:", r.text)
        except Exception as e:
            print("LocationIQ failed:", e)
else:
    print("No LocationIQ API key found in .env")

print("\n--- Testing OpenCage ---")
if opencage_key:
    for q in test_queries:
        url = "https://api.opencagedata.com/geocode/v1/json"
        params = {
            "key": opencage_key,
            "q": q,
            "countrycode": "in",
            "limit": 1
        }
        try:
            r = requests.get(url, params=params, timeout=5)
            print(f"Query: {q} | Status: {r.status_code}")
            if r.status_code == 200:
                results = r.json().get("results", [])
                if results:
                    print("Result:", results[0]["formatted"], "(Lat:", results[0]["geometry"]["lat"], "Lon:", results[0]["geometry"]["lng"], ")")
                else:
                    print("No results returned.")
            else:
                print("Error Details:", r.text)
        except Exception as e:
            print("OpenCage failed:", e)
else:
    print("No OpenCage API key found in .env")
