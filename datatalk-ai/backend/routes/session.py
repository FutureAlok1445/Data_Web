from fastapi import APIRouter, HTTPException
from routes.upload import safe_read_sessions

router = APIRouter()

@router.get("/{session_id}")
async def get_session(session_id: str):
    sessions = load_sessions()
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return {
        "session_id": session_id,
        "original_filename": session.get("original_filename"),
        "schema": session.get("schema"),
        "data_dictionary": session.get("data_dictionary"),
        "history_count": len(session.get("history", [])),
        "history": session.get("history", [])
    }
