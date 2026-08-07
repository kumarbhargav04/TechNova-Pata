import os
import re
import json
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.database.db import PincodeMaster

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
else:
    model = None

# A quick list of cities and states for basic regex matching
COMMON_CITIES = ["hyderabad", "secunderabad", "bangalore", "bengaluru", "delhi", "new delhi", "noida", "mumbai"]
COMMON_STATES = ["telangana", "karnataka", "delhi", "uttar pradesh", "up", "maharashtra", "punjab", "ap", "andhra pradesh"]

async def parse_address(normalized_address: str, db: Session, evidence_callback) -> dict:
    """
    Parses clean address into: landmark, area/locality, city, state, pincode.
    Uses regex for pincode and basic patterns, and Gemini LLM as primary/fallback.
    """
    parsed = {
        "landmark": None,
        "locality": None,
        "city": None,
        "state": None,
        "pincode": None
    }
    
    # 1. Regex Pincode extraction (very reliable and zero-cost)
    pincode_match = re.search(r'\b\d{6}\b', normalized_address)
    if pincode_match:
        parsed["pincode"] = pincode_match.group(0)
        evidence_callback("Parser Agent", f"Regex extracted pincode: {parsed['pincode']}", 1.0)
    
    # 2. LLM Parser
    try:
        from app.agents.llm_client import query_llm
        prompt = (
            "You are the Address Parser Agent for PataAI. "
            "Parse the following normalized address into structured components: "
            "landmark, locality, city, state, pincode. "
            "Return a JSON object matching this schema: "
            "{\"landmark\": string or null, \"locality\": string or null, \"city\": string or null, \"state\": string or null, \"pincode\": string or null}. "
            "Be accurate and do not guess pincodes if not explicitly present."
            f"\nAddress: {normalized_address}"
        )
        response_text = await query_llm(prompt, response_json=True)
        llm_parsed = json.loads(response_text)
        
        # Merge with regex pincode if regex caught it and LLM missed it
        if not llm_parsed.get("pincode") and parsed["pincode"]:
            llm_parsed["pincode"] = parsed["pincode"]
            
        evidence_callback("Parser Agent", "Parsed address components using LLM (Gemini/Groq)", 0.95)
        llm_parsed["used_llm"] = True
        return llm_parsed
    except Exception as e:
        evidence_callback("Parser Agent", f"LLM parsing failed, using rule-based engine: {str(e)}", 0.5)


    # 3. Rule-based Fallback Parser
    # Extract city
    addr_lower = normalized_address.lower()
    for city in COMMON_CITIES:
        if city in addr_lower:
            parsed["city"] = city.title()
            break
            
    # Try database-assisted extraction if city is not found and db session is provided
    if not parsed["city"] and db:
        words = re.findall(r'\b[a-zA-Z]{4,}\b', addr_lower)
        for word in words:
            if word in ["near", "opposite", "behind", "beside", "lane", "road", "street", "temple", "apartment", "residency", "dmart", "nagar", "colony", "town"]:
                continue
            # Look up in PincodeMaster
            match = db.query(PincodeMaster).filter(
                (PincodeMaster.district.ilike(word)) | 
                (PincodeMaster.office.ilike(word))
            ).first()
            if match:
                parsed["city"] = match.district.title()
                parsed["state"] = match.state
                evidence_callback("Parser Agent", f"Database lookup resolved city '{parsed['city']}' and state '{parsed['state']}' from token '{word}'", 0.9)
                break

    # Extract state if still missing
    if not parsed["state"]:
        for state in COMMON_STATES:
            if state in addr_lower:
                parsed["state"] = state.upper() if len(state) <= 3 else state.title()
                break

    # Look for common landmark prepositions like "opposite", "near", "behind", "beside"
    landmark_keywords = ["opposite", "near", "behind", "beside", "back gate", "opposite to"]
    addr_parts = re.split(r'[,\s]+', normalized_address)
    
    for kw in landmark_keywords:
        match = re.search(r'\b' + re.escape(kw) + r'\b\s+([^,]+)', normalized_address, re.IGNORECASE)
        if match:
            # Take the landmark segment
            parsed["landmark"] = f"{kw.capitalize()} {match.group(1).split('opposite')[0].split('near')[0].split('behind')[0].strip()}"
            break

    # Infer locality (everything that's not city, state, pincode, or landmark)
    # Simple heuristic for demo
    words = normalized_address.split(",")
    for part in words:
        part_clean = part.strip()
        if not part_clean:
            continue
        # If it contains city or pincode, skip
        if parsed["city"] and parsed["city"].lower() in part_clean.lower():
            continue
        if parsed["pincode"] and parsed["pincode"] in part_clean:
            continue
        # If it's the landmark part, skip
        if parsed["landmark"] and parsed["landmark"].lower() in part_clean.lower():
            continue
        
        parsed["locality"] = part_clean
        break
        
    parsed["used_llm"] = False
    evidence_callback("Parser Agent", "Completed parsing using rule-based heuristics", 0.8)
    return parsed
