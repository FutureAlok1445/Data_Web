import json
import os
from pathlib import Path

def _get_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    import anthropic
    return anthropic.Anthropic()

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "executive_summary.txt"

class ExecutiveSummaryEngine:
    def __init__(self):
        pass

    def generate(self, question, answer):
        try:
            prompt = PROMPT_PATH.read_text()
        except:
            prompt = "Generate JSON executive summary with keys: risk_level, key_finding, recommended_action."
            
        if not os.getenv("ANTHROPIC_API_KEY"):
            return {
                "risk_level": "Low",
                "key_finding": "No significant API key found for finding generation.",
                "recommended_action": "Enable API configurations."
            }
            
        try:
            response = _get_client().messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=300,
                system=prompt,
                messages=[{"role": "user", "content": f"Question: {question}\nAnswer: {answer}"}]
            )
            text = response.content[0].text.strip()
            text = text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception as e:
            return {
                "risk_level": "Unknown",
                "key_finding": f"Error synthesizing executive summary.",
                "recommended_action": str(e)
            }
