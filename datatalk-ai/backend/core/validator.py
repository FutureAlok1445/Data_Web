import duckdb
from core.query_engine import generate_sql
import anthropic
import os

class QueryValidator:
    def __init__(self, db, query_engine, analyzer, max_retries=3):
        self.db = db
        self.qe = query_engine
        self.analyzer = analyzer
        self.max_retries = max_retries

    def execute_with_retry(self, question):
        audit_trail = []
        error = None
        sql = None
        result = None
        
        schema_context = f"Schema:\n{json.dumps(self.analyzer.schema, indent=2)}\n\nData Dictionary:\n{json.dumps(self.analyzer.data_dictionary, indent=2)}"
        relevant_cols = list(self.analyzer.schema.keys())

        attempt = 1
        for attempt in range(1, self.max_retries + 1):
            sql = self.qe.generate_sql(question, schema_context, previous_error=error, previous_sql=sql)
            audit_trail.append({"step": f"Attempt {attempt}", "detail": f"Generated SQL: {sql}"})
            
            if sql.strip() == "UNANSWERABLE":
                error = "UNANSWERABLE"
                break
                
            sql_lower = sql.lower().strip()
            if not sql_lower.startswith("select"):
                error = "Security Guard: Only SELECT queries are allowed."
                audit_trail.append({"step": f"Attempt {attempt} Blocked", "detail": error})
                continue
                
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
