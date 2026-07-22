import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAdminUsers, createAdminUser, deleteAdminUser } from '../../api/client';
import { Plus, Trash2, User, Shield } from 'lucide-react';

interface AdminUser {
    id: string;
    full_name: string;
    email: string;
    role: string;
    department: string;
    is_active: boolean;
    created_at: string;
}

const mockUsers: AdminUser[] = [
    { id: '1', full_name: 'Admin User', email: 'admin@company.com', role: 'admin', department: 'IT', is_active: true, created_at: '2026-07-01' },
    { id: '2', full_name: 'Sarah Johnson', email: 'hr@company.com', role: 'hr', department: 'Human Resources', is_active: true, created_at: '2026-07-05' },
    { id: '3', full_name: 'Raj Patel', email: 'raj.patel@company.com', role: 'hr', department: 'Engineering', is_active: true, created_at: '2026-07-10' },
];

export default function AdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'hr', department: '' });

    useEffect(() => {
        getAdminUsers()
            .then(r => setUsers(r.data || mockUsers))
            .catch(() => setUsers(mockUsers))
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        try {
            const res = await createAdminUser(form as Record<string, unknown>);
            setUsers(prev => [...prev, res.data]);
            setShowModal(false);
            setForm({ full_name: '', email: '', password: '', role: 'hr', department: '' });
        } catch {
            alert('Error creating user');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this user?')) return;
        try {
            await deleteAdminUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch { alert('Error deleting user'); }
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>HR Users</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{users.length} registered users</div>
                </div>
                <button className="btn-accent" onClick={() => setShowModal(true)}><Plus size={15} /> Add User</button>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
                {users.map((u, i) => (
                    <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="stat-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                            background: u.role === 'admin' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18,
                        }}>{u.full_name?.[0] || u.email[0].toUpperCase()}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{u.full_name || 'Unnamed User'}</div>
                            <div style={{ fontSize: 13, color: '#64748b' }}>{u.email} • {u.department}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className={u.role === 'admin' ? 'badge badge-warning' : 'badge badge-info'}>
                                {u.role === 'admin' ? <><Shield size={11} /> Admin</> : <><User size={11} /> HR</>}
                            </span>
                            <span className={u.is_active ? 'badge badge-success' : 'badge badge-danger'}>
                                {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {u.role !== 'admin' && (
                                <button onClick={() => handleDelete(u.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}>
                                    <Trash2 size={14} color="#ef4444" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 24 }}>Create HR User</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[
                                { key: 'full_name', label: 'Full Name', type: 'text', ph: 'Jane Smith' },
                                { key: 'email', label: 'Email', type: 'email', ph: 'jane@company.com' },
                                { key: 'password', label: 'Password', type: 'password', ph: '••••••••' },
                                { key: 'department', label: 'Department', type: 'text', ph: 'Engineering' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
                                    <input type={f.type} className="form-input" placeholder={f.ph}
                                        value={(form as Record<string, string>)[f.key]}
                                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                </div>
                            ))}
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Role</label>
                                <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                                    <option value="hr">HR Recruiter</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn-accent" onClick={handleCreate}>Create User</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
