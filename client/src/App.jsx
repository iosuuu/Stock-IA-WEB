import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Trace from './pages/Trace';
import Stock from './pages/Stock';
import UsersPage from './pages/UsersPage';
import Metrics from './pages/Metrics';
import ActivityHistory from './pages/ActivityHistory';
import AdminPortal from './pages/AdminPortal';
import { getCurrentUser } from './auth';
import { LanguageProvider } from './contexts/LanguageContext';

// Placeholder Pages
const DashboardHome = () => <div className="glass-panel" style={{ padding: '2rem' }}><h1>Dashboard Overview</h1><p>Welcome to Trace IA. Select an option from the sidebar.</p></div>;

const PrivateRoute = ({ children }) => {
  const user = getCurrentUser();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const user = getCurrentUser();

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* If user is admin, default to portal, else dashboard */}
          <Route path="/" element={
            user ? (user.role === 'admin' ? <Navigate to="/portal" /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />
          } />

          <Route path="/portal" element={
            <PrivateRoute>
              <AdminPortal />
            </PrivateRoute>
          } />

          <Route path="/dashboard" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<DashboardHome />} />
            <Route path="trace" element={<Trace />} />
            <Route path="stock" element={<Stock />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="metrics" element={<Metrics />} />
            <Route path="activity" element={<ActivityHistory />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
