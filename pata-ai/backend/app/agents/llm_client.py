import os
import json
import warnings
import httpx
with warnings.catch_warnings():
    warnings.simplefilter("ignore", FutureWarning)
    import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables (searches for .env file)
load_dotenv()

async def query_llm(prompt: str, response_json: bool = True) -> str:
    """
    Tries to query Gemini first. If it fails, falls back to Groq Llama-3.
    Returns the raw text response from whichever LLM succeeds.
    """
    # 1. Try Gemini
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            genai.configure(api_key=gemini_key)
            gemini_model = genai.GenerativeModel("gemini-1.5-flash")
            
            generation_config = {}
            if response_json:
                generation_config["response_mime_type"] = "application/json"
            
            response = gemini_model.generate_content(
                prompt,
                generation_config=generation_config
            )
            if response and response.text:
                if response_json:
                    json.loads(response.text)  # validate JSON
                return response.text
        except Exception as e:
            print(f"[LLM Client] Gemini call failed: {e}. Falling back to Groq...")
            
    # 2. Try Groq (Fallback)
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        try:
            # We try llama-3.3-70b-versatile (standard production name) first,
            # then llama-3.1-8b-instant, then llama3-8b-8192 as backups.
            models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-8b-8192"]
            for model_name in models:
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": model_name,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1
                }
                if response_json:
                    payload["response_format"] = {"type": "json_object"}
                    
                # Fetch dynamic timeout from settings
                timeout_val = 10.0
                try:
                    agents_dir = os.path.dirname(os.path.abspath(__file__))
                    settings_path = os.path.join(os.path.dirname(agents_dir), "settings.json")
                    if os.path.exists(settings_path):
                        with open(settings_path, "r") as f:
                            s_data = json.load(f)
                            timeout_val = float(s_data.get("llm_timeout_seconds", 10.0))
                except Exception as e:
                    print(f"[LLM Client] Failed to read timeout setting: {e}")
                    
                async with httpx.AsyncClient() as client:
                    response = await client.post(url, json=payload, headers=headers, timeout=timeout_val)
                    if response.status_code == 200:
                        res_data = response.json()
                        content = res_data["choices"][0]["message"]["content"]
                        if response_json:
                            json.loads(content)  # validate JSON
                        return content
                    else:
                        print(f"[LLM Client] Groq model {model_name} failed with status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[LLM Client] Groq call failed: {e}")
            
    raise RuntimeError("Both Gemini and Groq LLM API calls failed or were not configured properly.")
