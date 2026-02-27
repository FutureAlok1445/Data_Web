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
    # Get active session
    session = get_active_session(req.session_id)
    validator = session["validator"]
    query_engine = session["query_engine"]
    analyzer = session["analyzer"]
    db = session["db"]

    # Load conversation history into query engine
    query_engine.conversation_history = req.conversation_history or []

    # === STEP 1: Run full pipeline with self-healing ===
    execution = validator.execute_with_retry(req.question)

    sql = execution.get("sql")
    result_df = execution.get("result")
    error = execution.get("error")
    audit_trail = execution.get("audit_trail", [])
    attempts = execution.get("attempts", 1)
    relevant_cols = execution.get("relevant_columns", [])

    # === STEP 2: Handle unanswerable ===
    if error == "UNANSWERABLE":
        return {
            "session_id": req.session_id,
            "query_id": str(uuid.uuid4())[:8],
            "question": req.question,
            "answer": (
                "This question cannot be answered from the current dataset. "
                "The data does not contain the information needed to respond to this query. "
                "Please ask something that can be derived from the available columns."
            ),
            "sql_executed": None,
            "result_data": None,
            "row_count": 0,
            "chart_type": None,
            "stats": None,
            "anomalies": [],
            "executive_summary": None,
            "follow_up_questions": [],
            "audit_trail": audit_trail,
            "relevant_columns": relevant_cols,
            "attempts": attempts,
            "success": False,
            "error_message": "Question is outside the scope of the current dataset"
        }

    # === STEP 3: Handle execution failure ===
    if result_df is None and error:
        return {
            "session_id": req.session_id,
            "query_id": str(uuid.uuid4())[:8],
            "question": req.question,
            "answer": f"Unable to compute answer after {attempts} attempts. Please rephrase your question.",
            "sql_executed": sql,
            "result_data": None,
            "row_count": 0,
            "chart_type": None,
            "stats": None,
            "anomalies": [],
            "executive_summary": None,
            "follow_up_questions": [],
            "audit_trail": audit_trail,
            "relevant_columns": relevant_cols,
            "attempts": attempts,
            "success": False,
            "error_message": error
        }

    # === STEP 3.5: Handle empty results ===
    if result_df is not None and result_df.empty:
        return {
            "session_id": req.session_id,
            "query_id": str(uuid.uuid4())[:8],
            "question": req.question,
            "answer": "No data found matching your question. The generated query returned 0 rows.",
            "sql_executed": sql,
            "result_data": [],
            "row_count": 0,
            "chart_type": None,
            "stats": None,
            "anomalies": [],
            "executive_summary": None,
            "follow_up_questions": [],
            "audit_trail": audit_trail,
            "relevant_columns": relevant_cols,
            "attempts": attempts,
            "success": True,
            "error_message": None
        }

    # === STEP 4: Statistical validation ===
    stats_result = None
    if result_df is not None and not result_df.empty:
        stats_result = stats_engine.run(result_df, db, req.question)
        if stats_result:
            audit_trail.append({
                "step": "Statistical Validation",
                "detail": f"Test: {stats_result.get('test_type')} | p-value: {stats_result.get('p_value')} | Significant: {stats_result.get('significant')}"
            })

    # === STEP 5: Anomaly detection ===
    anomalies = []
    if result_df is not None and not result_df.empty:
        anomalies = anomaly_detector.check(result_df)
        if anomalies:
            audit_trail.append({
                "step": "Anomaly Detection",
                "detail": f"Found {len(anomalies)} statistical outlier(s)"
            })

    # === STEP 6: Answer grounding (ANTI-HALLUCINATION) ===
    answer = answer_grounder.ground(req.question, result_df, sql)
    audit_trail.append({
        "step": "Answer Grounding",
        "detail": "Answer generated strictly from computed query result — no LLM memory used"
    })

    # === STEP 7: Executive summary ===
    exec_summary = exec_engine.generate(req.question, answer)

    # === STEP 8: Follow-up questions ===
    all_cols = list(analyzer.schema.keys())
    follow_ups = answer_grounder.generate_follow_ups(req.question, answer, all_cols)

    # === STEP 9: Chart type detection ===
    chart_type = query_engine.detect_chart_type_from_sql(sql or "", req.question)

    # === STEP 10: Prepare result data ===
    result_data = None
    if result_df is not None and not result_df.empty:
        result_data = result_df.round(2).to_dict(orient="records")

    # === STEP 11: Update conversation memory ===
    query_engine.add_to_history(req.question, sql or "", answer)

    # === STEP 12: Save to session history ===
    query_id = str(uuid.uuid4())[:8]
    sessions = load_sessions()
    if req.session_id in sessions:
        history_entry = {
            "query_id": query_id,
            "timestamp": datetime.now().isoformat(),
            "user_question": req.question,
            "relevant_columns_used": relevant_cols,
            "sql_executed": sql,
            "result": result_data[:20] if result_data else None,  # save first 20 rows
            "row_count": len(result_df) if result_df is not None else 0,
            "answer": answer,
            "chart_type": chart_type,
            "stats": stats_result,
            "anomalies": [a.get("message", "") for a in anomalies],
            "executive_summary": exec_summary,
            "attempts": attempts
        }
        sessions[req.session_id]["query_history"].append(history_entry)
        save_sessions(sessions)

    return {
        "session_id": req.session_id,
        "query_id": query_id,
        "question": req.question,
        "answer": answer,
        "sql_executed": sql,
        "result_data": result_data,
        "row_count": len(result_df) if result_df is not None else 0,
        "chart_type": chart_type,
        "stats": stats_result,
        "anomalies": anomalies,
        "executive_summary": exec_summary,
        "follow_up_questions": follow_ups,
        "audit_trail": audit_trail,
        "relevant_columns": relevant_cols,
        "attempts": attempts,
        "success": True,
        "error_message": None
    }