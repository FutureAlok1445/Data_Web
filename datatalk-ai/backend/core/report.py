from fpdf import FPDF

def generate_pdf_report(session_data: dict, history_index: int = -1) -> bytes:
    """Generates a PDF report using fpdf2 based on a query record."""
    if not session_data or not session_data.get("history"):
        return b""
        
    query_record = session_data["history"][history_index]
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 16)
    
    # Title
    pdf.cell(0, 10, "DataTalk AI - Executive Report", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(10)
    
    # User Query
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 10, "Query Investigated:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 11)
    pdf.multi_cell(0, 8, str(query_record.get("query", "N/A")))
    pdf.ln(5)
    
    # Executive Summary
    exec_sum = query_record.get("executive_summary", {})
    if exec_sum:
        pdf.set_font("helvetica", "B", 12)
        pdf.cell(0, 10, "Executive Summary:", new_x="LMARGIN", new_y="NEXT")
        
        pdf.set_font("helvetica", "B", 11)
        pdf.cell(30, 8, f"Risk Level: {exec_sum.get('risk_level', 'N/A')}", new_x="LMARGIN", new_y="NEXT")
        
        pdf.set_font("helvetica", "I", 11)
        pdf.multi_cell(0, 8, f"Finding: {exec_sum.get('key_finding', 'N/A')}")
        
        pdf.set_font("helvetica", "B", 11)
        pdf.multi_cell(0, 8, f"Recommendation: {exec_sum.get('recommended_action', 'N/A')}")
        pdf.ln(5)
        
    # Answer Grounding
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 10, "Analysis Details:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", "", 11)
    pdf.multi_cell(0, 8, str(query_record.get("answer", "N/A")))
    pdf.ln(10)
    
    # SQL Trace
    pdf.set_font("helvetica", "B", 10)
    pdf.cell(0, 8, "SQL Generated:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("courier", "", 9)
    pdf.multi_cell(0, 5, str(query_record.get("sql", "N/A")))
    
    return pdf.output()
