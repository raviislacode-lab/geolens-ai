from __future__ import annotations

from schemas.identification import (
    DecisionCandidate,
    FollowUpAnswer,
    LocationContext,
    SpecimenFacts,
    StructuredAttributes,
    VisionAnalysisResponse,
)

AMBIGUOUS_PAIRS = [
    ("quartz", "quartzite"),
    ("marble", "limestone"),
    ("obsidian", "basalt"),
    ("granite", "granodiorite"),
    ("granite", "diorite"),
    ("sandstone", "quartzite"),
]

LIMITATION_MESSAGES = [
    "Image-only identification is inherently difficult for visually similar specimens.",
    "Quartz versus quartzite cannot be reliably distinguished from photos alone.",
    "Marble versus limestone requires acid testing or detailed petrographic analysis.",
    "Feldspar varieties often require chemical or optical analysis.",
    "Similar igneous intrusive rocks (granite, granodiorite, diorite) share visual features.",
    "Synthetic versus natural gemstones cannot be authenticated from images.",
    "Valuable gemstone authentication requires professional gemological testing.",
]

FOLLOWUP_RULES: dict[str, dict[str, float]] = {
    "vesicles_present": {"basalt": 0.25, "scoria": 0.20, "obsidian": -0.15},
    "vesicles_absent": {"obsidian": 0.15, "basalt": -0.10},
    "conchoidal_fracture": {"obsidian": 0.30, "flint": 0.20, "basalt": -0.05},
    "magnetic_yes": {"magnetite": 0.35, "hematite": 0.15, "basalt": 0.05},
    "magnetic_no": {"obsidian": 0.10, "granite": 0.05},
    "foliated": {"slate": 0.25, "schist": 0.20, "gneiss": 0.15, "granite": -0.15},
    "non_foliated": {"granite": 0.10, "basalt": 0.10},
}


class DecisionEngine:
    def evaluate(
        self,
        vision: VisionAnalysisResponse,
        attributes: StructuredAttributes,
        specimen_facts: SpecimenFacts | None = None,
        follow_up_answers: list[FollowUpAnswer] | None = None,
        location: LocationContext | None = None,
    ) -> tuple[str, str, list[DecisionCandidate], float, list[str]]:
        candidates = self._build_candidates(vision)
        candidates = self._apply_attribute_rules(candidates, attributes)
        candidates = self._apply_followup_rules(candidates, follow_up_answers or [])
        candidates = self._apply_location_rules(candidates, location)
        candidates = self._apply_rag_consistency(candidates, attributes, specimen_facts)
        candidates.sort(key=lambda c: c.score, reverse=True)

        primary = candidates[0]
        classification = specimen_facts.rock_type if specimen_facts else self._infer_classification(primary.name)
        geological_consistency = self._compute_geological_consistency(attributes, specimen_facts)
        limitations = self._detect_limitations(vision, candidates)

        return primary.name, classification, candidates, geological_consistency, limitations

    def _build_candidates(self, vision: VisionAnalysisResponse) -> list[DecisionCandidate]:
        candidates = [
            DecisionCandidate(
                name=vision.primary_identification,
                score=vision.confidence,
                evidence=[vision.reasoning],
            )
        ]
        for alt in vision.alternatives:
            candidates.append(
                DecisionCandidate(
                    name=alt.name,
                    score=alt.confidence,
                    evidence=[f"Alternative candidate from vision model (confidence {alt.confidence:.2f})"],
                )
            )
        return candidates

    def _apply_attribute_rules(
        self,
        candidates: list[DecisionCandidate],
        attributes: StructuredAttributes,
    ) -> list[DecisionCandidate]:
        rules: list[tuple[str, float, str]] = []

        if attributes.vesicles:
            rules.append(("basalt", 0.20, "Vesicles observed — supports volcanic origin"))
            rules.append(("scoria", 0.15, "Vesicles observed — porous volcanic texture"))
            rules.append(("obsidian", -0.15, "Vesicles uncommon in obsidian"))
        else:
            rules.append(("obsidian", 0.10, "Absence of vesicles supports glassy volcanic rock"))

        if attributes.fracture.value == "conchoidal":
            rules.append(("obsidian", 0.25, "Conchoidal fracture strongly suggests obsidian or glass"))
            rules.append(("flint", 0.15, "Conchoidal fracture common in flint/chert"))

        if attributes.grain_size.value == "coarse" and attributes.visible_crystals:
            rules.append(("granite", 0.15, "Coarse visible crystals support intrusive igneous rock"))
            rules.append(("basalt", -0.10, "Basalt is typically fine-grained"))

        if attributes.layering or attributes.banding:
            rules.append(("slate", 0.15, "Layering/banding suggests foliated metamorphic rock"))
            rules.append(("schist", 0.10, "Banding common in schist"))
            rules.append(("gneiss", 0.10, "Banding common in gneiss"))

        if attributes.luster.value == "vitreous":
            rules.append(("obsidian", 0.15, "Vitreous luster supports glassy texture"))
            rules.append(("quartz", 0.10, "Vitreous luster common in quartz"))

        return self._apply_rules(candidates, rules)

    def _apply_followup_rules(
        self,
        candidates: list[DecisionCandidate],
        answers: list[FollowUpAnswer],
    ) -> list[DecisionCandidate]:
        rules: list[tuple[str, float, str]] = []
        for answer in answers:
            normalized = answer.answer.lower().strip()
            qid = answer.question_id.lower()

            if "vesicle" in qid or "bubble" in normalized or "porous" in normalized:
                if normalized in ("yes", "true", "present"):
                    for name, delta in FOLLOWUP_RULES["vesicles_present"].items():
                        rules.append((name, delta, f"Follow-up: vesicles present ({answer.answer})"))
                else:
                    for name, delta in FOLLOWUP_RULES["vesicles_absent"].items():
                        rules.append((name, delta, f"Follow-up: no vesicles ({answer.answer})"))

            if "fracture" in qid or "conchoidal" in normalized:
                if "conchoidal" in normalized or normalized in ("yes", "true"):
                    for name, delta in FOLLOWUP_RULES["conchoidal_fracture"].items():
                        rules.append((name, delta, f"Follow-up: conchoidal fracture ({answer.answer})"))

            if "magnetic" in qid:
                if normalized in ("yes", "true", "magnetic"):
                    for name, delta in FOLLOWUP_RULES["magnetic_yes"].items():
                        rules.append((name, delta, f"Follow-up: magnetic ({answer.answer})"))
                else:
                    for name, delta in FOLLOWUP_RULES["magnetic_no"].items():
                        rules.append((name, delta, f"Follow-up: non-magnetic ({answer.answer})"))

            if "foliat" in qid or "layer" in qid or "band" in qid:
                if normalized in ("yes", "true", "present", "foliated"):
                    for name, delta in FOLLOWUP_RULES["foliated"].items():
                        rules.append((name, delta, f"Follow-up: foliated/layered ({answer.answer})"))
                else:
                    for name, delta in FOLLOWUP_RULES["non_foliated"].items():
                        rules.append((name, delta, f"Follow-up: non-foliated ({answer.answer})"))

        return self._apply_rules(candidates, rules)

    def _apply_location_rules(
        self,
        candidates: list[DecisionCandidate],
        location: LocationContext | None,
    ) -> list[DecisionCandidate]:
        if not location or not location.region:
            return candidates

        region = location.region.lower()
        rules: list[tuple[str, float, str]] = []

        if any(term in region for term in ("volcanic", "hawaii", "iceland", "cascade")):
            rules.append(("basalt", 0.10, f"Volcanic region context: {location.region}"))
            rules.append(("obsidian", 0.10, f"Volcanic region context: {location.region}"))

        if any(term in region for term in ("mountain", "plutonic", "batholith")):
            rules.append(("granite", 0.10, f"Intrusive igneous region context: {location.region}"))

        return self._apply_rules(candidates, rules)

    def _apply_rag_consistency(
        self,
        candidates: list[DecisionCandidate],
        attributes: StructuredAttributes,
        specimen_facts: SpecimenFacts | None,
    ) -> list[DecisionCandidate]:
        if not specimen_facts:
            return candidates

        rules: list[tuple[str, float, str]] = []
        name = specimen_facts.name.lower()

        if attributes.vesicles and "igneous" in specimen_facts.rock_type.lower():
            rules.append((specimen_facts.name, 0.10, "RAG: vesicles consistent with igneous specimen profile"))

        if attributes.fracture.value == "conchoidal" and name == "obsidian":
            rules.append(("obsidian", 0.15, "RAG: conchoidal fracture matches obsidian profile"))

        return self._apply_rules(candidates, rules)

    def _apply_rules(
        self,
        candidates: list[DecisionCandidate],
        rules: list[tuple[str, float, str]],
    ) -> list[DecisionCandidate]:
        score_map = {c.name.lower(): c for c in candidates}

        for name, delta, evidence in rules:
            key = name.lower()
            if key in score_map:
                score_map[key].score = max(0.0, min(1.0, score_map[key].score + delta))
                score_map[key].evidence.append(evidence)
            else:
                score_map[key] = DecisionCandidate(name=name, score=max(0.0, delta), evidence=[evidence])

        return list(score_map.values())

    def _compute_geological_consistency(
        self,
        attributes: StructuredAttributes,
        specimen_facts: SpecimenFacts | None,
    ) -> float:
        if not specimen_facts:
            return 0.5

        matches = 0
        total = 3

        if attributes.dominant_colors and specimen_facts.colors:
            overlap = set(c.lower() for c in attributes.dominant_colors) & set(
                c.lower() for c in specimen_facts.colors
            )
            if overlap:
                matches += 1

        rock_type = specimen_facts.rock_type.lower()
        if "igneous" in rock_type and attributes.visible_crystals:
            matches += 1
        elif "metamorphic" in rock_type and (attributes.layering or attributes.banding):
            matches += 1
        elif "sedimentary" in rock_type and attributes.grain_size.value in ("fine", "medium"):
            matches += 1

        if specimen_facts.formation:
            matches += 1

        return matches / total

    def _detect_limitations(
        self,
        vision: VisionAnalysisResponse,
        candidates: list[DecisionCandidate],
    ) -> list[str]:
        limitations: list[str] = []

        if vision.confidence < 0.65:
            limitations.append(LIMITATION_MESSAGES[0])

        names = [c.name.lower() for c in candidates[:3]]
        for a, b in AMBIGUOUS_PAIRS:
            if a in names and b in names:
                for msg in LIMITATION_MESSAGES[1:]:
                    if a in msg.lower() or b in msg.lower():
                        limitations.append(msg)
                        break

        if len(candidates) >= 2 and abs(candidates[0].score - candidates[1].score) < 0.15:
            limitations.append("Top candidates have similar scores — physical testing recommended.")

        return list(dict.fromkeys(limitations))

    def _infer_classification(self, name: str) -> str:
        classification_map = {
            "granite": "Igneous Rock",
            "granodiorite": "Igneous Rock",
            "diorite": "Igneous Rock",
            "basalt": "Igneous Rock",
            "obsidian": "Igneous Rock",
            "scoria": "Igneous Rock",
            "marble": "Metamorphic Rock",
            "slate": "Metamorphic Rock",
            "schist": "Metamorphic Rock",
            "gneiss": "Metamorphic Rock",
            "quartzite": "Metamorphic Rock",
            "sandstone": "Sedimentary Rock",
            "limestone": "Sedimentary Rock",
            "shale": "Sedimentary Rock",
            "quartz": "Mineral",
            "calcite": "Mineral",
            "pyrite": "Mineral",
            "amethyst": "Gemstone",
            "flint": "Sedimentary Rock",
        }
        return classification_map.get(name.lower(), "Geological Specimen")
