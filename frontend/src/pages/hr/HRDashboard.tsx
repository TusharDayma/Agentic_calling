import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, CheckCircle, TrendingUp, Activity, Users, Clock, Zap, Award } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardMetrics, getEvaluationsList } from '../../api/client';
import { CandidateEvaluation } from '../../types';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

function ScoreBar({ value, color }: { value: number; color: string }) {
    return (
        <div className="score-bar" style={{ flex: 1 }}>
            <div className="score-bar-fill" style={{ width: `${value}%`, background: color }} />
        </div>
    );
}

function getRecBadge(rec: string) {
    const map: Record<string, { label: string; cls: string }> = {
        strongly_recommended: { label: '⭐ Top Pick', cls: 'badge badge-success' },
        recommended: { label: '✓ Recommended', cls: 'badge badge-info' },
        average: { label: '~ Average', cls: 'badge badge-warning' },
        not_recommended: { label: '✗ Not Rec.', cls: 'badge badge-danger' },
    };
    return map[rec] || { label: rec, cls: 'badge badge-neutral' };
}

const trendData = [
    { date: 'Jul 12', calls: 28 }, { date: 'Jul 13', calls: 45 }, { date: 'Jul 14', calls: 38 },
    { date: 'Jul 15', calls: 62 }, { date: 'Jul 16', calls: 55 }, { date: 'Jul 17', calls: 79 },
    { date: 'Jul 18', calls: 91 }, { date: 'Jul 19', calls: 67 },
];

const statusData = [
    { name: 'Completed', value: 198 },
    { name: 'Pending', value: 78 },
    { name: 'Failed', value: 29 },
];

export default function HRDashboard() {
    const [metrics, setMetrics] = useState<Record<string, number>>({});
    const [candidates, setCandidates] = useState<CandidateEvaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = () => {
            Promise.all([getDashboardMetrics(), getEvaluationsList(100)])
                .then(([m, e]) => {
                    setMetrics(m.data);
                    setCandidates(e.data || []);
                })
                .catch(() => { })
                .finally(() => setLoading(false));
        };

        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 5000);
        return () => clearInterval(interval);
    }, []);

    const top10 = [...candidates].sort((a, b) => b.candidate_intelligence_score - a.candidate_intelligence_score).slice(0, 10);

    const cards = [
        { icon: Activity, label: 'Active Campaigns', value: metrics.active_campaigns ?? 2, color: '#3b82f6', sub: 'Running right now' },
        { icon: Phone, label: "Today's Calls", value: metrics.completed_calls ?? 67, color: '#10b981', sub: 'Screened today' },
        { icon: Users, label: 'Total Candidates', value: metrics.total_candidates ?? 305, color: '#8b5cf6', sub: 'Across all campaigns' },
        { icon: Award, label: 'Top Candidates', value: candidates.filter(c => c.candidate_intelligence_score >= 80).length || 23, color: '#f59e0b', sub: 'CIS ≥ 80' },
        { icon: TrendingUp, label: 'Avg. CIS Score', value: `${metrics.avg_cis?.toFixed(1) ?? '72.4'}`, color: '#10b981', sub: 'Intelligence score' },
        { icon: CheckCircle, label: 'Call Success Rate', value: `${metrics.completed_calls && metrics.total_candidates ? Math.round((metrics.completed_calls / metrics.total_candidates) * 100) : 65}%`, color: '#1e3a5f', sub: 'Completion rate' },
    ];

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>HR Dashboard</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                        Welcome back! Here's your recruitment overview.
                    </div>
                </div>
                <Link to="/hr/campaigns/new">
                    <button className="btn-accent"><Zap size={15} /> New Campaign</button>
                </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 18, marginBottom: 28 }}>
                {cards.map((c, i) => (
                    <motion.div
                        key={c.label}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="stat-card"
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <c.icon size={20} color={c.color} />
                            </div>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{c.value}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginTop: 4 }}>{c.label}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{c.sub}</div>
                    </motion.div>
                ))}
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="chart-container">
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: '#1e293b' }}>Call Trend (Last 8 Days)</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="calls" stroke="#1e3a5f" strokeWidth={2.5} fill="url(#callGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: '#1e293b' }}>Call Status</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend iconSize={10} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Candidates */}
            <div className="stat-card" style={{ padding: 26 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>🏆 Top Candidates</div>
                    <Link to="/hr/candidates" style={{ textDecoration: 'none' }}>
                        <button className="btn-outline" style={{ fontSize: 13, padding: '7px 16px' }}>View All</button>
                    </Link>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Candidate</th>
                                <th>Campaign</th>
                                <th>CIS Score</th>
                                <th>Communication</th>
                                <th>JD Fit</th>
                                <th>Recommendation</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(top10.length > 0 ? top10 : Array.from({ length: 5 }, (_, i) => ({
                                candidate_id: `mock-${i}`,
                                evaluation_id: `eval-${i}`,
                                first_name: ['Aarav', 'Priya', 'Rahul', 'Neha', 'Vikram'][i],
                                last_name: ['Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta'][i],
                                email: `candidate${i}@email.com`,
                                campaign_title: 'Senior SWE Batch',
                                candidate_intelligence_score: [92.3, 89.1, 87.5, 84.2, 82.0][i],
                                communication_score: [91, 85, 88, 79, 83][i],
                                jd_fit_score: [94, 88, 85, 82, 80][i],
                                recommendation: ['strongly_recommended', 'strongly_recommended', 'recommended', 'recommended', 'recommended'][i],
                                city: 'Bangalore',
                                experience_years: 5,
                                current_company: 'TCS',
                                extracted_notice_period: '30 days',
                                extracted_salary_expectation: '18 LPA',
                                extracted_years_of_experience: 5,
                                confidence_score: 85,
                                fluency_score: 88,
                                technical_score: 87,
                                campaign_id: 'c1',
                            }))).map((cand, i) => {
                                const c = cand as CandidateEvaluation;
                                const rec = getRecBadge(c.recommendation);
                                return (
                                    <tr key={c.candidate_id || i} className="action-row">
                                        <td style={{ fontWeight: 700, color: '#94a3b8', fontSize: 13 }}>#{i + 1}</td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.first_name} {c.last_name}</div>
                                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.email}</div>
                                        </td>
                                        <td style={{ fontSize: 13, color: '#64748b' }}>{c.campaign_title}</td>
                                        <td>
                                            <div style={{ fontWeight: 700, fontSize: 16, color: c.candidate_intelligence_score >= 80 ? '#10b981' : c.candidate_intelligence_score >= 65 ? '#f59e0b' : '#ef4444' }}>
                                                {c.candidate_intelligence_score?.toFixed(1)}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <ScoreBar value={c.communication_score || 0} color="#3b82f6" />
                                                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', minWidth: 28 }}>
                                                    {Math.round(c.communication_score || 0)}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <ScoreBar value={c.jd_fit_score || 0} color="#8b5cf6" />
                                                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', minWidth: 28 }}>
                                                    {Math.round(c.jd_fit_score || 0)}
                                                </span>
                                            </div>
                                        </td>
                                        <td><span className={rec.cls}>{rec.label}</span></td>
                                        <td>
                                            <button
                                                onClick={() => navigate(`/hr/candidates/${c.evaluation_id}`)}
                                                style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, background: '#f1f5f9', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#1e3a5f', transition: 'all 0.2s' }}
                                            >View →</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
