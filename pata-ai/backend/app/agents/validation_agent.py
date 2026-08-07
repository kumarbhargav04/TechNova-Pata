from app.agents.ranking_agent import haversine_distance

def self_check(
    candidate: dict, 
    parsed_address: dict, 
    pincode_info: dict, 
    evidence_callback
) -> dict:
    """
    Self-Check Agent (Agent 7).
    Validates logical consistency and generates warnings if confidence is low or coordinates are suspect.
    """
    risk_warning = None
    confidence = candidate.get("confidence", 0.0)
    
    # 1. Check distance between top candidate and pincode centroid
    if candidate and pincode_info.get("latitude"):
        dist = haversine_distance(
            candidate["latitude"], 
            candidate["longitude"], 
            pincode_info["latitude"], 
            pincode_info["longitude"]
        )
        
        # If the landmark is more than 5km from the pincode centroid, it's highly suspicious!
        if dist > 5000:
            confidence = max(confidence - 25.0, 30.0) # Penalty
            risk_warning = f"High Risk: Resolved landmark is {int(dist/1000)}km away from the verified pincode centroid. The delivery address might be incorrect."
            evidence_callback("Self Check Agent", f"Detected distance mismatch: landmark is {int(dist)}m away from pincode centroid", 0.3)
        elif dist > 2500:
            confidence = max(confidence - 10.0, 50.0)
            risk_warning = f"Moderate Risk: Landmark is {int(dist)}m away from the pincode centroid."
            evidence_callback("Self Check Agent", "Landmark distance slightly high compared to pincode centroid", 0.7)
        else:
            evidence_callback("Self Check Agent", "Geospatial logical check passed: Landmark is close to pincode center", 1.0)
            
    # 2. Check for city mismatch
    if parsed_address.get("city") and pincode_info.get("district"):
        city = parsed_address["city"].lower()
        district = pincode_info["district"].lower()
        if city not in district and district not in city:
            confidence = max(confidence - 15.0, 40.0)
            risk_warning = f"High Risk: City mismatch. Address mentions '{parsed_address['city']}' but pincode resolves to '{pincode_info['district']}'."
            evidence_callback("Self Check Agent", f"City/District mismatch detected: {city} vs {district}", 0.2)

    # 3. Check for low confidence threshold
    if confidence < 70.0:
        if not risk_warning:
            risk_warning = "Low Confidence: Could not verify a matching physical landmark close to the pincode centroid. Human confirmation recommended."
        evidence_callback("Self Check Agent", f"Confidence fell below 70% threshold. Flagging as Need Confirmation.", 0.5)

    return {
        "confidence": confidence,
        "risk_warning": risk_warning,
        "is_safe": confidence >= 70.0
    }
