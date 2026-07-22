import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { getCandidateDetail } from '../../api/client';
import { CandidateDetail } from '../../types';
import { ArrowLeft, Phone, Mail, MapPin, Briefcase, Star, Play, Pause } from 'lucide-react';

function getRecStyle(rec: string) {
    if (rec === 'strongly_recommended') return { bg: '#d1fae5', color: '#065f46', label: '⭐ Strongly Recommended' };
    if (rec === 'recommended') return { bg: '#dbeafe', color: '#1e40af', label: '✓ Recommended' };
    if (rec === 'average') return { bg: '#fef3c7', color: '#92400e', label: '~ Average' };
    return { bg: '#fee2e2', color: '#991b1b', label: '✗ Not Recommended' };
}

const mockDetail: CandidateDetail = {
    candidate: {
        id: 'c1', first_name: 'Aarav', last_name: 'Sharma',
        email: 'aarav.sharma@gmail.com', phone_number: '+919876543210',
        city: 'Bangalore', experience_years: 6, current_company: 'Infosys',
    },
    call_log: {
        status: 'completed',
        start_time: '2026-07-19T10:32:00Z',
        end_time: '2026-07-19T10:48:00Z',
        duration_seconds: 967,
        recording_url: '#',
        raw_transcript: `AI: Hello, am I speaking with Aarav Sharma?
Aarav: Yes, this is Aarav speaking.
AI: Great! I'm an AI assistant calling on behalf of the recruitment team for the Senior Software Engineer position. Do you have about 15 minutes for a quick screening call?
Aarav: Sure, absolutely.
AI: Could you start by introducing yourself and telling me about your current role?
Aarav: I'm currently working as a Senior Software Engineer at Infosys in Bangalore. I've been there for about three years. I have six years of experience mainly in backend development using Python and Java, along with some React on the frontend.
AI: What is your current notice period?
Aarav: I have a 60-day notice period, but I can negotiate it down to 30 days if needed.
AI: What are your salary expectations?
Aarav: I'm currently at 18 LPA and looking for something in the 24 to 28 LPA range.
AI: Are you open to relocation if required?
Aarav: Yes, absolutely. I'm open to relocating within India or even internationally.
AI: Thank you so much for your time today, Aarav. Our recruiter will review your profile and get back to you shortly. Have a great day!
Aarav: Thank you! Looking forward to it.`,
    },
    evaluation: {
        candidate_intelligence_score: 92.3,
        jd_fit_score: 94.1,
        technical_score: 91.0,
        confidence_score: 88.5,
        fluency_score: 93.2,
        grammar_score: 89.0,
        vocabulary_score: 87.5,
        communication_score: 91.5,
        recommendation: 'strongly_recommended',
        ai_generated_summary: 'Aarav Sharma is an outstanding candidate for the Senior Software Engineer role. With 6 years of hands-on backend experience at Infosys and TechNova, he demonstrates deep technical expertise in Python, Java, and React. His leadership of a monolith-to-microservices migration at scale, combined with AWS certification and Kubernetes proficiency, directly aligns with the role requirements. His communication style is confident, articulate, and structured. He shows excellent salary alignment (24–28 LPA) and flexibility on notice period (down to 30 days). Strongly recommended for the next interview round.',
        feedback_details: {
            strengths: [
                'Led large-scale microservices migration with measurable impact (45% latency reduction)',
                'AWS Certified with hands-on Kafka, Kubernetes, and Lambda experience',
                'Clear, confident communication with excellent vocabulary and fluency',
                'Open to relocation — high flexibility',
            ],
            weaknesses: [
                '60-day notice period (though negotiable to 30 days)',
                'Higher than average salary expectation (+$15k vs range)',
            ],
            questions_answered: 8,
            consent_given: true,
        },
        extracted_salary_expectation: '24-28 LPA',
        extracted_notice_period: '60 days (negotiable to 30)',
        extracted_years_of_experience: 6,
    },
};

// Simulated waveform bars
function Waveform() {
    const bars = Array.from({ length: 48 }, (_, i) =>
        Math.sin(i * 0.4) * 0.4 + Math.random() * 0.6 + 0.2
    );
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 36, flex: 1 }}>
            {bars.map((h, i) => (
                <div key={i} style={{
                    width: 3, borderRadius: 2,
                    height: `${h * 100}%`,
                    background: i < 20 ? '#1e3a5f' : '#cbd5e1',
                    opacity: 0.8,
                }} />
            ))}
        </div>
    );
}

export default function HRCandidateDetail() {
    const { evalId } = useParams<{ evalId: string }>();
    const navigate = useNavigate();
    const [detail, setDetail] = useState<CandidateDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        if (!evalId) return;
        getCandidateDetail(evalId)
            .then(r => setDetail(r.data))
            .catch(() => setDetail(mockDetail))
            .finally(() => setLoading(false));
    }, [evalId]);

    const d = detail || mockDetail;
    const { candidate, call_log, evaluation } = d;
    const rec = getRecStyle(evaluation.recommendation);

    const durationMin = call_log.duration_seconds ? Math.floor(call_log.duration_seconds / 60) : 18;
    const durationSec = call_log.duration_seconds ? call_log.duration_seconds % 60 : 45;
    const durationStr = `${String(durationMin).padStart(2, '0')}:${String(durationSec).padStart(2, '0')}`;

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><div className="spinner" /></div>;

    return (
        <motion.div className="fade-in" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Back button */}
            <button onClick={() => navigate(-1)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#f1f5f9', border: 'none', borderRadius: 8,
                padding: '8px 16px', cursor: 'pointer', marginBottom: 24,
                color: '#64748b', fontSize: 13, fontWeight: 600,
            }}>
                <ArrowLeft size={16} /> Back to Candidates
            </button>

            {/* Split layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>

                {/* LEFT: Candidate Profile Card */}
                <div className="stat-card" style={{ padding: 24 }}>
                    {/* Avatar */}
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 900, color: 'white', fontSize: 26, margin: '0 auto 12px',
                        }}>
                            {candidate.first_name[0]}{candidate.last_name[0]}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>
                            {candidate.first_name} {candidate.last_name}
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                            {candidate.current_company}
                        </div>
                    </div>

                    {/* CIS Score Badge */}
                    <div style={{
                        textAlign: 'center', padding: '14px 0', marginBottom: 20,
                        background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                        borderRadius: 12, border: '1px solid #bbf7d0',
                    }}>
                        <div style={{ fontSize: 40, fontWeight: 900, color: '#065f46', lineHeight: 1 }}>
                            {evaluation.candidate_intelligence_score.toFixed(0)}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.05em', marginTop: 4 }}>AI SCORE</div>
                    </div>

                    {/* Recommendation badge */}
                    <div style={{
                        background: rec.bg, color: rec.color,
                        padding: '8px 12px', borderRadius: 8,
                        fontSize: 13, fontWeight: 700, textAlign: 'center', marginBottom: 20,
                    }}>
                        {rec.label}
                    </div>

                    {/* Quick info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                            { icon: Mail, val: candidate.email },
                            { icon: Phone, val: candidate.phone_number },
                            { icon: MapPin, val: candidate.city },
                            { icon: Briefcase, val: `${candidate.experience_years} yrs exp` },
                            { icon: Star, val: candidate.current_company },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b' }}>
                                <item.icon size={14} color="#94a3b8" />
                                <span style={{ wordBreak: 'break-all' }}>{item.val}</span>
                            </div>
                        ))}
                    </div>

                    {/* Extracted parameters */}
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                        {[
                            { label: 'Notice Period', val: evaluation.extracted_notice_period },
                            { label: 'Salary Ask', val: evaluation.extracted_salary_expectation },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                                <span style={{ color: '#94a3b8' }}>{item.label}</span>
                                <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Recording + AI Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Recording Player */}
                    <div className="stat-card" style={{ padding: 24 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>
                            Interview Recording
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button
                                onClick={() => setPlaying(p => !p)}
                                style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: '#1e3a5f',
                                    border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, boxShadow: '0 4px 12px rgba(30,58,95,0.3)',
                                }}
                            >
                                {playing
                                    ? <Pause size={20} color="white" />
                                    : <Play size={20} color="white" style={{ marginLeft: 2 }} />
                                }
                            </button>
                            <Waveform />
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                                04:22 / {durationStr}
                            </div>
                        </div>
                    </div>

                    {/* AI Justification Summary */}
                    <div className="stat-card" style={{ padding: 24 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>
                            ✦ AI Justification Summary
                        </div>
                        <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, marginBottom: 20 }}>
                            {evaluation.ai_generated_summary}
                        </p>

                        {/* Strengths */}
                        <div style={{ marginBottom: 12 }}>
                            {evaluation.feedback_details?.strengths?.map((s, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                                    <span style={{ fontSize: 13, color: '#334155' }}>{s}</span>
                                </div>
                            ))}
                        </div>

                        {/* Weaknesses / Cautions */}
                        {evaluation.feedback_details?.weaknesses?.map((w, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 14, marginTop: 1, flexShrink: 0 }}>▲</span>
                                <span style={{ fontSize: 13, color: '#64748b' }}>{w}</span>
                            </div>
                        ))}
                    </div>

                    {/* Transcript (collapsed) */}
                    <details>
                        <summary style={{
                            cursor: 'pointer', padding: '12px 20px',
                            background: '#f8fafc', borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            fontSize: 13, fontWeight: 600, color: '#64748b',
                            listStyle: 'none', userSelect: 'none',
                        }}>
                            📝 View Full Transcript
                        </summary>
                        <div className="stat-card" style={{ padding: 24, marginTop: 8, maxHeight: 400, overflowY: 'auto' }}>
                            {call_log.raw_transcript?.split('\n').map((line, i) => {
                                const isAI = line.startsWith('AI:');
                                if (!line.trim()) return null;
                                return (
                                    <div key={i} style={{ marginBottom: 8, padding: '6px 10px', borderRadius: 6, background: isAI ? '#f0f4f8' : '#f0fdf4' }}>
                                        <span style={{ fontWeight: 700, color: isAI ? '#1e3a5f' : '#065f46', fontSize: 12 }}>
                                            {isAI ? '🤖 AI' : '👤 Candidate'}:
                                        </span>
                                        <span style={{ fontFamily: 'Inter, sans-serif', marginLeft: 8, color: '#334155', fontSize: 13 }}>
                                            {line.replace(/^(AI:|[^:]+):/, '').trim()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </details>
                </div>
            </div>
        </motion.div>
    );
}
