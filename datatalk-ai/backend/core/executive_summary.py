import os
import anthropic
import json

def generate_executive_summary(kpis: dict, anomalies: dict, insights: list) -> dict:
    """
    Generates a risk level and recommendation based on the data findings.
    Calls Claude 3.5 Sonnet to synthesize the results into an executive summary.
    """
    prompt_path = os.path.join(os.path.dirname(__file__), '..', 'prompts', 'executive_summary.txt')
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            system_prompt = f.read()
    except FileNotFoundError:
        system_prompt = (
            "You are a Chief Data Officer. Based on the provided KPIs, anomalies, and insights, "
            "provide strictly a valid JSON object with three keys: 'risk_level' (Low, Medium, or High), "
            "'key_finding' (1 concise sentence), and 'recommended_action' (1 concise sentence)."
        )
        
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return {
            "risk_level": "Medium",
            "key_finding": "Actionable patterns detected in the mock dataset processing.",
            "recommended_action": "Proceed with standard review and continuous monitoring."
        }
        
    client = anthropic.Anthropic(api_key=api_key)
    
    # Truncate context to keep prompt manageable
    insights_str = str(insights)[:3000]
    
    context = (
        f"KPIs: {kpis}\n\n"
        f"Anomalies: {anomalies}\n\n"
        f"Insights Highlights: {insights_str}"
    )
    
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=300,
            system=system_prompt,
            messages=[{"role": "user", "content": context}]
        )
        content = response.content[0].text.strip()
        
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        return json.loads(content)
    except Exception as e:
        return {
            "risk_level": "Unknown",
            "key_finding": f"Error synthesizing executive summary. Diagnostics: {str(e)}",
            "recommended_action": "Verify data consistency and API connectivity."
        }
