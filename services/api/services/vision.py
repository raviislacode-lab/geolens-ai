import base64
import io
import json
import logging
from typing import Any

import httpx
from pydantic import ValidationError

from config import settings
from prompts.system import GEOLOGY_SYSTEM_PROMPT, GEOLOGY_USER_PROMPT
from schemas.identification import VisionAnalysisResponse

logger = logging.getLogger(__name__)


class VisionService:
    def __init__(self) -> None:
        self.api_key = settings.openrouter_api_key
        self.base_url = settings.openrouter_base_url
        self.model = settings.vision_model

    async def analyze_image(self, image_base64: str) -> VisionAnalysisResponse:
        if not self.api_key:
            return self._mock_analysis()

        image_data = image_base64
        if image_base64.startswith("data:"):
            image_data = image_base64.split(",", 1)[1]

        payload: dict[str, Any] = {
            "model": self.model,
            "temperature": 0.1,
            "top_p": 0.9,
            "max_tokens": 3000,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": GEOLOGY_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": GEOLOGY_USER_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}",
                            },
                        },
                    ],
                },
            ],
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://geolens.ai",
            "X-Title": "GeoLens AI",
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)

        # Follow-up Q&A UI was removed — never surface questions to the client
        parsed["follow_up_questions"] = []

        try:
            return VisionAnalysisResponse.model_validate(parsed)
        except ValidationError as exc:
            logger.warning("Vision response validation failed, retrying parse: %s", exc)
            normalized = self._normalize_response(parsed)
            normalized["follow_up_questions"] = []
            return VisionAnalysisResponse.model_validate(normalized)

    def _normalize_response(self, parsed: dict[str, Any]) -> dict[str, Any]:
        vf = parsed.get("visual_features", {})
        if isinstance(vf, dict):
            for key in ("visible_crystals", "layering", "vesicles", "banding", "cleavage_visible"):
                if key in vf and vf[key] == "null":
                    vf[key] = None
        parsed["visual_features"] = vf
        if "follow_up_questions" not in parsed:
            parsed["follow_up_questions"] = []
        if "observations" not in parsed:
            parsed["observations"] = []
        if "assumptions" not in parsed:
            parsed["assumptions"] = []
        return parsed

    def _mock_analysis(self) -> VisionAnalysisResponse:
        return VisionAnalysisResponse.model_validate(
            {
                "primary_identification": "Granite",
                "confidence": 0.82,
                "alternatives": [
                    {"name": "Granodiorite", "confidence": 0.11},
                    {"name": "Diorite", "confidence": 0.04},
                ],
                "visual_features": {
                    "grain_size": "coarse",
                    "texture": "phaneritic",
                    "dominant_colors": ["pink", "white", "black"],
                    "visible_crystals": True,
                    "layering": False,
                    "vesicles": False,
                    "luster": "non-metallic",
                },
                "reasoning": (
                    "Visible quartz grains, potassium feldspar crystals, and interlocking "
                    "coarse texture strongly suggest granite."
                ),
                "observations": [
                    "Coarse interlocking crystals visible",
                    "Pink, white, and black mineral grains present",
                    "Non-foliated texture",
                ],
                "assumptions": ["Specimen is a natural rock, not a synthetic aggregate"],
                "follow_up_questions": [],
            }
        )


def compute_image_quality(image_base64: str) -> float:
    try:
        import numpy as np
        from PIL import Image, ImageFilter

        raw = image_base64
        if raw.startswith("data:"):
            raw = raw.split(",", 1)[1]
        image_bytes = base64.b64decode(raw)
        image = Image.open(io.BytesIO(image_bytes)).convert("L")
        edges = image.filter(ImageFilter.FIND_EDGES)
        arr = np.array(edges, dtype=float)
        variance = float(arr.var())
        normalized = min(1.0, variance / 2000.0)
        return max(0.3, normalized)
    except Exception:
        return 0.7
