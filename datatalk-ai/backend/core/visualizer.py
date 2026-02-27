import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import json
from typing import Optional


def _detect_chart_type(df: pd.DataFrame, intent: str) -> str:
    """Heuristically decide the best chart type from the intent and dataframe shape."""
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    categorical_cols = df.select_dtypes(exclude="number").columns.tolist()

    if intent == "INDIVIDUAL_LOOKUP":
        return "card"  # No chart needed for single record
    if intent in ("GROUP_COMPARISON", "METRIC_CALCULATION") and categorical_cols and numeric_cols:
        return "bar"
    if intent == "COLUMN_ANALYSIS":
        if numeric_cols:
            return "histogram"
        if categorical_cols:
            return "pie"
    if len(numeric_cols) >= 2 and not categorical_cols:
        return "scatter"
    if categorical_cols and numeric_cols:
        return "bar"
    return "table"


def build_chart(df: pd.DataFrame, intent: str, user_query: str) -> Optional[dict]:
    """
    Deterministically build a Plotly chart from the result dataframe.

    Returns a dict with:
        - chart_type: str
        - plotly_json: str  (JSON-serialised Plotly figure)
    Returns None if a chart is not appropriate (e.g., single record lookup).
    """
    if df.empty:
        return None

    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    categorical_cols = df.select_dtypes(exclude="number").columns.tolist()
    chart_type = _detect_chart_type(df, intent)

    fig = None

    try:
        if chart_type == "bar" and categorical_cols and numeric_cols:
            x_col = categorical_cols[0]
            y_col = numeric_cols[0]
            fig = px.bar(
                df,
                x=x_col,
                y=y_col,
                color=categorical_cols[1] if len(categorical_cols) > 1 else None,
                title=user_query.capitalize(),
                color_discrete_sequence=px.colors.sequential.Blues_r,
                text_auto=True,
            )
            fig.update_layout(
                plot_bgcolor="rgba(0,0,0,0)",
                paper_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#1e293b"),
            )

        elif chart_type == "histogram" and numeric_cols:
            fig = px.histogram(
                df,
                x=numeric_cols[0],
                title=user_query.capitalize(),
                color_discrete_sequence=["#3b82f6"],
                nbins=30,
            )
            fig.update_layout(
                plot_bgcolor="rgba(0,0,0,0)",
                paper_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#1e293b"),
            )

        elif chart_type == "pie" and categorical_cols and numeric_cols:
            fig = px.pie(
                df,
                names=categorical_cols[0],
                values=numeric_cols[0],
                title=user_query.capitalize(),
                color_discrete_sequence=px.colors.sequential.Blues_r,
            )

        elif chart_type == "scatter" and len(numeric_cols) >= 2:
            fig = px.scatter(
                df,
                x=numeric_cols[0],
                y=numeric_cols[1],
                title=user_query.capitalize(),
                color_discrete_sequence=["#3b82f6"],
            )
            fig.update_layout(
                plot_bgcolor="rgba(0,0,0,0)",
                paper_bgcolor="rgba(0,0,0,0)",
            )

        elif chart_type == "table" or fig is None:
            # Fallback: render as a Plotly table
            fig = go.Figure(
                data=[
                    go.Table(
                        header=dict(
                            values=list(df.columns),
                            fill_color="#3b82f6",
                            font=dict(color="white"),
                            align="left",
                        ),
                        cells=dict(
                            values=[df[c].tolist() for c in df.columns],
                            fill_color="#f8fafc",
                            align="left",
                        ),
                    )
                ]
            )
            fig.update_layout(title=user_query.capitalize())

    except Exception:
        return None

    if fig is None:
        return None

    return {
        "chart_type": chart_type,
        "plotly_json": fig.to_json(),
    }
