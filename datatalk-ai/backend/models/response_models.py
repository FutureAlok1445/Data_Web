from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class OutlierModel(BaseModel):
    outlier_count: int
    total_count: int
    threshold_used: float
    outliers: List[Dict[str, Any]]

class CorrelationModel(BaseModel):
    feature: Optional[str] = None
    feature1: Optional[str] = None
    feature2: Optional[str] = None
    target: Optional[str] = None
    correlation_score: float
    impact_magnitude: float
    direction: str

class ExecutiveSummaryModel(BaseModel):
    risk_level: str
    key_finding: str
    recommended_action: str

class AuditTrailStep(BaseModel):
    step: str
    status: Optional[str] = None
    sql: Optional[str] = None
    new_sql: Optional[str] = None
    error: Optional[str] = None

class QueryResponse(BaseModel):
    success: bool
    query: str
    sql: str
    answer: str
    data: List[Dict[str, Any]]
    columns: List[str]
    anomalies: Dict[str, OutlierModel]
    insights: List[CorrelationModel]
    executive_summary: ExecutiveSummaryModel
    audit_trail: List[AuditTrailStep]
    error: Optional[str] = None
