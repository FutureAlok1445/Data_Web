from fastapi import APIRouter, HTTPException
from routes.upload import load_sessions, get_active_session

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


@router.get("/preview/{session_id}")
async def preview_session(session_id: str, limit: int = 100):
    """Return actual rows from the uploaded dataset, plus column-level stats."""
    try:
        session = get_active_session(session_id)
        db = session["db"]

        # Count total rows
        total_rows = db.execute("SELECT COUNT(*) as cnt FROM main_data").fetchone()[0]

        # Fetch preview rows
        rows_df = db.execute(f"SELECT * FROM main_data LIMIT {limit}").df()
        rows = rows_df.to_dict(orient="records")

        # Column-level stats for distributions
        col_stats = {}
        for col in rows_df.columns:
            try:
                dtype = str(rows_df[col].dtype)
                if "float" in dtype or "int" in dtype:
                    stats_row = db.execute(
                        f'SELECT MIN("{col}") as min, MAX("{col}") as max, AVG("{col}") as avg, STDDEV("{col}") as std FROM main_data'
                    ).fetchone()
                    col_stats[col] = {"type": "numeric", "min": stats_row[0], "max": stats_row[1], "avg": round(stats_row[2] or 0, 2), "std": round(stats_row[3] or 0, 2)}
                else:
                    vc = db.execute(
                        f'SELECT "{col}", COUNT(*) as cnt FROM main_data GROUP BY "{col}" ORDER BY cnt DESC LIMIT 10'
                    ).df()
                    col_stats[col] = {"type": "categorical", "top_values": vc.to_dict(orient="records")}
            except Exception:
                col_stats[col] = {"type": "unknown"}

        return {
            "session_id": session_id,
            "total_rows": total_rows,
            "columns": list(rows_df.columns),
            "rows": rows,
            "col_stats": col_stats,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Session not found or expired: {str(e)}")
