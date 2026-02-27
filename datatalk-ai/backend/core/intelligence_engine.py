import json
import re
from typing import List, Dict, Any, Optional
from core.nvidia_client import nvidia_complete
from core.prompt_manager import prompt_manager
from models.ai_models import AnalyticMission, GroundedAnswer, ExecutiveReport, AutoInsights
import pandas as pd

class IntelligenceEngine:
    def __init__(self, db, schema_analyzer, table_name: str = "main_data"):
        self.db = db
        self.schema_analyzer = schema_analyzer
        self.table = table_name
        self.conversation_history: List[Dict] = []

    def classify_intent(self, question: str) -> AnalyticMission:
        """Step 1: Parse user intent into an Analytic Mission."""
        history_str = json.dumps(self.conversation_history[-3:]) if self.conversation_history else "None"
        schema_info = json.dumps(self.schema_analyzer.schema)
        
        system_prompt = prompt_manager.get_prompt("intent_classification")
        user_content = f"QUESTION: {question}\nSCHEMA: {schema_info}\nPREVIOUS_INTERACTION: {history_str}"
        
        response = nvidia_complete(system_prompt, user_content, max_tokens=1024, temperature=0.1)
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            return AnalyticMission(**data)
        raise ValueError("Failed to parse intent from LLM response.")

    def generate_sql(self, mission: AnalyticMission) -> str:
        """Step 2: Generate deterministic SQL from the Analytic Mission."""
        schema_info = json.dumps(self.schema_analyzer.schema)
        system_prompt = prompt_manager.get_prompt("sql_generation")
        user_content = f"MISSION: {mission.json()}\nSCHEMA: {schema_info}\nTABLE: {self.table}"
        
        sql = nvidia_complete(system_prompt, user_content, max_tokens=512, temperature=0.1)
        sql = sql.replace("```sql", "").replace("```", "").strip()
        if "UNSUPPORTED_QUERY" in sql:
            return "UNSUPPORTED"
        return sql

    def ground_answer(self, question: str, sql_result: pd.DataFrame, sql_query: str) -> GroundedAnswer:
        """Step 3: Generate a data-backed answer strictly from execution results."""
        data_json = sql_result.round(2).to_dict(orient="records")
        system_prompt = prompt_manager.get_prompt("answer_grounding")
        user_content = f"QUESTION: {question}\nSQL_QUERY: {sql_query}\nSQL_RESULT: {json.dumps(data_json[:20])}"
        
        response = nvidia_complete(system_prompt, user_content, max_tokens=1024, temperature=0.1)
        
        # Robust parsing for split sections
        recs = []
        if "BUSINESS RECOMMENDATIONS" in response:
            parts = response.split("BUSINESS RECOMMENDATIONS")
            answer_part = parts[0].replace("DATA-BACKED ANSWER:", "").strip()
            recs_part = parts[1].strip().replace(":", "")
            recs = [r.strip("- ").strip() for r in recs_part.split("\n") if r.strip() and len(r) > 10]
        else:
            answer_part = response.strip()

        # Clean up Markdown artifacts
        answer_part = re.sub(r'#+\s*', '', answer_part)
        answer_part = answer_part.replace("**", "")

        # Numeric Verification (Anti-Hallucination)
        allowed_numbers = self._extract_numbers_from_df(sql_result)
        # Extract numbers, handling comma separators
        found_nums = re.findall(r"[-+]?\d*\.\d+|\d+", answer_part.replace(",", ""))
        
        for num_str in found_nums:
            try:
                val = float(num_str)
                # Allow small tolerance for rounding or percentage diffs
                if not any(abs(val - float(a)) < 0.05 for a in allowed_numbers):
                    # If it's a small integer like 1, 2, 3 (list numbering), ignore
                    if val < 10 and len(num_str) == 1: continue
                    answer_part = answer_part.replace(num_str, f"{num_str}[UNVERIFIED]")
            except ValueError:
                continue

        return GroundedAnswer(answer=answer_part, recommendations=recs[:3])

    def generate_executive_report(self, question: str, answer: str, sql_result: pd.DataFrame) -> ExecutiveReport:
        """Step 4: Synthesize high-level business report."""
        kpis = sql_result.describe().to_dict() if not sql_result.empty else {}
        system_prompt = prompt_manager.get_prompt("executive_summary")
        user_content = f"QUESTION: {question}\nANSWER: {answer}\nKPI_STATS: {json.dumps(kpis)}"
        
        response = nvidia_complete(system_prompt, user_content, max_tokens=1024, temperature=0.1)
        
        def extract(field):
            # Look for "Field Name:", "**Field Name:**", "1. Field Name:", etc.
            pattern = rf"(?:^|\n)(?:\d+\.\s*)?(?:\*\*)?{field}(?:\*\*)?:?\s*(.*)"
            m = re.search(pattern, response, re.IGNORECASE)
            return m.group(1).split("\n")[0].strip() if m else ""

        return ExecutiveReport(
            summary=extract("Summary") or extract("Key Finding") or "Analysis summary generated.",
            risk_level=extract("Risk Level") or "LOW",
            business_impact=extract("Business Impact") or "Impact data unavailable.",
            priority_action=extract("Priority Action") or extract("Recommended Action") or "Continue monitoring data trends.",
            statistical_confidence=extract("Statistical Confidence")
        )

    def explain_chart(self, chart_type: str, result_df: pd.DataFrame, question: str) -> str:
        """Multimodal Explanation Mode."""
        system_prompt = prompt_manager.get_prompt("chart_interpretation")
        snippet = result_df.head(5).to_dict(orient="records")
        user_content = f"CHART_TYPE: {chart_type}\nMETADATA: {json.dumps(snippet)}\nQUESTION: {question}"
        
        return nvidia_complete(system_prompt, user_content, max_tokens=512, temperature=0.1)

    def _extract_numbers_from_df(self, df: pd.DataFrame) -> List[float]:
        numbers = []
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                numbers.extend(df[col].tolist())
        return [float(n) for n in numbers if pd.notnull(n)]

    def add_to_history(self, question: str, sql: str, answer: str):
        self.conversation_history.append({"q": question, "sql": sql, "a": answer})
        if len(self.conversation_history) > 10:
            self.conversation_history = self.conversation_history[-10:]
