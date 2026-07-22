import React from 'react';

const stubs = [
    { name: 'AdminQuestions', title: 'Question Bank', icon: '📝', desc: 'Manage AI interview question sets' },
    { name: 'AdminAIConfig', title: 'AI Configuration', icon: '🤖', desc: 'Configure AI voice agent settings' },
    { name: 'AdminCampaigns', title: 'All Campaigns', icon: '📋', desc: 'System-wide campaign overview' },
    { name: 'AdminAnalytics', title: 'Analytics', icon: '📊', desc: 'System-wide analytics dashboard' },
    { name: 'AdminAuditLogs', title: 'Audit Logs', icon: '🔍', desc: 'View system audit trail' },
    { name: 'AdminSettings', title: 'Settings', icon: '⚙️', desc: 'Platform settings and configuration' },
];

function makePage(title: string, icon: string, desc: string) {
    return function Page() {
        return (
            <div className="fade-in">
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>{title}</div>
                <div className="stat-card" style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{title}</div>
                    <div style={{ fontSize: 14, color: '#64748b' }}>{desc}</div>
                </div>
            </div>
        );
    };
}

const AdminQuestions = makePage('Question Bank', '📝', 'Manage reusable AI interview question sets per role and department');
const AdminAIConfig = makePage('AI Configuration', '🤖', 'Configure voice agent persona, language, speed, and evaluation thresholds');
const AdminCampaigns = makePage('All Campaigns', '📋', 'System-wide view of all HR campaigns across all recruiters');
const AdminAnalytics = makePage('Analytics', '📊', 'System-wide analytics: recruiter performance, call volumes, score trends');
const AdminAuditLogs = makePage('Audit Logs', '🔍', 'Full audit trail of system events, user actions, and API calls');
const AdminSettings = makePage('Settings', '⚙️', 'Platform-wide configuration, integrations, and security settings');

export { AdminQuestions, AdminAIConfig, AdminCampaigns, AdminAnalytics, AdminAuditLogs, AdminSettings };
