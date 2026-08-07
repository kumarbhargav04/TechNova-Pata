import httpx
import math
from typing import Tuple, List, Dict

async def calculate_street_route(lat1: float, lon1: float, lat2: float, lon2: float) -> Tuple[float, List[List[float]], Dict]:
    """
    Queries public OSRM (Open Source Routing Machine) API to fetch real street routing coordinates,
    distance, and durations, with a robust geodetic fallback if the OSRM service is unavailable.
    """
    osrm_url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson"
    
    distance_km = 0.0
    geometry = []
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(osrm_url, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    # OSRM distance is in meters, convert to km
                    distance_km = round(route["distance"] / 1000.0, 2)
                    
                    # Convert OSRM GeoJSON coords [lon, lat] -> Leaflet expected [lat, lon]
                    raw_coords = route["geometry"]["coordinates"]
                    geometry = [[float(c[1]), float(c[0])] for c in raw_coords]
                    
    except Exception as e:
        print(f"[Routing Agent] OSRM live routing failed: {e}. Falling back to geodetic curve.")
        
    # Geodetic / Great Circle Fallback if OSRM is down
    if not geometry:
        # Haversine distance
        R = 6371.0 # Earth radius in km
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        
        a = math.sin(delta_phi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(delta_lambda/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance_km = round(R * c, 2)
        
        # Build curved road simulation points (Bézier quadratic curve)
        # Midpoint
        mid_lat = (lat1 + lat2) / 2.0
        mid_lon = (lon1 + lon2) / 2.0
        
        # Add offset perpendicular to the line to simulate road bends
        lat_offset = (lon2 - lon1) * 0.15
        lon_offset = -(lat2 - lat1) * 0.15
        control_lat = mid_lat + lat_offset
        control_lon = mid_lon + lon_offset
        
        steps = 40
        for i in range(steps + 1):
            t = i / steps
            # Bezier formula
            curr_lat = (1 - t)**2 * lat1 + 2 * (1 - t) * t * control_lat + t**2 * lat2
            curr_lon = (1 - t)**2 * lon1 + 2 * (1 - t) * t * control_lon + t**2 * lon2
            geometry.append([round(curr_lat, 6), round(curr_lon, 6)])

    # Ensure distance is positive
    if distance_km <= 0.05:
        distance_km = 0.1

    # Calculate travel metrics for different modes
    # Speed is in km/h
    # traffic factor adds congestion delay
    modes = {
        "Truck": {
            "speed_kph": 35,
            "traffic_factor": 1.25,
            "label": "Medium Duty EV Truck",
            "icon": "truck"
        },
        "Two-Wheeler": {
            "speed_kph": 45,
            "traffic_factor": 1.1,
            "label": "Delivery Electric Scooter",
            "icon": "bike"
        },
        "Auto-Rickshaw": {
            "speed_kph": 28,
            "traffic_factor": 1.3,
            "label": "Commercial Auto Cargo",
            "icon": "auto"
        },
        "Drone (Aerial)": {
            "speed_kph": 75,
            "traffic_factor": 1.0,
            "label": "Autonomous Aerial Drone",
            "icon": "drone"
        },
        "Walking Courier": {
            "speed_kph": 5,
            "traffic_factor": 1.05,
            "label": "On-Foot Delivery Agent",
            "icon": "walk"
        }
    }
    
    modes_calculated = {}
    for mode, params in modes.items():
        # Duration = Distance / Speed
        # Convert hours to minutes
        raw_time = (distance_km / params["speed_kph"]) * 60.0
        # Drone travels straight line, others follow road geometry distance multiplier
        if mode == "Drone (Aerial)":
            # Direct distance is typically shorter than street distance
            drone_dist = distance_km * 0.8
            raw_time = (drone_dist / params["speed_kph"]) * 60.0
            
        time_mins = math.ceil(raw_time * params["traffic_factor"])
        # Ensure minimum 1 minute
        if time_mins < 1:
            time_mins = 1
            
        modes_calculated[mode] = {
            "label": params["label"],
            "time_mins": time_mins,
            "avg_speed_kph": params["speed_kph"],
            "carbon_emissions_g": 0 if "EV" in params["label"] or "Electric" in params["label"] or "Drone" in params["label"] or "On-Foot" in params["label"] else round(distance_km * 120, 1)
        }

    return distance_km, geometry, modes_calculated
