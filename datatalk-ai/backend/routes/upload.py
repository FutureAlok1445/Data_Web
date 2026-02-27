from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import uuid
import json
import shutil
from ..core.ingestion import ingest_csv_to_duckdb
from ..core.schema_analyzer import profile_schema, get_data_dictionary

router = APIRouter()

STORAGE_DIR = os.path.join(os.path.dirname(__file__), '..', 'storage')
UPLOADS_DIR = os.path.join(STORAGE_DIR, 'uploads')
SESSIONS_FILE = os.path.join(STORAGE_DIR, 'sessions.json')

os.makedirs(UPLOADS_DIR, exist_ok=True)

def safe_read_sessions():
    if os.path.exists(SESSIONS_FILE):
        try:
            with open(SESSIONS_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    return {}

def safe_write_sessions(data):
    with open(SESSIONS_FILE, 'w') as f:
        json.dump(data, f, indent=4)

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
            
        # Analyze schema immediately upon upload to store in session
        conn, cleaned_columns = ingest_csv_to_duckdb(file_path)
        schema = profile_schema(conn)
        data_dict = get_data_dictionary(schema)
        
        # We don't need to keep DuckDB connection open for now
        conn.close()
        
        # Save session info to JSON registry
        sessions = safe_read_sessions()
        sessions[session_id] = {
            "session_id": session_id,
            "original_filename": file.filename,
            "file_path": file_path,
            "schema": schema,
            "data_dictionary": data_dict,
            "history": []
        }
        safe_write_sessions(sessions)
        
        return {
            "session_id": session_id, 
            "message": "File uploaded and profiled successfully",
            "schema": schema
        }
    except Exception as e:
        # Cleanup on failure
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
