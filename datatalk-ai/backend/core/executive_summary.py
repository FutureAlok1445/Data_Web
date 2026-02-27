import json
import os
from pathlib import Path
from core.nvidia_client import nvidia_complete, has_api_key

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "executive_summary.txt"

class ExecutiveSummaryEngine:
    def __init__(self):
        pass

    def generate(self, question, answer):
        try:
            system_prompt = PROMPT_PATH.read_text()
        except:
            system_prompt = 'Generate a JSON executive summary. Return ONLY valid JSON with keys: risk_level (High/Medium/Low), key_finding (string), recommended_action (string).'

        if not has_api_key():
            return self._fallback(answer)

        user_message = f"""Question: {question}
Answer: {answer}

Return ONLY valid JSON with exactly these keys: risk_level, key_finding, recommended_action"""

        text = nvidia_complete(system_prompt, user_message, max_tokens=300, temperature=0.2)
        if not text:
            return self._fallback(answer)
        try:
            text = text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except:
            return self._fallback(answer)

    def _fallback(self, answer):
        return {
            "risk_level": "Low",
            "key_finding": (answer or "")[:150],
            "recommended_action": "Review the data and explore further trends."
        }
