import duckdb
from core.query_engine import generate_sql
import anthropic
import os

def execute_with_retry(
    conn: duckdb.DuckDBPyConnection, 
    user_query: str, 
    schema: dict, 
    data_dictionary: str, 
    max_retries: int = 3,
    table_name: str = "dataset"
) -> dict:
    """
    Executes AI-generated SQL with a self-healing retry loop.
    Returns the final SQL, the result data, and the audit trail.
    """
    audit_trail = []
    
    # 1. Initial generation
    sql = generate_sql(user_query, schema, data_dictionary, table_name)
    audit_trail.append({"step": "initial_generation", "sql": sql})
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key) if api_key else None
    
    for attempt in range(max_retries):
        try:
            # 2. Try to execute
            result_df = conn.execute(sql).fetchdf()
            audit_trail.append({"step": f"execution_attempt_{attempt + 1}", "status": "success"})
            
            return {
                "success": True,
                "sql": sql,
                "data": result_df.to_dict(orient="records"),
                "columns": result_df.columns.tolist(),
                "audit_trail": audit_trail
            }
            
        except Exception as e:
            error_msg = str(e)
            audit_trail.append({
                "step": f"execution_attempt_{attempt + 1}", 
                "status": "error", 
                "error": error_msg
            })
            
            if attempt == max_retries - 1:
                break
                
            if not client:
                # Cannot self-heal without AI if in mock mode
                break
                
            # 3. Self-healing loop
            try:
                # NEW: Contextual advice if column not found
                col_advice = ""
                if "column not found" in error_msg.lower():
                    col_advice = f"\nNote: If the user asked for a column that doesn't exist, suggest the closest existing alternative from the schema: {list(schema.keys())}."

                healing_prompt = (
                    f"The following DuckDB SQL query failed:\n```sql\n{sql}\n```\n\n"
                    f"Error Message: {error_msg}\n\n"
                    f"Schema Reference: {schema}\n\n"
                    f"{col_advice}\n"
                    "Please provide the corrected SQL query to fix this error. Return ONLY the valid DuckDB SQL."
                )
                response = client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1000,
                    system="You are an expert SQL debugging assistant. Fix the query and return ONLY the valid SQL.",
                    messages=[{"role": "user", "content": healing_prompt}]
                )
                
                sql = response.content[0].text.strip()
                if "```sql" in sql:
                    sql = sql.split("```sql")[1].split("```")[0].strip()
                elif "```" in sql:
                    sql = sql.split("```")[1].split("```")[0].strip()
                    
                audit_trail.append({
                    "step": f"self_heal_{attempt + 1}", 
                    "new_sql": sql,
                    "tip": "Suggested column correction" if col_advice else "Fixed syntax/logic"
                })
                
            except Exception as heal_e:
                audit_trail.append({"step": f"self_heal_error_{attempt + 1}", "error": str(heal_e)})
                break
                
    # If final attempt failed, and was column-related, provide a friendly suggestion
    final_error = audit_trail[-1].get("error", "") if audit_trail else ""
    return {
        "success": False,
        "sql": sql,
        "error": "Max retries reached. Unable to fix query.",
        "suggestion": f"I couldn't find some of the data you requested. Did you mean one of these: {list(schema.keys())[:5]}?" if "column" in str(final_error).lower() else None,
        "audit_trail": audit_trail
    }
