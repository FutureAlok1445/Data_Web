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
from core.stats_engine import run_ttest, run_chisquare, calculate_confidence_interval
from core.visualizer import generate_plotly_figure

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
        stats = {}
        result_df = pd.DataFrame(data)
        
        if not result_df.empty:
            numeric_cols = result_df.select_dtypes(include=['number']).columns.tolist()
            non_numeric_cols = [c for c in result_df.columns if c not in numeric_cols]
            
            # Anomaly detection on each numeric column
            for col in numeric_cols:
                outliers = detect_outliers_zscore(result_df, col)
                if outliers and outliers.get("outlier_count", 0) > 0:
                    anomalies[col] = outliers
                    
            # Correlations
            insights = calculate_correlations(result_df)
            
            # Statistical tests
            if len(non_numeric_cols) >= 1 and len(numeric_cols) >= 1:
                group_col = non_numeric_cols[0]
                value_col = numeric_cols[0]
                num_groups = result_df[group_col].nunique()
                
                # t-test for 2-group comparisons
                if num_groups == 2:
                    ttest_result = run_ttest(result_df, group_col, value_col)
                    if ttest_result and "error" not in ttest_result:
                        stats["ttest"] = ttest_result
                
                # chi-square for categorical associations
                if num_groups >= 2 and len(non_numeric_cols) >= 2:
                    chi_result = run_chisquare(result_df, non_numeric_cols[0], non_numeric_cols[1])
                    if chi_result and "error" not in chi_result:
                        stats["chisquare"] = chi_result
                        
            # Confidence interval on primary numeric column
            if len(numeric_cols) >= 1:
                ci_result = calculate_confidence_interval(result_df, numeric_cols[0])
                if ci_result and "error" not in ci_result:
                    stats["confidence_interval"] = ci_result
            
        # 4. Executive Summary Generation
        kpis = {"total_rows_returned": len(data)}
        # Pass a summarized version of anomalies/insights
        exec_summary = generate_executive_summary(kpis, list(anomalies.keys()), insights[:3])
        
        # 5. Generate visualization config (Plotly JSON)
        viz_config = generate_plotly_figure(data, req.query, answer)
        
        response = {
            "success": True,
            "query": req.query,
            "sql": sql,
            "answer": answer,
            "data": data,
            "columns": sql_result.get("columns", []),
            "anomalies": anomalies,
            "insights": insights[:5], # Keep top 5
            "stats": stats,
            "executive_summary": exec_summary,
            "visualization": viz_config,
            "audit_trail": sql_result["audit_trail"]
        }
        
        # Save payload to session history for exports later
        # Don't store large viz config in session file
        history_record = {k: v for k, v in response.items() if k != 'visualization'}
        session["history"].append(history_record)
        sessions[req.session_id] = session
        safe_write_sessions(sessions)
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline Error: {str(e)}")
