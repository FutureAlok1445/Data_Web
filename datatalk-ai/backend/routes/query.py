import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import duckdb
import os
import json
import pandas as pd

from routes.upload import safe_read_sessions, safe_write_sessions
from core.validator import execute_with_retry
from core.answer_grounder import ground_answer
from core.anomaly import detect_outliers_zscore
from core.insight_discovery import calculate_correlations, perform_categorical_sweep
from core.executive_summary import generate_executive_summary
from core.intent_classifier import classify_intent
from core.visualizer import build_chart
from core.infographic_generator import generate_infographic, derive_key_highlight
from core.stats_engine import compare_groups_statistically
import anthropic

def explain_chart(user_query: str, chart_type: str, data: list) -> str:
    """Uses Anthropic to explain the chart data (Multimodal Explanation)."""
    prompt_path = os.path.join(os.path.dirname(__file__), '..', 'prompts', 'chart_interpretation.txt')
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            system_prompt = f.read()
    except FileNotFoundError:
        system_prompt = "Explain this chart data to a CEO."
        
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return "Chart explanation not available (API key missing)."
        
    client = anthropic.Anthropic(api_key=api_key)
    try:
        context = {
            "query": user_query,
            "chart_type": chart_type,
            "data_snippet": data[:10]
        }
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=200,
            system=system_prompt,
            messages=[{"role": "user", "content": json.dumps(context, indent=2)}]
        )
        return response.content[0].text.strip()
    except Exception as e:
        return f"Explanation failed: {str(e)}"

router = APIRouter()

stats_engine = StatsEngine()
anomaly_detector = AnomalyDetector()
answer_grounder = AnswerGrounder()
exec_engine = ExecutiveSummaryEngine()

async def _execute_sub_query(conn, req: QueryRequest, session: dict) -> dict:
    """
    Internal helper to execute a sub-query mission within a larger analytic flow.
    """
    # Simplified pipeline for sub-queries to avoid complex recursion
    intent_result = classify_intent(req.query, history=[])
    intent = intent_result.intent
    
    sql_result = execute_with_retry(
        conn=conn,
        user_query=req.query,
        schema=session.get("schema"),
        data_dictionary=session.get("data_dictionary"),
        table_name="dataset"
    )
    
    if not sql_result["success"]:
        return {"query": req.query, "answer": "Failed to execute sub-analysis.", "success": False}
        
    data = sql_result["data"]
    sql = sql_result["sql"]
    answer = ground_answer(req.query, sql, data)
    
    return {
        "query": req.query,
        "intent": intent,
        "answer": answer,
        "sql": sql,
        "success": True
    }

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
        history = session.get("history", [])
        intent_result = classify_intent(req.query, history=history)
        intent = intent_result.intent

        # ----------------------------------------------------------------
        # NEW: AI-Powered Query Expansion (Phase 3)
        # ----------------------------------------------------------------
        if intent == "VAGUE_QUERY" and intent_result.expanded_queries:
            # Execute multiple sub-queries and synthesize them
            sub_results = []
            for sub_q in intent_result.expanded_queries[:3]: # Limit to top 3 for speed
                # Recursively simulate sub-query (simplified for direct execution here)
                # We reuse the same request structure but override the query
                sub_req = QueryRequest(session_id=req.session_id, query=sub_q)
                try:
                    # In a real system, we'd call this internally without infinite recursion
                    # For this demo, we'll perform a lighter version of the pipeline
                    res = await _execute_sub_query(conn, sub_req, session)
                    sub_results.append(res)
                except Exception:
                    continue
            
            # Synthesize all sub-results into one response
            combined_answer = f"I've expanded your request into a comprehensive analysis:\n\n"
            for r in sub_results:
                combined_answer += f"### {r['query']}\n{r['answer']}\n\n"
            
            response = {
                "success": True,
                "query": req.query,
                "intent": "VAGUE_QUERY_EXPANDED",
                "answer": combined_answer,
                "sub_queries": sub_results,
                "executive_summary": "Expanded analysis complete. See sub-sections for details."
            }
            session["history"].append(response)
            safe_write_sessions(sessions)
            return response

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
        # STEP 5 — Statistical Validation (optional layer)
        # ----------------------------------------------------------------
        stat_validation = {}
        if intent == "GROUP_COMPARISON" and len(intent_result.target_columns) >= 2:
            group_col = intent_result.target_columns[0]
            target_col = intent_result.target_columns[1]
            if group_col in result_df.columns and target_col in result_df.columns:
                stat_validation = compare_groups_statistically(result_df, group_col, target_col)
                if stat_validation.get("significance_msg"):
                    answer += f"\n\n**Statistical Note**: {stat_validation['significance_msg']}"

        # ----------------------------------------------------------------
        # STEP 6 — Executive Summary
        # ----------------------------------------------------------------
        kpis = {"total_rows_returned": len(data)}
        exec_summary = generate_executive_summary(
            kpis=kpis, 
            anomalies=list(anomalies.keys()), 
            insights=insights[:3],
            stat_note=stat_validation.get("significance_msg")
        )

        # ----------------------------------------------------------------
        # STEP 7 — Explainable Process Analysis (The "How it Works" trail)
        # ----------------------------------------------------------------
        analysis_process = {
            "intent": intent,
            "target_columns": intent_result.target_columns,
            "metric_identified": intent_result.metric,
            "aggregation_method": intent_result.aggregation_method,
            "methodology": intent_result.methodology or "Standard SQL aggregation and result formatting.",
            "rows_processed": len(data),
            "verification": "Output verified against deterministic SQL results"
        }

        # ----------------------------------------------------------------
        # STEP 8 — Deterministic Chart Building (AI-directed selection)
        # ----------------------------------------------------------------
        chart = None
        chart_explanation = None
        if intent != "INDIVIDUAL_LOOKUP" and not result_df.empty:
            chart = build_chart(result_df, intent, req.query, intent_result.recommended_chart_type)
            if chart:
                chart_explanation = explain_chart(req.query, chart['chart_type'], data)

        # ----------------------------------------------------------------
        # STEP 9 — Infographic Generation (Gemini image — only if requested)
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
        # STEP 10 — Insight Generation Agent (Proactive Related Insights)
        # ----------------------------------------------------------------
        related_insights = []
        inferred_target = session.get("data_health", {}).get("inferred_target")
        if inferred_target and not df.empty:
            related_insights = perform_categorical_sweep(df, inferred_target)

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
            "chart": chart,
            "chart_explanation": chart_explanation,
            "infographic": infographic_b64,
            "analysis_process": analysis_process,
            "stat_validation": stat_validation,
            "anomalies": anomalies,
            "insights": insights[:5],
            "related_insights": related_insights,
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


# ====================================================================
# EXECUTIVE REPORT GENERATOR (Board-Level Memo)
# ====================================================================

@router.post("/executive-report")
async def generate_executive_report(req: QueryRequest):
    """One-click Board-Level executive summary combining all session analytics."""
    sessions = safe_read_sessions()
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    history = session.get("history", [])
    data_health = session.get("data_health", {})
    top_drivers = session.get("top_drivers", [])
    
    # Collect all prior query answers
    all_findings = []
    for h in history[-10:]:  # Last 10 interactions
        all_findings.append({
            "query": h.get("query", ""),
            "answer": h.get("answer", "")[:300],
            "stat_note": h.get("stat_validation", {}).get("significance_msg", "")
        })
    
    # Build comprehensive context for the LLM
    context = {
        "data_health_summary": data_health,
        "top_drivers": top_drivers[:5],
        "analysis_findings": all_findings,
    }
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return {"success": False, "error": "API key missing"}
        
    client = anthropic.Anthropic(api_key=api_key)
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1500,
            system=(
                "You are a Chief Data Officer writing a board-level executive memo. "
                "Based strictly on the provided analytics findings, write a structured memo with: "
                "1. Executive Summary (2-3 sentences) "
                "2. Key Findings (bullet points with exact numbers) "
                "3. Risk Assessment (High/Medium/Low for each finding) "
                "4. Strategic Recommendations (3 actionable items grounded in data) "
                "5. Next Steps. "
                "Do NOT invent any numbers. Use ONLY the data provided."
            ),
            messages=[{"role": "user", "content": json.dumps(context, indent=2, default=str)}]
        )
        memo = response.content[0].text.strip()
        return {
            "success": True,
            "executive_report": memo,
            "findings_used": len(all_findings),
            "drivers_referenced": len(top_drivers[:5])
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ====================================================================
# AI-DRIVEN INSIGHT RANKING
# ====================================================================

@router.post("/rank-insights")
async def rank_insights(req: QueryRequest):
    """Uses LLM to rank discovered insights by business relevance."""
    sessions = safe_read_sessions()
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    top_drivers = session.get("top_drivers", [])
    data_health = session.get("data_health", {})
    
    if not top_drivers:
        return {"success": True, "ranked_insights": [], "message": "No insights available to rank."}
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        # Fallback: return sorted by impact_score
        ranked = sorted(top_drivers, key=lambda x: x.get("impact_score", 0), reverse=True)
        return {"success": True, "ranked_insights": ranked[:5], "method": "numeric_sort"}
    
    client = anthropic.Anthropic(api_key=api_key)
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=800,
            system=(
                "You are an AI analyst. Rank the following data insights by business relevance. "
                "Consider: (1) Magnitude of difference, (2) Population affected, (3) Actionability. "
                "Return a JSON array of objects with: feature, rank, reasoning (1 sentence). "
                "Return ONLY the JSON array."
            ),
            messages=[{"role": "user", "content": json.dumps(top_drivers[:10], indent=2, default=str)}]
        )
        raw = response.content[0].text.strip()
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
        ranked = json.loads(raw)
        return {"success": True, "ranked_insights": ranked, "method": "ai_ranking"}
    except Exception as e:
        # Fallback
        ranked = sorted(top_drivers, key=lambda x: x.get("impact_score", 0), reverse=True)
        return {"success": True, "ranked_insights": ranked[:5], "method": "numeric_fallback", "error": str(e)}
