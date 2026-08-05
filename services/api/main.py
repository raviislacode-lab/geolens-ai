from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.identify import router as identify_router
from services.rag import RAGService


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.rag = RAGService()
    yield


app = FastAPI(
    title="GeoLens AI API",
    description="AI-powered geological specimen identification",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(identify_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "geolens-ai"}
