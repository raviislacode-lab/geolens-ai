from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class GrainSize(str, Enum):
    VERY_FINE = "very_fine"
    FINE = "fine"
    MEDIUM = "medium"
    COARSE = "coarse"
    VERY_COARSE = "very_coarse"
    UNKNOWN = "unknown"


class Luster(str, Enum):
    METALLIC = "metallic"
    NON_METALLIC = "non-metallic"
    VITREOUS = "vitreous"
    PEARLY = "pearly"
    RESINOUS = "resinous"
    DULL = "dull"
    UNKNOWN = "unknown"


class Transparency(str, Enum):
    TRANSPARENT = "transparent"
    TRANSLUCENT = "translucent"
    OPAQUE = "opaque"
    UNKNOWN = "unknown"


class Fracture(str, Enum):
    CONCHOIDAL = "conchoidal"
    UNEVEN = "uneven"
    SPLINTERY = "splintery"
    HACKLY = "hackly"
    UNKNOWN = "unknown"


class MagneticStatus(str, Enum):
    YES = "yes"
    NO = "no"
    UNKNOWN = "unknown"


class AlternativeCandidate(BaseModel):
    name: str
    confidence: float = Field(ge=0.0, le=1.0)


class VisualFeatures(BaseModel):
    grain_size: str = "unknown"
    texture: str = "unknown"
    dominant_colors: List[str] = Field(default_factory=list)
    visible_crystals: Optional[bool] = None
    layering: Optional[bool] = None
    vesicles: Optional[bool] = None
    luster: str = "unknown"
    banding: Optional[bool] = None
    cleavage_visible: Optional[bool] = None
    fracture: Optional[str] = None
    transparency: Optional[str] = None


class FollowUpQuestion(BaseModel):
    id: str
    question: str
    options: List[str] = Field(default_factory=list)
    test_type: str = "visual"


class VisionAnalysisResponse(BaseModel):
    primary_identification: str
    confidence: float = Field(ge=0.0, le=1.0)
    alternatives: List[AlternativeCandidate] = Field(default_factory=list)
    visual_features: VisualFeatures
    reasoning: str
    observations: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    follow_up_questions: List[FollowUpQuestion] = Field(default_factory=list)


class StructuredAttributes(BaseModel):
    grain_size: GrainSize = GrainSize.UNKNOWN
    luster: Luster = Luster.UNKNOWN
    transparency: Transparency = Transparency.UNKNOWN
    fracture: Fracture = Fracture.UNKNOWN
    cleavage_visible: bool = False
    banding: bool = False
    vesicles: bool = False
    magnetic: MagneticStatus = MagneticStatus.UNKNOWN
    texture: str = "unknown"
    dominant_colors: List[str] = Field(default_factory=list)
    visible_crystals: bool = False
    layering: bool = False


class SpecimenFacts(BaseModel):
    name: str
    rock_type: str
    hardness: str
    colors: List[str] = Field(default_factory=list)
    chemical_composition: str = ""
    formation: str = ""
    common_uses: List[str] = Field(default_factory=list)
    found_in: str = ""
    about: str = ""


class LocationContext(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    region: Optional[str] = None


class IdentifyRequest(BaseModel):
    image_base64: str
    location: Optional[LocationContext] = None
    expert: bool = False


class FollowUpAnswer(BaseModel):
    question_id: str
    answer: str


class FollowUpRequest(BaseModel):
    scan_id: str
    vision_result: VisionAnalysisResponse
    answers: List[FollowUpAnswer]
    image_base64: Optional[str] = None
    location: Optional[LocationContext] = None
    expert: bool = False


class DecisionCandidate(BaseModel):
    name: str
    score: float
    evidence: List[str] = Field(default_factory=list)


class IdentificationResult(BaseModel):
    scan_id: str
    primary_identification: str
    classification: str
    confidence: float
    raw_confidence: float
    alternatives: List[AlternativeCandidate] = Field(default_factory=list)
    visual_features: VisualFeatures
    structured_attributes: StructuredAttributes
    reasoning: str
    observations: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    follow_up_questions: List[FollowUpQuestion] = Field(default_factory=list)
    specimen_facts: Optional[SpecimenFacts] = None
    limitations: List[str] = Field(default_factory=list)
    recommend_physical_test: bool = False
    image_quality_score: float = 0.0
    geological_consistency: float = 0.0
    followup_agreement: float = 0.0
    premium_verification_used: bool = False
