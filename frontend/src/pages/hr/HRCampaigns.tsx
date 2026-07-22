import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getCampaigns, startCampaign } from '../../api/client';
import { Campaign } from '../../types';
import { Plus, Play, Eye, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        draft: 'badge badge-neutral',
        active: 'badge badge-success',
        completed: 'badge badge-info',
        paused: 'badge badge-warning',
    };
    return <span className={map[status] || 'badge badge-neutral'}>{status.toUpperCase()}</span>;
}

export default function HRCampaigns() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getCampaigns()
            .then(r => setCampaigns(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleStart = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await startCampaign(id);
            setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'active' } : c));
        } catch { }
    };

    // Mock if empty
    const displayCampaigns = campaigns.length > 0 ? campaigns : [
        { id: 'mock1', title: 'Senior SWE Batch - July 2026', department: 'Engineering', status: 'completed' as const, question_set: [], created_at: '2026-07-05', accent: 'en-IN', max_retries: 3, retry_delay_minutes: 120, parallel_calls: 10, calling_window_start: '09:00', calling_window_end: '18:00', voice_speed: '1.0', hiring_manager: 'Alex Morgan', hiring_location: 'Bangalore', experience_required: '4-8 years', job_description: '...' },
        { id: 'mock2', title: 'Data Science Hiring Drive Q2', department: 'Analytics', status: 'active' as const, question_set: [], created_at: '2026-07-12', accent: 'en-IN', max_retries: 3, retry_delay_minutes: 120, parallel_calls: 5, calling_window_start: '09:00', calling_window_end: '18:00', voice_speed: '1.0', hiring_manager: 'Sarah Johnson', hiring_location: 'Hyderabad', experience_required: '2-6 years', job_description: '...' },
        { id: 'mock3', title: 'Product Manager Expansion 2026', department: 'Product', status: 'active' as const, question_set: [], created_at: '2026-07-15', accent: 'en-US', max_retries: 3, retry_delay_minutes: 120, parallel_calls: 5, calling_window_start: '09:00', calling_window_end: '18:00', voice_speed: '1.0', hiring_manager: 'Alex Morgan', hiring_location: 'Mumbai', experience_required: '3-7 years', job_description: '...' },
        { id: 'mock4', title: 'DevOps Cloud Hire - Bangalore', department: 'Engineering', status: 'draft' as const, question_set: [], created_at: '2026-07-18', accent: 'en-IN', max_retries: 3, retry_delay_minutes: 120, parallel_calls: 5, calling_window_start: '09:00', calling_window_end: '18:00', voice_speed: '1.0', hiring_manager: 'Raj Patel', hiring_location: 'Bangalore', experience_required: '3-6 years', job_description: '...' },
    ];

    const mockCandidateCounts: Record<string, { total: number; completed: number; pending: number; failed: number }> = {
        mock1: { total: 120, completed: 98, pending: 0, failed: 22 },
        mock2: { total: 85, completed: 47, pending: 31, failed: 7 },
        mock3: { total: 60, completed: 33, pending: 22, failed: 5 },
        mock4: { total: 40, completed: 0, pending: 40, failed: 0 },
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>My Campaigns</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{displayCampaigns.length} campaigns total</div>
                </div>
                <Link to="/hr/campaigns/new">
                    <button className="btn-accent"><Plus size={16} /> New Campaign</button>
                </Link>
            </div>

            <div style={{ display: 'grid', gap: 20 }}>
                {displayCampaigns.map((camp, i) => {
                    const cnt = mockCandidateCounts[camp.id] || { total: 0, completed: 0, pending: 0, failed: 0 };
                    const progress = cnt.total > 0 ? Math.round((cnt.completed / cnt.total) * 100) : 0;

                    return (
                        <motion.div
                            key={camp.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="stat-card"
                            style={{ padding: 24, cursor: 'pointer' }}
                            onClick={() => navigate(`/hr/campaigns/${camp.id}`)}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                                        <h3 style={{ fontWeight: 700, fontSize: 17, color: '#0f172a' }}>{camp.title}</h3>
                                        <StatusBadge status={camp.status} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#64748b' }}>
                                        <span>📁 {camp.department}</span>
                                        <span>📍 {camp.hiring_location}</span>
                                        <span>👤 {camp.hiring_manager}</span>
                                        <span>💼 {camp.experience_required}</span>
                                        <span>🎤 {camp.accent}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {camp.status === 'draft' && (
                                        <button onClick={(e) => handleStart(camp.id, e)} className="btn-accent" style={{ fontSize: 13, padding: '7px 14px' }}>
                                            <Play size={14} /> Start
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/hr/campaigns/${camp.id}`); }}
                                        className="btn-outline"
                                        style={{ fontSize: 13, padding: '7px 14px' }}
                                    >
                                        <Eye size={14} /> View
                                    </button>
                                </div>
                            </div>

                            {cnt.total > 0 && (
                                <>
                                    <div className="progress-bar" style={{ marginBottom: 10 }}>
                                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 28, fontSize: 13 }}>
                                        <span style={{ color: '#334155' }}><strong>{cnt.total}</strong> Total</span>
                                        <span style={{ color: '#10b981' }}><strong>{cnt.completed}</strong> Completed</span>
                                        <span style={{ color: '#f59e0b' }}><strong>{cnt.pending}</strong> Pending</span>
                                        <span style={{ color: '#ef4444' }}><strong>{cnt.failed}</strong> Failed</span>
                                        <span style={{ color: '#94a3b8', marginLeft: 'auto' }}>{progress}% Complete</span>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
