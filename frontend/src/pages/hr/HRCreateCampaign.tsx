import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createCampaign, uploadCandidatesCSV } from '../../api/client';
import { Check, Upload, ChevronRight, ChevronLeft, UserPlus, Trash2 } from 'lucide-react';

const defaultQuestions = [
    { question_text: 'Can you briefly introduce yourself and walk me through your professional background?', category: 'Introduction', expected_answer: 'Candidate should provide a clear summary of their experience.', difficulty: 'Easy', type: 'long_answer' },
    { question_text: 'Why are you interested in this role and our company?', category: 'Behavioral', expected_answer: 'Should mention alignment with company goals and role requirements.', difficulty: 'Easy', type: 'long_answer' },
    { question_text: 'What is your current notice period?', category: 'Logistics', expected_answer: 'State time in weeks or months.', difficulty: 'Easy', type: 'short_answer' },
    { question_text: 'What are your salary expectations?', category: 'Logistics', expected_answer: 'State numerical value or range.', difficulty: 'Easy', type: 'short_answer' },
    { question_text: 'Are you open to relocation if required?', category: 'Logistics', expected_answer: 'Yes or No.', difficulty: 'Easy', type: 'yes_no' },
];

const steps = [
    { num: 1, label: 'Campaign Details' },
    { num: 2, label: 'Candidate Input / CSV' },
    { num: 3, label: 'Question Set' },
    { num: 4, label: 'Launch' },
];

interface ManualCandidate {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    city?: string;
    experience_years?: string;
    current_company?: string;
}

function StepIndicator({ current }: { current: number }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
            {steps.map((step, i) => (
                <React.Fragment key={step.num}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: step.num < current ? '#10b981' : step.num === current ? '#1e3a5f' : '#e2e8f0',
                            color: step.num <= current ? 'white' : '#94a3b8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 14, transition: 'all 0.3s',
                        }}>
                            {step.num < current ? <Check size={16} /> : step.num}
                        </div>
                        <span style={{ fontSize: 11, color: step.num === current ? '#1e3a5f' : '#94a3b8', fontWeight: step.num === current ? 700 : 500, whiteSpace: 'nowrap' }}>
                            {step.label}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: step.num < current ? '#10b981' : '#e2e8f0', margin: '0 8px', marginBottom: 22, transition: 'all 0.3s' }} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

export default function HRCreateCampaign() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [campaignId, setCampaignId] = useState<string | null>(null);

    // Candidate step state
    const [candidateInputMode, setCandidateInputMode] = useState<'csv' | 'manual'>('csv');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvDrag, setCsvDrag] = useState(false);

    // Manual candidates state
    const [manualCandidates, setManualCandidates] = useState<ManualCandidate[]>([]);
    const [newCand, setNewCand] = useState<ManualCandidate>({
        first_name: '', last_name: '', email: '', phone_number: '', city: '', experience_years: '', current_company: ''
    });

    // Question set state
    const [questionCsvDrag, setQuestionCsvDrag] = useState(false);
    const [questionInputMode, setQuestionInputMode] = useState<'list' | 'text'>('list');
    const [questionText, setQuestionText] = useState('');

    const [form, setForm] = useState({
        title: '', department: '', hiring_manager: '', hiring_location: '',
        experience_required: '3-5 years',
        question_set: defaultQuestions,
    });

    const update = (key: string, val: unknown) => setForm(p => ({ ...p, [key]: val }));

    const handleAddManualCandidate = () => {
        if (!newCand.first_name || !newCand.phone_number) {
            return alert('First Name and Phone Number are required.');
        }
        setManualCandidates(prev => [...prev, { ...newCand }]);
        setNewCand({ first_name: '', last_name: '', email: '', phone_number: '', city: '', experience_years: '', current_company: '' });
    };

    const handleRemoveManualCandidate = (idx: number) => {
        setManualCandidates(prev => prev.filter((_, i) => i !== idx));
    };

    // Helper to generate File from manual candidates list
    const generateCSVFileFromManual = (): File => {
        const header = "first_name,last_name,email,phone_number,city,experience_years,current_company\n";
        const rows = manualCandidates.map(c =>
            `"${c.first_name}","${c.last_name}","${c.email}","${c.phone_number}","${c.city || ''}","${c.experience_years || ''}","${c.current_company || ''}"`
        ).join("\n");
        const blob = new Blob([header + rows], { type: 'text/csv' });
        return new File([blob], 'manual_candidates.csv', { type: 'text/csv' });
    };

    const parseQuestionCsv = (text: string) => {
        const lines = text.trim().split('\n').filter(l => l.trim());
        const parsed = lines
            .slice(1)
            .map(l => {
                const parts = l.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                if (parts.length >= 1 && parts[0]) {
                    return {
                        text: parts[0] || '',
                        category: parts[1] || 'General',
                        type: parts[2] || 'long_answer',
                    };
                }
                return null;
            })
            .filter(Boolean) as typeof defaultQuestions;
        if (parsed.length > 0) {
            update('question_set', parsed);
        }
    };

    const handleQuestionCsvDrop = async (e: React.DragEvent) => {
        e.preventDefault(); setQuestionCsvDrag(false);
        const file = e.dataTransfer.files[0];
        if (file?.name.endsWith('.csv')) {
            const text = await file.text();
            parseQuestionCsv(text);
        }
    };

    const handleNext = async () => {
        if (step === 1) {
            if (!form.title || !form.department) return alert('Campaign title and department are required');
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        } else if (step === 3) {
            // Questions are updated dynamically in the form array
            setLoading(true);
            try {
                const res = await createCampaign({
                    title: form.title,
                    department: form.department,
                    hiring_manager: form.hiring_manager,
                    hiring_location: form.hiring_location,
                    experience_required: form.experience_required,
                    question_set: form.question_set,
                    job_description: '',
                    accent: 'en-IN',
                    max_retries: 3,
                    retry_delay_minutes: 120,
                    parallel_calls: 5,
                    calling_window_start: '09:00',
                    calling_window_end: '18:00',
                    voice_speed: '1.0',
                });
                setCampaignId(res.data.id);

                // Upload candidates (either from CSV file or manual input)
                let uploadFile = csvFile;
                if (candidateInputMode === 'manual' && manualCandidates.length > 0) {
                    uploadFile = generateCSVFileFromManual();
                }

                if (uploadFile && res.data.id) {
                    await uploadCandidatesCSV(res.data.id, uploadFile);
                }
                setStep(4);
            } catch (e: unknown) {
                const err = e as { response?: { data?: { detail?: string } } };
                alert(err?.response?.data?.detail || 'Error creating campaign. Check all fields and try again.');
            } finally {
                setLoading(false);
            }
        } else if (step === 4) {
            navigate('/hr/campaigns');
        }
    };

    const handlePrev = () => setStep(s => Math.max(1, s - 1));

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setCsvDrag(false);
        const file = e.dataTransfer.files[0];
        if (file?.name.endsWith('.csv')) setCsvFile(file);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Create New Campaign</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Set up an AI pre-screening campaign in 4 steps</div>
                </div>
            </div>

            <div style={{ maxWidth: 860, margin: '0 auto' }}>
                <div className="stat-card" style={{ padding: 36 }}>
                    <StepIndicator current={step} />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                        >
                            {/* Step 1: Campaign Details */}
                            {step === 1 && (
                                <div>
                                    <h3 style={{ fontWeight: 700, fontSize: 19, marginBottom: 24, color: '#1e293b' }}>Campaign Details</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        {[
                                            { key: 'title', label: 'Campaign Title *', placeholder: 'e.g. Senior SWE Batch July 2026' },
                                            { key: 'department', label: 'Department *', placeholder: 'e.g. Engineering' },
                                            { key: 'hiring_manager', label: 'Hiring Manager', placeholder: 'e.g. Alex Morgan' },
                                            { key: 'hiring_location', label: 'Hiring Location', placeholder: 'e.g. Bangalore, India' },
                                            { key: 'experience_required', label: 'Experience Required', placeholder: 'e.g. 3-5 years' },
                                        ].map(field => (
                                            <div key={field.key} style={{ gridColumn: field.key === 'title' ? '1 / -1' : 'auto' }}>
                                                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{field.label}</label>
                                                <input
                                                    className="form-input"
                                                    value={(form as Record<string, unknown>)[field.key] as string || ''}
                                                    onChange={e => update(field.key, e.target.value)}
                                                    placeholder={field.placeholder}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Candidates Input (CSV or Manual) */}
                            {step === 2 && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <div>
                                            <h3 style={{ fontWeight: 700, fontSize: 19, color: '#1e293b' }}>Candidate Input</h3>
                                            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                                                Add candidates via CSV upload or manual entry below.
                                            </p>
                                        </div>

                                        {/* Toggle candidate input mode */}
                                        <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
                                            <button
                                                type="button"
                                                onClick={() => setCandidateInputMode('csv')}
                                                style={{
                                                    padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                                    fontWeight: 600, fontSize: 13,
                                                    background: candidateInputMode === 'csv' ? 'white' : 'transparent',
                                                    boxShadow: candidateInputMode === 'csv' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                                    color: candidateInputMode === 'csv' ? '#0f172a' : '#64748b',
                                                }}
                                            >
                                                📁 CSV Upload
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCandidateInputMode('manual')}
                                                style={{
                                                    padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                                    fontWeight: 600, fontSize: 13,
                                                    background: candidateInputMode === 'manual' ? 'white' : 'transparent',
                                                    boxShadow: candidateInputMode === 'manual' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                                    color: candidateInputMode === 'manual' ? '#0f172a' : '#64748b',
                                                }}
                                            >
                                                ✍️ Manual Input
                                            </button>
                                        </div>
                                    </div>

                                    {candidateInputMode === 'csv' ? (
                                        <div>
                                            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                                                Required columns: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>first_name, last_name, email, phone_number</code>
                                                {' '}Optional: city, experience_years, current_company
                                            </p>

                                            <div
                                                className={`drop-zone ${csvDrag ? 'dragging' : ''}`}
                                                onDragOver={e => { e.preventDefault(); setCsvDrag(true); }}
                                                onDragLeave={() => setCsvDrag(false)}
                                                onDrop={handleDrop}
                                                onClick={() => document.getElementById('csv-input')?.click()}
                                            >
                                                <input
                                                    type="file" id="csv-input" accept=".csv" style={{ display: 'none' }}
                                                    onChange={e => { const f = e.target.files?.[0]; if (f) setCsvFile(f); }}
                                                />
                                                <Upload size={40} color={csvFile ? '#10b981' : '#94a3b8'} style={{ margin: '0 auto 12px' }} />
                                                {csvFile ? (
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: '#10b981', fontSize: 16, marginBottom: 4 }}>✓ {csvFile.name}</div>
                                                        <div style={{ fontSize: 13, color: '#64748b' }}>Click to replace file</div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Drop your candidate CSV file here</div>
                                                        <div style={{ fontSize: 13, color: '#94a3b8' }}>or click to browse files</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Manual Candidate Entry Form */
                                        <div>
                                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <UserPlus size={18} color="#00f2fe" /> Add New Candidate
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                                    <div>
                                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>First Name *</label>
                                                        <input className="form-input" value={newCand.first_name} onChange={e => setNewCand({ ...newCand, first_name: e.target.value })} placeholder="John" />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Last Name</label>
                                                        <input className="form-input" value={newCand.last_name} onChange={e => setNewCand({ ...newCand, last_name: e.target.value })} placeholder="Doe" />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Email Address</label>
                                                        <input className="form-input" type="email" value={newCand.email} onChange={e => setNewCand({ ...newCand, email: e.target.value })} placeholder="john@example.com" />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Phone Number *</label>
                                                        <input className="form-input" value={newCand.phone_number} onChange={e => setNewCand({ ...newCand, phone_number: e.target.value })} placeholder="+15551234567" />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>City / Location</label>
                                                        <input className="form-input" value={newCand.city} onChange={e => setNewCand({ ...newCand, city: e.target.value })} placeholder="New York" />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Experience (Years)</label>
                                                        <input className="form-input" value={newCand.experience_years} onChange={e => setNewCand({ ...newCand, experience_years: e.target.value })} placeholder="4" />
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={handleAddManualCandidate}
                                                    style={{
                                                        marginTop: 16, background: '#0f172a', color: 'white', border: 'none',
                                                        padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                                                    }}
                                                >
                                                    + Add Candidate to Campaign
                                                </button>
                                            </div>

                                            {/* Manual Candidate Table */}
                                            <div style={{ marginTop: 16 }}>
                                                <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 10 }}>
                                                    Added Candidates ({manualCandidates.length})
                                                </div>

                                                {manualCandidates.length === 0 ? (
                                                    <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: 10, color: '#94a3b8', fontSize: 13 }}>
                                                        No candidates added yet. Fill out the form above to add candidates manually.
                                                    </div>
                                                ) : (
                                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                                                            <thead style={{ background: '#f1f5f9', color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>
                                                                <tr>
                                                                    <th style={{ padding: '10px 14px' }}>Name</th>
                                                                    <th style={{ padding: '10px 14px' }}>Phone</th>
                                                                    <th style={{ padding: '10px 14px' }}>Email</th>
                                                                    <th style={{ padding: '10px 14px' }}>Exp</th>
                                                                    <th style={{ padding: '10px 14px', width: 40 }}>Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {manualCandidates.map((c, i) => (
                                                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{c.first_name} {c.last_name}</td>
                                                                        <td style={{ padding: '10px 14px' }}>{c.phone_number}</td>
                                                                        <td style={{ padding: '10px 14px', color: '#64748b' }}>{c.email || '—'}</td>
                                                                        <td style={{ padding: '10px 14px', color: '#64748b' }}>{c.experience_years ? `${c.experience_years} yrs` : '—'}</td>
                                                                        <td style={{ padding: '10px 14px' }}>
                                                                            <button onClick={() => handleRemoveManualCandidate(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        {[
                                            { label: 'Duplicate Detection', desc: 'Skips duplicate emails/phones' },
                                            { label: 'Phone Validation', desc: 'E.164 format validation' },
                                            { label: 'Missing Fields Check', desc: 'Flags rows with empty required fields' },
                                            { label: 'Country Code Support', desc: 'Auto-detects international format' },
                                        ].map(v => (
                                            <div key={v.label} style={{ display: 'flex', gap: 12, padding: 14, background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                                                <span style={{ color: '#10b981', fontWeight: 700, fontSize: 16 }}>✓</span>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 13, color: '#065f46' }}>{v.label}</div>
                                                    <div style={{ fontSize: 12, color: '#6ee7b7', marginTop: 2 }}>{v.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Question Set */}
                            {step === 3 && (
                                <div>
                                    <h3 style={{ fontWeight: 700, fontSize: 19, marginBottom: 8, color: '#1e293b' }}>Structured Interview Questions</h3>
                                    <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
                                        Define the exact questions the AI will ask, along with the criteria the AI will use to evaluate the answers.
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        {form.question_set.map((q, i) => (
                                            <div key={i} style={{
                                                padding: 20, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0',
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                    <div style={{ fontWeight: 700, color: '#334155', fontSize: 15 }}>Question {i + 1}</div>
                                                    <button
                                                        onClick={() => update('question_set', form.question_set.filter((_, j) => j !== i))}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 13, fontWeight: 600 }}
                                                    >Remove</button>
                                                </div>
                                                
                                                <div style={{ display: 'grid', gap: 14 }}>
                                                    <div>
                                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Question Text *</label>
                                                        <textarea 
                                                            className="form-input" 
                                                            value={q.question_text || ''} 
                                                            onChange={e => {
                                                                const newQs = [...form.question_set];
                                                                newQs[i] = { ...newQs[i], question_text: e.target.value };
                                                                update('question_set', newQs);
                                                            }}
                                                            placeholder="e.g. Explain how index lookup works in PostgreSQL"
                                                            rows={2}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Expected Answer / Evaluation Criteria *</label>
                                                        <textarea 
                                                            className="form-input" 
                                                            value={q.expected_answer || ''} 
                                                            onChange={e => {
                                                                const newQs = [...form.question_set];
                                                                newQs[i] = { ...newQs[i], expected_answer: e.target.value };
                                                                update('question_set', newQs);
                                                            }}
                                                            placeholder="e.g. Must mention B-Trees, O(log N) lookup time, and index scans"
                                                            rows={2}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                                        <div>
                                                            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Target Skill / Category</label>
                                                            <input 
                                                                className="form-input" 
                                                                value={q.category || ''} 
                                                                onChange={e => {
                                                                    const newQs = [...form.question_set];
                                                                    newQs[i] = { ...newQs[i], category: e.target.value };
                                                                    update('question_set', newQs);
                                                                }}
                                                                placeholder="e.g. Database Internals"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Difficulty</label>
                                                            <select 
                                                                className="form-input" 
                                                                value={q.difficulty || 'Easy'} 
                                                                onChange={e => {
                                                                    const newQs = [...form.question_set];
                                                                    newQs[i] = { ...newQs[i], difficulty: e.target.value };
                                                                    update('question_set', newQs);
                                                                }}
                                                            >
                                                                <option value="Easy">Easy</option>
                                                                <option value="Medium">Medium</option>
                                                                <option value="Hard">Hard</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Live Preview Card */}
                                                <div style={{ marginTop: 16, padding: 12, background: '#f1f5f9', borderRadius: 8, borderLeft: '3px solid #3b82f6' }}>
                                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>AI Prompt Preview</div>
                                                    <div style={{ fontSize: 13, color: '#334155' }}>
                                                        <strong>Ask:</strong> "{q.question_text || '[Question]'}"<br/>
                                                        <strong>Evaluate against:</strong> "{q.expected_answer || '[Criteria]'}"
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => update('question_set', [...form.question_set, { question_text: '', expected_answer: '', category: 'General', difficulty: 'Medium', type: 'long_answer' }])}
                                        style={{ marginTop: 20, padding: '12px 24px', width: '100%', background: 'transparent', border: '2px dashed #cbd5e1', borderRadius: 12, color: '#475569', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    >
                                        + Add New Question
                                    </button>
                                </div>
                            )}

                            {/* Step 4: Launch */}
                            {step === 4 && campaignId && (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ fontSize: 64, marginBottom: 20 }}>🚀</div>
                                    <h3 style={{ fontWeight: 800, fontSize: 24, color: '#1e293b', marginBottom: 12 }}>Campaign Created Successfully!</h3>
                                    <p style={{ fontSize: 15, color: '#64748b', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
                                        Your campaign "<strong>{form.title}</strong>" is ready. Candidates will be called during the configured time window.
                                    </p>
                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                        <button onClick={() => navigate(`/hr/campaigns/${campaignId}`)} className="btn-accent">
                                            View Campaign →
                                        </button>
                                        <button onClick={() => navigate('/hr/campaigns')} className="btn-outline">
                                            All Campaigns
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 4 && !campaignId && (
                                <div>
                                    <div style={{ padding: 20, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: '#1e293b' }}>Campaign Summary</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            {[
                                                { label: 'Title', val: form.title },
                                                { label: 'Department', val: form.department },
                                                { label: 'Location', val: form.hiring_location || '—' },
                                                { label: 'Candidates Added', val: candidateInputMode === 'csv' ? (csvFile ? `✓ ${csvFile.name}` : 'No CSV file') : `${manualCandidates.length} manual candidate(s)` },
                                                { label: 'Questions', val: `${form.question_set.length} questions` },
                                            ].map(item => (
                                                <div key={item.label} style={{ fontSize: 13 }}>
                                                    <span style={{ color: '#94a3b8', fontWeight: 500 }}>{item.label}: </span>
                                                    <span style={{ color: '#334155', fontWeight: 600 }}>{item.val || '—'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation buttons */}
                    {!(step === 4 && campaignId) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
                            <button
                                onClick={handlePrev}
                                disabled={step === 1}
                                className="btn-outline"
                                style={{ opacity: step === 1 ? 0.4 : 1 }}
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={loading}
                                className="btn-accent"
                            >
                                {loading ? <><div className="spinner" /> Creating...</> : step === 3 ? '🚀 Launch Campaign' : <>Next <ChevronRight size={16} /></>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
