import json
import os
import re
from pathlib import Path
from typing import Optional, List, Dict
from core.nvidia_client import nvidia_complete, has_api_key

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "sql_generation.txt"

try:
    SQL_PROMPT = PROMPT_PATH.read_text()
except Exception:
    SQL_PROMPT = "You are a SQL expert. Generate DuckDB-compatible SQL queries. Return ONLY the SQL query, no Markdown, no explanation."


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

        if not has_api_key():
            return self._fallback_sql(question, schema_context)

        error_block = ""
        if previous_error and previous_sql:
            error_block = f"\nPREVIOUS SQL FAILED:\nSQL: {previous_sql}\nError: {previous_error}\nFix the error.\n"

        history_block = ""
        if self.conversation_history:
            recent = self.conversation_history[-3:]
            history_block = "\nCONVERSATION HISTORY:\n"
            for turn in recent:
                history_block += f"User: {turn['q']}\nSQL: {turn.get('sql', '')}\n\n"

        user_message = f"""{schema_context}

TABLE NAME: {self.table}
{history_block}
{error_block}

USER QUESTION: {question}

Return ONLY the SQL query, nothing else."""

        sql = nvidia_complete(SQL_PROMPT, user_message, max_tokens=512, temperature=0.1)
        if not sql:
            return self._fallback_sql(question, schema_context)

        sql = sql.replace("```sql", "").replace("```", "").strip()
        return sql if sql else self._fallback_sql(question, schema_context)

    def _fallback_sql(self, question: str, schema_context: str) -> str:
        q = question.lower()
        table = self.table

        col_matches = re.findall(r'"(\w+)":\s*"(\w+)"', schema_context)
        numeric_cols = [c for c, t in col_matches if t in ("numeric", "integer", "float", "number")]
        cat_cols = [c for c, t in col_matches if t in ("text", "categorical", "boolean", "string")]

        if any(w in q for w in ["count", "how many", "total", "number of"]):
            if cat_cols:
                return f'SELECT "{cat_cols[0]}", COUNT(*) as count FROM {table} GROUP BY "{cat_cols[0]}" ORDER BY count DESC LIMIT 20'
            return f'SELECT COUNT(*) as total_count FROM {table}'

        if any(w in q for w in ["average", "avg", "mean"]):
            if numeric_cols and cat_cols:
                return f'SELECT "{cat_cols[0]}", AVG("{numeric_cols[0]}") as avg_value FROM {table} GROUP BY "{cat_cols[0]}" ORDER BY avg_value DESC LIMIT 20'
            if numeric_cols:
                return f'SELECT AVG("{numeric_cols[0]}") as average FROM {table}'

        if any(w in q for w in ["sum", "total"]):
            if numeric_cols and cat_cols:
                return f'SELECT "{cat_cols[0]}", SUM("{numeric_cols[0]}") as total FROM {table} GROUP BY "{cat_cols[0]}" ORDER BY total DESC LIMIT 20'

        if any(w in q for w in ["distribution", "breakdown", "split", "rate", "churn"]):
            if cat_cols:
                return f'SELECT "{cat_cols[0]}", COUNT(*) as count, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage FROM {table} GROUP BY "{cat_cols[0]}" ORDER BY count DESC'

        if any(w in q for w in ["top", "highest", "most", "max"]):
            if numeric_cols and cat_cols:
                return f'SELECT "{cat_cols[0]}", "{numeric_cols[0]}" FROM {table} ORDER BY "{numeric_cols[0]}" DESC LIMIT 10'

        if any(w in q for w in ["bottom", "lowest", "least", "min"]):
            if numeric_cols and cat_cols:
                return f'SELECT "{cat_cols[0]}", "{numeric_cols[0]}" FROM {table} ORDER BY "{numeric_cols[0]}" ASC LIMIT 10'

        if any(w in q for w in ["correlation", "vs", "versus"]):
            if len(numeric_cols) >= 2:
                return f'SELECT "{numeric_cols[0]}", "{numeric_cols[1]}" FROM {table} LIMIT 50'

        return f'SELECT * FROM {table} LIMIT 20'

    def detect_chart_type_from_sql(self, sql: str, question: str) -> str:
        sql_lower = sql.lower()
        q_lower = question.lower()
        if any(w in q_lower for w in ["trend", "over time", "monthly", "yearly", "timeline", "date"]):
            return "LineChart"
        if any(w in q_lower for w in ["distribution", "histogram", "spread"]):
            return "HistogramChart"
        if any(w in q_lower for w in ["proportion", "share", "percentage", "breakdown", "composition"]):
            return "PieChart"
        if any(w in q_lower for w in ["correlation", "scatter", "vs", "versus", "relationship"]):
            return "ScatterChart"
        if "group by" in sql_lower or any(w in q_lower for w in ["compare", "by", "per", "each", "rate"]):
            return "BarChart"
        return "BarChart"

    def add_to_history(self, question: str, sql: str, answer: str):
        self.conversation_history.append({"q": question, "sql": sql, "a": answer})
        if len(self.conversation_history) > 10:
            self.conversation_history = self.conversation_history[-10:]