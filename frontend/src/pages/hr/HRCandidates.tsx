import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getEvaluationsList } from '../../api/client';
import { CandidateEvaluation } from '../../types';
import { Search, Filter, Download, LayoutGrid, List } from 'lucide-react';

function getRecBadge(rec: string) {
    const map: Record<string, { label: string; cls: string }> = {
        strongly_recommended: { label: '⭐ Top Pick', cls: 'badge badge-success' },
        recommended: { label: '✓ Recommended', cls: 'badge badge-info' },
        average: { label: '~ Average', cls: 'badge badge-warning' },
        not_recommended: { label: '✗ Not Rec.', cls: 'badge badge-danger' },
    };
    return map[rec] || { label: rec, cls: 'badge badge-neutral' };
}

const MOCK: CandidateEvaluation[] = Array.from({ length: 20 }, (_, i) => ({
    candidate_id: `c${i}`,
    evaluation_id: `ev${i}`,
    first_name: ['Aarav', 'Priya', 'Rahul', 'Neha', 'Vikram', 'Anjali', 'Ravi', 'Pooja', 'Arun', 'Divya'][i % 10],
    last_name: ['Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Mehta', 'Joshi', 'Nair', 'Roy', 'Iyer'][i % 10],
    email: `candidate${i + 1}@email.com`,
    city: ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'][i % 6],
    experience_years: 2 + (i % 8),
    current_company: ['Infosys', 'TCS', 'Wipro', 'Accenture', 'Cognizant', 'HCL'][i % 6],
    campaign_id: ['c1', 'c2', 'c3', 'c4'][i % 4],
    campaign_title: ['Senior SWE', 'Data Science', 'Product Manager', 'DevOps'][i % 4],
    candidate_intelligence_score: parseFloat((55 + Math.random() * 40).toFixed(1)),
    technical_score: parseFloat((50 + Math.random() * 45).toFixed(1)),
    jd_fit_score: parseFloat((55 + Math.random() * 40).toFixed(1)),
    fluency_score: parseFloat((60 + Math.random() * 35).toFixed(1)),
    confidence_score: parseFloat((58 + Math.random() * 37).toFixed(1)),
    communication_score: parseFloat((55 + Math.random() * 40).toFixed(1)),
    recommendation: ['strongly_recommended', 'recommended', 'average', 'not_recommended'][i % 4] as CandidateEvaluation['recommendation'],
    extracted_years_of_experience: 2 + (i % 8),
    extracted_notice_period: ['30 days', '60 days', '90 days'][i % 3],
    extracted_salary_expectation: ['12-15 LPA', '16-20 LPA', '20-25 LPA', '25-30 LPA'][i % 4],
    status: ['pending', 'scheduled', 'calling', 'completed', 'failed'][i % 5] as any,
}));

export default function HRCandidates() {
    const [candidates, setCandidates] = useState<CandidateEvaluation[]>([]);
    const [search, setSearch] = useState('');
    const [recFilter, setRecFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'cis_desc' | 'cis_asc' | 'name_asc' | 'name_desc' | 'date_desc' | 'date_asc'>('cis_desc');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCandidates = () => {
            getEvaluationsList(200)
                .then(r => setCandidates(r.data || MOCK))
                .catch(() => setCandidates(MOCK))
                .finally(() => setLoading(false));
        };

        fetchCandidates();
        const interval = setInterval(fetchCandidates, 5000);
        return () => clearInterval(interval);
    }, []);

    const filtered = candidates
        .filter(c => {
            const term = search.toLowerCase();
            const match = `${c.first_name} ${c.last_name} ${c.email} ${c.city} ${c.current_company}`.toLowerCase().includes(term);
            const recMatch = recFilter === 'all' || c.recommendation === recFilter;
            return match && recMatch;
        })
        .sort((a, b) => {
            if (sortBy === 'cis_desc') return b.candidate_intelligence_score - a.candidate_intelligence_score;
            if (sortBy === 'cis_asc') return a.candidate_intelligence_score - b.candidate_intelligence_score;
            if (sortBy === 'name_asc') return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
            if (sortBy === 'name_desc') return `${b.first_name} ${b.last_name}`.localeCompare(`${a.first_name} ${a.last_name}`);
            if (sortBy === 'date_desc') return new Date(b.created_at || a.created_at || 0).getTime() - new Date(a.created_at || b.created_at || 0).getTime();
            if (sortBy === 'date_asc') return new Date(a.created_at || b.created_at || 0).getTime() - new Date(b.created_at || a.created_at || 0).getTime();
            return 0;
        });

    // Grouping for Kanban columns
    const columns = {
        pending: {
            title: 'Pending',
            color: '#64748b',
            bg: '#f1f5f9',
            items: filtered.filter(c => !c.status || c.status === 'pending'),
        },
        calling: {
            title: 'Calling / Scheduled',
            color: '#3b82f6',
            bg: '#eff6ff',
            items: filtered.filter(c => c.status === 'calling' || c.status === 'scheduled'),
        },
        completed: {
            title: 'Completed / Evaluated',
            color: '#10b981',
            bg: '#ecfdf5',
            items: filtered.filter(c => c.status === 'completed'),
        },
        failed: {
            title: 'Failed / Rejected',
            color: '#ef4444',
            bg: '#fef2f2',
            items: filtered.filter(c => c.status === 'failed' || c.status === 'skipped'),
        },
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Candidates</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{filtered.length} candidates found</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* View Switcher */}
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: 2, borderRadius: 8, marginRight: 8 }}>
                        <button
                            onClick={() => setViewMode('list')}
                            className={viewMode === 'list' ? 'btn-primary' : 'btn-outline'}
                            style={{ padding: '6px 12px', border: 'none', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <List size={14} /> Table View
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={viewMode === 'kanban' ? 'btn-primary' : 'btn-outline'}
                            style={{ padding: '6px 12px', border: 'none', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <LayoutGrid size={14} /> Kanban Board
                        </button>
                    </div>
                    <button className="btn-outline" style={{ fontSize: 13 }}><Download size={14} /> Export CSV</button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: 260 }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        className="form-input"
                        placeholder="Search by name, email, city, company..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: 36 }}
                    />
                </div>
                <select className="form-select" style={{ width: 200 }} value={recFilter} onChange={e => setRecFilter(e.target.value)}>
                    <option value="all">All Recommendations</option>
                    <option value="strongly_recommended">⭐ Top Picks</option>
                    <option value="recommended">✓ Recommended</option>
                    <option value="average">~ Average</option>
                    <option value="not_recommended">✗ Not Recommended</option>
                </select>
                <select className="form-select" style={{ width: 220 }} value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                    <option value="cis_desc">Sort: CIS (High to Low)</option>
                    <option value="cis_asc">Sort: CIS (Low to High)</option>
                    <option value="name_asc">Sort: Name (A to Z)</option>
                    <option value="name_desc">Sort: Name (Z to A)</option>
                    <option value="date_desc">Sort: Date (Newest first)</option>
                    <option value="date_asc">Sort: Date (Oldest first)</option>
                </select>
            </div>

            {loading ? (
                <div className="stat-card" style={{ padding: 40, textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
            ) : viewMode === 'list' ? (
                <div className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Candidate</th>
                                    <th>Location</th>
                                    <th>Experience</th>
                                    <th>Campaign</th>
                                    <th>CIS Score</th>
                                    <th>JD Fit</th>
                                    <th>Status</th>
                                    <th>Recommendation</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c, i) => {
                                    const rec = getRecBadge(c.recommendation);
                                    return (
                                        <tr key={c.candidate_id}>
                                            <td style={{ color: '#94a3b8', fontWeight: 600 }}>{i + 1}</td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.first_name} {c.last_name}</div>
                                                <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.email}</div>
                                            </td>
                                            <td style={{ fontSize: 13, color: '#64748b' }}>{c.city}</td>
                                            <td style={{ fontSize: 13, color: '#64748b' }}>{c.experience_years}y • {c.current_company}</td>
                                            <td style={{ fontSize: 13, color: '#64748b' }}>{c.campaign_title}</td>
                                            <td>
                                                <span style={{
                                                    fontSize: 16, fontWeight: 800,
                                                    color: c.candidate_intelligence_score >= 80 ? '#10b981' : c.candidate_intelligence_score >= 65 ? '#f59e0b' : '#ef4444',
                                                }}>
                                                    {c.candidate_intelligence_score > 0 ? c.candidate_intelligence_score.toFixed(1) : '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
                                                    <div className="score-bar" style={{ flex: 1 }}>
                                                        <div className="score-bar-fill" style={{ width: `${c.jd_fit_score}%`, background: '#8b5cf6' }} />
                                                    </div>
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{Math.round(c.jd_fit_score)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${c.status === 'completed' ? 'badge-success' :
                                                    c.status === 'calling' ? 'badge-info' :
                                                        c.status === 'failed' ? 'badge-danger' : 'badge-neutral'
                                                    }`}>
                                                    {c.status || 'pending'}
                                                </span>
                                            </td>
                                            <td><span className={rec.cls}>{rec.label}</span></td>
                                            <td>
                                                <button
                                                    onClick={() => navigate(`/hr/candidates/${c.evaluation_id || c.candidate_id}`)}
                                                    style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, background: '#f1f5f9', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#1e3a5f' }}
                                                >View →</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Kanban Board View */
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
                    {Object.entries(columns).map(([colKey, col]) => (
                        <div
                            key={colKey}
                            style={{
                                flex: 1,
                                minWidth: 280,
                                background: '#f8fafc',
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                                padding: 12,
                                display: 'flex',
                                flexDirection: 'column',
                                height: 'calc(100vh - 280px)',
                                minHeight: 450
                            }}
                        >
                            {/* Column Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: `2.5px solid ${col.color}`, paddingBottom: 8 }}>
                                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{col.title}</span>
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: '#334155',
                                        background: '#e2e8f0',
                                        padding: '2px 8px',
                                        borderRadius: 10
                                    }}
                                >
                                    {col.items.length}
                                </span>
                            </div>

                            {/* Cards Container */}
                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
                                {col.items.length === 0 ? (
                                    <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13, border: '2px dashed #cbd5e1', borderRadius: 8 }}>
                                        No candidates
                                    </div>
                                ) : (
                                    col.items.map(c => {
                                        const rec = getRecBadge(c.recommendation);
                                        return (
                                            <div
                                                key={c.candidate_id}
                                                style={{
                                                    background: '#ffffff',
                                                    border: '1px solid #edf2f7',
                                                    borderRadius: 10,
                                                    padding: 12,
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                className="kanban-card"
                                                onClick={() => navigate(`/hr/candidates/${c.evaluation_id || c.candidate_id}`)}
                                            >
                                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>
                                                    {c.first_name} {c.last_name}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                                                    {c.current_company} • {c.experience_years}y experience
                                                </div>
                                                <div style={{ fontSize: 11, color: '#8c5ca5', marginTop: 4, fontWeight: 600 }}>
                                                    Role: {c.campaign_title}
                                                </div>

                                                {colKey === 'completed' && (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                                                        <span style={{ fontSize: 12, fontWeight: 750, color: c.candidate_intelligence_score >= 80 ? '#10b981' : c.candidate_intelligence_score >= 65 ? '#f59e0b' : '#ef4444' }}>
                                                            CIS: {c.candidate_intelligence_score.toFixed(1)}
                                                        </span>
                                                        <span className={rec.cls} style={{ fontSize: 10, padding: '2px 6px' }}>{rec.label}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

