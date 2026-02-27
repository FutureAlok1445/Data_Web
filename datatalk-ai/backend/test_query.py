import os
import json
import asyncio
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test():
    print("--- Starting Analytics Engine Test ---")
    
    # Import the router function and request model
    try:
        from routes.query import process_query, QueryRequest
    except ImportError as e:
        print(f"Import Error: {e}")
        return

    # Check for API keys
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    
    if not anthropic_key or anthropic_key == "YOUR_ANTHROPIC_API_KEY":
        print("WARNING: ANTHROPIC_API_KEY is missing or placeholder. LLM steps will use mock logic.")
    if not gemini_key or gemini_key == "YOUR_GEMINI_API_KEY":
        print("WARNING: GEMINI_API_KEY is missing or placeholder. Intent classification will use keyword fallback.")

    req = QueryRequest(
        session_id="test-session-123",
        query="What is the churn rate analysis of male and female customers?"
    )

    print(f"Executing Query: {req.query}")
    
    try:
        print("Awaiting process_query...")
        # Increased timeout slightly for cold-start LLM models
        response = await asyncio.wait_for(process_query(req), timeout=90)
        
        print("\n--- RESPONSE DATA ---")
        print(f"Status: {response.get('success')}")
        print(f"Intent detected: {response.get('intent')}")
        print(f"Answer: {response.get('answer')}")
        print("\n--- ANALYSIS PROCESS (Explainability) ---")
        print(json.dumps(response.get('analysis_process'), indent=2))
        
        print("\n--- SQL GENERATED ---")
        print(response.get('sql'))
        
        print("\n--- STAT VALIDATION ---")
        print(json.dumps(response.get('stat_validation'), indent=2))
        
        print("\n--- EXECUTIVE SUMMARY ---")
        print(response.get('executive_summary'))
        
        print("\nTest Successful!")
    except asyncio.TimeoutError:
        print("\nError: The test timed out after 90 seconds.")
    except Exception as e:
        print(f"\nExecution Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
