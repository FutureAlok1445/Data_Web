import os
from dotenv import load_dotenv
load_dotenv()

key = os.getenv("GEMINI_API_KEY")
print(f"✅ Gemini key found: {key[:10]}...")
try:
    from google import genai
    client = genai.Client(api_key=key)
    for model_name in ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-lite"]:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents="Say exactly: Gemini works!"
            )
            print(f"✅ Model {model_name} works: {response.text.strip()[:50]}")
            break
        except Exception as e:
            print(f"⚠️  {model_name} failed: {str(e)[:80]}")
except Exception as e:
    print(f"❌ Error: {e}")

