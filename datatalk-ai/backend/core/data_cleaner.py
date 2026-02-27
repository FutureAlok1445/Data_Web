import pandas as pd

def clean_column_names(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace(r"[^a-zA-Z0-9_]", "", regex=True)
    )
    return df

def clean_strings(df: pd.DataFrame) -> pd.DataFrame:
    for col in df.select_dtypes(include='object').columns:
        df[col] = df[col].astype(str).str.strip()
    return df

def normalize_booleans(df: pd.DataFrame) -> pd.DataFrame:
    for col in df.columns:
        unique_vals = df[col].dropna().unique()
        if set(unique_vals).issubset({"Yes", "No", "yes", "no", "Y", "N", 1, 0, "True", "False", "true", "false", True, False}):
            df[col] = df[col].replace({
                "yes": "Yes",
                "no": "No",
                "Y": "Yes",
                "N": "No",
                1: "Yes",
                0: "No",
                "true": "Yes",
                "false": "No",
                True: "Yes",
                False: "No"
            })
    return df

def clean_numeric_columns(df: pd.DataFrame) -> pd.DataFrame:
    for col in df.columns:
        if df[col].dtype == object:
            df[col] = df[col].str.replace(",", "")
            df[col] = df[col].str.replace("$", "")
            try:
                # Only convert if actually numeric otherwise ignore (like ID strings)
                df[col] = pd.to_numeric(df[col])
            except ValueError:
                pass
    return df

def handle_missing(df: pd.DataFrame) -> pd.DataFrame:
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            if df[col].isna().any():
                df[col] = df[col].fillna(df[col].median())
        else:
            if df[col].isna().any():
                df[col] = df[col].fillna("Unknown")
    return df

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = clean_column_names(df)
    df = clean_strings(df)
    df = normalize_booleans(df)
    df = clean_numeric_columns(df)
    df = handle_missing(df)
    df = df.drop_duplicates()
    return df
