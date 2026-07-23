import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Admin / System management pages
import AdminUsers from './pages/admin/AdminUsers';
import AdminJobRoles from './pages/admin/AdminJobRoles';
import { AdminQuestions as AdminQuestionsStub, AdminAIConfig, AdminCampaigns, AdminAnalytics, AdminAuditLogs, AdminSettings } from './pages/admin/AdminStubs';

// HR & Screening pages
import HRLayout from './pages/hr/HRLayout';
import HRDashboard from './pages/hr/HRDashboard';
import HRCampaigns from './pages/hr/HRCampaigns';
import HRCreateCampaign from './pages/hr/HRCreateCampaign';
import HRCampaignDetail from './pages/hr/HRCampaignDetail';
import HRCandidates from './pages/hr/HRCandidates';
import HRCandidateDetail from './pages/hr/HRCandidateDetail';
import HRAnalytics from './pages/hr/HRAnalytics';
import HRReports from './pages/hr/HRReports';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
    const { user, role, isLoading } = useAuth();
    if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;

    // Allow access - if not logged in, auto redirect to login
    if (!user) return <Navigate to="/login" replace />;
    
    if (allowedRoles && role && !allowedRoles.includes(role)) {
        return <Navigate to="/hr" replace />; // or an unauthorized page
    }

    return <>{children}</>;
}

function AppRoutes() {
    const { user, isLoading } = useAuth();

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div className="spinner" />
        </div>
    );

    return (
        <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={user ? <Navigate to="/hr" replace /> : <LoginPage />} />
            <Route path="/signup" element={user ? <Navigate to="/hr" replace /> : <SignupPage />} />

            {/* Main Unified Platform Routes */}
            <Route path="/hr" element={
                <ProtectedRoute>
                    <HRLayout />
                </ProtectedRoute>
            }>
                <Route index element={<HRDashboard />} />
                <Route path="campaigns" element={<HRCampaigns />} />
                <Route path="campaigns/new" element={<HRCreateCampaign />} />
                <Route path="campaigns/:id" element={<HRCampaignDetail />} />
                <Route path="candidates" element={<HRCandidates />} />
                <Route path="candidates/:evalId" element={<HRCandidateDetail />} />
                <Route path="analytics" element={<HRAnalytics />} />
                <Route path="reports" element={<HRReports />} />
            </Route>

            {/* System / Admin Settings Routes embedded seamlessly */}
            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <HRLayout />
                </ProtectedRoute>
            }>
                <Route index element={<HRDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="roles" element={<AdminJobRoles />} />
                <Route path="questions" element={<AdminQuestionsStub />} />
                <Route path="ai-config" element={<AdminAIConfig />} />
                <Route path="campaigns" element={<AdminCampaigns />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="audit" element={<AdminAuditLogs />} />
                <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}
