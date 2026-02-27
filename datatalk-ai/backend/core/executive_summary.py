import os
import anthropic
import json

def generate_executive_summary(kpis: dict, anomalies: list, insights: list, stat_note: str = None) -> str:
    """
    Generates a high-level executive summary based on findings.
    Uses Anthropic for the CDO-style synthesis (Business Impact Layer).
    """
    prompt_path = os.path.join(os.path.dirname(__file__), '..', 'prompts', 'executive_summary.txt')
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            system_prompt = f.read()
    except FileNotFoundError:
        system_prompt = "You are a Chief Data Officer. Summarize these results with clear business takeaways."
        
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    # Enrich findings for the prompt
    findings = {
        "kpis": kpis,
        "anomalies_detected": anomalies,
        "key_insights": insights,
        "statistical_validation": stat_note
    }
    
    if not api_key:
        return f"Executive Summary (Mock): Found {len(anomalies)} anomalies and {len(insights)} insights. {stat_note if stat_note else ''}"
        
    client = anthropic.Anthropic(api_key=api_key)
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            system=system_prompt,
            messages=[{"role": "user", "content": f"Summarize these findings and provide business takeaways (Risk, Priority, Recommendations):\n{json.dumps(findings, indent=2)}"}]
        )
        return response.content[0].text.strip()
    except Exception as e:
        return f"Executive Summary: Analytics pipeline executed but summary generation failed. ({str(e)})"
