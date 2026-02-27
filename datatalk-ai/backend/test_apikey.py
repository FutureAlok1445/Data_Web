import os
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("ANTHROPIC_API_KEY")
if not key:
    print("❌ ANTHROPIC_API_KEY is NOT set in .env")
else:
    print(f"✅ API key found: {key[:12]}...{key[-4:]}")
    # Test a real Claude call
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=key)
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=50,
            messages=[{"role": "user", "content": "Say 'API key works!' in exactly those words."}]
        )
        print(f"✅ Claude response: {response.content[0].text}")
    except Exception as e:
        print(f"❌ Claude API error: {e}")
