import json

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
                
            forbidden = ["drop ", "delete ", "insert ", "update ", "truncate ", "alter "]
            if any(f in sql_lower for f in forbidden):
                error = "Security Guard: Destructive operations are not allowed."
                audit_trail.append({"step": f"Attempt {attempt} Blocked", "detail": error})
                continue
                
            result, error = self.db.execute_query(sql)
            if error:
                audit_trail.append({"step": f"Attempt {attempt} Failed", "detail": error})
                continue
            
            audit_trail.append({"step": f"Attempt {attempt} Success", "detail": "Query executed successfully."})
            break
            
        return {
            "sql": sql,
            "result": result,
            "error": error,
            "audit_trail": audit_trail,
            "attempts": attempt,
            "relevant_columns": relevant_cols
        }
