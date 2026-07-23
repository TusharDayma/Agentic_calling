import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Plus, List, Users, BarChart3,
    FileText, PhoneCall, Shield, Settings, LogOut, Bell, Menu
} from 'lucide-react';

const navItems = [
    { to: '/hr', icon: LayoutDashboard, label: 'Overview Dashboard', end: true, roles: ['hr', 'admin'] },
    { to: '/hr/campaigns/new', icon: Plus, label: 'Create Campaign', roles: ['hr'] },
    { to: '/hr/campaigns', icon: List, label: 'All Campaigns', roles: ['hr'] },
    { to: '/hr/candidates', icon: Users, label: 'Candidate Dossiers', roles: ['hr'] },
    { to: '/hr/analytics', icon: BarChart3, label: 'Analytics & Leaderboard', roles: ['hr', 'admin'] },
    { to: '/hr/reports', icon: FileText, label: 'Evaluation Reports', roles: ['hr', 'admin'] },
    { to: '/admin/roles', icon: Shield, label: 'Job Roles & Question Sets', roles: ['admin'] },
    { to: '/admin/users', icon: Settings, label: 'Team & System Settings', roles: ['admin'] },
];

export default function HRLayout() {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <aside style={{
                width: 270, minHeight: '100vh', flexShrink: 0,
                background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
                display: 'flex', flexDirection: 'column',
                position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50,
                transition: 'transform 0.3s ease',
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-270px)',
                overflowY: 'auto',
                borderRight: '1px solid rgba(255,255,255,0.08)'
            }}>
                {/* Logo */}
                <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 900, color: '#0f172a', fontSize: 18, flexShrink: 0,
                        }}>A</div>
                        <div>
                            <div style={{ fontWeight: 800, color: 'white', fontSize: 16 }}>AntiTalk AI</div>
                            <div style={{ fontSize: 11, color: '#00f2fe', marginTop: 1 }}>Unified Talent Screener</div>
                        </div>
                    </div>
                </div>

                {/* V1 Screener Fast Link */}
                <div style={{ padding: '16px 16px 8px' }}>
                    <a
                        href="/dashboard"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', borderRadius: 8,
                            background: 'linear-gradient(135deg, rgba(0,242,254,0.15), rgba(79,70,229,0.15))',
                            border: '1px solid rgba(0,242,254,0.3)',
                            color: '#00f2fe', textDecoration: 'none',
                            fontSize: 13, fontWeight: 700,
                        }}
                    >
                        <PhoneCall size={16} /> Open V1 AI Screener →
                    </a>
                </div>

                <nav style={{ padding: '8px 12px', flex: 1 }}>
                    {navItems.filter(item => item.roles.includes(user?.role || 'hr')).map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 14px', borderRadius: 10,
                                margin: '3px 0', textDecoration: 'none',
                                color: isActive ? '#00f2fe' : 'rgba(255,255,255,0.7)',
                                background: isActive ? 'rgba(0,242,254,0.1)' : 'transparent',
                                borderLeft: isActive ? '3px solid #00f2fe' : '3px solid transparent',
                                fontWeight: isActive ? 600 : 500, fontSize: 13.5,
                                transition: 'all 0.2s',
                            })}
                        >
                            <item.icon size={17} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#0f172a', fontWeight: 800, fontSize: 14,
                        }}>{user?.full_name?.[0] || 'U'}</div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, color: 'white', fontSize: 13, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.full_name || 'Active User'}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user?.username || 'Recruiter'}</div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            width: '100%', padding: '9px 14px', borderRadius: 8,
                            background: 'rgba(239,68,68,0.12)', color: '#fca5a5',
                            border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                            fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                        }}
                    >
                        <LogOut size={15} /> Sign Out
                    </button>
                </div>
            </aside>

            <div style={{ marginLeft: sidebarOpen ? 270 : 0, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin 0.3s ease' }}>
                <div style={{
                    height: 64, background: 'white', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 28px', position: 'sticky', top: 0, zIndex: 40,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                            <Menu size={20} />
                        </button>
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>
                            AntiTalk Platform <span style={{ margin: '0 6px' }}>/</span>
                            <span style={{ color: '#0f172a', fontWeight: 600 }}>Unified Screener</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <a
                            href="/dashboard"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                                background: '#0f172a', color: '#00f2fe', textDecoration: 'none'
                            }}
                        >
                            ⚡ Launch AI Call Screener
                        </a>
                        <button style={{
                            background: '#f1f5f9', border: 'none', borderRadius: 8,
                            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        }}>
                            <Bell size={16} color="#64748b" />
                        </button>
                    </div>
                </div>
                <div style={{ padding: 28, flex: 1 }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
