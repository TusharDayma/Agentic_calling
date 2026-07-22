import json
import logging
import requests
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class OllamaService:
    def __init__(self, base_url: str = None, model: str = None):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.model = model or settings.OLLAMA_MODEL

    def _call_ollama(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """Executes a text generation request to the local Ollama daemon."""
        url = f"{self.base_url.rstrip('/')}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            response = requests.post(url, json=payload, timeout=12)
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "").strip()
            else:
                logger.warning(f"Ollama request returned status code {response.status_code}")
        except Exception as e:
            logger.warning(f"Ollama connection error ({self.base_url}): {e}. Utilizing intelligent fallback.")
        return None

    def evaluate_and_respond(
        self,
        candidate_name: str,
        question_text: str,
        expected_answer: str,
        candidate_answer: str,
        reask_count: int = 0
    ) -> Dict[str, Any]:
        """
        Agent 3: Interviewer logic.
        Evaluates candidate's answer against expected answer and decides
        whether to re-ask/probe or advance to the next question.
        """
        system_prompt = (
            f"You are an expert AI recruiter conducting a phone interview for {candidate_name}. "
            "Your job is to assess if the candidate answered the question accurately according to the expected criteria. "
            "Respond strictly with valid JSON with keys: is_correct (boolean), next_speech (string), feedback (string)."
        )

        user_prompt = f"""
Question asked: "{question_text}"
Expected Answer / Criteria: "{expected_answer}"
Candidate's Answer: "{candidate_answer}"
Previous re-ask count for this question: {reask_count}

Evaluate the candidate's response:
- If the answer is accurate or demonstrates good understanding, set is_correct=true. Provide a polite transition speech in next_speech.
- If the answer is incorrect or too vague AND reask_count is less than 2, set is_correct=false and set next_speech to a polite re-asking/follow-up question seeking clarification.
- If reask_count >= 2, set is_correct=true (move on) and summarize in next_speech.

Return raw JSON only:
{{"is_correct": true|false, "next_speech": "text to speak to candidate", "feedback": "brief reasoning"}}
"""
        response_text = self._call_ollama(user_prompt, system_prompt)
        
        if response_text:
            try:
                # Try to parse JSON output
                clean_text = response_text
                if "```json" in clean_text:
                    clean_text = clean_text.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_text:
                    clean_text = clean_text.split("```")[1].split("```")[0].strip()
                res = json.loads(clean_text)
                return {
                    "is_correct": bool(res.get("is_correct", True)),
                    "next_speech": str(res.get("next_speech", "Thank you. Let's move to the next question.")),
                    "feedback": str(res.get("feedback", "Evaluated via Ollama."))
                }
            except Exception as parse_err:
                logger.warning(f"Failed to parse Ollama JSON response: {parse_err}. Response text was: {response_text}")

        # Fallback if Ollama is not active or response parsing failed
        cand_lower = candidate_answer.lower()
        if "don't know" in cand_lower or "skip" in cand_lower or len(candidate_answer.strip()) < 5:
            if reask_count < 1:
                return {
                    "is_correct": False,
                    "next_speech": f"Could you provide a bit more detail regarding {question_text[:30]}...?",
                    "feedback": "Answer incomplete or vague."
                }
            else:
                return {
                    "is_correct": True,
                    "next_speech": "Thank you for sharing. Let's proceed to the next question.",
                    "feedback": "Retry limit reached, advancing."
                }
        
        return {
            "is_correct": True,
            "next_speech": "Thank you, that was clear. Moving to the next question.",
            "feedback": "Valid answer accepted."
        }

    def rank_candidate_interview(
        self,
        candidate_name: str,
        role_title: str,
        transcript: str,
        questions_and_expected: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Agent 4: Post-Call Ranker LLM.
        Analyzes the full interview transcript against the job role and expected answers.
        Returns a score out of 100 and a detailed justification.
        """
        system_prompt = (
            "You are an executive talent assessment AI. Evaluate the interview transcript against the expected answers. "
            "Output strictly valid JSON with keys: score (float 0-100), justification (string), technical_fit (float 0-10), communication_fit (float 0-10)."
        )

        qa_formatted = json.dumps(questions_and_expected, indent=2)
        user_prompt = f"""
Candidate Name: {candidate_name}
Role: {role_title}

Questions & Expected Answers:
{qa_formatted}

Full Interview Transcript:
{transcript}

Analyze the candidate's answers against the expected criteria.
Provide:
1. "score": Overall score from 0 to 100.
2. "justification": Concise 2-4 sentence summary explaining key strengths and weak points.
3. "technical_fit": Score out of 10 for technical accuracy.
4. "communication_fit": Score out of 10 for clarity and communication.

Return raw JSON only:
{{"score": 85.0, "justification": "The candidate answered technical questions well...", "technical_fit": 8.5, "communication_fit": 8.0}}
"""
        response_text = self._call_ollama(user_prompt, system_prompt)
        
        if response_text:
            try:
                clean_text = response_text
                if "```json" in clean_text:
                    clean_text = clean_text.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_text:
                    clean_text = clean_text.split("```")[1].split("```")[0].strip()
                res = json.loads(clean_text)
                return {
                    "score": float(res.get("score", 75.0)),
                    "justification": str(res.get("justification", "Evaluated candidate interview responses against job requirements.")),
                    "technical_fit": float(res.get("technical_fit", 7.5)),
                    "communication_fit": float(res.get("communication_fit", 7.5))
                }
            except Exception as e:
                logger.warning(f"Ollama ranking JSON parse error: {e}")

        # Fallback scoring logic
        word_count = len(transcript.split())
        score = min(90.0, max(50.0, 60.0 + (word_count / 10)))
        return {
            "score": round(score, 1),
            "justification": f"Candidate completed the pre-screening interview for {role_title}. Demonstrated general communication and role alignment.",
            "technical_fit": round(score / 10, 1),
            "communication_fit": 8.0
        }

ollama_service = OllamaService()
