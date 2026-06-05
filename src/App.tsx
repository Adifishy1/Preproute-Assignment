import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateTestPage from './pages/CreateTestPage';
import AddQuestionsPage from './pages/AddQuestionsPage';
import PreviewPublishPage from './pages/PreviewPublishPage';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1E1E27', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, borderRadius: 10 },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/tests/create" element={<ProtectedRoute><CreateTestPage /></ProtectedRoute>} />
        <Route path="/tests/:id/edit" element={<ProtectedRoute><CreateTestPage /></ProtectedRoute>} />
        <Route path="/tests/:id/questions" element={<ProtectedRoute><AddQuestionsPage /></ProtectedRoute>} />
        <Route path="/tests/:id/preview" element={<ProtectedRoute><PreviewPublishPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
