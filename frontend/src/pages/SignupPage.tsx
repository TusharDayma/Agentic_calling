import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SignupPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/signup`, {
                username: email,
                password: password
            });
            setSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { detail?: string } } };
            setError(axiosErr?.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
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
                        Join the Future of<br />
                        <span style={{ color: '#00f2fe' }}>Automated Screening</span>
                    </h1>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: 400 }}>
                        Create your HR account today to start building AI voice campaigns and evaluating candidates at scale.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 48 }}>
                        {[
                            { icon: '🚀', text: 'Launch Campaigns Instantly' },
                            { icon: '🤖', text: 'AI-Powered Interviewing' },
                            { icon: '📈', text: 'Data-Driven Candidate Ranking' },
                        ].map((item) => (
                            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.85)' }}>
                                <span style={{ fontSize: 20 }}>{item.icon}</span>
                                <span style={{ fontSize: 15 }}>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Right panel - signup form */}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }} className="lg:hidden">
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
                        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>Create Account</h2>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Register as an HR Recruiter</p>
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

                    {success && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: 10, padding: '12px 16px',
                                color: '#6ee7b7', fontSize: 14, marginBottom: 20
                            }}
                        >
                            ✓ {success}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 8 }}>
                                Email Address (Username)
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
                                placeholder="Min 8 characters"
                                required
                                minLength={8}
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
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                required
                                minLength={8}
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

                        <button
                            type="submit"
                            disabled={loading || !!success}
                            style={{
                                background: (loading || !!success) ? 'rgba(0,242,254,0.5)' : 'linear-gradient(135deg, #00f2fe, #4facfe)',
                                color: '#0f172a', padding: '14px', borderRadius: 10,
                                fontWeight: 800, fontSize: 15, border: 'none', cursor: (loading || !!success) ? 'not-allowed' : 'pointer',
                                marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                transition: 'all 0.2s',
                            }}
                        >
                            {loading ? 'Creating Account...' : '→  Sign Up'}
                        </button>
                    </form>

                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                            Already have an account?{' '}
                            <button
                                onClick={() => navigate('/login')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#00f2fe',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: 0,
                                    fontSize: 14,
                                    textDecoration: 'underline'
                                }}
                            >
                                Sign in here
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
