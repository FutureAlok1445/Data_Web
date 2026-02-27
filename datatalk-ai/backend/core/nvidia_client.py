"""
Shared LLM client — now using Groq API (OpenAI-compatible).
Model: llama-3.3-70b-versatile (fast, free-tier friendly)
"""
import os
import json
import requests

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def nvidia_complete(system_prompt: str, user_message: str, max_tokens: int = 1024, temperature: float = 0.6) -> str:
    """
    Call Groq API and return the full response text.
    Falls back to empty string on any error.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return ""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": 0.95,
        "stream": False,
    }

    try:
        response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"[GroqClient] API error: {e}")
        return ""


def has_api_key() -> bool:
    return bool(os.getenv("GROQ_API_KEY"))
