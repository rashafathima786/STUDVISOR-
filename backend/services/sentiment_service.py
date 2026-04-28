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
    def analyze(self, text: str) -> dict:
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
        
        return {
            "text": text,
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
