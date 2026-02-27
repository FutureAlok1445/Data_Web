import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()
from core.nvidia_client import nvidia_complete, has_api_key

print(f"Groq key available: {has_api_key()}")
result = nvidia_complete(
    system_prompt="You are a SQL expert. Return ONLY SQL.",
    user_message="Write: SELECT 1 as test",
    max_tokens=50,
    temperature=0.1
)
print(f"✅ Response: {result}")
