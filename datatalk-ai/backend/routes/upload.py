import os
import uuid
import json
import shutil
import pandas as pd
from core.ingestion import ingest_csv_to_duckdb
from core.schema_analyzer import profile_schema, get_data_dictionary, profile_data_health
from core.insight_discovery import find_top_drivers

router = APIRouter()

UPLOAD_DIR = Path(__file__).parent.parent / "storage" / "uploads"
SESSIONS_FILE = Path(__file__).parent.parent / "storage" / "sessions.json"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def load_sessions() -> dict:
    if SESSIONS_FILE.exists():
        with open(SESSIONS_FILE) as f:
            return json.load(f)
    return {}


@router.post("/")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
    session_id = str(uuid.uuid4())
    filename = f"{session_id}_{file.filename}"
    file_path = os.path.join(UPLOADS_DIR, filename)
    
    try:
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Analyze schema and profile data health immediately upon upload
        conn, cleaned_columns = ingest_csv_to_duckdb(file_path)
        schema = profile_schema(conn)
        
        # Load into pandas for deep profiling
        df = pd.read_csv(file_path)
        df.columns = cleaned_columns
        data_health = profile_data_health(df)
        
        # Discover top drivers (if a target is inferred or global insights)
        target = data_health.get("inferred_target")
        top_drivers = find_top_drivers(df, target) if target else []
        
        data_dict = get_data_dictionary(schema)
        conn.close()
        
        # Save session info to JSON registry
        sessions = safe_read_sessions()
        sessions[session_id] = {
            "session_id": session_id,
            "original_filename": file.filename,
            "file_path": file_path,
            "schema": schema,
            "data_dictionary": data_dict,
            "data_health": data_health,
            "top_drivers": top_drivers,
            "history": []
        }

    return ACTIVE_SESSIONS[session_id]