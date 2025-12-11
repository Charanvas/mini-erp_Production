import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Layout from './components/Layout/Layout';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Dashboard
import Dashboard from './pages/Dashboard/Dashboard';

// Projects
import ProjectList from './pages/Projects/ProjectList';
import ProjectDetails from './pages/Projects/ProjectDetails';

// Finance
import FinanceDashboard from './pages/Finance/FinanceDashboard';
import GeneralLedger from './pages/Finance/GeneralLedger';
import JournalEntries from './pages/Finance/JournalEntries';
import FinancialStatements from './pages/Finance/FinancialStatements';
import AccountsReceivable from './pages/Finance/AccountsReceivable';

// Insights
import RiskAnalysis from './pages/Insights/RiskAnalysis';

// Admin
import UserManagement from './pages/Admin/UserManagement';

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Projects */}
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/:id" element={<ProjectDetails />} />

            {/* Finance */}
            <Route
              path="finance"
              element={
                <ProtectedRoute roles={['Admin', 'Finance Manager']}>
                  <FinanceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="finance/general-ledger"
              element={
                <ProtectedRoute roles={['Admin', 'Finance Manager']}>
                  <GeneralLedger />
                </ProtectedRoute>
              }
            />
            <Route
              path="finance/journal-entries"
              element={
                <ProtectedRoute roles={['Admin', 'Finance Manager']}>
                  <JournalEntries />
                </ProtectedRoute>
              }
            />
            <Route
              path="finance/statements"
              element={
                <ProtectedRoute roles={['Admin', 'Finance Manager']}>
                  <FinancialStatements />
                </ProtectedRoute>
              }
            />

            {/* Invoices */}
            <Route
              path="invoices"
              element={
                <ProtectedRoute roles={['Admin', 'Finance Manager']}>
                  <AccountsReceivable />
                </ProtectedRoute>
              }
            />

            {/* Insights */}
            <Route path="risks" element={<RiskAnalysis />} />

            {/* Admin */}
            <Route
              path="admin/users"
              element={
                <ProtectedRoute roles={['Admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;