from routes.upload import get_active_session
import sys
import os

# Add backend to path
sys.path.append(os.getcwd())

session_id = "40937de1" # One of the recent ones found
try:
    session = get_active_session(session_id)
    print(f"SUCCESS: Loaded session {session_id}")
    print(f"Keys: {list(session.keys())}")
    print(f"Rows in main_data: {session['db'].execute('SELECT COUNT(*) FROM main_data').fetchone()[0]}")
except Exception as e:
    print(f"FAILED: {str(e)}")
