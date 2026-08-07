import urllib.request
import ssl
import os

ssl._create_default_https_context = ssl._create_unverified_context

url = "https://raw.githubusercontent.com/santhosh-s/indian-pincodes/master/pincodes.csv"
target = "test_download.csv"

try:
    print(f"Downloading from {url}...")
    with urllib.request.urlopen(url, timeout=15) as response:
        with open(target, 'wb') as f:
            f.write(response.read())
    print("Download success!")
    print(f"File size: {os.path.getsize(target)} bytes")
    os.remove(target)
except Exception as e:
    print(f"Download failed: {e}")
