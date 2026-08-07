import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes distance in meters between two points using the Haversine formula.
    """
    if None in (lat1, lon1, lat2, lon2):
        return float('inf')
        
    R = 6371000 # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2)**2 + math.cos(phi1)*math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def rank_candidates(
    parsed_address: dict, 
    pincode_info: dict, 
    landmarks: list, 
    lang_info: dict, 
    evidence_callback
) -> list:
    """
    Generates and ranks geo-coordinates candidates using the weighted formula:
    - Landmark match: 40%
    - Pincode match: 25%
    - Locality match: 20%
    - Language understanding: 15%
    """
    candidates = []
    
    # 1. Landmark Candidates (Strongest)
    for index, lm in enumerate(landmarks):
        lat = lm["latitude"]
        lon = lm["longitude"]
        
        # Calculate distance to pincode centroid
        pin_dist = haversine_distance(lat, lon, pincode_info["latitude"], pincode_info["longitude"])
        
        # Calculate sub-scores
        # Landmark score: maximum 40. Scale by semantic similarity match to target landmark.
        import difflib
        landmark_target = parsed_address.get("landmark")
        if landmark_target:
            clean_target = landmark_target.lower().replace("opposite", "").replace("near", "").replace("behind", "").replace("beside", "").strip()
            clean_lm_name = lm["name"].lower().replace("opposite", "").replace("near", "").replace("behind", "").replace("beside", "").strip()
            ratio = difflib.SequenceMatcher(None, clean_target, clean_lm_name).ratio()
            
            # Penalize generic area boundary centroids
            category_lower = lm.get("category", "").lower()
            is_generic = category_lower in ["city", "administrative", "state", "country", "postcode", "county", "region", "district", "suburb", "locality", "neighbourhood"]
            
            if is_generic:
                lm_score = 10.0
            elif ratio >= 0.7:
                lm_score = 40.0
            elif ratio >= 0.4:
                lm_score = 25.0
            else:
                lm_score = 10.0
        else:
            lm_score = 20.0
        print(f"[Ranking Agent Debug] Landmark: {lm['name']}, Category: {lm.get('category')}, Score: {lm_score}")
        
        # Pincode score: maximum 25. Deduct if it's very far from the pincode centroid.
        if pin_dist == float('inf'):
            pin_score = 10.0  # missing pincode fallback
        elif pin_dist <= 1500:
            pin_score = 25.0
        elif pin_dist <= 3000:
            pin_score = 18.0
        else:
            pin_score = 10.0
            
        # Locality score: maximum 20. High if it's within pincode bounds.
        loc_score = 20.0 if pin_dist <= 2500 else 12.0
        
        # Language score: maximum 15. Based on clean translation.
        lang_score = 15.0 if lang_info["language"] != "Failed" else 8.0
        
        total_score = lm_score + pin_score + loc_score + lang_score
        
        candidates.append({
            "name": lm["name"],
            "latitude": lat,
            "longitude": lon,
            "confidence": total_score,
            "type": "Landmark-Based Geocode",
            "source": lm["source"],
            "evidence": [
                f"Landmark '{lm['name']}' found ({lm['source']})",
                f"Pincode matched within {int(pin_dist)}m of centroid" if pin_dist != float('inf') else "No pincode centroid reference",
                f"Language model parsed successfully ({lang_info['language']})"
            ]
        })

    # 2. Pincode Centroid Candidate (Fallback if no landmarks)
    if pincode_info["latitude"] and pincode_info["longitude"]:
        # If we have landmarks, this is a weaker option.
        # If no landmarks, this is our only option.
        lm_score = 0.0  # No landmark verified
        pin_score = 25.0  # Centroid is exactly the pincode
        loc_score = 20.0  # Since it's the locality centroid
        lang_score = 10.0 if lang_info["language"] else 5.0
        
        total_score = lm_score + pin_score + loc_score + lang_score
        
        # If we had no landmarks, we boost the score to represent centroid confidence
        if not landmarks:
            # We can't be 100% confident without a landmark, cap at 60-70%
            total_score = 65.0
            evidence_desc = "Pincode centroid fallback (no matching landmark found)"
        else:
            evidence_desc = "Pincode centroid reference"
            
        candidates.append({
            "name": f"{pincode_info['office']} Centroid",
            "latitude": pincode_info["latitude"],
            "longitude": pincode_info["longitude"],
            "confidence": total_score,
            "type": "Pincode Centroid",
            "evidence": [
                "No physical landmark matched nearby",
                f"Using verified Pincode {pincode_info['pincode']} centroid",
                f"Locality resolved to {pincode_info['office']}"
            ]
        })

    # Sort candidates by confidence score descending
    print("[Ranking Agent Debug] Candidates generated:", candidates)
    candidates.sort(key=lambda x: x["confidence"], reverse=True)
    
    if candidates:
        best = candidates[0]
        evidence_callback(
            "Ranking Agent", 
            f"Selected best candidate '{best['name']}' with {best['confidence']}% confidence", 
            best["confidence"] / 100.0
        )
    else:
        evidence_callback("Ranking Agent", "No geocode candidates could be generated", 0.0)

    return candidates
