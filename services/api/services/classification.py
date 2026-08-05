from schemas.identification import (
    Fracture,
    GrainSize,
    Luster,
    MagneticStatus,
    StructuredAttributes,
    Transparency,
    VisualFeatures,
)

GRAIN_SIZE_MAP = {
    "very fine": GrainSize.VERY_FINE,
    "very_fine": GrainSize.VERY_FINE,
    "fine": GrainSize.FINE,
    "medium": GrainSize.MEDIUM,
    "coarse": GrainSize.COARSE,
    "very coarse": GrainSize.VERY_COARSE,
    "very_coarse": GrainSize.VERY_COARSE,
}

LUSTER_MAP = {
    "metallic": Luster.METALLIC,
    "non-metallic": Luster.NON_METALLIC,
    "non_metallic": Luster.NON_METALLIC,
    "vitreous": Luster.VITREOUS,
    "pearly": Luster.PEARLY,
    "resinous": Luster.RESINOUS,
    "dull": Luster.DULL,
    "glassy": Luster.VITREOUS,
}

TRANSPARENCY_MAP = {
    "transparent": Transparency.TRANSPARENT,
    "translucent": Transparency.TRANSLUCENT,
    "opaque": Transparency.OPAQUE,
}

FRACTURE_MAP = {
    "conchoidal": Fracture.CONCHOIDAL,
    "uneven": Fracture.UNEVEN,
    "splintery": Fracture.SPLINTERY,
    "hackly": Fracture.HACKLY,
}


class ClassificationLayer:
    def normalize(self, visual_features: VisualFeatures) -> StructuredAttributes:
        grain_key = visual_features.grain_size.lower().replace("-", "_").strip()
        luster_key = (visual_features.luster or "unknown").lower().replace("-", "_").strip()
        transparency_key = (visual_features.transparency or "unknown").lower().strip()
        fracture_key = (visual_features.fracture or "unknown").lower().strip()

        return StructuredAttributes(
            grain_size=GRAIN_SIZE_MAP.get(grain_key, GrainSize.UNKNOWN),
            luster=LUSTER_MAP.get(luster_key, Luster.UNKNOWN),
            transparency=TRANSPARENCY_MAP.get(transparency_key, Transparency.UNKNOWN),
            fracture=FRACTURE_MAP.get(fracture_key, Fracture.UNKNOWN),
            cleavage_visible=bool(visual_features.cleavage_visible),
            banding=bool(visual_features.banding),
            vesicles=bool(visual_features.vesicles),
            magnetic=MagneticStatus.UNKNOWN,
            texture=visual_features.texture,
            dominant_colors=visual_features.dominant_colors,
            visible_crystals=bool(visual_features.visible_crystals),
            layering=bool(visual_features.layering),
        )
