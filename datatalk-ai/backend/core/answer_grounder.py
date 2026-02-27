import os
from pathlib import Path
from core.nvidia_client import nvidia_complete, has_api_key

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "answer_grounding.txt"

class AnswerGrounder:
    def __init__(self):
        pass

    def ground(self, question, result_df, sql):
        try:
            system_prompt = PROMPT_PATH.read_text()
        except:
            system_prompt = "Answer the question based strictly on the data provided. Be concise and factual. Do not guess or hallucinate."

        if not has_api_key():
            return self._fallback_answer(question, result_df)

        data_str = "No results"
        if result_df is not None and not result_df.empty:
            data_str = result_df.head(15).to_string()

        user_message = f"""Question: {question}
SQL Executed: {sql}
Data:
{data_str}

Provide a direct, factual answer based strictly on the data above:"""

        answer = nvidia_complete(system_prompt, user_message, max_tokens=600, temperature=0.3)
        return answer if answer else self._fallback_answer(question, result_df)

    def _fallback_answer(self, question, result_df):
        if result_df is None or result_df.empty:
            return "No data found for this query."
        rows = len(result_df)
        cols = list(result_df.columns)
        try:
            summary_parts = []
            for col in cols[:3]:
                if result_df[col].dtype in ['float64', 'int64']:
                    summary_parts.append(f"{col}: avg={result_df[col].mean():.2f}, max={result_df[col].max():.2f}")
                else:
                    top = result_df[col].value_counts().index[0] if not result_df[col].empty else "N/A"
                    summary_parts.append(f"{col}: top='{top}'")
            return f"Query returned {rows} rows. Summary: {'; '.join(summary_parts)}."
        except:
            return f"Query returned {rows} rows across {len(cols)} columns."

    def generate_follow_ups(self, question, answer, all_cols):
        return [
            "What factors influence this trend?",
            "Can you break this down further?",
            f"Show me the distribution of {all_cols[0] if all_cols else 'the data'}.",
        ]
