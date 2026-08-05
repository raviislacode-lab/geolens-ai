import pytest

from schemas.identification import (
    FollowUpAnswer,
    StructuredAttributes,
    VisionAnalysisResponse,
    VisualFeatures,
)
from services.classification import ClassificationLayer
from services.confidence import ConfidenceCalibrator
from services.decision_engine import DecisionEngine


@pytest.fixture
def obsidian_basalt_vision():
    return VisionAnalysisResponse.model_validate(
        {
            "primary_identification": "Obsidian",
            "confidence": 0.55,
            "alternatives": [
                {"name": "Basalt", "confidence": 0.40},
            ],
            "visual_features": {
                "grain_size": "fine",
                "texture": "glassy",
                "dominant_colors": ["black"],
                "visible_crystals": False,
                "layering": False,
                "vesicles": False,
                "luster": "vitreous",
            },
            "reasoning": "Dark glassy appearance with smooth texture.",
            "observations": ["Black color", "Smooth glassy surface"],
            "assumptions": [],
            "follow_up_questions": [
                {
                    "id": "vesicles_check",
                    "question": "Are there visible gas bubbles (vesicles) in the rock?",
                    "options": ["Yes", "No"],
                    "test_type": "visual",
                }
            ],
        }
    )


def test_classification_normalizes_visual_features():
    layer = ClassificationLayer()
    vf = VisualFeatures(
        grain_size="coarse",
        texture="phaneritic",
        dominant_colors=["pink", "white"],
        visible_crystals=True,
        luster="non-metallic",
        vesicles=False,
    )
    attrs = layer.normalize(vf)
    assert attrs.grain_size.value == "coarse"
    assert attrs.luster.value == "non-metallic"
    assert attrs.visible_crystals is True


def test_confidence_calibrator_weights():
    calibrator = ConfidenceCalibrator()
    vision = VisionAnalysisResponse.model_validate(
        {
            "primary_identification": "Granite",
            "confidence": 0.82,
            "alternatives": [],
            "visual_features": {"grain_size": "coarse", "texture": "phaneritic"},
            "reasoning": "test",
        }
    )
    final, followup = calibrator.calibrate(vision, image_quality=0.8, geological_consistency=0.7)
    expected = 0.40 * 0.82 + 0.25 * 0.7 + 0.20 * 0.8 + 0.15 * 0.7
    assert abs(final - round(expected, 3)) < 0.001


def test_obsidian_basalt_vesicles_followup(obsidian_basalt_vision):
    engine = DecisionEngine()
    classifier = ClassificationLayer()
    attrs = classifier.normalize(obsidian_basalt_vision.visual_features)

    _, _, candidates_before, _, _ = engine.evaluate(obsidian_basalt_vision, attrs)
    scores_before = {c.name.lower(): c.score for c in candidates_before}

    answers = [FollowUpAnswer(question_id="vesicles_check", answer="Yes")]
    _, _, candidates_after, _, _ = engine.evaluate(
        obsidian_basalt_vision, attrs, follow_up_answers=answers
    )
    scores_after = {c.name.lower(): c.score for c in candidates_after}

    assert scores_after.get("basalt", 0) > scores_before.get("basalt", 0)


def test_should_trigger_premium_fallback():
    calibrator = ConfidenceCalibrator()
    vision = VisionAnalysisResponse.model_validate(
        {
            "primary_identification": "Quartz",
            "confidence": 0.45,
            "alternatives": [{"name": "Quartzite", "confidence": 0.42}],
            "visual_features": {"grain_size": "fine", "texture": "unknown"},
            "reasoning": "test",
        }
    )
    assert calibrator.should_use_premium_fallback(0.45, vision) is True
