from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes.upload import router as upload_router
from routes.query import router as query_router
from routes.export import router as export_router
from routes.session import router as session_router

app = FastAPI(
    title="DataTalk AI",
    description="Conversational Data Intelligence Platform - Hallucination-Free Analytics",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, tags=["Upload"])
app.include_router(query_router, tags=["Query"])
app.include_router(export_router, tags=["Export"])
app.include_router(session_router, prefix="/session", tags=["Session"])


@app.get("/")
def root():
    return {
        "name": "DataTalk AI",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "upload": "POST /upload",
            "query": "POST /query",
            "export_json": "GET /export/json/{session_id}",
            "export_sql": "GET /export/sql/{session_id}",
            "export_pdf": "GET /export/pdf/{session_id}",
            "export_csv": "GET /export/csv/{session_id}/{query_id}",
            "session": "GET /session/{session_id}",
            "docs": "/docs"
        }
    }


@app.get("/health")
def health():
    return {"status": "ok"}