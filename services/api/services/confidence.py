from __future__ import annotations

from schemas.identification import FollowUpAnswer, VisionAnalysisResponse


class ConfidenceCalibrator:
    VISUAL_WEIGHT = 0.40
    FOLLOWUP_WEIGHT = 0.25
    IMAGE_QUALITY_WEIGHT = 0.20
    GEOLOGICAL_WEIGHT = 0.15

    def calibrate(
        self,
        vision: VisionAnalysisResponse,
        image_quality: float,
        geological_consistency: float,
        follow_up_answers: list[FollowUpAnswer] | None = None,
    ) -> tuple[float, float]:
        visual_conf = vision.confidence
        followup_agreement = self._compute_followup_agreement(vision, follow_up_answers or [])

        final = (
            self.VISUAL_WEIGHT * visual_conf
            + self.FOLLOWUP_WEIGHT * followup_agreement
            + self.IMAGE_QUALITY_WEIGHT * image_quality
            + self.GEOLOGICAL_WEIGHT * geological_consistency
        )
        return round(min(1.0, max(0.0, final)), 3), followup_agreement

    def _compute_followup_agreement(
        self,
        vision: VisionAnalysisResponse,
        answers: list[FollowUpAnswer],
    ) -> float:
        if not vision.follow_up_questions:
            return 0.7 if not answers else 0.85

        if not answers:
            return 0.4

        answered_ids = {a.question_id for a in answers}
        expected_ids = {q.id for q in vision.follow_up_questions}
        if not expected_ids:
            return 0.7

        coverage = len(answered_ids & expected_ids) / len(expected_ids)
        return 0.5 + 0.5 * coverage

    def should_use_premium_fallback(
        self,
        final_confidence: float,
        vision: VisionAnalysisResponse,
        expert: bool = False,
        threshold: float = 0.55,
    ) -> bool:
        if expert:
            return True
        if final_confidence < threshold:
            return True
        if len(vision.alternatives) >= 2:
            top_two = sorted(
                [vision.confidence] + [a.confidence for a in vision.alternatives[:1]],
                reverse=True,
            )
            if len(top_two) >= 2 and abs(top_two[0] - top_two[1]) < 0.10:
                return True
        return False
