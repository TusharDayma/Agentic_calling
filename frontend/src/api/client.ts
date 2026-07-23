import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('talent_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 - auto logout
api.interceptors.response.use(
    (r) => r,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('talent_token');
            localStorage.removeItem('talent_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// Auth
export const loginApi = (username: string, password: string) =>
    api.post('/auth/login', { username, password });

export const getMeApi = () => api.get('/auth/me');

// Dashboard
export const getDashboardMetrics = () => api.get('/dashboard/live-queue');
export const getEvaluationsList = (limit = 100) => api.get(`/dashboard/evaluations?limit=${limit}`);
export const getCandidateDetail = (evalId: string) => api.get(`/dashboard/candidate-detail/${evalId}`);

// Campaigns
export const getCampaigns = () => api.get('/campaigns/');
export const getCampaign = (id: string) => api.get(`/campaigns/${id}`);
export const createCampaign = (data: Record<string, unknown>) => api.post('/campaigns/', data);
export const startCampaign = (id: string) => api.post(`/campaigns/${id}/start`);

// Candidates
export const getCampaignCandidates = (campaignId: string) =>
    api.get(`/campaigns/${campaignId}/candidates`);
export const uploadCandidatesCSV = (campaignId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/campaigns/${campaignId}/upload-csv`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// Admin
export const getAdminUsers = () => api.get('/admin/users');
export const createAdminUser = (data: Record<string, unknown>) => api.post('/admin/users', data);
export const updateAdminUser = (id: string, data: Record<string, unknown>) => api.patch(`/admin/users/${id}`, data);
export const deleteAdminUser = (id: string) => api.delete(`/admin/users/${id}`);

export const getJobRoles = () => api.get('/admin/job-roles');
export const createJobRole = (data: Record<string, unknown>) => api.post('/admin/job-roles', data);
export const deleteJobRole = (id: string) => api.delete(`/admin/job-roles/${id}`);

export const getQuestionSets = () => api.get('/admin/question-sets');
export const createQuestionSet = (data: Record<string, unknown>) => api.post('/admin/question-sets', data);

export const getAuditLogs = () => api.get('/admin/audit-logs');
export const getSystemStats = () => api.get('/admin/system-stats');
export const getAIConfig = () => api.get('/admin/ai-config');
export const updateAIConfig = (data: Record<string, unknown>) => api.put('/admin/ai-config', data);

// Analytics
export const getAnalyticsSummary = () => api.get('/analytics/summary');
export const getCallsPerDay = (days = 14) => api.get(`/analytics/calls-per-day?days=${days}`);
export const getScoreDistribution = () => api.get('/analytics/score-distribution');
export const getCandidateFunnel = () => api.get('/analytics/candidate-funnel');
export const getCommunicationDistribution = () => api.get('/analytics/communication-distribution');

export default api;
