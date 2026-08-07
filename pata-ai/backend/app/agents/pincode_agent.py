from sqlalchemy.orm import Session
from app.database.db import PincodeMaster

def verify_pincode(parsed_pincode: str, parsed_locality: str, parsed_city: str, db: Session, evidence_callback) -> dict:
    """
    Checks the pincode against the database. If missing or incorrect, corrects it based on locality.
    """
    result = {
        "pincode": parsed_pincode,
        "office": None,
        "district": None,
        "state": None,
        "latitude": None,
        "longitude": None,
        "is_corrected": False
    }

    # 1. Exact Pincode Match
    if parsed_pincode:
        db_pincode = db.query(PincodeMaster).filter(PincodeMaster.pincode == parsed_pincode).first()
        if db_pincode:
            # Check if city matches (basic validation)
            city_matches = True
            if parsed_city and parsed_city.lower() not in db_pincode.district.lower() and parsed_city.lower() not in db_pincode.office.lower():
                city_matches = False
                
            if city_matches:
                evidence_callback("Pincode Agent", f"Pincode {parsed_pincode} verified successfully ({db_pincode.office}, {db_pincode.district})", 1.0)
                return {
                    "pincode": db_pincode.pincode,
                    "office": db_pincode.office,
                    "district": db_pincode.district,
                    "state": db_pincode.state,
                    "latitude": db_pincode.latitude,
                    "longitude": db_pincode.longitude,
                    "is_corrected": False
                }
            else:
                evidence_callback("Pincode Agent", f"Warning: Pincode {parsed_pincode} location mismatch with parsed city '{parsed_city}'", 0.4)

    # 2. Correction by Locality
    if parsed_locality or parsed_city:
        search_term = parsed_locality if parsed_locality else parsed_city
        if not search_term:
            return result
        # Remove common noise words like 'opposite', 'near', etc.
        clean_search = search_term.lower().replace("opposite", "").replace("near", "").replace("behind", "").replace("beside", "").strip()
        if not clean_search:
            return result
        
        matches = []
        # Try a specific query prioritizing the parsed city/district if present
        if parsed_city:
            clean_city = parsed_city.lower().strip()
            matches = db.query(PincodeMaster).filter(
                PincodeMaster.office.ilike(f"%{clean_search}%") & 
                (PincodeMaster.district.ilike(f"%{clean_city}%") | PincodeMaster.office.ilike(f"%{clean_city}%"))
            ).all()

        # If no city-scoped match, try general search by office or district
        if not matches:
            matches = db.query(PincodeMaster).filter(
                PincodeMaster.office.ilike(f"%{clean_search}%") | 
                PincodeMaster.district.ilike(f"%{clean_search}%")
            ).all()

        # If still no match, fallback to just matching the city
        if not matches and parsed_city:
            matches = db.query(PincodeMaster).filter(PincodeMaster.district.ilike(f"%{parsed_city}%")).all()

        if matches:
            # Best match (prioritize office matching parsed_locality)
            best_match = matches[0]
            # Prioritize matching both parsed_locality AND parsed_city if possible
            for m in matches:
                office_lower = m.office.lower()
                locality_lower = parsed_locality.lower() if parsed_locality else ""
                city_lower = parsed_city.lower() if parsed_city else ""
                
                if parsed_locality and locality_lower in office_lower:
                    if parsed_city and (city_lower in m.district.lower() or city_lower in office_lower):
                        best_match = m
                        break
                    best_match = m
                    
            if parsed_city:
                city_lower = parsed_city.lower().strip()
                district_lower = best_match.district.lower()
                state_lower = best_match.state.lower()
                office_lower = best_match.office.lower()
                if city_lower not in district_lower and city_lower not in state_lower and city_lower not in office_lower:
                    evidence_callback(
                        "Pincode Agent", 
                        f"Discarded candidate pincode {best_match.pincode} ({best_match.district}) due to city mismatch with '{parsed_city}'",
                        0.2
                    )
                    return result

            original = parsed_pincode if parsed_pincode else "MISSING"
            evidence_callback(
                "Pincode Agent", 
                f"Corrected pincode from {original} to {best_match.pincode} based on locality '{search_term}'", 
                0.9
            )
            return {
                "pincode": best_match.pincode,
                "office": best_match.office,
                "district": best_match.district,
                "state": best_match.state,
                "latitude": best_match.latitude,
                "longitude": best_match.longitude,
                "is_corrected": True
            }

    evidence_callback("Pincode Agent", "Pincode could not be verified or corrected against ground truth", 0.0)
    return result
