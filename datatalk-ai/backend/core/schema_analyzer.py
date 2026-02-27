import duckdb
import os
import anthropic
import pandas as pd
import numpy as np

def profile_schema(conn: duckdb.DuckDBPyConnection, table_name: str = "dataset") -> dict:
    """Profiles the schema by fetching column names and types from DuckDB."""
    query = f"DESCRIBE {table_name}"
    result = conn.execute(query).fetchall()
    schema = {}
    for row in result:
        col_name = row[0]; col_type = row[1]
        schema[col_name] = col_type
    return schema

def profile_data_health(df: pd.DataFrame) -> dict:
    """
    Performs deep profiling: missing values, skewness, and outliers.
    """
    if df.empty: return {}
    
    health = {}
    total_rows = len(df)
    
    # Check for target column (heuristic: binary strings or high-impact columns)
    potential_targets = [c for c in df.columns if "churn" in c.lower() or "target" in c.lower() or "label" in c.lower()]
    health["inferred_target"] = potential_targets[0] if potential_targets else None
    
    for col in df.columns:
        col_health = {}
        
        # Missing values
        missing_count = int(df[col].isna().sum())
        col_health["missing_pct"] = (missing_count / total_rows) * 100
        
        # Numeric profiling
        if pd.api.types.is_numeric_dtype(df[col]):
            values = df[col].dropna()
            if not values.empty:
                col_health["skew"] = float(values.skew())
                col_health["std_dev"] = float(values.std())
                # Is skewed?
                col_health["is_skewed"] = abs(col_health["skew"]) > 1.0
        
        # Cardinality
        col_health["unique_count"] = int(df[col].nunique())
        
        health[col] = col_health
        
    return health

def get_data_dictionary(schema: dict) -> str:
    """Generates an AI data dictionary using Anthropic."""
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
