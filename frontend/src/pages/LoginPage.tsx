import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/hr');
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { detail?: string } } };
            setError(axiosErr?.response?.data?.detail || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (role: 'admin' | 'hr') => {
        setEmail(role === 'admin' ? 'admin@company.com' : 'hr@company.com');
        setPassword('password123');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f2744 100%)',
        }}>
            {/* Left panel - brand */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '60px',
                color: 'white',
            }} className="hidden lg:flex">
                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 24, fontWeight: 900, color: '#0f172a'
                        }}>A</div>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>AntiTalk AI</div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Enterprise Recruitment Platform</div>
                        </div>
                    </div>

                    <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-1px' }}>
                        AI-Powered<br />
                        <span style={{ color: '#00f2fe' }}>Candidate Screening</span><br />
                        at Scale
                    </h1>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: 400 }}>
                        Screen candidates with AI voice agents. Get instant candidate intelligence scores, transcripts, and verified rankings.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 48 }}>
                        {[
                            { icon: '🎯', text: 'AI Voice Pre-Screening (Local Ollama)' },
                            { icon: '📊', text: 'Real-time Candidate Intelligence Scores' },
                            { icon: '⚡', text: 'Twilio WhatsApp & Scheduling Funnel' },
                        ].map((item) => (
                            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.85)' }}>
                                <span style={{ fontSize: 20 }}>{item.icon}</span>
                                <span style={{ fontSize: 15 }}>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Right panel - login form */}
            <div style={{
                width: '100%',
                maxWidth: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 40px',
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ width: '100%', maxWidth: 400 }}
                >
                    {/* Logo for mobile */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, fontWeight: 900, color: '#0f172a'
                        }}>A</div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>AntiTalk AI</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Unified Platform</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>Welcome back</h2>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Sign in to access all platform features</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: 10, padding: '12px 16px',
                                color: '#fca5a5', fontSize: 14, marginBottom: 20
                            }}
                        >
                            ⚠️ {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 8 }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                required
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1.5px solid rgba(255,255,255,0.15)',
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: 8,
                                    width: '100%'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 8 }}>
                                Password
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1.5px solid rgba(255,255,255,0.15)',
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: 8,
                                    width: '100%'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ accentColor: '#00f2fe' }} />
                                Remember me
                            </label>
                            <a href="#" style={{ fontSize: 13, color: '#00f2fe', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: loading ? 'rgba(0,242,254,0.5)' : 'linear-gradient(135deg, #00f2fe, #4facfe)',
                                color: '#0f172a', padding: '14px', borderRadius: 10,
                                fontWeight: 800, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                transition: 'all 0.2s',
                            }}
                        >
                            {loading ? 'Signing in...' : '→  Sign In to Platform'}
                        </button>
                    </form>

                    {/* Quick Login */}
                    <div style={{
                        marginTop: 32, padding: 20, borderRadius: 12,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.08em' }}>
                            Quick One-Click Demo Access
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                            {[
                                { label: 'Admin Access', email: 'admin@company.com', role: 'admin' as const },
                                { label: 'HR Recruiter Access', email: 'hr@company.com', role: 'hr' as const },
                            ].map((demo) => (
                                <button
                                    key={demo.role}
                                    onClick={() => fillDemo(demo.role)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 14px', borderRadius: 8,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer', color: 'rgba(255,255,255,0.85)', fontSize: 13,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <span style={{ fontWeight: 600 }}>{demo.label}</span>
                                    <code style={{ fontSize: 11, color: '#00f2fe', background: 'rgba(0,242,254,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                                        {demo.email}
                                    </code>
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Default password: <code style={{ color: '#00f2fe' }}>password123</code></p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
