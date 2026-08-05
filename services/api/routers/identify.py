from fastapi import APIRouter, HTTPException

from schemas.identification import FollowUpRequest, IdentificationResult, IdentifyRequest, SpecimenFacts
from services.pipeline import IdentificationPipeline
from services.rag import RAGService

router = APIRouter(prefix="/v1", tags=["identification"])
pipeline = IdentificationPipeline()
rag = RAGService()


@router.post("/identify", response_model=IdentificationResult)
async def identify_specimen(request: IdentifyRequest) -> IdentificationResult:
    if not request.image_base64:
        raise HTTPException(status_code=400, detail="image_base64 is required")
    return await pipeline.identify(request)


@router.post("/identify/follow-up", response_model=IdentificationResult)
async def identify_follow_up(request: FollowUpRequest) -> IdentificationResult:
    if not request.answers:
        raise HTTPException(status_code=400, detail="At least one follow-up answer is required")
    return await pipeline.follow_up(request)


@router.get("/specimens/{name}", response_model=SpecimenFacts)
async def get_specimen(name: str) -> SpecimenFacts:
    facts = rag.get_by_name(name)
    if not facts:
        facts = rag.retrieve(name)
    if not facts:
        raise HTTPException(status_code=404, detail=f"Specimen '{name}' not found")
    return facts
