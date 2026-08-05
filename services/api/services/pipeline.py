from __future__ import annotations

import uuid

from schemas.identification import (
    AlternativeCandidate,
    FollowUpRequest,
    IdentificationResult,
    IdentifyRequest,
)
from services.classification import ClassificationLayer
from services.confidence import ConfidenceCalibrator
from services.decision_engine import DecisionEngine
from services.fallback import FallbackService
from services.rag import RAGService
from services.vision import VisionService, compute_image_quality


class IdentificationPipeline:
    def __init__(self) -> None:
        self.vision = VisionService()
        self.classifier = ClassificationLayer()
        self.engine = DecisionEngine()
        self.calibrator = ConfidenceCalibrator()
        self.rag = RAGService()
        self.fallback = FallbackService()

    async def identify(self, request: IdentifyRequest) -> IdentificationResult:
        scan_id = str(uuid.uuid4())
        vision = await self.vision.analyze_image(request.image_base64)
        return await self._process(scan_id, vision, request.image_base64, request.location, expert=request.expert)

    async def follow_up(self, request: FollowUpRequest) -> IdentificationResult:
        return await self._process(
            request.scan_id,
            request.vision_result,
            request.image_base64 or "",
            request.location,
            follow_up_answers=request.answers,
            expert=request.expert,
        )

    async def _process(
        self,
        scan_id: str,
        vision,
        image_base64: str,
        location,
        follow_up_answers=None,
        expert: bool = False,
    ) -> IdentificationResult:
        attributes = self.classifier.normalize(vision.visual_features)
        specimen_facts = self.rag.retrieve(vision.primary_identification, attributes)

        primary_name, classification, candidates, geo_consistency, limitations = self.engine.evaluate(
            vision,
            attributes,
            specimen_facts,
            follow_up_answers,
            location,
        )

        image_quality = compute_image_quality(image_base64) if image_base64 else 0.7
        final_confidence, followup_agreement = self.calibrator.calibrate(
            vision, image_quality, geo_consistency, follow_up_answers
        )

        premium_used = False
        if self.calibrator.should_use_premium_fallback(final_confidence, vision, expert):
            verified = await self.fallback.verify(vision, image_base64)
            if verified:
                vision = verified
                premium_used = True

        if specimen_facts is None or specimen_facts.name.lower() != primary_name.lower():
            specimen_facts = self.rag.retrieve(primary_name, attributes)

        alternatives = [
            AlternativeCandidate(name=c.name, confidence=round(c.score, 3))
            for c in candidates[1:4]
        ]

        recommend_test = final_confidence < 0.55 or len(limitations) > 0

        return IdentificationResult(
            scan_id=scan_id,
            primary_identification=primary_name,
            classification=classification,
            confidence=final_confidence,
            raw_confidence=vision.confidence,
            alternatives=alternatives,
            visual_features=vision.visual_features,
            structured_attributes=attributes,
            reasoning=vision.reasoning,
            observations=vision.observations,
            assumptions=vision.assumptions,
            follow_up_questions=vision.follow_up_questions,
            specimen_facts=specimen_facts,
            limitations=limitations,
            recommend_physical_test=recommend_test,
            image_quality_score=round(image_quality, 3),
            geological_consistency=round(geo_consistency, 3),
            followup_agreement=round(followup_agreement, 3),
            premium_verification_used=premium_used,
        )
