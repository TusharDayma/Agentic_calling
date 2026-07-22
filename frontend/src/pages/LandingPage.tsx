import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", background: '#05071a', color: 'white', minHeight: '100vh' }}>

            {/* Navigation */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 40px', height: 64,
                background: 'rgba(5,7,26,0.85)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, color: '#05071a', fontSize: 18,
                    }}>A</div>
                    <span style={{ fontWeight: 800, fontSize: 20, color: 'white', letterSpacing: '-0.01em' }}>AntiTalk</span>
                </div>

                <div style={{ display: 'flex', gap: 32, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                    <a href="#rankings" style={{ textDecoration: 'none', color: 'inherit' }}>Live Rankings</a>
                    <a href="#how-it-works" style={{ textDecoration: 'none', color: 'inherit' }}>How It Works</a>
                    <a href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>Admin Portal</a>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)',
                            cursor: 'pointer', fontSize: 14, fontWeight: 500, padding: '8px 16px',
                        }}
                    >Sign In</button>
                    <button
                        onClick={() => navigate('/hr')}
                        style={{
                            background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                            border: 'none', color: '#05071a',
                            padding: '9px 20px', borderRadius: 8,
                            cursor: 'pointer', fontSize: 14, fontWeight: 700,
                            boxShadow: '0 0 20px rgba(0,242,254,0.3)',
                        }}
                    >Launch Platform →</button>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                textAlign: 'center',
                padding: '80px 24px 40px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse 70% 50% at 50% 20%, rgba(0,242,254,0.12) 0%, transparent 70%)',
                }} />

                <div style={{ display: 'inline-flex', marginBottom: 24 }}>
                    <span style={{
                        background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.3)',
                        color: '#00f2fe', padding: '6px 18px', borderRadius: 999,
                        fontSize: 13, fontWeight: 600, letterSpacing: '0.05em',
                    }}>LOCAL OLLAMA + TWILIO TELEPHONY ENGINE</span>
                </div>

                <h1 style={{
                    fontSize: 'clamp(40px, 6vw, 72px)',
                    fontWeight: 900, lineHeight: 1.05,
                    letterSpacing: '-0.03em', margin: '0 auto 24px',
                    maxWidth: 900,
                }}>
                    Enterprise AI Screening & <span style={{ color: '#00f2fe' }}>Candidate Rankings</span>
                </h1>

                <p style={{
                    fontSize: 18, color: 'rgba(255,255,255,0.7)',
                    maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7,
                }}>
                    Automate WhatsApp outreach, candidate scheduling, and real-time voice pre-screening. Powered by local Ollama AI intelligence.
                </p>

                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
                    <button
                        onClick={() => navigate('/hr')}
                        style={{
                            background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                            border: 'none', color: '#05071a',
                            padding: '14px 32px', borderRadius: 10,
                            fontSize: 15, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 0 30px rgba(0,242,254,0.4)',
                        }}
                    >
                        Go to Dashboard →
                    </button>
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)', color: 'white',
                            padding: '14px 32px', borderRadius: 10,
                            fontSize: 15, fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        Open V1 AI Screener
                    </button>
                </div>
            </section>

            {/* Features / How It Works Section */}
            <section id="how-it-works" style={{ padding: '60px 40px 100px', maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 60 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#00f2fe', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                        Platform Features
                    </div>
                    <h2 style={{ fontSize: 36, fontWeight: 800 }}>How AntiTalk Works</h2>
                    <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 700, margin: '16px auto 0' }}>
                        A seamless, automated pipeline designed to evaluate candidates efficiently, consistently, and without human bias.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 32
                }}>
                    <div style={{
                        background: 'rgba(17, 24, 39, 0.7)', backdropFilter: 'blur(16px)',
                        borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#fff' }}>1. Automated Outreach</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                            Candidates receive automated WhatsApp invitations with a secure, self-service link to schedule their technical screening at their convenience.
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(17, 24, 39, 0.7)', backdropFilter: 'blur(16px)',
                        borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#fff' }}>2. Real-Time AI Voice Call</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                            A localized LLM (Llama 3) dynamically interviews the candidate over a secure WebSocket audio stream, evaluating responses and asking follow-up questions.
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(17, 24, 39, 0.7)', backdropFilter: 'blur(16px)',
                        borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#fff' }}>3. Advanced Evaluation</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                            Post-call, our AI generates a comprehensive dossier with a standardized Intelligence Score (0-100) and detailed technical justifications for easy review.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                padding: '24px 40px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 13, color: 'rgba(255,255,255,0.4)',
            }}>
                <span style={{ fontWeight: 700, color: '#00f2fe' }}>AntiTalk AI Platform</span>
                <span>© 2026 AntiTalk Technologies. All rights reserved.</span>
            </footer>
        </div>
    );
}
