import json
import os
from pathlib import Path
from core.nvidia_client import nvidia_complete, has_api_key

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "data_dictionary.txt"

class SchemaAnalyzer:
    def __init__(self, schema):
        self.schema = schema
        self.data_dictionary = {}

    def generate_data_dictionary(self):
        try:
            system_prompt = PROMPT_PATH.read_text()
        except Exception:
            system_prompt = "Generate a data dictionary as JSON. Each key is a column name, each value has: description, data_type_category. Return ONLY valid JSON."

        if not has_api_key():
            self.data_dictionary = self._fallback_dict()
            return self.data_dictionary

        schema_context = json.dumps(self.schema, indent=2)
        user_message = f"""Schema:
{schema_context}

Return ONLY valid JSON where each key is a column name with description and data_type_category."""

        text = nvidia_complete(system_prompt, user_message, max_tokens=1500, temperature=0.1)
        if not text:
            self.data_dictionary = self._fallback_dict()
            return self.data_dictionary

        try:
            text = text.replace("```json", "").replace("```", "").strip()
            self.data_dictionary = json.loads(text)
        except:
            self.data_dictionary = self._fallback_dict()
        return self.data_dictionary

    def _fallback_dict(self):
        return {
            col: {"description": f"{col.replace('_', ' ').title()} column", "data_type_category": dtype}
            for col, dtype in self.schema.items()
        }

    def generate_sample_questions(self, target_col):
        if not target_col:
            return ["Show me a summary of the data."]
        return [
            f"What is the average {target_col}?",
            f"Show me the distribution of {target_col}.",
            f"How does {target_col} correlate with other features?"
        ]
