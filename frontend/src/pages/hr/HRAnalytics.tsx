import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend, FunnelChart, Funnel, LabelList,
} from 'recharts';
import { getAnalyticsSummary, getCallsPerDay, getScoreDistribution, getCandidateFunnel, getCommunicationDistribution } from '../../api/client';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const mockCallsPerDay = [
    { date: 'Jul 10', calls: 22 }, { date: 'Jul 11', calls: 38 }, { date: 'Jul 12', calls: 29 },
    { date: 'Jul 13', calls: 45 }, { date: 'Jul 14', calls: 41 }, { date: 'Jul 15', calls: 67 },
    { date: 'Jul 16', calls: 55 }, { date: 'Jul 17', calls: 79 }, { date: 'Jul 18', calls: 91 },
    { date: 'Jul 19', calls: 67 }, { date: 'Jul 20', calls: 74 }, { date: 'Jul 21', calls: 82 },
    { date: 'Jul 22', calls: 48 }, { date: 'Jul 23', calls: 19 },
];

const mockScoreDist = [
    { range: '0-20', count: 5 }, { range: '21-40', count: 12 }, { range: '41-60', count: 45 },
    { range: '61-70', count: 62 }, { range: '71-80', count: 84 }, { range: '81-90', count: 67 },
    { range: '91-100', count: 30 },
];

const mockFunnel = [
    { name: 'Total Uploaded', value: 305, fill: '#1e3a5f' },
    { name: 'Called', value: 270, fill: '#3b82f6' },
    { name: 'Completed', value: 198, fill: '#10b981' },
    { name: 'Recommended', value: 87, fill: '#f59e0b' },
    { name: 'Shortlisted', value: 43, fill: '#8b5cf6' },
];

const mockCommDist = [
    { name: 'Excellent', value: 67 },
    { name: 'Good', value: 89 },
    { name: 'Average', value: 95 },
    { name: 'Below Average', value: 49 },
];

const mockSummary = {
    total_candidates: 305,
    calls_completed: 198,
    calls_failed: 29,
    calls_pending: 78,
    avg_intelligence_score: 72.4,
    top_candidates: 43,
    call_success_rate: 68,
    recommendation_distribution: {
        strongly_recommended: 43,
        recommended: 87,
        average: 95,
        not_recommended: 80,
    },
};

export default function HRAnalytics() {
    const [summary, setSummary] = useState(mockSummary);
    const [callsData, setCallsData] = useState(mockCallsPerDay);
    const [scoreDist, setScoreDist] = useState(mockScoreDist);
    const [funnel, setFunnel] = useState(mockFunnel);
    const [commDist, setCommDist] = useState(mockCommDist);

    useEffect(() => {
        Promise.all([
            getAnalyticsSummary().then(r => setSummary(r.data)).catch(() => { }),
            getCallsPerDay(14).then(r => setCallsData(r.data)).catch(() => { }),
            getScoreDistribution().then(r => setScoreDist(r.data)).catch(() => { }),
            getCandidateFunnel().then(r => setFunnel(r.data)).catch(() => { }),
            getCommunicationDistribution().then(r => setCommDist(r.data)).catch(() => { }),
        ]);
    }, []);

    const recData = Object.entries(summary.recommendation_distribution || {}).map(([k, v]) => ({
        name: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value: v as number,
    }));

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: 28 }}>
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Analytics</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Campaign performance & candidate insights</div>
                </div>
            </div>

            {/* Summary KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 18, marginBottom: 28 }}>
                {[
                    { label: 'Total Candidates', val: summary.total_candidates, color: '#3b82f6' },
                    { label: 'Calls Completed', val: summary.calls_completed, color: '#10b981' },
                    { label: 'Calls Pending', val: summary.calls_pending, color: '#f59e0b' },
                    { label: 'Calls Failed', val: summary.calls_failed, color: '#ef4444' },
                    { label: 'Avg. CIS Score', val: summary.avg_intelligence_score?.toFixed(1), color: '#8b5cf6' },
                    { label: 'Top Candidates', val: summary.top_candidates, color: '#10b981' },
                ].map(k => (
                    <div key={k.label} className="stat-card" style={{ padding: '20px 22px' }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: k.color }}>{k.val}</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="chart-container">
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: '#1e293b' }}>Calls Per Day (14 Days)</div>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={callsData}>
                            <defs>
                                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.18} />
                                    <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="calls" stroke="#1e3a5f" strokeWidth={2.5} fill="url(#grad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: '#1e293b' }}>Recommendation Split</div>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={recData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                {recData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend iconSize={10} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="chart-container">
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: '#1e293b' }}>CIS Score Distribution</div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={scoreDist}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
                            <Bar dataKey="count" fill="#1e3a5f" radius={[4, 4, 0, 0]} name="Candidates" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: '#1e293b' }}>Communication Quality</div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={commDist} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={90} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
                            <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} name="Candidates" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Candidate Funnel */}
            <div className="chart-container">
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: '#1e293b' }}>Candidate Funnel</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {funnel.map((stage, i) => {
                        const pct = funnel[0].value > 0 ? Math.round((stage.value / funnel[0].value) * 100) : 0;
                        return (
                            <div key={stage.name} style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{
                                    height: 60, background: stage.fill + '20', borderRadius: 8,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 4px', border: `2px solid ${stage.fill}40`,
                                    flexDirection: 'column',
                                }}>
                                    <div style={{ fontWeight: 800, fontSize: 20, color: stage.fill }}>{stage.value}</div>
                                </div>
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 8, fontWeight: 600 }}>{stage.name}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{pct}%</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
