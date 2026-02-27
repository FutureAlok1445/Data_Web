import pandas as pd
import duckdb
import re
from typing import Tuple, List

def clean_column_name(col_name: str) -> str:
    """Clean column names to be SQL-friendly."""
    if not isinstance(col_name, str):
        col_name = str(col_name)
    # Replace non-alphanumeric with underscore
    clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', col_name)
    # Remove leading/trailing underscores and collapse multiple underscores
    clean_name = re.sub(r'_+', '_', clean_name).strip('_')
    # If starts with number, prepend 'col_'
    if clean_name and clean_name[0].isdigit():
        clean_name = f"col_{clean_name}"
    return clean_name.lower()

def ingest_csv_to_duckdb(file_path: str, table_name: str = "dataset") -> Tuple[duckdb.DuckDBPyConnection, List[str]]:
    """
    Load a CSV file, clean column names, and load into an in-memory DuckDB instance.
    Returns:
        Tuple containing the DuckDB connection and a list of cleaned column names.
    """
    try:
        # Load CSV using pandas for robust parsing/cleaning
        df = pd.read_csv(file_path)
        
        # Clean column names
        cleaned_columns = [clean_column_name(col) for col in df.columns]
        df.columns = cleaned_columns
        
        # Initialize an in-memory DuckDB connection
        conn = duckdb.connect(':memory:')
        
        # Register the dataframe as a table
        # We create an actual table to allow standard SQL queries without referencing 'df'
        conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM df")
        
        return conn, cleaned_columns
        
    except Exception as e:
        raise ValueError(f"Failed to ingest CSV: {str(e)}")
