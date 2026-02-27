from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import duckdb
import os
import pandas as pd

from routes.upload import safe_read_sessions, safe_write_sessions
from core.validator import execute_with_retry
from core.answer_grounder import ground_answer
from core.anomaly import detect_outliers_zscore
from core.insight_discovery import calculate_correlations
from core.executive_summary import generate_executive_summary
from core.intent_classifier import classify_intent
from core.visualizer import build_chart
from core.infographic_generator import generate_infographic, derive_key_highlight

router = APIRouter()

class QueryRequest(BaseModel):
    session_id: str
    query: str

@router.post("/")
async def process_query(req: QueryRequest):
    sessions = safe_read_sessions()
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    file_path = session.get("file_path")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Dataset file missing from server")
        
    try:
        # ----------------------------------------------------------------
        # STEP 0 — Data Re-hydration (rebuild DuckDB table for this request)
        # ----------------------------------------------------------------
        df = pd.read_csv(file_path)
        schema_keys = list(session.get("schema", {}).keys())
        if len(df.columns) == len(schema_keys):
            df.columns = schema_keys
            
        conn = duckdb.connect(':memory:')
        conn.register("df", df)
        conn.execute("CREATE TABLE dataset AS SELECT * FROM df")

        # ----------------------------------------------------------------
        # STEP 1 — Intent Classification (Gemini / keyword fallback)
        # ----------------------------------------------------------------
        intent_result = classify_intent(req.query)
        intent = intent_result.intent

        # ----------------------------------------------------------------
        # STEP 2 — SQL Generation & Validation loop (Claude / Gemini)
        # ----------------------------------------------------------------
        sql_result = execute_with_retry(
            conn=conn,
            user_query=req.query,
            schema=session.get("schema"),
            data_dictionary=session.get("data_dictionary"),
            table_name="dataset"
        )
        
        if not sql_result["success"]:
            return {
                "success": False,
                "error": sql_result["error"],
                "audit_trail": sql_result.get("audit_trail", []),
                "intent": intent,
            }
            
        data = sql_result["data"]
        sql = sql_result["sql"]
        result_df = pd.DataFrame(data)

        # ----------------------------------------------------------------
        # STEP 3 — Answer Grounding (LLM explains data, never calculates)
        # ----------------------------------------------------------------
        answer = ground_answer(req.query, sql, data)

        # ----------------------------------------------------------------
        # STEP 4 — Micro-analytics (Anomalies & Correlations on result set)
        # ----------------------------------------------------------------
        anomalies = {}
        insights = []
        if not result_df.empty:
            numeric_cols = result_df.select_dtypes(include=['number']).columns
            for col in numeric_cols:
                outliers = detect_outliers_zscore(result_df, col)
                if outliers and outliers.get("outlier_count", 0) > 0:
                    anomalies[col] = outliers
            insights = calculate_correlations(result_df)

        # ----------------------------------------------------------------
        # STEP 5 — Executive Summary
        # ----------------------------------------------------------------
        kpis = {"total_rows_returned": len(data)}
        exec_summary = generate_executive_summary(kpis, list(anomalies.keys()), insights[:3])

        # ----------------------------------------------------------------
        # STEP 6 — Deterministic Chart Building (Plotly, no LLM)
        # ----------------------------------------------------------------
        chart = None
        if intent != "INDIVIDUAL_LOOKUP" and not result_df.empty:
            chart = build_chart(result_df, intent, req.query)

        # ----------------------------------------------------------------
        # STEP 7 — Infographic Generation (Gemini image — only if requested)
        # ----------------------------------------------------------------
        infographic_b64 = None
        if intent_result.infographic and not result_df.empty:
            highlight = derive_key_highlight(data, req.query)
            infographic_b64 = generate_infographic(
                title=req.query.capitalize(),
                data=data,
                key_highlight=highlight,
            )

        # ----------------------------------------------------------------
        # Build response payload
        # ----------------------------------------------------------------
        response = {
            "success": True,
            "query": req.query,
            "intent": intent,
            "sql": sql,
            "answer": answer,
            "data": data,
            "columns": sql_result.get("columns", []),
            "chart": chart,                          # Plotly JSON or None
            "infographic": infographic_b64,           # Base64 PNG or None
            "anomalies": anomalies,
            "insights": insights[:5],
            "executive_summary": exec_summary,
            "audit_trail": sql_result["audit_trail"],
        }
        
        # Save to session history for exports
        session["history"].append(response)
        sessions[req.session_id] = session
        safe_write_sessions(sessions)
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline Error: {str(e)}")
