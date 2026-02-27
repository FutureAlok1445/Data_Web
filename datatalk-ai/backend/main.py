from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import upload, query, export, session

app = FastAPI(
    title="DataTalk AI",
    description="Backend API for DataTalk AI analytics processing",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(query.router, prefix="/query", tags=["Query"])
app.include_router(export.router, prefix="/export", tags=["Export"])
app.include_router(session.router, prefix="/session", tags=["Session"])

@app.get("/")
async def root():
    return {"message": "DataTalk AI API is running"}
