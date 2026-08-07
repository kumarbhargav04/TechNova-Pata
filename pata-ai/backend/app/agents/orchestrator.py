import time
import asyncio
import re
from sqlalchemy.orm import Session
from app.agents.language_agent import process_language
from app.agents.parser_agent import parse_address
from app.agents.landmark_agent import find_landmarks
from app.agents.pincode_agent import verify_pincode
from app.agents.ranking_agent import rank_candidates
from app.agents.validation_agent import self_check
from app.database.db import AddressRequest, EvidenceLog

def mask_sensitive_address(raw_address: str) -> str:
    """
    DPDP Compliance: Masks flat numbers, house numbers, phone numbers, and potential personal names.
    E.g. 'Flat 302, Sai Residency' -> 'Flat ***, Sai Residency'
    """
    # Mask flat/house/plot numbers
    masked = re_sub_flat_house(raw_address)
    # Mask phone numbers (10 digits)
    masked = re.sub(r'\b\d{10}\b', '**********', masked)
    return masked

def re_sub_flat_house(text: str) -> str:
    import re
    # Mask numbers like 'Flat 302', 'House No 12-3', 'Plot 45'
    patterns = [
        (r'\b(flat|house|plot|no|h\.?no|qtr|flat\s*no|plot\s*no)\s*\w+([-/\w]+)?\b', r'\1 ***'),
        (r'\b\d+[-/]\d+\b', '***')
    ]
    masked = text
    for pattern, repl in patterns:
        masked = re.sub(pattern, repl, masked, flags=re.IGNORECASE)
    return masked

async def resolve_address_pipeline(raw_address: str, db: Session, user_id: int = None) -> dict:
    """
    Main Orchestrator Agent (Agent 0).
    Runs the multi-agent pipeline asynchronously, logs audit trails, and formats response.
    """
    start_time = time.time()
    evidence_logs = []
    
    def log_evidence(agent_name: str, description: str, score: float):
        evidence_logs.append({
            "source": agent_name,
            "description": description,
            "score": score
        })

    # Step 1: Language Intelligence Agent
    lang_info = await process_language(raw_address, log_evidence)
    normalized = lang_info["normalized"]
    
    # Step 2: Address Parser Agent
    parsed_address = await parse_address(normalized, log_evidence)
    
    # Step 3: Pincode Agent (runs in parallel with Landmark Agent if we have a seed pincode)
    pincode = parsed_address.get("pincode")
    locality = parsed_address.get("locality")
    city = parsed_address.get("city")
    
    pincode_info = verify_pincode(pincode, locality, city, db, log_evidence)
    
    # Step 4: Landmark Agent (uses corrected pincode coordinates to narrow Overpass search)
    landmarks = []
    if parsed_address.get("landmark"):
        landmarks = await find_landmarks(
            parsed_address["landmark"],
            pincode_info["latitude"],
            pincode_info["longitude"],
            db,
            log_evidence
        )
        
    # Step 5: Ranking Agent
    ranked_candidates = rank_candidates(
        parsed_address,
        pincode_info,
        landmarks,
        lang_info,
        log_evidence
    )
    
    if not ranked_candidates:
        # Fallback to general city coords if everything fails
        fallback_lat, fallback_lon = 17.3850, 78.4867 # Hyderabad defaults
        if pincode_info["latitude"]:
            fallback_lat, fallback_lon = pincode_info["latitude"], pincode_info["longitude"]
        ranked_candidates = [{
            "name": "General Area Coordinates Fallback",
            "latitude": fallback_lat,
            "longitude": fallback_lon,
            "confidence": 40.0,
            "type": "Fallback",
            "evidence": ["No landmark found, falling back to area coordinates"]
        }]
        
    best_candidate = ranked_candidates[0]
    
    # Step 6: Self-Check Agent
    check_results = self_check(best_candidate, parsed_address, pincode_info, log_evidence)
    
    final_confidence = check_results["confidence"]
    risk_warning = check_results["risk_warning"]
    
    latency_ms = (time.time() - start_time) * 1000
    
    # DPDP Audit Log Writing: Keep original address masked in logs
    masked_original = mask_sensitive_address(raw_address)
    
    # Save request record to database
    db_request = AddressRequest(
        original_address=masked_original, # Masked for privacy
        normalized_address=normalized,
        latitude=best_candidate["latitude"],
        longitude=best_candidate["longitude"],
        confidence=final_confidence,
        user_id=user_id
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    # Save evidence logs to database
    for log in evidence_logs:
        db_log = EvidenceLog(
            request_id=db_request.id,
            source=log["source"],
            description=log["description"],
            score=log["score"]
        )
        db.add(db_log)
    db.commit()
    
    # Format evidence text output for frontend UI
    formatted_evidence = []
    for log in evidence_logs:
        formatted_evidence.append(f"[{log['source']}] {log['description']}")
        
    # Generate human-friendly explanation
    explanation = f"Resolved using {best_candidate['type']}. "
    if best_candidate.get("name"):
        explanation += f"Identified landmark: {best_candidate['name']}. "
    explanation += f"Verified Pincode: {pincode_info.get('pincode') or 'Unspecified'}."
    
    return {
        "original_address": raw_address, # Returned in response for instant display, not stored
        "normalized_address": normalized,
        "latitude": best_candidate["latitude"],
        "longitude": best_candidate["longitude"],
        "confidence": round(final_confidence, 1),
        "evidence": formatted_evidence,
        "correction_explanation": explanation,
        "risk_warning": risk_warning,
        "latency_ms": round(latency_ms, 1)
    }
