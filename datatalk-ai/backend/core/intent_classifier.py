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
    aggregation_method: Optional[str] = None
    methodology: Optional[str] = None
    infographic: bool = False
    expanded_queries: Optional[List[str]] = None
    recommended_chart_type: Optional[str] = None

    @field_validator("intent")
    @classmethod
    def validate_intent(cls, v: str) -> str:
        valid = {
            "CHURN_ANALYSIS",
            "GROUP_COMPARISON",
            "TREND_ANALYSIS",
            "DISTRIBUTION",
            "METRIC_CALCULATION",
            "INDIVIDUAL_LOOKUP",
            "INFOGRAPHIC_REQUEST",
            "UNSUPPORTED",
            "COLUMN_ANALYSIS",
            "VAGUE_QUERY"
        }
        v = v.upper().strip()
        if v not in valid:
            return "UNSUPPORTED"
        return v


# ---------------------------------------------------------------------------
# Intent classifier
# ---------------------------------------------------------------------------

def classify_intent(user_query: str, history: List[dict] = None) -> IntentResult:
    """
    Calls Gemini to classify the user query into a structured intent.
    Incorporates session history for conversational context.
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

    # Format history for context (just the last round to keep it snappy)
    context_str = ""
    if history and len(history) > 0:
        last = history[-1]
        context_str = f"Previous Interaction:\nUser: {last.get('query')}\nAssistant: {last.get('answer', '')[:200]}..."

    # ------------------------------------------------------------------
    # Keyword fallback (no API key required)
    # ------------------------------------------------------------------
    if not api_key:
        query_lower = user_query.lower()
        infographic = any(
            kw in query_lower
            for kw in ["infographic", "poster", "image", "visual summary"]
        )
        
        # Default results
        intent = "UNSUPPORTED"
        agg = None
        method = None
        metric = None

        if infographic:
            intent = "INFOGRAPHIC_REQUEST"
        elif "churn" in query_lower:
            intent = "CHURN_ANALYSIS"
            agg = "group-by"
            metric = "rate"
            method = "Calculating ratio of churned customers to total population."
        elif any(kw in query_lower for kw in ["customer", "id", "individual", "specific"]):
            intent = "INDIVIDUAL_LOOKUP"
            agg = "filtering"
            method = "Retrieving detailed record matching unique identifier."
        elif any(kw in query_lower for kw in ["compare", "versus", "vs", "between", "by gender", "by contract", "by payment"]):
            intent = "GROUP_COMPARISON"
            agg = "group-by"
            method = "Segmenting metrics across specified category dimensions."
        elif any(kw in query_lower for kw in ["rate", "average", "total", "count", "sum", "percentage"]):
            intent = "METRIC_CALCULATION"
            agg = "summation" if "sum" in query_lower else "averaging"
            method = "Performing aggregate computation on target numeric column."
        elif any(kw in query_lower for kw in ["distribution", "breakdown"]):
            intent = "DISTRIBUTION"
            agg = "group-by"
            method = "Calculating frequency of unique values within column."
            
        return IntentResult(
            intent=intent, 
            target_columns=[], 
            metric=metric, 
            aggregation_method=agg,
            methodology=method,
            infographic=infographic
        )

    # ------------------------------------------------------------------
    # Gemini call
    # ------------------------------------------------------------------
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    full_prompt = f"{system_prompt}\n\n{context_str}\n\nUser Query: {user_query}"

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
        # Safe fallback
        return IntentResult(
            intent="GROUP_COMPARISON",
            target_columns=[],
            metric=None,
            aggregation_method="group-by",
            methodology="Attempting segmented analysis on provided query.",
            infographic=False,
        )
