import json
from pathlib import Path
from typing import Optional, List, Dict
import anthropic

client = anthropic.Anthropic()

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "sql_generation.txt"
SQL_PROMPT = PROMPT_PATH.read_text()


class QueryEngine:
    def __init__(self, db, schema_analyzer, table_name: str = "main_data"):
        self.db = db
        self.schema = schema_analyzer
        self.table = table_name
        self.conversation_history: List[Dict] = []

    def generate_sql(
        self,
        question: str,
        schema_context: str,
        previous_error: Optional[str] = None,
        previous_sql: Optional[str] = None
    ) -> str:

        error_block = ""
        if previous_error and previous_sql:
            error_block = f"""
PREVIOUS ATTEMPT FAILED:
SQL tried: {previous_sql}
Error: {previous_error}
Fix the above error and try again.
"""

        history_block = ""
        if self.conversation_history:
            recent = self.conversation_history[-3:]
            history_block = f"\nCONVERSATION HISTORY (for context on follow-up questions):\n"
            for turn in recent:
                history_block += f"User: {turn['q']}\nSQL used: {turn.get('sql', '')}\n\n"

        user_message = f"""
{schema_context}

TABLE NAME: {self.table}

{history_block}

{error_block}

USER QUESTION: {question}

Write the SQL query now:
"""

        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            system=SQL_PROMPT,
            messages=[{"role": "user", "content": user_message}]
        )

        sql = response.content[0].text.strip()
        # Remove markdown code blocks if present
        sql = sql.replace("```sql", "").replace("```", "").strip()
        return sql

    def detect_chart_type_from_sql(self, sql: str, question: str) -> str:
        q = question.lower()
        if any(w in q for w in ["trend", "over time", "monthly", "yearly", "growth", "decline"]):
            return "line"
        if any(w in q for w in ["proportion", "share", "percentage", "breakdown", "portion"]):
            return "pie"
        if any(w in q for w in ["distribution", "spread", "range", "histogram"]):
            return "histogram"
        if any(w in q for w in ["correlation", "relationship", "vs", "against", "scatter"]):
            return "scatter"
        if "GROUP BY" in sql.upper() and sql.upper().count("GROUP BY") > 1:
            return "heatmap"
        return "bar"

    def add_to_history(self, question: str, sql: str, answer: str):
        self.conversation_history.append({
            "q": question,
            "sql": sql,
            "a": answer[:200]
        })
        # Keep last 10 turns
        self.conversation_history = self.conversation_history[-10:]