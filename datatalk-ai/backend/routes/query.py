from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import duckdb
import os
import pandas as pd

from .upload import safe_read_sessions, safe_write_sessions
from ..core.validator import execute_with_retry
from ..core.answer_grounder import ground_answer
from ..core.anomaly import detect_outliers_zscore
from ..core.insight_discovery import calculate_correlations
from ..core.executive_summary import generate_executive_summary

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
        # 0. Data Re-hydration (create duckdb table for this request)
        df = pd.read_csv(file_path)
        # Using columns stored in schema
        schema_keys = list(session.get("schema", {}).keys())
        if len(df.columns) == len(schema_keys):
            df.columns = schema_keys
            
        conn = duckdb.connect(':memory:')
        conn.register("df", df)
        conn.execute("CREATE TABLE dataset AS SELECT * FROM df")
        
        # 1. SQL Generation & Validation loop
        sql_result = execute_with_retry(
            conn=conn,
            user_query=req.query,
            schema=session.get("schema"),
            data_dictionary=session.get("data_dictionary"),
            table_name="dataset"
        )
        
        if not sql_result["success"]:
            # Even on failure, return the audit trail
            return {"success": False, "error": sql_result["error"], "audit_trail": sql_result.get("audit_trail", [])}
            
        data = sql_result["data"]
        sql = sql_result["sql"]
        
        # 2. Answer Grounding (convert data back to English answer)
        answer = ground_answer(req.query, sql, data)
        
        # 3. Micro-analytics (Anomalies & Correlations on resultset)
        anomalies = {}
        insights = []
        result_df = pd.DataFrame(data)
        
        if not result_df.empty:
            numeric_cols = result_df.select_dtypes(include=['number']).columns
            for col in numeric_cols:
                outliers = detect_outliers_zscore(result_df, col)
                if outliers and outliers.get("outlier_count", 0) > 0:
                    anomalies[col] = outliers
                    
            insights = calculate_correlations(result_df)
            
        # 4. Executive Summary Generation
        kpis = {"total_rows_returned": len(data)}
        # Pass a summarized version of anomalies/insights
        exec_summary = generate_executive_summary(kpis, list(anomalies.keys()), insights[:3])
        
        response = {
            "success": True,
            "query": req.query,
            "sql": sql,
            "answer": answer,
            "data": data,
            "columns": sql_result.get("columns", []),
            "anomalies": anomalies,
            "insights": insights[:5], # Keep top 5
            "executive_summary": exec_summary,
            "audit_trail": sql_result["audit_trail"]
        }
        
        # Save payload to session history for exports later
        session["history"].append(response)
        sessions[req.session_id] = session
        safe_write_sessions(sessions)
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline Error: {str(e)}")
