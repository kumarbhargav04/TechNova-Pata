import urllib.request
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

url = "https://raw.githubusercontent.com/santhosh-s/indian-pincodes/master/pincodes.csv"

try:
    print(f"Testing download from {url}...")
    with urllib.request.urlopen(url, timeout=15) as response:
        head = response.read(1024).decode('utf-8')
        print("First 1024 bytes of downloaded CSV:")
        print(head)
except Exception as e:
    print(f"Failed: {e}")
