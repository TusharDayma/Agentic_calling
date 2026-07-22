import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, BarChart3, Phone, CheckCircle, TrendingUp, Clock, Activity, Star } from 'lucide-react';
import { getSystemStats, getAuditLogs } from '../../api/client';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

function StatCard({ icon: Icon, label, value, color, trend }: {
    icon: React.ElementType; label: string; value: string | number; color: string; trend?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="stat-card"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={20} color={color} />
                </div>
                {trend && (
                    <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600, background: '#d1fae5', padding: '2px 8px', borderRadius: 6 }}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{value}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{label}</div>
            </div>
        </motion.div>
    );
}

// Mock chart data
const callsPerDay = [
    { day: 'Mon', calls: 48 }, { day: 'Tue', calls: 72 }, { day: 'Wed', calls: 65 },
    { day: 'Thu', calls: 91 }, { day: 'Fri', calls: 88 }, { day: 'Sat', calls: 24 }, { day: 'Sun', calls: 12 },
];

const recruiterData = [
    { name: 'Sarah J.', screened: 205, shortlisted: 42 },
    { name: 'Raj P.', screened: 100, shortlisted: 18 },
];

const campaignStatusData = [
    { name: 'Completed', value: 1 },
    { name: 'Active', value: 2 },
    { name: 'Draft', value: 1 },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState<Record<string, unknown>>({});
    const [auditLogs, setAuditLogs] = useState<unknown[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getSystemStats(), getAuditLogs()])
            .then(([s, a]) => {
                setStats(s.data);
                setAuditLogs(a.data?.slice(0, 8) || []);
            })
            .catch(() => { }) // Use mock data on fail
            .finally(() => setLoading(false));
    }, []);

    const cards = [
        { icon: Users, label: 'Total HR Users', value: (stats.total_hr_users as number) || 3, color: '#3b82f6', trend: '+1 this month' },
        { icon: BarChart3, label: 'Total Campaigns', value: (stats.total_campaigns as number) || 4, color: '#8b5cf6', trend: '+2 this week' },
        { icon: Phone, label: 'Candidates Screened', value: (stats.total_candidates as number) || 305, color: '#10b981', trend: '+47 today' },
        { icon: CheckCircle, label: 'Calls Completed', value: (stats.completed_calls as number) || 198, color: '#f59e0b' },
        { icon: TrendingUp, label: 'Avg. CIS Score', value: `${(stats.avg_intelligence_score as number)?.toFixed(1) || '72.4'}`, color: '#10b981', trend: '↑ 3.2%' },
        { icon: Activity, label: 'Call Success Rate', value: `${(stats.call_success_rate as number) || 68}%`, color: '#1e3a5f' },
    ];

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                        Admin Dashboard
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>System overview & performance metrics</div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Link to="/admin/users">
                        <button className="btn-primary"><Users size={15} /> Manage Users</button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
                {cards.map((c, i) => (
                    <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <StatCard {...c} />
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="chart-container">
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: '#1e293b' }}>Calls Per Day (This Week)</div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={callsPerDay}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="calls" fill="#1e3a5f" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: '#1e293b' }}>Campaign Status</div>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie data={campaignStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                                {campaignStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recruiter Performance + Audit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="chart-container">
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: '#1e293b' }}>Recruiter Performance</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={recruiterData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="screened" fill="#3b82f6" radius={[0, 6, 6, 0]} name="Screened" />
                            <Bar dataKey="shortlisted" fill="#10b981" radius={[0, 6, 6, 0]} name="Shortlisted" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="stat-card" style={{ padding: 24 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: '#1e293b' }}>Recent Activity</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(auditLogs.length > 0 ? auditLogs : [
                            { action: 'campaign_created', resource: 'campaign', created_at: new Date().toISOString(), ip_address: '192.168.1.10' },
                            { action: 'user_login', resource: 'auth', created_at: new Date().toISOString(), ip_address: '192.168.1.5' },
                            { action: 'csv_uploaded', resource: 'candidate', created_at: new Date().toISOString(), ip_address: '192.168.1.12' },
                            { action: 'campaign_started', resource: 'campaign', created_at: new Date().toISOString(), ip_address: '192.168.1.10' },
                            { action: 'user_created', resource: 'user', created_at: new Date().toISOString(), ip_address: '192.168.1.1' },
                        ]).slice(0, 5).map((log: unknown, i) => {
                            const l = log as Record<string, string>;
                            return (
                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%', marginTop: 5,
                                        background: l.action?.includes('login') ? '#10b981' : l.action?.includes('created') ? '#3b82f6' : '#f59e0b',
                                        flexShrink: 0,
                                    }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
                                            {l.action?.replace(/_/g, ' ')}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                            {l.resource} • {l.ip_address}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Link to="/admin/audit" style={{ textDecoration: 'none' }}>
                        <button style={{ width: '100%', marginTop: 16, padding: '8px', borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                            View All Logs →
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
