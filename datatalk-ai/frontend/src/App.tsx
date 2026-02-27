import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import QueryPage from './pages/QueryPage';
import DataExplorerPage from './pages/DataExplorerPage';
import DashboardPage from './pages/DashboardPage';

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<QueryPage />} />
                    <Route path="explorer" element={<DataExplorerPage />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="saved" element={<DashboardPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
