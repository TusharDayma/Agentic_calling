import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, LogOut, Menu, Bell
} from 'lucide-react';

const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
            {/* Sidebar */}
            <aside style={{
                width: 260, minHeight: '100vh', flexShrink: 0,
                background: 'linear-gradient(180deg, #1e3a5f 0%, #0d2137 100%)',
                display: 'flex', flexDirection: 'column',
                position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50,
                transition: 'transform 0.3s ease',
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-260px)',
                overflowY: 'auto',
            }}>
                {/* Logo */}
                <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 900, color: 'white', fontSize: 18, flexShrink: 0,
                        }}>A</div>
                        <div>
                            <div style={{ fontWeight: 800, color: 'white', fontSize: 16 }}>AntiTalk</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>Admin Console</div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ padding: '16px 12px', flex: 1 }}>
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 14px', borderRadius: 10,
                                margin: '2px 0', textDecoration: 'none',
                                color: isActive ? '#34d399' : 'rgba(255,255,255,0.7)',
                                background: isActive ? 'rgba(16,185,129,0.12)' : 'transparent',
                                borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                                fontWeight: isActive ? 600 : 500, fontSize: 14,
                                transition: 'all 0.2s',
                            })}
                        >
                            <item.icon size={17} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User profile */}
                <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 700, fontSize: 14,
                        }}>{user?.full_name?.[0] || 'A'}</div>
                        <div>
                            <div style={{ fontWeight: 600, color: 'white', fontSize: 13 }}>{user?.full_name || user?.email}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Administrator</div>
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

            {/* Main content */}
            <div style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Top bar */}
                <div style={{
                    height: 64, background: 'white', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 28px', position: 'sticky', top: 0, zIndex: 40,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                            <Menu size={20} />
                        </button>
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>
                            Admin <span style={{ margin: '0 6px' }}>/</span>
                            <span style={{ color: '#1e293b', fontWeight: 600 }}>Console</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button style={{
                            background: '#f1f5f9', border: 'none', borderRadius: 8,
                            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        }}>
                            <Bell size={16} color="#64748b" />
                        </button>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 700, fontSize: 14,
                        }}>{user?.full_name?.[0] || 'A'}</div>
                    </div>
                </div>

                {/* Page content */}
                <div style={{ padding: 28, flex: 1 }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
