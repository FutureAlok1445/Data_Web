import requests, json

sessions = json.load(open("storage/sessions.json"))
sid = list(sessions.keys())[-1]
print(f"Session: {sid}")

r = requests.post("http://localhost:8000/query", json={"session_id": sid, "query": "What is the churn rate by gender?"})
print(f"Status: {r.status_code}")

if r.status_code == 200:
    data = r.json()
    print(f"Answer: {data.get('answer', 'N/A')[:200]}")
    print(f"SQL: {data.get('sql_executed')}")
    print(f"Chart: {data.get('chart_type')}")
    print(f"Rows: {data.get('row_count')}")
    print(f"Success: {data.get('success')}")
else:
    print(f"Error: {r.text[:500]}")
