export interface User {
    id: string;
    email: string;
    full_name: string;
    department: string;
    role: 'admin' | 'hr';
    is_active: boolean;
    created_at: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    role: string | null;
}

export interface Campaign {
    id: string;
    title: string;
    job_description: string;
    department: string;
    hiring_manager: string;
    hiring_location: string;
    experience_required: string;
    status: 'draft' | 'active' | 'completed' | 'paused';
    question_set: Question[];
    accent: string;
    max_retries: number;
    retry_delay_minutes: number;
    parallel_calls: number;
    calling_window_start: string;
    calling_window_end: string;
    created_at: string;
}

export interface Question {
    text: string;
    category: string;
    type: 'yes_no' | 'short_answer' | 'long_answer' | 'technical' | 'behavioral';
}

export interface Candidate {
    id: string;
    campaign_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    city: string;
    experience_years: number;
    current_company: string;
    status: 'pending' | 'scheduled' | 'calling' | 'completed' | 'failed' | 'skipped';
    call_attempts: number;
    created_at: string;
}

export interface CandidateEvaluation {
    candidate_id: string;
    first_name: string;
    last_name: string;
    email: string;
    city: string;
    experience_years: number;
    current_company: string;
    campaign_id: string;
    campaign_title: string;
    evaluation_id: string;
    candidate_intelligence_score: number;
    technical_score: number;
    jd_fit_score: number;
    fluency_score: number;
    confidence_score: number;
    communication_score: number;
    recommendation: 'strongly_recommended' | 'recommended' | 'average' | 'not_recommended';
    extracted_years_of_experience: number;
    extracted_notice_period: string;
    extracted_salary_expectation: string;
    status?: 'pending' | 'scheduled' | 'calling' | 'completed' | 'failed' | 'skipped';
    created_at?: string;
}


export interface CandidateDetail {
    candidate: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone_number: string;
        city: string;
        experience_years: number;
        current_company: string;
    };
    call_log: {
        status: string;
        start_time: string;
        end_time: string;
        raw_transcript: string;
        recording_url: string;
        duration_seconds: number;
    };
    evaluation: {
        candidate_intelligence_score: number;
        jd_fit_score: number;
        technical_score: number;
        confidence_score: number;
        fluency_score: number;
        grammar_score: number;
        vocabulary_score: number;
        communication_score: number;
        recommendation: string;
        ai_generated_summary: string;
        feedback_details: {
            strengths: string[];
            weaknesses: string[];
            questions_answered: number;
            consent_given: boolean;
        };
        extracted_salary_expectation: string;
        extracted_notice_period: string;
        extracted_years_of_experience: number;
    };
}

export interface JobRole {
    id: string;
    title: string;
    department: string;
    description: string;
    skills_required: string[];
    experience_min: number;
    experience_max: number;
    is_active: boolean;
}

export interface QuestionSet {
    id: string;
    name: string;
    role_id: string;
    questions: Question[];
    is_active: boolean;
}

export interface DashboardMetrics {
    active_campaigns: number;
    total_campaigns: number;
    completed_campaigns: number;
    total_candidates: number;
    completed_calls: number;
    failed_calls: number;
    pending_calls: number;
    avg_cis: number;
}

export interface AnalyticsSummary {
    total_candidates: number;
    calls_completed: number;
    calls_failed: number;
    calls_pending: number;
    avg_intelligence_score: number;
    top_candidates: number;
    call_success_rate: number;
    recommendation_distribution: Record<string, number>;
}

export interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    resource: string;
    ip_address: string;
    created_at: string;
}
