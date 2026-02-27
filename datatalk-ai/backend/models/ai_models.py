from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AnalyticMission(BaseModel):
    intent: str = Field(..., description="The detected intent category")
    target_columns: List[str] = Field(..., description="Relevant dataset columns")
    metric: Optional[str] = Field(None, description="The mathematical metric to compute")
    aggregation_method: Optional[str] = Field(None, description="The SQL aggregation method")
    methodology: str = Field(..., description="Step-by-step math explanation")
    expanded_queries: Optional[List[str]] = Field(default_factory=list, description="Sub-queries for vague intent")
    recommended_chart_type: str = Field(..., description="The chart type to use for visualization")

class GroundedAnswer(BaseModel):
    answer: str = Field(..., description="The data-backed natural language answer")
    recommendations: List[str] = Field(..., description="Actionable business recommendations")

class ExecutiveReport(BaseModel):
    summary: str = Field(..., description="Key findings summary")
    risk_level: str = Field(..., description="HIGH, MEDIUM, or LOW")
    business_impact: str = Field(..., description="Quantified impact statement")
    priority_action: str = Field(..., description="Single concrete recommendation")
    statistical_confidence: Optional[str] = Field(None, description="Significance note")

class InsightItem(BaseModel):
    title: str
    description: str
    impact: str
    relevance_score: float

class AutoInsights(BaseModel):
    insights: List[InsightItem]
