import json
import io
import csv as csv_module
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, JSONResponse
import pandas as pd
from routes.upload import safe_read_sessions

router = APIRouter()
TEMP_DIR = Path("/tmp")


@router.get("/export/json/{session_id}")
async def export_json(session_id: str):
    sessions = load_sessions()
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")

    session = sessions[session_id]
    filename = f"datatalk_{session_id}.json"
    filepath = TEMP_DIR / filename

    with open(filepath, "w") as f:
        json.dump(session, f, indent=2, default=str)

    return FileResponse(
        path=str(filepath),
        filename=filename,
        media_type="application/json"
    )


@router.get("/export/sql/{session_id}")
async def export_sql(session_id: str):
    sessions = load_sessions()
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")

    session = sessions[session_id]
    history = session.get("query_history", [])

    lines = [
        f"-- DataTalk AI - SQL Export",
        f"-- Dataset: {session.get('filename', 'Unknown')}",
        f"-- Session: {session_id}",
        f"-- Exported: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"-- Total Queries: {len(history)}",
        "",
    ]

    for i, item in enumerate(history, 1):
        lines.append(f"-- Query {i}: {item.get('user_question', '')}")
        sql = item.get("sql_executed", "")
        if sql:
            lines.append(sql.rstrip(";") + ";")
        lines.append("")

    sql_content = "\n".join(lines)

    return StreamingResponse(
        io.StringIO(sql_content),
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=datatalk_{session_id}.sql"}
    )


@router.get("/export/csv/{session_id}/{query_id}")
async def export_csv(session_id: str, query_id: str):
    sessions = load_sessions()
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")

    history = sessions[session_id].get("query_history", [])
    query = next((q for q in history if q.get("query_id") == query_id), None)

    if not query:
        raise HTTPException(404, "Query not found")

    result = query.get("result", [])
    if not result:
        raise HTTPException(400, "No result data for this query")

    output = io.StringIO()
    writer = csv_module.DictWriter(output, fieldnames=result[0].keys())
    writer.writeheader()
    writer.writerows(result)

    return StreamingResponse(
        io.StringIO(output.getvalue()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=result_{query_id}.csv"}
    )


@router.get("/export/pdf/{session_id}")
async def export_pdf(session_id: str):
    sessions = load_sessions()
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")

    session = sessions[session_id]
    filename = f"datatalk_{session_id}.pdf"
    filepath = str(TEMP_DIR / filename)

    rg = ReportGenerator()
    rg.generate(session, filepath)

    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/pdf"
    )


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    sessions = load_sessions()
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")
    return sessions[session_id]
