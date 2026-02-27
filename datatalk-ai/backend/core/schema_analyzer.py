import json
import os
from pathlib import Path

def _get_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    import anthropic
    return anthropic.Anthropic()

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "data_dictionary.txt"

class SchemaAnalyzer:
    def __init__(self, schema):
        self.schema = schema
        self.data_dictionary = {}

    def generate_data_dictionary(self):
        try:
            prompt = PROMPT_PATH.read_text()
        except Exception:
            prompt = "Generate a data dictionary."
        
        # Only run if API key exists
        if not os.getenv("ANTHROPIC_API_KEY"):
            self.data_dictionary = {"mock": {"description": "Mock Data Dictionary", "data_type_category": "categorical"}}
            return self.data_dictionary
            
        schema_context = json.dumps(self.schema, indent=2)
        try:
            response = _get_client().messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                system=prompt,
                messages=[{"role": "user", "content": schema_context}]
            )
            text = response.content[0].text.strip()
            text = text.replace("```json", "").replace("```", "").strip()
            self.data_dictionary = json.loads(text)
        except Exception as e:
            self.data_dictionary = {"error": str(e)}
        return self.data_dictionary

    def generate_sample_questions(self, target_col):
        if not target_col:
            return ["Show me a summary of the data."]
        return [
            f"What is the average {target_col}?",
            f"Show me the distribution of {target_col}.",
            f"How does {target_col} correlate with other features?"
        ]
