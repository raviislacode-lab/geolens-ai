from __future__ import annotations

import json
import logging
from pathlib import Path

from schemas.identification import SpecimenFacts, StructuredAttributes

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent / "data"
SEED_FILE = DATA_DIR / "specimens.json"


class RAGService:
    def __init__(self) -> None:
        self.specimens: dict[str, SpecimenFacts] = {}
        self._vector_store = None
        self._load_seed_data()
        self._init_vector_store()

    def _load_seed_data(self) -> None:
        if not SEED_FILE.exists():
            logger.warning("Seed file not found: %s", SEED_FILE)
            return

        with open(SEED_FILE) as f:
            data = json.load(f)

        for item in data:
            facts = SpecimenFacts.model_validate(item)
            self.specimens[facts.name.lower()] = facts

    def _init_vector_store(self) -> None:
        try:
            from langchain_community.vectorstores import Chroma
            from langchain_core.documents import Document
            from langchain_core.embeddings import Embeddings

            class SimpleEmbeddings(Embeddings):
                def embed_documents(self, texts: list[str]) -> list[list[float]]:
                    return [self._hash_embed(t) for t in texts]

                def embed_query(self, text: str) -> list[float]:
                    return self._hash_embed(text)

                def _hash_embed(self, text: str) -> list[float]:
                    import hashlib

                    h = hashlib.sha256(text.lower().encode()).digest()
                    return [b / 255.0 for b in h[:32]] + [0.0] * 32

            documents = []
            for facts in self.specimens.values():
                content = (
                    f"{facts.name} {facts.rock_type} {facts.about} "
                    f"Hardness: {facts.hardness}. Colors: {', '.join(facts.colors)}. "
                    f"Formation: {facts.formation}. Found in: {facts.found_in}."
                )
                documents.append(
                    Document(
                        page_content=content,
                        metadata={"name": facts.name.lower()},
                    )
                )

            if documents:
                self._vector_store = Chroma.from_documents(
                    documents=documents,
                    embedding=SimpleEmbeddings(),
                    persist_directory=str(DATA_DIR / "chroma"),
                )
        except Exception as exc:
            logger.warning("Vector store init failed, using direct lookup: %s", exc)
            self._vector_store = None

    def retrieve(self, name: str, attributes: StructuredAttributes | None = None) -> SpecimenFacts | None:
        key = name.lower().strip()
        if key in self.specimens:
            return self.specimens[key]

        if self._vector_store:
            try:
                query = name
                if attributes:
                    query += f" {attributes.texture} {' '.join(attributes.dominant_colors)}"
                results = self._vector_store.similarity_search(query, k=1)
                if results:
                    meta_name = results[0].metadata.get("name", "")
                    if meta_name in self.specimens:
                        return self.specimens[meta_name]
            except Exception as exc:
                logger.warning("Vector search failed: %s", exc)

        for specimen_key, facts in self.specimens.items():
            if key in specimen_key or specimen_key in key:
                return facts

        return None

    def get_by_name(self, name: str) -> SpecimenFacts | None:
        return self.specimens.get(name.lower().strip())

    def list_all(self) -> list[SpecimenFacts]:
        return list(self.specimens.values())
