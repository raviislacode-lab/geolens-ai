from __future__ import annotations

import logging

from config import settings
from schemas.identification import VisionAnalysisResponse

logger = logging.getLogger(__name__)


class FallbackService:
    """Premium verification fallback — placeholder for GPT-based secondary check."""

    async def verify(
        self,
        vision: VisionAnalysisResponse,
        image_base64: str | None = None,
    ) -> VisionAnalysisResponse | None:
        if not settings.openrouter_api_key:
            logger.info("Premium fallback skipped — no API key configured")
            return None

        logger.info(
            "Premium fallback would be invoked for %s (confidence %.2f)",
            vision.primary_identification,
            vision.confidence,
        )
        return None
