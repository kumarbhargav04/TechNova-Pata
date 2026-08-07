import sys
import os
import csv
import urllib.request
import ssl

try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass

# Add parent directory to sys.path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.db import init_db, SessionLocal, PincodeMaster

PINCODE_DATASET_URLS = [
    "https://raw.githubusercontent.com/dropdevrahul/pincodes-india/main/pincode.csv",
    "https://raw.githubusercontent.com/sanand0/pincode/master/data/IN.csv"
]

def download_pincodes_csv(target_path: str) -> bool:
    print("Checking for All India Pincode Directory CSV...")
    if os.path.exists(target_path):
        print(f"Dataset already exists locally at: {target_path}")
        return True
        
    print("Dataset not found locally. Attempting programmatic download from public open-data mirrors...")
    for url in PINCODE_DATASET_URLS:
        try:
            print(f"Downloading from: {url} ...")
            # Set a timeout of 15 seconds
            with urllib.request.urlopen(url, timeout=15) as response:
                with open(target_path, 'wb') as out_file:
                    out_file.write(response.read())
            print(f"Successfully downloaded All India Pincode Directory CSV to: {target_path}")
            return True
        except Exception as e:
            print(f"Failed to download from {url}: {e}")
            
    print("Could not download original dataset from any mirror. Falling back to local default seeding...")
    return False

def seed():
    print("Initializing Database Schema...")
    # Drop old table to update schema to multi-office per pincode support
    from app.database.db import engine
    try:
        PincodeMaster.__table__.drop(bind=engine, checkfirst=True)
    except Exception as e:
        print(f"Note: Could not drop old table (expected if it does not exist): {e}")
    init_db()
    
    db = SessionLocal()
    
    # Check if database is already seeded
    pincode_count = db.query(PincodeMaster).count()
    if pincode_count > 100:
        print(f"Database already seeded with {pincode_count} pincodes. Skipping...")
        db.close()
        return
    else:
        # Clear out the small mock list to re-seed properly
        db.query(PincodeMaster).delete()
        db.commit()

    # Set up datasets folder
    datasets_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "datasets")
    os.makedirs(datasets_dir, exist_ok=True)
    csv_path = os.path.join(datasets_dir, "pincode_directory.csv")
    
    # Attempt download
    download_success = download_pincodes_csv(csv_path)
    
    if download_success and os.path.exists(csv_path):
        print(f"Parsing & seeding original database records from: {csv_path}")
        try:
            with open(csv_path, mode='r', encoding='utf-8') as f:
                # Read first few bytes to sniff dialect/headers
                sample = f.read(2048)
                f.seek(0)
                
                # Check header keys
                dialect = csv.Sniffer().sniff(sample)
                reader = csv.DictReader(f, dialect=dialect)
                
                count = 0
                for row in reader:
                    # Clean and standardize keys (convert keys to lowercase)
                    cleaned_row = {k.lower().strip() if k else "": v.strip() if v else "" for k, v in row.items()}
                    
                    pincode = cleaned_row.get("pincode", cleaned_row.get("postal code", "")).strip()
                    office = cleaned_row.get("office", cleaned_row.get("officename", cleaned_row.get("place name", ""))).strip()
                    district = cleaned_row.get("district", cleaned_row.get("districtname", cleaned_row.get("admin name2", ""))).strip()
                    state = cleaned_row.get("state", cleaned_row.get("statename", cleaned_row.get("admin name1", ""))).strip()
                    
                    lat_str = cleaned_row.get("latitude", cleaned_row.get("lat", "0.0"))
                    lon_str = cleaned_row.get("longitude", cleaned_row.get("lng", cleaned_row.get("lon", "0.0")))
                    
                    try:
                        lat = float(lat_str) if lat_str else 0.0
                        lon = float(lon_str) if lon_str else 0.0
                    except ValueError:
                        continue
                        
                    if not pincode or lat == 0.0 or lon == 0.0:
                        continue
                        
                    pm = PincodeMaster(
                        pincode=pincode,
                        office=office,
                        district=district,
                        state=state,
                        latitude=lat,
                        longitude=lon
                    )
                    db.add(pm)
                    count += 1
                    
                    # Commit in batches of 1000 for memory efficiency
                    if count % 2000 == 0:
                        db.commit()
                        print(f"Seeded {count} rows...")
                        
                db.commit()
                print(f"Successfully seeded {count} records from the original All India Pincode Directory!")
                db.close()
                return
        except Exception as e:
            print(f"Error parsing CSV file: {e}. Falling back to default seeding list.")

    # Seeding major test key hubs (fallback)
    pincodes = [
        # Andhra Pradesh
        {"pincode": "521001", "office": "Machilipatnam H.O", "district": "Krishna", "state": "Andhra Pradesh", "latitude": 16.1824, "longitude": 81.1352},
        {"pincode": "521002", "office": "Machilipatnam Chilakalapudi S.O", "district": "Krishna", "state": "Andhra Pradesh", "latitude": 16.1950, "longitude": 81.1550},
        {"pincode": "520010", "office": "Vijayawada Patamata S.O (Benz Circle)", "district": "Krishna", "state": "Andhra Pradesh", "latitude": 16.5062, "longitude": 80.6480},
        {"pincode": "520001", "office": "Vijayawada H.O", "district": "Krishna", "state": "Andhra Pradesh", "latitude": 16.5150, "longitude": 80.6150},
        {"pincode": "522001", "office": "Guntur H.O", "district": "Guntur", "state": "Andhra Pradesh", "latitude": 16.3067, "longitude": 80.4365},
        {"pincode": "530001", "office": "Visakhapatnam H.O", "district": "Visakhapatnam", "state": "Andhra Pradesh", "latitude": 17.6868, "longitude": 83.2185},
        {"pincode": "530017", "office": "Visakhapatnam Port Trust S.O", "district": "Visakhapatnam", "state": "Andhra Pradesh", "latitude": 17.7010, "longitude": 83.2980},
        {"pincode": "517501", "office": "Tirupati H.O", "district": "Chittoor", "state": "Andhra Pradesh", "latitude": 13.6288, "longitude": 79.4192},
        {"pincode": "524001", "office": "Nellore H.O", "district": "Nellore", "state": "Andhra Pradesh", "latitude": 14.4426, "longitude": 79.9864},
        {"pincode": "533001", "office": "Kakinada H.O", "district": "East Godavari", "state": "Andhra Pradesh", "latitude": 16.9891, "longitude": 82.2475},
        {"pincode": "533101", "office": "Rajahmundry H.O", "district": "East Godavari", "state": "Andhra Pradesh", "latitude": 17.0005, "longitude": 81.7878},
        {"pincode": "518001", "office": "Kurnool H.O", "district": "Kurnool", "state": "Andhra Pradesh", "latitude": 15.8281, "longitude": 78.0373},
        {"pincode": "515001", "office": "Anantapur H.O", "district": "Anantapur", "state": "Andhra Pradesh", "latitude": 14.6819, "longitude": 77.6006},
        {"pincode": "516001", "office": "Kadapa H.O", "district": "Cuddapah", "state": "Andhra Pradesh", "latitude": 14.4713, "longitude": 78.8243},
        {"pincode": "534001", "office": "Eluru H.O", "district": "West Godavari", "state": "Andhra Pradesh", "latitude": 16.7107, "longitude": 81.1026},
        {"pincode": "523001", "office": "Ongole H.O", "district": "Prakasam", "state": "Andhra Pradesh", "latitude": 15.5057, "longitude": 80.0499},

        # Hyderabad
        {"pincode": "500035", "office": "Kothapet S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.3732, "longitude": 78.5476},
        {"pincode": "500038", "office": "Ameerpet S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.4375, "longitude": 78.4482},
        {"pincode": "500081", "office": "Madhapur S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.4483, "longitude": 78.3741},
        {"pincode": "500032", "office": "Gachibowli S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.4401, "longitude": 78.3489},
        {"pincode": "500045", "office": "Yousufguda S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.4368, "longitude": 78.4304},
        {"pincode": "500033", "office": "Jubilee Hills S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.4319, "longitude": 78.4018},
        {"pincode": "500082", "office": "Punjagutta S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.4265, "longitude": 78.4526},
        {"pincode": "500003", "office": "Secunderabad H.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.4399, "longitude": 78.4983},
        {"pincode": "500072", "office": "Kukatpally S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.4875, "longitude": 78.3953},
        {"pincode": "500085", "office": "JNTU Kukatpally S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.5012, "longitude": 78.3885},
        {"pincode": "500095", "office": "Kothi S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.3828, "longitude": 78.4841},
        {"pincode": "500002", "office": "Charminar S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.3616, "longitude": 78.4747},
        {"pincode": "500001", "office": "Hyderabad G.P.O.", "district": "Hyderabad", "state": "Telangana", "latitude": 17.3892, "longitude": 78.4754},
        {"pincode": "500020", "office": "Ram Nagar S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.4121, "longitude": 78.5032},
        {"pincode": "500016", "office": "Begumpet S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.4412, "longitude": 78.4613},
        {"pincode": "500028", "office": "Mehdipatnam S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.3917, "longitude": 78.4354},
        {"pincode": "500024", "office": "Darulshifa S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.3681, "longitude": 78.4890},
        {"pincode": "500063", "office": "Khairatabad S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.4132, "longitude": 78.4589},
        {"pincode": "500004", "office": "Saifabad S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.4042, "longitude": 78.4667},
        {"pincode": "500096", "office": "Film Nagar S.O", "district": "Hyderabad", "state": "Telangana", "latitude": 17.4150, "longitude": 78.3995},
        
        # Delhi
        {"pincode": "110006", "office": "Delhi G.P.O.", "district": "Central Delhi", "state": "Delhi", "latitude": 28.6562, "longitude": 77.2307},
        {"pincode": "110017", "office": "Saket S.O", "district": "South Delhi", "state": "Delhi", "latitude": 28.5244, "longitude": 77.2066},
        {"pincode": "110019", "office": "Kalkaji S.O (CR Park)", "district": "South Delhi", "state": "Delhi", "latitude": 28.5365, "longitude": 77.2514},
        {"pincode": "110016", "office": "Green Park S.O", "district": "South West Delhi", "state": "Delhi", "latitude": 28.5589, "longitude": 77.2028},
        {"pincode": "110085", "office": "Rohini S.O", "district": "North West Delhi", "state": "Delhi", "latitude": 28.7161, "longitude": 77.1171},
        
        # Bangalore
        {"pincode": "560066", "office": "Whitefield S.O", "district": "Bangalore", "state": "Karnataka", "latitude": 12.9698, "longitude": 77.7499},
        {"pincode": "560038", "office": "Indiranagar S.O", "district": "Bangalore", "state": "Karnataka", "latitude": 12.9719, "longitude": 77.6412},
        {"pincode": "560095", "office": "Koramangala S.O", "district": "Bangalore", "state": "Karnataka", "latitude": 12.9352, "longitude": 77.6244},
        
        # Noida
        {"pincode": "201301", "office": "Noida Sector 62 S.O", "district": "Gautam Buddha Nagar", "state": "Uttar Pradesh", "latitude": 28.6186, "longitude": 77.3725},
        
        # Mumbai
        {"pincode": "400050", "office": "Bandra West S.O", "district": "Mumbai", "state": "Maharashtra", "latitude": 19.0544, "longitude": 72.8402},
        {"pincode": "400001", "office": "Mumbai G.P.O.", "district": "Mumbai", "state": "Maharashtra", "latitude": 18.9322, "longitude": 72.8354},
        
        # Punjab
        {"pincode": "143001", "office": "Amritsar H.O", "district": "Amritsar", "state": "Punjab", "latitude": 31.6340, "longitude": 74.8723}
    ]
    
    print(f"Seeding {len(pincodes)} default key hubs into PINCODE_MASTER...")
    for p in pincodes:
        pm = PincodeMaster(**p)
        db.add(pm)
        
    db.commit()
    db.close()
    print("Database default seeding completed successfully.")

if __name__ == "__main__":
    seed()
