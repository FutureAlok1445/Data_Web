import json
import os
import re
from pathlib import Path
from typing import Optional, List, Dict

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "sql_generation.txt"

def _get_client():
    """Lazily create Anthropic client only when API key is available."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    import anthropic
    return anthropic.Anthropic()

# Read the SQL generation prompt once
try:
    SQL_PROMPT = PROMPT_PATH.read_text()
except Exception:
    SQL_PROMPT = "You are a SQL expert. Generate DuckDB-compatible SQL queries."


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

        client = _get_client()

        # === FALLBACK: No API key – generate SQL using keyword heuristics ===
        if client is None:
            return self._fallback_sql(question, schema_context)

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

    def _fallback_sql(self, question: str, schema_context: str) -> str:
        """
        Generate a reasonable SQL query from keywords when no LLM API key is available.
        This enables the demo to work end-to-end without an external API.
        """
        q = question.lower()

        # Extract column names from schema context
        columns = []
        try:
            # schema_context starts with "Schema:\n{...json...}"
            json_str = schema_context.split("Schema:\n", 1)[-1]
            json_str = json_str.split("\n\nData Dictionary:")[0]
            schema_dict = json.loads(json_str)
            columns = list(schema_dict.keys())
        except Exception:
            pass

        if not columns:
            return f"SELECT * FROM {self.table} LIMIT 10"

        # Find mentioned columns
        mentioned = [c for c in columns if c.lower() in q or c.lower().replace("_", " ") in q]

        # Detect aggregation keywords
        agg_map = {
            "average": "AVG", "avg": "AVG", "mean": "AVG",
            "sum": "SUM", "total": "SUM",
            "count": "COUNT", "how many": "COUNT",
            "maximum": "MAX", "max": "MAX", "highest": "MAX",
            "minimum": "MIN", "min": "MIN", "lowest": "MIN",
        }
        agg_func = None
        for keyword, func in agg_map.items():
            if keyword in q:
                agg_func = func
                break

        # Detect GROUP BY keywords
        group_keywords = ["by", "per", "for each", "across", "grouped by", "breakdown"]
        group_col = None
        for kw in group_keywords:
            if kw in q:
                # Find a categorical column mentioned after the keyword
                idx = q.find(kw)
                rest = q[idx + len(kw):].strip()
                for c in columns:
                    if c.lower() in rest or c.lower().replace("_", " ") in rest:
                        group_col = c
                        break
                if group_col:
                    break

        # Detect numeric columns for aggregation target
        numeric_cols = []
        try:
            for c, info in schema_dict.items():
                if isinstance(info, dict) and info.get("type") in ("numeric", "float", "int"):
                    numeric_cols.append(c)
        except Exception:
            pass

        agg_target = None
        if mentioned:
            for m in mentioned:
                if m != group_col:
                    agg_target = m
                    break
        if not agg_target and numeric_cols:
            agg_target = numeric_cols[0]

        # Build SQL
        if agg_func and group_col and agg_target:
            return f"SELECT \"{group_col}\", {agg_func}(\"{agg_target}\") as result FROM {self.table} GROUP BY \"{group_col}\" ORDER BY result DESC"
        elif agg_func and agg_target:
            return f"SELECT {agg_func}(\"{agg_target}\") as result FROM {self.table}"
        elif group_col:
            return f"SELECT \"{group_col}\", COUNT(*) as count FROM {self.table} GROUP BY \"{group_col}\" ORDER BY count DESC"
        elif "distribution" in q or "spread" in q:
            target = agg_target or (numeric_cols[0] if numeric_cols else columns[0])
            return f"SELECT \"{target}\", COUNT(*) as count FROM {self.table} GROUP BY \"{target}\" ORDER BY count DESC LIMIT 20"
        elif "top" in q:
            limit_match = re.search(r'top\s+(\d+)', q)
            limit = int(limit_match.group(1)) if limit_match else 10
            return f"SELECT * FROM {self.table} LIMIT {limit}"
        else:
            # Default: select all with limit
            return f"SELECT * FROM {self.table} LIMIT 20"

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