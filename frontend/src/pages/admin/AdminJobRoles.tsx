import React, { useEffect, useState } from 'react';
import { getJobRoles, createJobRole, deleteJobRole } from '../../api/client';
import { JobRole } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const mockRoles: JobRole[] = [
    { id: '1', title: 'Senior Software Engineer', department: 'Engineering', description: 'Build scalable backend systems.', skills_required: ['Python', 'React', 'AWS', 'SQL'], experience_min: 4, experience_max: 8, is_active: true },
    { id: '2', title: 'Data Scientist', department: 'Analytics', description: 'ML model development and deployment.', skills_required: ['Python', 'TensorFlow', 'SQL', 'MLOps'], experience_min: 2, experience_max: 6, is_active: true },
    { id: '3', title: 'Product Manager', department: 'Product', description: 'Drive product roadmap and delivery.', skills_required: ['Product Strategy', 'Agile', 'Data Analysis'], experience_min: 3, experience_max: 7, is_active: true },
];

export default function AdminJobRoles() {
    const [roles, setRoles] = useState<JobRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', department: '', description: '', skills_required: '', experience_min: 2, experience_max: 6 });

    useEffect(() => {
        getJobRoles().then(r => setRoles(r.data || mockRoles)).catch(() => setRoles(mockRoles)).finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        try {
            const payload = { ...form, skills_required: form.skills_required.split(',').map(s => s.trim()) };
            const res = await createJobRole(payload as Record<string, unknown>);
            setRoles(prev => [...prev, res.data]);
            setShowModal(false);
        } catch { setRoles(prev => [...prev, { ...form, id: `local-${Date.now()}`, skills_required: form.skills_required.split(',').map(s => s.trim()), is_active: true }]); setShowModal(false); }
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Job Roles</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{roles.length} active job roles</div>
                </div>
                <button className="btn-accent" onClick={() => setShowModal(true)}><Plus size={15} /> Add Role</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
                {roles.map((role, i) => (
                    <motion.div key={role.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="stat-card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>{role.title}</div>
                                <div style={{ fontSize: 13, color: '#64748b' }}>{role.department}</div>
                            </div>
                            <button onClick={() => deleteJobRole(role.id).then(() => setRoles(p => p.filter(r => r.id !== role.id))).catch(() => { })}
                                style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', height: 32 }}>
                                <Trash2 size={13} color="#ef4444" />
                            </button>
                        </div>
                        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14, lineHeight: 1.6 }}>{role.description}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                            {role.skills_required?.map(skill => (
                                <span key={skill} style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{skill}</span>
                            ))}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Experience: {role.experience_min}–{role.experience_max} years</div>
                    </motion.div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 24 }}>New Job Role</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[
                                { key: 'title', label: 'Role Title', ph: 'Senior Software Engineer' },
                                { key: 'department', label: 'Department', ph: 'Engineering' },
                                { key: 'description', label: 'Description', ph: 'Role description...' },
                                { key: 'skills_required', label: 'Required Skills (comma-separated)', ph: 'Python, AWS, SQL' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
                                    {f.key === 'description' ? (
                                        <textarea rows={3} className="form-input" placeholder={f.ph} value={(form as Record<string, unknown>)[f.key] as string} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                    ) : (
                                        <input className="form-input" placeholder={f.ph} value={(form as Record<string, unknown>)[f.key] as string} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                    )}
                                </div>
                            ))}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {[{ key: 'experience_min', label: 'Min Years' }, { key: 'experience_max', label: 'Max Years' }].map(f => (
                                    <div key={f.key}>
                                        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
                                        <input type="number" className="form-input" value={(form as Record<string, unknown>)[f.key] as number} onChange={e => setForm(p => ({ ...p, [f.key]: parseInt(e.target.value) }))} />
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn-accent" onClick={handleCreate}>Create Role</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
