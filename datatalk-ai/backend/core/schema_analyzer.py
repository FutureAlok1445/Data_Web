import duckdb
import os
import anthropic

def profile_schema(conn: duckdb.DuckDBPyConnection, table_name: str = "dataset") -> dict:
    """Profiles the schema by fetching column names and types from DuckDB."""
    query = f"DESCRIBE {table_name}"
    result = conn.execute(query).fetchall()
    schema = {}
    for row in result:
        col_name = row[0]
        col_type = row[1]
        schema[col_name] = col_type
    return schema

def get_data_dictionary(schema: dict) -> str:
    """
    Generates an AI data dictionary using Anthropic.
    Reads system prompt from backend/prompts/data_dictionary.txt.
    """
    prompt_path = os.path.join(os.path.dirname(__file__), '..', 'prompts', 'data_dictionary.txt')
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            system_prompt = f.read()
    except FileNotFoundError:
        system_prompt = "You are a data dictionary generator."
        
    api_key = os.getenv("ANTHROPIC_API_KEY")
    schema_str = "\n".join([f"{k}: {v}" for k, v in schema.items()])
    
    if not api_key:
        return f"Mock Data Dictionary for schema:\n{schema_str}"
        
    client = anthropic.Anthropic(api_key=api_key)
    
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            system=system_prompt,
            messages=[{"role": "user", "content": f"Generate a data dictionary for this schema:\n{schema_str}"}]
        )
        return response.content[0].text
    except Exception as e:
        return f"Failed to generate data dictionary: {str(e)}"
