# DataTalk AI

DataTalk AI is a full-stack, AI-powered dataset analytics platform that allows users to chat with their data using plain English, automatically profiling schemas, generating SQL, surfacing impactful correlations, and extracting key performance metrics.

## Quick Start & Installation Instructions

To run DataTalk AI locally, you need to spin up both the Python FastAPI backend and the React Vite frontend.

### 1. Backend Setup (FastAPI & Python)

The intelligence backend uses DuckDB, Anthropic's Claude, and Scipy to execute SQL and statistics.

1. Open a new terminal and navigate to the `backend` folder:
   ```bash
   cd datatalk-ai/backend
   ```
2. Create and activate a Virtual Environment (optional, but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install Python Dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up Environment Variables:
   - Create a `.env` file in the `backend` directory.
   - Add your Anthropic API Key:
     ```env
     ANTHROPIC_API_KEY="your_claude_api_key_here"
     ```
5. Run the Backend Server:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will start running on `http://localhost:8000`*.

---

### 2. Frontend Setup (React & Vite)

The UI uses React, Zustand for state management, Tailwind for styling, and Plotly.js for interactive analytics.

1. Open a **second** terminal and navigate to the `frontend` folder:
   ```bash
   cd datatalk-ai/frontend
   ```
2. Install Node Dependencies:
   ```bash
   npm install
   ```
3. Set up Environment Variables:
   - Create a `.env` file in the `frontend` directory.
   - Specify the backend API URL:
     ```env
     VITE_API_URL="http://localhost:8000"
     ```
4. Start the Frontend Development Server:
   ```bash
   npm run dev
   ```
   *The frontend will start running on `http://localhost:5173`. Open this URL in your browser to begin.*

## Features
- **AI-Powered Insights**: Chat directly with CSV files in English via Claude 3.5 Sonnet translating to DuckDB SQL.
- **Self-Healing SQL**: Automatic execution error capturing and prompt retries.
- **Statistical Significance**: Built-in p-value confidence tests, Scipy t-tests, Z-score anomalies, and dynamic Impact Rankings.
- **Automated Visualizations**: Dynamic rendering of Bar, Pie, Scatter, Heatmap, and Line charts using Plotly context inference.
