from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, JSONResponse
import pandas as pd
from routes.upload import safe_read_sessions
from core.report import generate_pdf_report

router = APIRouter()

@router.get("/csv/{session_id}")
async def export_csv(session_id: str):
    sessions = safe_read_sessions()
    session = sessions.get(session_id)
    if not session or not session.get("history"):
        raise HTTPException(status_code=404, detail="No history found for session")
        
    last_query = session["history"][-1]
    df = pd.DataFrame(last_query.get("data", []))
    csv_data = df.to_csv(index=False)
    
    return Response(
        content=csv_data, 
        media_type="text/csv", 
        headers={"Content-Disposition": 'attachment; filename="export.csv"'}
    )

@router.get("/json/{session_id}")
async def export_json(session_id: str):
    sessions = safe_read_sessions()
    session = sessions.get(session_id)
    if not session or not session.get("history"):
        raise HTTPException(status_code=404, detail="No history found for session")
        
    last_query = session["history"][-1]
    return JSONResponse(content=last_query.get("data", []))

@router.get("/sql/{session_id}")
async def export_sql(session_id: str):
    sessions = safe_read_sessions()
    session = sessions.get(session_id)
    if not session or not session.get("history"):
        raise HTTPException(status_code=404, detail="No history found for session")
        
    last_query = session["history"][-1]
    sql_query = last_query.get("sql", "")
    
    return Response(
        content=sql_query,
        media_type="text/plain",
        headers={"Content-Disposition": 'attachment; filename="query.sql"'}
    )
    
@router.get("/pdf/{session_id}")
async def export_pdf(session_id: str):
    sessions = safe_read_sessions()
    session = sessions.get(session_id)
    if not session or not session.get("history"):
        raise HTTPException(status_code=404, detail="No history found for session")
        
    pdf_bytes = generate_pdf_report(session)
    if not pdf_bytes:
        raise HTTPException(status_code=500, detail="Failed to generate PDF report")
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="datatalk_report.pdf"'}
    )
