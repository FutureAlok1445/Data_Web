import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import QueryPage from './pages/QueryPage';
import DataExplorerPage from './pages/DataExplorerPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<QueryPage />} />
                    <Route path="explorer" element={<DataExplorerPage />} />
                    {/* Add other routes here later */}
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
