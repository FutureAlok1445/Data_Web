import json
import os
from pathlib import Path

def _get_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    import anthropic
    return anthropic.Anthropic()

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "answer_grounding.txt"

class AnswerGrounder:
    def __init__(self):
        pass

    def ground(self, question, result_df, sql):
        try:
            prompt = PROMPT_PATH.read_text()
        except:
            prompt = "Answer the question based strictly on the data."
            
        if not os.getenv("ANTHROPIC_API_KEY"):
            return "Mock fallback answer based on local constraints."
            
        data_str = "No results"
        if result_df is not None and not result_df.empty:
            data_str = result_df.head(10).to_string()
            
        context = f"Question: {question}\nSQL: {sql}\nData Result:\n{data_str}"
        try:
            response = _get_client().messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=600,
                system=prompt,
                messages=[{"role": "user", "content": context}]
            )
            return response.content[0].text.strip()
        except Exception as e:
            return f"Answer generation failed: {str(e)}"

    def generate_follow_ups(self, question, answer, all_cols):
        return [
            "What factors influence this trend?",
            "Can you break this down further?"
        ]
