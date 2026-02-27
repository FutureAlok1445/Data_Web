"""
Backend Visualizer using Plotly Express.
Generates Plotly figure JSON from query results — can be sent to the frontend
or used for server-side rendering (e.g., image export for PDF reports).
"""

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import plotly.io as pio
import numpy as np
from typing import Optional


def detect_chart_type(question: str, df: pd.DataFrame) -> str:
    """
    Two-signal chart type detection:
    Signal 1 — Question keywords (intent)
    Signal 2 — Data shape (structure)
    """
    q = question.lower()

    # ── Signal 1: Question Intent ─────────────────────────────
    if any(w in q for w in ['trend', 'over time', 'monthly', 'yearly', 'growth', 'decline', 'evolution']):
        return 'line'
    if any(w in q for w in ['distribution', 'spread', 'range', 'histogram']):
        return 'histogram'
    if any(w in q for w in ['proportion', 'share', 'percentage', 'breakdown', 'pie', 'donut']):
        return 'pie'
    if any(w in q for w in ['correlation', 'relationship', 'scatter', 'impact', 'affect']):
        return 'scatter'
    if any(w in q for w in ['heatmap', 'heat map', 'matrix']):
        return 'heatmap'
    if any(w in q for w in ['rank', 'top', 'bottom', 'leaderboard', 'highest', 'lowest']):
        return 'horizontal_bar'

    # ── Signal 2: Data Shape ──────────────────────────────────
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    non_numeric_cols = [c for c in df.columns if c not in numeric_cols]

    # Time columns
    time_cols = [c for c in df.columns if any(t in c.lower() for t in ['date', 'time', 'month', 'year', 'quarter', 'week'])]
    if time_cols and numeric_cols:
        return 'line'

    # Two numerics + many rows → scatter
    if len(numeric_cols) >= 2 and len(non_numeric_cols) == 0 and len(df) > 5:
        return 'scatter'

    # Two dimensions + one numeric → heatmap
    if len(non_numeric_cols) >= 2 and len(numeric_cols) >= 1:
        return 'heatmap'

    # One dimension + one numeric
    if len(non_numeric_cols) == 1 and len(numeric_cols) >= 1:
        unique_vals = df[non_numeric_cols[0]].nunique()
        if unique_vals <= 6:
            # Check if values sum to ~100 (percentages)
            total = df[numeric_cols[0]].sum()
            if 80 < total < 120 and all(0 <= v <= 100 for v in df[numeric_cols[0]]):
                return 'pie'
            return 'bar'
        elif unique_vals <= 15:
            return 'bar'
        else:
            return 'horizontal_bar'

    # Single numeric → histogram
    if len(numeric_cols) == 1 and len(non_numeric_cols) == 0:
        return 'histogram'

    return 'bar'  # default fallback


def generate_plotly_figure(
    data: list,
    question: str,
    answer: str = ""
) -> Optional[dict]:
    """
    Generate a Plotly figure dict from query result data.
    Returns the figure as a JSON-serializable dict (plotly.io.to_dict format).
    """
    if not data or len(data) == 0:
        return None

    df = pd.DataFrame(data)
    if df.empty or len(df.columns) < 1:
        return None

    chart_type = detect_chart_type(question, df)

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    non_numeric_cols = [c for c in df.columns if c not in numeric_cols]

    # Identify axes
    x_col = non_numeric_cols[0] if non_numeric_cols else (numeric_cols[0] if numeric_cols else df.columns[0])
    y_col = numeric_cols[0] if numeric_cols else df.columns[-1]

    title = answer[:80] + '...' if len(answer) > 80 else answer

    fig = None

    try:
        if chart_type == 'bar':
            fig = px.bar(
                df, x=x_col, y=y_col,
                title=title,
                color=x_col,
                template='plotly_white',
                text=y_col
            )
            # Add average line
            avg = df[y_col].mean()
            fig.add_hline(
                y=avg, line_dash="dash", line_color="#ef4444",
                annotation_text=f"Avg: {avg:.1f}",
                annotation_font_color="#ef4444"
            )
            fig.update_traces(texttemplate='%{text:.1f}', textposition='outside')

        elif chart_type == 'horizontal_bar':
            df_sorted = df.sort_values(by=y_col, ascending=True)
            fig = px.bar(
                df_sorted, x=y_col, y=x_col,
                title=title,
                orientation='h',
                color=y_col,
                color_continuous_scale='Blues',
                template='plotly_white',
                text=y_col
            )
            fig.update_traces(texttemplate='%{text:.1f}', textposition='outside')

        elif chart_type == 'line':
            fig = px.line(
                df, x=x_col, y=y_col,
                title=title,
                template='plotly_white',
                markers=True
            )
            fig.update_traces(
                fill='tozeroy',
                fillcolor='rgba(59,130,246,0.06)',
                line=dict(width=3)
            )

        elif chart_type == 'pie':
            fig = px.pie(
                df, names=x_col, values=y_col,
                title=title,
                hole=0.5
            )
            total = df[y_col].sum()
            fig.add_annotation(
                text=f"<b>Total</b><br>{total:,.1f}",
                showarrow=False,
                font_size=14
            )
            fig.update_traces(textinfo='percent+label')

        elif chart_type == 'histogram':
            target = numeric_cols[0] if numeric_cols else df.columns[0]
            fig = px.histogram(
                df, x=target,
                title=title,
                template='plotly_white',
                nbins=min(30, max(8, int(np.sqrt(len(df)))))
            )
            mean_val = df[target].mean()
            median_val = df[target].median()
            fig.add_vline(x=mean_val, line_dash="dash", line_color="#ef4444",
                          annotation_text=f"Mean: {mean_val:.1f}")
            fig.add_vline(x=median_val, line_dash="dot", line_color="#10b981",
                          annotation_text=f"Median: {median_val:.1f}")

        elif chart_type == 'scatter':
            x = numeric_cols[0] if len(numeric_cols) >= 1 else df.columns[0]
            y = numeric_cols[1] if len(numeric_cols) >= 2 else df.columns[-1]
            fig = px.scatter(
                df, x=x, y=y,
                title=title,
                template='plotly_white',
                trendline='ols' if len(df) > 3 else None
            )

        elif chart_type == 'heatmap':
            if len(non_numeric_cols) >= 2 and numeric_cols:
                pivot = df.pivot_table(
                    values=numeric_cols[0],
                    index=non_numeric_cols[0],
                    columns=non_numeric_cols[1],
                    aggfunc='mean',
                    fill_value=0
                )
                fig = px.imshow(
                    pivot,
                    title=title,
                    template='plotly_white',
                    color_continuous_scale='RdYlGn_r',
                    text_auto='.1f'
                )
            else:
                # Fallback to bar
                fig = px.bar(df, x=x_col, y=y_col, title=title, template='plotly_white')

        # Common formatting
        if fig:
            fig.update_layout(
                font=dict(family='Inter, sans-serif', size=12),
                margin=dict(t=40, r=40, l=60, b=60),
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)'
            )

        return pio.to_plotly_json(fig) if fig else None

    except Exception:
        return None


def generate_chart_image(data: list, question: str, answer: str = "", format: str = "png") -> Optional[bytes]:
    """
    Generate a static image (PNG/SVG/PDF) of the chart for PDF report embedding.
    Requires kaleido package installed.
    """
    fig_dict = generate_plotly_figure(data, question, answer)
    if not fig_dict:
        return None

    try:
        fig = go.Figure(fig_dict)
        return fig.to_image(format=format, width=800, height=400, scale=2)
    except Exception:
        return None
