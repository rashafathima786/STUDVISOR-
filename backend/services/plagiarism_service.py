"""
Plagiarism detection service — semantic similarity between assignment submissions.
Stage 1: MinHash LSH for fast candidate selection
Stage 2: Cosine similarity on word frequency vectors
"""
from collections import Counter
import math
import hashlib
import re


def _tokenize(text: str) -> list:
    """Simple word tokenization with normalization."""
    return re.findall(r'\b[a-z]{2,}\b', text.lower())


def _ngrams(tokens: list, n: int = 3) -> list:
    """Generate character n-grams from token list."""
    text = " ".join(tokens)
    return [text[i:i+n] for i in range(len(text) - n + 1)]


def _minhash_signature(ngrams: list, num_hashes: int = 100) -> list:
    """Generate MinHash signature for fast similarity estimation."""
    signature = []
    for i in range(num_hashes):
        min_hash = float('inf')
        for ng in ngrams:
            h = int(hashlib.md5(f"{i}:{ng}".encode()).hexdigest(), 16)
            min_hash = min(min_hash, h)
        signature.append(min_hash)
    return signature


def _jaccard_from_minhash(sig1: list, sig2: list) -> float:
    """Estimate Jaccard similarity from MinHash signatures."""
    if not sig1 or not sig2:
        return 0.0
    matching = sum(1 for a, b in zip(sig1, sig2) if a == b)
    return matching / len(sig1)


def _cosine_similarity(text1: str, text2: str) -> float:
    """Cosine similarity based on word frequency vectors."""
    tokens1 = _tokenize(text1)
    tokens2 = _tokenize(text2)
    if not tokens1 or not tokens2:
        return 0.0

    counter1 = Counter(tokens1)
    counter2 = Counter(tokens2)
    all_words = set(counter1.keys()) | set(counter2.keys())

    dot = sum(counter1.get(w, 0) * counter2.get(w, 0) for w in all_words)
    mag1 = math.sqrt(sum(v**2 for v in counter1.values()))
    mag2 = math.sqrt(sum(v**2 for v in counter2.values()))

    if mag1 == 0 or mag2 == 0:
        return 0.0
    return round(dot / (mag1 * mag2), 4)


class PlagiarismDetector:

    def compare_pair(self, text1: str, text2: str) -> dict:
        """Compare two texts for similarity using both MinHash and Cosine."""
        tokens1 = _tokenize(text1)
        tokens2 = _tokenize(text2)

        # Stage 1: MinHash for fast screening
        ng1 = _ngrams(tokens1)
        ng2 = _ngrams(tokens2)
        sig1 = _minhash_signature(ng1)
        sig2 = _minhash_signature(ng2)
        minhash_sim = _jaccard_from_minhash(sig1, sig2)

        # Stage 2: Cosine similarity for accuracy
        cosine_sim = _cosine_similarity(text1, text2)

        # Combined score (weighted average)
        combined = round(minhash_sim * 0.4 + cosine_sim * 0.6, 4)

        return {
            "minhash_similarity": round(minhash_sim, 4),
            "cosine_similarity": cosine_sim,
            "combined_score": combined,
            "is_suspicious": combined > 0.6,
            "verdict": "HIGHLY SUSPICIOUS" if combined > 0.8 else "SUSPICIOUS" if combined > 0.6 else "MODERATE" if combined > 0.4 else "CLEAN",
        }

    def batch_compare(self, submissions: list) -> list:
        """
        Compare all submissions in a batch against each other.
        Input: [{"student_id": 1, "student_name": "...", "text": "..."}, ...]
        Returns: list of suspicious pairs sorted by score.
        """
        results = []
        for i in range(len(submissions)):
            for j in range(i + 1, len(submissions)):
                s1 = submissions[i]
                s2 = submissions[j]
                comparison = self.compare_pair(s1["text"], s2["text"])
                if comparison["combined_score"] > 0.4:
                    results.append({
                        "student_1": {"id": s1["student_id"], "name": s1.get("student_name", "?")},
                        "student_2": {"id": s2["student_id"], "name": s2.get("student_name", "?")},
                        **comparison,
                    })
        return sorted(results, key=lambda x: x["combined_score"], reverse=True)


plagiarism_detector = PlagiarismDetector()
