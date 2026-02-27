import os
import anthropic

def ground_answer(user_query: str, sql: str, data: list) -> str:
    """
    Takes the raw data and user query, and returns a plain English answer.
    Uses Claude Haiku for anti-hallucination grounding.
    """
    prompt_path = os.path.join(os.path.dirname(__file__), '..', 'prompts', 'answer_grounding.txt')
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            system_prompt = f.read()
    except FileNotFoundError:
        system_prompt = (
            "You are a professional data analyst. Review the executed SQL and its results. "
            "Write a concise, plain English answer directly addressing the user's question. "
            "Under no circumstances should you hallucinate data that is not present in the results."
        )
        
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return "Mock grounded answer: The data shows relevant findings for your query."
        
    client = anthropic.Anthropic(api_key=api_key)
    
    # Format data safely and truncate to avoid massive payloads
    data_str = str(data)
    if len(data_str) > 15000:
        data_str = data_str[:15000] + "... [truncated]"
        
    context = (
        f"User Question: {user_query}\n\n"
        f"SQL Query Executed:\n{sql}\n\n"
        f"Query Results:\n{data_str}"
    )
    
    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=600,
            system=system_prompt,
            messages=[{"role": "user", "content": context}]
        )
        return response.content[0].text.strip()
    except Exception as e:
        # Fallback to a rigid string if the API fails
        return f"Could not generate conversational answer. Error: {str(e)}"
