import os
import re

# ============================================================================
# UNICODE SCRIPT DETECTION — All 22 Scheduled Indian Languages + Global Scripts
# ============================================================================
# Each entry: (compiled_regex, script_name, language_name)
SCRIPT_DETECTORS = [
    # --- Indian Official Languages (22 Scheduled Languages) ---
    (re.compile(r'[\u0C00-\u0C7F]+'), "Telugu Script", "Telugu"),
    (re.compile(r'[\u0900-\u097F]+'), "Devanagari Script", "Hindi/Marathi/Sanskrit/Nepali"),
    (re.compile(r'[\u0980-\u09FF]+'), "Bengali Script", "Bengali/Assamese"),
    (re.compile(r'[\u0B80-\u0BFF]+'), "Tamil Script", "Tamil"),
    (re.compile(r'[\u0C80-\u0CFF]+'), "Kannada Script", "Kannada"),
    (re.compile(r'[\u0D00-\u0D7F]+'), "Malayalam Script", "Malayalam"),
    (re.compile(r'[\u0A80-\u0AFF]+'), "Gujarati Script", "Gujarati"),
    (re.compile(r'[\u0A00-\u0A7F]+'), "Gurmukhi Script", "Punjabi"),
    (re.compile(r'[\u0B00-\u0B7F]+'), "Odia Script", "Odia"),
    (re.compile(r'[\u0600-\u06FF]+'), "Arabic/Urdu Script", "Urdu/Kashmiri/Sindhi"),
    (re.compile(r'[\U00011000-\U0001107F]+'), "Brahmi Script", "Sanskrit Historical"),
    (re.compile(r'[\uABC0-\uABFF]+'), "Meetei Mayek Script", "Manipuri"),
    (re.compile(r'[\u1C00-\u1C4F]+'), "Lepcha Script", "Lepcha"),
    (re.compile(r'[\u1C80-\u1C8F]+'), "Old Church Slavonic", "Slavonic"),
    (re.compile(r'[\uA800-\uA82F]+'), "Syloti Nagri", "Sylheti"),
    (re.compile(r'[\u0D80-\u0DFF]+'), "Sinhala Script", "Sinhala"),

    # --- Major World Languages ---
    (re.compile(r'[\u4E00-\u9FFF]+'), "CJK Ideographs", "Chinese"),
    (re.compile(r'[\u3040-\u309F\u30A0-\u30FF]+'), "Japanese Kana", "Japanese"),
    (re.compile(r'[\uAC00-\uD7AF]+'), "Hangul Script", "Korean"),
    (re.compile(r'[\u0E00-\u0E7F]+'), "Thai Script", "Thai"),
    (re.compile(r'[\u0E80-\u0EFF]+'), "Lao Script", "Lao"),
    (re.compile(r'[\u1000-\u109F]+'), "Myanmar Script", "Burmese"),
    (re.compile(r'[\u1780-\u17FF]+'), "Khmer Script", "Khmer"),
    (re.compile(r'[\u0530-\u058F]+'), "Armenian Script", "Armenian"),
    (re.compile(r'[\u10A0-\u10FF]+'), "Georgian Script", "Georgian"),
    (re.compile(r'[\u1200-\u137F]+'), "Ethiopic Script", "Amharic/Tigrinya"),
    (re.compile(r'[\u0400-\u04FF]+'), "Cyrillic Script", "Russian/Ukrainian"),
    (re.compile(r'[\u0370-\u03FF]+'), "Greek Script", "Greek"),
    (re.compile(r'[\u0590-\u05FF]+'), "Hebrew Script", "Hebrew"),
    (re.compile(r'[\u0700-\u074F]+'), "Syriac Script", "Syriac"),
    (re.compile(r'[\u0780-\u07BF]+'), "Thaana Script", "Dhivehi"),
    (re.compile(r'[\u1400-\u167F]+'), "Canadian Syllabics", "Cree/Inuktitut"),
    (re.compile(r'[\u13A0-\u13FF]+'), "Cherokee Script", "Cherokee"),
    (re.compile(r'[\u1680-\u169F]+'), "Ogham Script", "Old Irish"),
    (re.compile(r'[\u16A0-\u16FF]+'), "Runic Script", "Old Norse"),
    (re.compile(r'[\u1700-\u171F]+'), "Tagalog Script", "Tagalog"),
    (re.compile(r'[\u1720-\u173F]+'), "Hanunoo Script", "Hanunoo"),
    (re.compile(r'[\u1740-\u175F]+'), "Buhid Script", "Buhid"),
    (re.compile(r'[\u1760-\u177F]+'), "Tagbanwa Script", "Tagbanwa"),
    (re.compile(r'[\u2D30-\u2D7F]+'), "Tifinagh Script", "Berber"),
    (re.compile(r'[\uA000-\uA48F]+'), "Yi Script", "Yi"),
    (re.compile(r'[\u1900-\u194F]+'), "Limbu Script", "Limbu"),
    (re.compile(r'[\u1950-\u197F]+'), "Tai Le Script", "Tai Le"),
    (re.compile(r'[\u1980-\u19DF]+'), "New Tai Lue Script", "New Tai Lue"),
    (re.compile(r'[\u1A00-\u1A1F]+'), "Buginese Script", "Buginese"),
    (re.compile(r'[\u1B00-\u1B7F]+'), "Balinese Script", "Balinese"),
    (re.compile(r'[\u1B80-\u1BBF]+'), "Sundanese Script", "Sundanese"),
    (re.compile(r'[\u1BC0-\u1BFF]+'), "Batak Script", "Batak"),
    (re.compile(r'[\uA500-\uA63F]+'), "Vai Script", "Vai"),
    (re.compile(r'[\uA6A0-\uA6FF]+'), "Bamum Script", "Bamum"),
    (re.compile(r'[\uA900-\uA92F]+'), "Kayah Li Script", "Kayah Li"),
    (re.compile(r'[\uA930-\uA95F]+'), "Rejang Script", "Rejang"),
    (re.compile(r'[\uA960-\uA97F]+'), "Jamo Extended-A", "Korean Extended"),
    (re.compile(r'[\uAA00-\uAA5F]+'), "Cham Script", "Cham"),
    (re.compile(r'[\uAA80-\uAADF]+'), "Tai Viet Script", "Tai Viet"),
]

# ============================================================================
# TRANSLITERATION DICTIONARY — Multi-Language Indian Address Keywords
# Covers: Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali, Marathi, Gujarati,
#         Punjabi, Odia, Urdu, + common Indian English abbreviations
# ============================================================================
TRANSLATIONS = {
    # --- Telugu Transliterations ---
    "daggara": "near", "daggira": "near", "dhaggara": "near", "dhaggira": "near",
    "deggira": "near", "deggara": "near", "daggarla": "near", "daggaralo": "near",
    "pakana": "beside", "pakkana": "beside", "pakkalo": "beside",
    "venuka": "behind", "venaka": "behind", "venakala": "behind",
    "eduruga": "opposite", "eduru": "opposite", "edurugaa": "opposite",
    "mundhu": "in front of", "munduga": "in front of",
    "gudi": "temple", "gudikaada": "near temple",
    "bazaar": "market", "bazar": "market",
    "rasta": "road", "veedhi": "street", "bata": "road",
    "cheruvu": "lake", "kunta": "pond",
    "palli": "village", "palem": "village",
    "thota": "garden", "thoppu": "garden",
    "vari": "of", "valla": "of",
    "illu": "house", "intlo": "house",
    "masjid": "mosque", "church": "church",
    "koththa": "new", "patha": "old",

    # --- Hindi / Hinglish Transliterations ---
    "ke paas": "near", "k paas": "near", "ke pass": "near",
    "ke peeche": "behind", "peechay": "behind", "peeche": "behind",
    "ke opposite": "opposite", "ke saamne": "opposite",
    "bagal mein": "beside", "bagal me": "beside",
    "samne": "opposite", "saamne": "opposite",
    "mandir": "temple", "masjid": "mosque",
    "gali": "lane", "mohalla": "locality", "nagar": "township",
    "chowk": "intersection", "chauk": "intersection", "chowrasta": "crossroad",
    "sadak": "road", "marg": "road", "path": "road",
    "pul": "bridge", "nadi": "river", "talab": "pond",
    "purana": "old", "naya": "new", "bada": "big", "chhota": "small",
    "wali": "of", "wala": "of",
    "ghar": "house", "makan": "building", "dukan": "shop",
    "hospital": "hospital", "dawakhana": "hospital",
    "thana": "police station", "post office": "post office",
    "ke andar": "inside", "ke bahar": "outside",
    "dargah": "shrine", "gurudwara": "gurudwara",
    "jheel": "lake", "talaab": "pond",

    # --- Tamil Transliterations ---
    "arugil": "near", "arukil": "near", "pakkathil": "beside",
    "pinnaal": "behind", "munnal": "in front of",
    "ethire": "opposite", "ethirile": "opposite",
    "kovil": "temple", "koil": "temple",
    "theru": "street", "salai": "road", "sandhu": "lane",
    "kattu": "building", "veedu": "house",
    "kudi": "house", "pattinam": "city", "nagar": "township",
    "eri": "lake", "kulam": "pond", "aaru": "river",
    "puthiya": "new", "pazhaya": "old",
    "kadai": "shop", "maligai": "shop",
    "pallikoodam": "school", "aspatri": "hospital",

    # --- Kannada Transliterations ---
    "hathira": "near", "hattira": "near",
    "hinde": "behind", "mundu": "in front of",
    "eduru": "opposite", "pakkada": "beside",
    "devasthana": "temple", "gudi": "temple",
    "beedhi": "street", "raste": "road",
    "mane": "house", "angadi": "shop",
    "hosadu": "new", "haleeya": "old",
    "kere": "lake", "nadi": "river",
    "shaale": "school", "aaspathre": "hospital",

    # --- Malayalam Transliterations ---
    "aduthu": "near", "aduthulla": "near",
    "pinnil": "behind", "munnil": "in front of",
    "ethire": "opposite", "ethirvashathil": "opposite",
    "pakkathil": "beside",
    "ambalam": "temple", "kshetram": "temple", "palli": "church/mosque",
    "veedhi": "street", "vazhil": "road",
    "veedu": "house", "kadai": "shop",
    "puthiya": "new", "pazhaya": "old",
    "kayal": "lake", "puzhaa": "river",
    "school": "school", "aashupathri": "hospital",

    # --- Bengali Transliterations ---
    "kachhe": "near", "kache": "near",
    "pechone": "behind", "shamne": "in front of",
    "ulto dike": "opposite", "pashe": "beside",
    "mondir": "temple", "mosjid": "mosque",
    "rasta": "road", "goli": "lane", "sarak": "road",
    "bari": "house", "dokan": "shop",
    "notun": "new", "purano": "old",
    "jheel": "lake", "nodi": "river",
    "school": "school", "hospital": "hospital",

    # --- Gujarati Transliterations ---
    "paase": "near", "pase": "near",
    "pachhaal": "behind", "same": "in front of",
    "same no": "opposite", "baaju ma": "beside",
    "mandir": "temple", "masjid": "mosque",
    "rasto": "road", "sheri": "lane",
    "ghar": "house", "dukaan": "shop",
    "navu": "new", "jaanu": "old",
    "sarovar": "lake", "nadi": "river",

    # --- Punjabi Transliterations ---
    "kol": "near", "kole": "near",
    "picche": "behind", "aage": "in front of",
    "samne": "opposite", "naal": "beside",
    "gurdwara": "gurudwara", "mandir": "temple",
    "sadak": "road", "gali": "lane",
    "ghar": "house", "dukaan": "shop",
    "nawan": "new", "purana": "old",

    # --- Odia Transliterations ---
    "pakhare": "near", "pakhare": "near",
    "pachhe": "behind", "aagare": "in front of",
    "samna re": "opposite", "pase": "beside",
    "mandira": "temple", "masjida": "mosque",
    "rasta": "road", "gali": "lane",
    "ghara": "house", "dukana": "shop",
    "nua": "new", "puruna": "old",

    # --- Marathi Transliterations ---
    "javal": "near", "javala": "near",
    "maghe": "behind", "samor": "in front of",
    "samore": "opposite", "bajula": "beside",
    "deul": "temple", "mandir": "temple",
    "rasta": "road", "galli": "lane",
    "ghar": "house", "dukan": "shop",
    "nava": "new", "juna": "old",
    "talav": "lake", "nadi": "river",

    # --- Urdu Transliterations ---
    "nazdeek": "near", "qarib": "near",
    "peeche": "behind", "saamne": "opposite",
    "barabar": "adjacent", "bagal mein": "beside",
    "masjid": "mosque", "dargah": "shrine",
    "sadak": "road", "gali": "lane", "mohalla": "locality",
    "makaan": "building", "dukaan": "shop",
    "naya": "new", "purana": "old",

    # --- Common Indian English Abbreviations ---
    "opp": "opposite", "nr": "near", "adj": "adjacent",
    "b/h": "behind", "bhd": "behind",
    "nr.": "near", "opp.": "opposite", "adj.": "adjacent",
    "templ": "temple", "hosp": "hospital",
    "stn": "station", "rly": "railway", "rlwy": "railway",
    "rd": "road", "st": "street", "ln": "lane",
    "apt": "apartment", "flr": "floor", "blk": "block",
    "govt": "government", "pvt": "private",
    "sch": "school", "clg": "college", "univ": "university",
    "mkt": "market", "cmplx": "complex",
    "ofc": "office", "bldg": "building",
    "ch": "church", "msq": "mosque",
    "hq": "headquarters", "pol": "police",
    "ngr": "nagar", "col": "colony",
    "extn": "extension", "ext": "extension",
    "indl": "industrial", "estd": "estate",
    "dist": "district", "tq": "taluk", "vill": "village",
    "po": "post office", "ps": "police station",
    "nh": "national highway", "sh": "state highway",
    "mc": "municipal corporation", "mc road": "municipal corporation road",
}

# Multi-word translations (must be checked first, before single-word)
MULTI_WORD_TRANSLATIONS = {
    "ke paas": "near", "k paas": "near", "ke pass": "near",
    "ke peeche": "behind", "ke opposite": "opposite",
    "ke saamne": "opposite", "bagal mein": "beside", "bagal me": "beside",
    "opposite to": "opposite", "opposite side": "opposite",
    "in front of": "in front of",
    "ulto dike": "opposite", "same no": "opposite",
    "samna re": "opposite", "baaju ma": "beside",
    "ke andar": "inside", "ke bahar": "outside",
}


def detect_language(address: str) -> str:
    """
    Detects language/script of the address by scanning Unicode ranges.
    Supports 50+ scripts covering 100+ languages worldwide.
    """
    for regex, script_name, lang_name in SCRIPT_DETECTORS:
        if regex.search(address):
            return f"{lang_name} ({script_name})"
    
    # Check for transliterated keywords (Hinglish, Telugu-English, etc.)
    addr_lower = address.lower()
    for phrase in MULTI_WORD_TRANSLATIONS:
        if phrase in addr_lower:
            return "Transliterated Regional (Latin Script)"
    for word in TRANSLATIONS:
        if re.search(r'\b' + re.escape(word) + r'\b', addr_lower):
            return "Transliterated Regional (Latin Script)"
            
    return "English (Standard)"


async def process_language(address: str, evidence_callback) -> dict:
    """
    Detects language/script and translates/transliterates/normalizes address
    to clean English. Supports 100+ languages via LLM with rule-based fallback
    for all major Indian regional languages.
    """
    lang = detect_language(address)
    evidence_callback("Language Agent", f"Detected language: {lang}", 1.0)
    
    # ========================================================================
    # PRIMARY: Use LLM (Gemini → Groq fallback) for accurate translation
    # This handles ALL 100+ languages natively — no hardcoded rules needed
    # ========================================================================
    try:
        from app.agents.llm_client import query_llm
        prompt = (
            "You are the Language Intelligence Agent for PataAI, an Indian address geocoding system.\n\n"
            "Your task is to normalize the following address into clean, accurate English.\n\n"
            "RULES:\n"
            "1. Translate ALL non-English words to English (Telugu, Hindi, Tamil, Kannada, Malayalam, "
            "Bengali, Gujarati, Punjabi, Odia, Marathi, Urdu, Assamese, Sanskrit, or ANY other language).\n"
            "2. Fix ALL spelling mistakes and typos in place names (e.g., 'Machilioatanm' → 'Machilipatnam', "
            "'Hyderbad' → 'Hyderabad', 'Banglore' → 'Bangalore').\n"
            "3. Transliterated words like 'daggara/daggira/deggira' mean 'near', "
            "'eduruga' means 'opposite', 'venuka' means 'behind', 'gudi/kovil/mandir' means 'temple'.\n"
            "4. Keep proper nouns (theater names, restaurant names, landmark names, city names) intact "
            "but fix their spelling.\n"
            "5. Keep pincodes (6-digit numbers) exactly as they are.\n"
            "6. Output a SINGLE clean English address string.\n\n"
            "Format your response as JSON: {\"cleaned_address\": \"...\", \"explanation\": \"...\"}\n\n"
            f"Address: {address}"
        )
        response_text = await query_llm(prompt, response_json=True)
        import json
        result = json.loads(response_text)
        cleaned = result.get("cleaned_address", address)
        explanation = result.get("explanation", "Cleaned using LLM.")
        evidence_callback("Language Agent", f"LLM Normalization: {explanation}", 0.95)
        return {"normalized": cleaned, "language": lang, "explanation": explanation, "used_llm": True}
    except Exception as e:
        evidence_callback("Language Agent", f"LLM translation failed (using rule-based fallback): {str(e)}", 0.5)

    # ========================================================================
    # FALLBACK: Rule-based translation for all supported Indian languages
    # ========================================================================
    cleaned = address
    
    # Check if it's a non-Latin script — if so, we can't rule-based translate properly
    is_non_latin = any(regex.search(address) for regex, _, _ in SCRIPT_DETECTORS)
    
    if is_non_latin:
        # For non-Latin scripts without LLM, we can only pass through and flag
        evidence_callback(
            "Language Agent", 
            f"Warning: Non-Latin script ({lang}) detected but LLM unavailable. Passing address through with limited cleaning.", 
            0.4
        )
    else:
        # Apply multi-word translations first (longer phrases first to avoid partial matches)
        cleaned_lower = cleaned.lower()
        for phrase, replacement in sorted(MULTI_WORD_TRANSLATIONS.items(), key=lambda x: -len(x[0])):
            if phrase in cleaned_lower:
                # Case-insensitive replacement
                pattern = re.compile(re.escape(phrase), re.IGNORECASE)
                cleaned = pattern.sub(replacement, cleaned)
                cleaned_lower = cleaned.lower()
        
        # Apply single-word translations
        words = cleaned.split()
        for i, w in enumerate(words):
            clean_w = w.strip(",.-;:'\"!?()[]")
            if clean_w.lower() in TRANSLATIONS:
                words[i] = w.replace(clean_w, TRANSLATIONS[clean_w.lower()])
        cleaned = " ".join(words)
        
        evidence_callback("Language Agent", f"Applied rule-based multi-language transliteration mappings ({lang})", 0.85)

    # Capitalize first letter of words for clean output
    cleaned_address = " ".join([w.capitalize() if not w[0].isdigit() else w for w in cleaned.split() if w])
    
    return {
        "normalized": cleaned_address,
        "language": lang,
        "explanation": f"Normalized using local rule-based engine for {lang}.",
        "used_llm": False
    }
