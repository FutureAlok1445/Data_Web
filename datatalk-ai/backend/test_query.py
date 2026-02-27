import json, traceback, os
os.environ.setdefault("ANTHROPIC_API_KEY", "")

# Load a real session
with open("storage/sessions.json") as f:
    sessions = json.load(f)

sid = list(sessions.keys())[-1]
print(f"Session: {sid}")
record = sessions[sid]

try:
    from core.ingestion import DataIngestion
    from core.schema_analyzer import SchemaAnalyzer
    from core.query_engine import QueryEngine
    from core.validator import QueryValidator

    saved_path = record.get("saved_path")
    print(f"CSV path: {saved_path}")
    print(f"File exists: {os.path.exists(saved_path)}")

    db = DataIngestion()
    schema, shape = db.ingest_csv(saved_path)
    print(f"Ingested OK: {shape}")

    analyzer = SchemaAnalyzer(schema)
    analyzer.data_dictionary = record.get("data_dictionary", {})
    print("Analyzer OK")

    qe = QueryEngine(db, analyzer)
    print("QueryEngine OK")

    validator = QueryValidator(db, qe, analyzer)
    print("Validator OK")

    # Now test the actual query execution
    result = validator.execute_with_retry("What is the average tenure?")
    print(f"Result keys: {list(result.keys())}")
    print(f"Error: {result.get('error')}")
    print(f"SQL: {result.get('sql')}")
except Exception as e:
    traceback.print_exc()
