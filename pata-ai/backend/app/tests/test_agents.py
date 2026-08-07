import pytest
from app.agents.language_agent import detect_language, process_language
from app.agents.parser_agent import parse_address
from app.agents.ranking_agent import rank_candidates, haversine_distance
from app.agents.validation_agent import self_check

def test_language_detection():
    # Test Hinglish / transliterated address
    lang1 = detect_language("Opposite ganesh mandir daggara")
    assert "Hinglish" in lang1 or "Telugu" in lang1
    
    # Test regional script
    lang2 = detect_language("హనుమాన్ గుడి")
    assert lang2 == "Telugu Script"

@pytest.mark.asyncio
async def test_language_processing():
    logs = []
    def mock_callback(source, desc, score):
        logs.append(desc)
        
    result = await process_language("ganesh mandir daggara Kothapet", mock_callback)
    assert result["normalized"] is not None
    assert "Ganesh Temple Near Kothapet" in result["normalized"] or "Ganesh Mandir Near Kothapet" in result["normalized"]

@pytest.mark.asyncio
async def test_address_parser():
    logs = []
    def mock_callback(source, desc, score):
        pass
        
    # Test regex pincode extraction
    parsed = await parse_address("Ganesh Temple, Kothapet 500035", mock_callback)
    assert parsed["pincode"] == "500035"

def test_haversine_distance():
    # Distance between two identical points should be 0
    dist = haversine_distance(17.3732, 78.5476, 17.3732, 78.5476)
    assert dist == 0.0
    
    # Distance between two distinct points should be positive
    dist2 = haversine_distance(17.3732, 78.5476, 17.4375, 78.4482)
    assert dist2 > 0

def test_ranking_agent():
    logs = []
    def mock_callback(source, desc, score):
        pass
        
    parsed_address = {"landmark": "Ganesh Temple", "locality": "Kothapet", "city": "Hyderabad", "pincode": "500035"}
    pincode_info = {"pincode": "500035", "office": "Kothapet S.O", "latitude": 17.3732, "longitude": 78.5476}
    landmarks = [
        {"name": "Ganesh Temple", "latitude": 17.3719, "longitude": 78.5485, "source": "Local"}
    ]
    lang_info = {"language": "Telugu transliteration"}
    
    ranked = rank_candidates(parsed_address, pincode_info, landmarks, lang_info, mock_callback)
    
    assert len(ranked) > 0
    assert ranked[0]["confidence"] >= 70.0  # Should be high since landmark is close
