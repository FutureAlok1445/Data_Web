import os
import uuid
import json
import tempfile
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path

from core.ingestion import DataIngestion
from core.schema_analyzer import SchemaAnalyzer
from core.intelligence_engine import IntelligenceEngine
from core.insight_discovery import InsightDiscovery
from core.profiler import DataProfiler

router = APIRouter()

UPLOAD_DIR = Path(__file__).parent.parent / "storage" / "uploads"
SESSIONS_FILE = Path(__file__).parent.parent / "storage" / "sessions.json"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def load_sessions() -> dict:
    if SESSIONS_FILE.exists():
        with open(SESSIONS_FILE) as f:
            return json.load(f)
    return {}


def save_sessions(sessions: dict):
    SESSIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SESSIONS_FILE, "w") as f:
        json.dump(sessions, f, indent=2, default=str)


# In-memory store for active sessions
ACTIVE_SESSIONS = {}


@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported")

    session_id = str(uuid.uuid4())[:8]

    # Save raw file
    save_path = UPLOAD_DIR / f"{session_id}_{file.filename}"
    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)

    # Ingest into DuckDB
    db = DataIngestion()
    schema, shape = db.ingest_csv(str(save_path))
    df_sample = db.get_sample_rows(n=10000)

    # 1. AI Profiling
    profiler = DataProfiler(df_sample)
    profile_report = profiler.run_profiling()
    ai_profile_summary = profiler.generate_ai_summary(profile_report)

    # 2. Schema analysis + data dictionary
    analyzer = SchemaAnalyzer(schema)
    data_dict = analyzer.generate_data_dictionary()

    # 3. Target column detection
    target_col = db.detect_target_column(schema)

    # 4. Impact scores & Discovery
    discovery = InsightDiscovery(db)
    impact_scores = discovery.compute_impact_scores(schema, target_col)
    auto_insights = discovery.discover_categorical_insights(target_col, schema)

    # 5. Intelligence Engine
    intel_engine = IntelligenceEngine(db, analyzer)

    # Store in memory
    ACTIVE_SESSIONS[session_id] = {
        "db": db,
        "analyzer": analyzer,
        "intel_engine": intel_engine,
        "discovery": discovery
    }

    # Build session record
    session_record = {
        "session_id": session_id,
        "filename": file.filename,
        "saved_path": str(save_path),
        "uploaded_at": datetime.now().isoformat(),
        "shape": {"rows": shape[0], "columns": shape[1]},
        "schema": schema,
        "data_dictionary": data_dict,
        "target_column": target_col,
        "impact_scores": impact_scores,
        "auto_insights": auto_insights,
        "profile_summary": ai_profile_summary,
        "query_history": []
    }

    # Persist session
    sessions = load_sessions()
    sessions[session_id] = session_record
    save_sessions(sessions)

    return {
        "session_id": session_id,
        "filename": file.filename,
        "rows": shape[0],
        "columns": shape[1],
        "schema": schema,
        "ai_profile": ai_profile_summary,
        "auto_insights": auto_insights,
        "data_dictionary": data_dict,
        "target_column": target_col,
        "impact_scores": impact_scores,
        "sample_questions": analyzer.generate_sample_questions(target_col)
    }


def get_active_session(session_id: str) -> dict:
    if session_id not in ACTIVE_SESSIONS:
        sessions = load_sessions()
        if session_id not in sessions:
            raise HTTPException(404, f"Session {session_id} not found.")

        record = sessions[session_id]
        saved_path = record.get("saved_path") or record.get("file_path")
        
        if not saved_path or not Path(saved_path).exists():
            raise HTTPException(404, "CSV file no longer available on disk.")

        db = DataIngestion()
        schema, _ = db.ingest_csv(saved_path)
        analyzer = SchemaAnalyzer(schema)
        intel_engine = IntelligenceEngine(db, analyzer)
        discovery = InsightDiscovery(db)

        ACTIVE_SESSIONS[session_id] = {
            "db": db,
            "analyzer": analyzer,
            "intel_engine": intel_engine,
            "discovery": discovery
        }

    return ACTIVE_SESSIONS[session_id]
