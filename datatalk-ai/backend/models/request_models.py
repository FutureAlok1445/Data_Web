from pydantic import BaseModel, Field

class QueryRequest(BaseModel):
    session_id: str = Field(..., description="Unique ID for the current dataset session")
    query: str = Field(..., description="Natural language question from the user")
