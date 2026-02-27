import os
import json
import google.generativeai as genai
from pydantic import BaseModel, field_validator
from typing import List, Optional

# ---------------------------------------------------------------------------
# Pydantic model for structured intent output
# ---------------------------------------------------------------------------

class IntentResult(BaseModel):
    intent: str
    target_columns: List[str] = []
    metric: Optional[str] = None
    infographic: bool = False

    @field_validator("intent")
    @classmethod
    def validate_intent(cls, v: str) -> str:
        valid = {
            "COLUMN_ANALYSIS",
            "GROUP_COMPARISON",
            "METRIC_CALCULATION",
            "INDIVIDUAL_LOOKUP",
            "INFOGRAPHIC_REQUEST",
            "UNSUPPORTED",
        }
        v = v.upper().strip()
        if v not in valid:
            return "UNSUPPORTED"
        return v


# ---------------------------------------------------------------------------
# Intent classifier
# ---------------------------------------------------------------------------

def classify_intent(user_query: str) -> IntentResult:
    """
    Calls Gemini to classify the user query into a structured intent.
    Falls back to a keyword heuristic if the API key is missing.
    """
    prompt_path = os.path.join(
        os.path.dirname(__file__), "..", "prompts", "intent_classification.txt"
    )
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            system_prompt = f.read()
    except FileNotFoundError:
        system_prompt = "Classify user analytics queries. Return JSON with intent."

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    # ------------------------------------------------------------------
    # Keyword fallback (no API key required)
    # ------------------------------------------------------------------
    if not api_key:
        query_lower = user_query.lower()
        infographic = any(
            kw in query_lower
            for kw in ["infographic", "poster", "image", "visual summary"]
        )
        intent = "UNSUPPORTED"
        if infographic:
            intent = "INFOGRAPHIC_REQUEST"
        elif any(kw in query_lower for kw in ["customer", "id", "individual", "specific"]):
            intent = "INDIVIDUAL_LOOKUP"
        elif any(kw in query_lower for kw in ["compare", "versus", "vs", "between", "by gender", "by contract", "by payment"]):
            intent = "GROUP_COMPARISON"
        elif any(kw in query_lower for kw in ["rate", "average", "total", "count", "sum", "percentage", "churn rate"]):
            intent = "METRIC_CALCULATION"
        elif any(kw in query_lower for kw in ["distribution", "analysis", "analytics", "breakdown"]):
            intent = "COLUMN_ANALYSIS"
        return IntentResult(intent=intent, target_columns=[], metric=None, infographic=infographic)

    # ------------------------------------------------------------------
    # Gemini call
    # ------------------------------------------------------------------
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    full_prompt = f"{system_prompt}\n\nUser Query: {user_query}"

    try:
        response = model.generate_content(full_prompt)
        raw = response.text.strip()

        # Strip markdown code fences if present
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()

        parsed = json.loads(raw)
        return IntentResult(**parsed)

    except Exception:
        # Safe fallback — treat as generic column analysis
        return IntentResult(
            intent="COLUMN_ANALYSIS",
            target_columns=[],
            metric=None,
            infographic=False,
        )
