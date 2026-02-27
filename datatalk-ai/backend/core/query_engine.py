import os
import anthropic

def generate_sql(user_query: str, schema: dict, data_dictionary: str, table_name: str = "dataset") -> str:
    """
    Generates DuckDB-compatible SQL using Claude Sonnet.
    Reads system prompt from backend/prompts/sql_generation.txt.
    """
    prompt_path = os.path.join(os.path.dirname(__file__), '..', 'prompts', 'sql_generation.txt')
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            system_prompt = f.read()
    except FileNotFoundError:
        system_prompt = "You are an expert SQL assistant. Return ONLY the SQL query compatible with DuckDB. No explanation."
        
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    schema_str = "\n".join([f"{k}: {v}" for k, v in schema.items()])
    context = (
        f"Table Name: {table_name}\n\n"
        f"Schema:\n{schema_str}\n\n"
        f"Data Dictionary:\n{data_dictionary}\n\n"
        f"User Query: {user_query}"
    )
    
    if not api_key:
        return f"SELECT * FROM {table_name} LIMIT 5; -- Mock query for '{user_query}'"
        
    client = anthropic.Anthropic(api_key=api_key)
    
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            system=system_prompt,
            messages=[{"role": "user", "content": context}]
        )
        sql = response.content[0].text.strip()
        
        # Clean up Markdown formatting if present
        if "```sql" in sql:
            sql = sql.split("```sql")[1].split("```")[0].strip()
        elif "```" in sql:
            sql = sql.split("```")[1].split("```")[0].strip()
            
        return sql
    except Exception as e:
        raise ValueError(f"Failed to generate SQL: {str(e)}")
