from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from fpdf import FPDF

class QueryRequest(BaseModel):
    session_id: str
    question: str
    conversation_history: List[Dict] = []

class ExportRequest(BaseModel):
    session_id: str
    format: str  # json, sql, pdf, csv
    query_id: Optional[str] = None  # for csv export of specific query

class ReportGenerator:
    def generate(self, session: dict, filepath: str):
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("helvetica", "B", 16)
        
        pdf.cell(0, 10, "DataTalk AI - Active Pipeline", new_x="LMARGIN", new_y="NEXT", align="C")
        pdf.ln(5)
        
        history = session.get("query_history", [])
        if not history:
            pdf.set_font("helvetica", "", 12)
            pdf.cell(0, 10, "No queries found in session.", new_x="LMARGIN", new_y="NEXT")
            pdf.output(filepath)
            return
            
        for i, h in enumerate(history):
            pdf.set_font("helvetica", "B", 12)
            pdf.cell(0, 10, f"Query {i+1}: {h.get('user_question')}", new_x="LMARGIN", new_y="NEXT")
            
            pdf.set_font("helvetica", "", 11)
            pdf.multi_cell(0, 8, f"Answer: {h.get('answer', 'N/A')}")
            
            exec_sum = h.get("executive_summary")
            if exec_sum:
                pdf.set_font("helvetica", "B", 11)
                pdf.multi_cell(0, 8, f"Summary: [{exec_sum.get('risk_level')}] {exec_sum.get('key_finding')}")
            
            pdf.ln(5)
            
        pdf.output(filepath)