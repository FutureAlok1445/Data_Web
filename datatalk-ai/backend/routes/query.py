import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from models.request_models import QueryRequest
from routes.upload import get_active_session, load_sessions, save_sessions
from core.stats_engine import StatsEngine
from core.anomaly import AnomalyDetector
from core.answer_grounder import AnswerGrounder
from core.executive_summary import ExecutiveSummaryEngine

router = APIRouter()

stats_engine = StatsEngine()
anomaly_detector = AnomalyDetector()
answer_grounder = AnswerGrounder()
exec_engine = ExecutiveSummaryEngine()


@router.post("/query")
async def query(req: QueryRequest):
    try:
        # 1. Get Session & Components
        session = get_active_session(req.session_id)
        intel_engine = session["intel_engine"]
        discovery = session["discovery"]
        db = session["db"]

        # Update history
        intel_engine.conversation_history = req.conversation_history or []

        # === STEP 1: Intent Classification (Reasoning Layer) ===
        mission = intel_engine.classify_intent(req.question)

        # === STEP 2: Multi-Query Expansion for Vague Queries ===
        if mission.intent == "VAGUE_QUERY" and mission.expanded_queries:
            # For vague queries, we return expansion options to the user
            return {
                "session_id": req.session_id,
                "intent": "VAGUE_QUERY",
                "expanded_queries": mission.expanded_queries,
                "answer": "Your query is broad. Would you like to analyze any of these specific areas?",
                "success": True
            }

        # === STEP 3: SQL Generation & Execution (Deterministic Layer) ===
        sql = intel_engine.generate_sql(mission)
        if sql == "UNSUPPORTED":
             raise HTTPException(400, "Query outside the scope of current dataset.")

        result_df, sql_error = db.execute_query(sql)
        if sql_error:
             raise HTTPException(400, f"SQL Execution Error: {sql_error}")

        # === STEP 4: Grounded Explanation (Formatting Layer) ===
        grounded = intel_engine.ground_answer(req.question, result_df, sql)
        
        # === STEP 5: Visual Interpretation & Selection ===
        chart_type = mission.recommended_chart_type or "BarChart"
        visual_explanation = intel_engine.explain_chart(chart_type, result_df, req.question)

        # === STEP 6: AI-Driven Exploratory Insights (Discovery Agent) ===
        target_col = session["analyzer"].schema.get("target_column")
        extra_insights = discovery.discover_categorical_insights(target_col, session["analyzer"].schema)

        # === STEP 7: Executive Summary (Strategic Layer) ===
        report = intel_engine.generate_executive_report(req.question, grounded.answer, result_df)

        # Cleanup data for response
        result_data = result_df.round(2).to_dict(orient="records") if not result_df.empty else []

        # Update Memory
        intel_engine.add_to_history(req.question, sql, grounded.answer)

        return {
            "session_id": req.session_id,
            "query_id": str(uuid.uuid4())[:8],
            "question": req.question,
            "intent": mission.intent,
            "answer": grounded.answer,
            "recommendations": grounded.recommendations,
            "sql_executed": sql,
            "result_data": result_data,
            "row_count": len(result_df),
            "chart_type": chart_type,
            "visual_explanation": visual_explanation,
            "executive_summary": {
                "summary": report.summary,
                "risk_level": report.risk_level,
                "business_impact": report.business_impact,
                "priority_action": report.priority_action,
                "statistical_confidence": report.statistical_confidence
            },
            "auto_insights": extra_insights,
            "success": True
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return { "success": False, "error_message": str(e) }


