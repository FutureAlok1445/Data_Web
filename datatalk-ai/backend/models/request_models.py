from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class QueryRequest(BaseModel):
    session_id: str = Field(..., description="Unique ID for the current dataset session")
    query: str = Field(..., description="Natural language question from the user")
    conversation_history: Optional[List[Dict]] = Field(default_factory=list, description="Optional conversation context")

    @property
    def question(self):
        return self.query
