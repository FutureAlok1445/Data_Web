import os

class PromptManager:
    def __init__(self, prompts_dir: str = "prompts"):
        # Get absolute path relative to this file
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.prompts_path = os.path.join(base_dir, prompts_dir)

    def get_prompt(self, name: str, **kwargs) -> str:
        """Reads a prompt file and formats it with provided kwargs."""
        file_path = os.path.join(self.prompts_path, f"{name}.txt")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Prompt file {name}.txt not found in {self.prompts_path}")
        
        with open(file_path, "r", encoding="utf-8") as f:
            template = f.read()
            
        if kwargs:
            try:
                return template.format(**kwargs)
            except KeyError as e:
                # Fallback: if format fails due to missing keys, return raw or handle partially
                print(f"[PromptManager] Warning: Missing key {e} in prompt {name}")
                return template
        return template

# Singleton instance
prompt_manager = PromptManager()
