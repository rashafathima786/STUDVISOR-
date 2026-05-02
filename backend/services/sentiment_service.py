"""
Sentiment Analysis Service — detects toxicity, bullying, and distress in campus posts.
Uses a simplified rule-based approach for high performance without GPU.
"""
import re

TOXIC_KEYWORDS = [
    "hate", "stupid", "idiot", "kill", "die", "suicide", "trash", "garbage",
    "useless", "worthless", "ugly", "fat", "loser", "shut up", "hell",
]

DISTRESS_KEYWORDS = [
    "kill myself", "end it", "hopeless", "can't go on", "goodbye world",
    "suffering", "depressed", "anxiety", "panic attack", "hurting",
]

ACADEMIC_KEYWORDS = [
    "exam", "marks", "fail", "study", "teacher", "professor", "class", "lecture",
]


class SentimentService:
    def redact_pii(self, text: str) -> str:
        """Redacts sensitive campus data like emails and phone numbers."""
        # Redact emails
        text = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[EMAIL REDACTED]', text)
        # Redact phone numbers (simple common formats)
        text = re.sub(r'\+?\d{10,12}', '[PHONE REDACTED]', text)
        text = re.sub(r'\d{3}-\d{3}-\d{4}', '[PHONE REDACTED]', text)
        return text

    def analyze(self, text: str) -> dict:
        raw_text = text
        text = text.lower()
        
        # 1. Toxicity check
        toxicity_score = 0.0
        toxic_matches = [w for w in TOXIC_KEYWORDS if w in text]
        if toxic_matches:
            toxicity_score = min(1.0, len(toxic_matches) * 0.2)
            
        # 2. Distress check
        distress_score = 0.0
        distress_matches = [w for w in DISTRESS_KEYWORDS if w in text]
        if distress_matches:
            distress_score = min(1.0, len(distress_matches) * 0.4)
            
        # 3. Categorization
        is_academic = any(w in text for w in ACADEMIC_KEYWORDS)
        
        # 4. PII Redaction
        redacted_text = self.redact_pii(raw_text)
        
        return {
            "text": text,
            "redacted_content": redacted_text,
            "sentiment": "Negative" if toxicity_score > 0.3 or distress_score > 0.3 else "Neutral",
            "score": max(toxicity_score, distress_score),
            "toxicity_score": toxicity_score,
            "distress_score": distress_score,
            "is_toxic": toxicity_score >= 0.2,
            "needs_moderation": toxicity_score > 0.6 or distress_score > 0.5,
            "is_distress": distress_score >= 0.4,
            "category": "academic" if is_academic else "social",
            "flagged_keywords": toxic_matches + distress_matches,
        }

sentiment_service = SentimentService()
