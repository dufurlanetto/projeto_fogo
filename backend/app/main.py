from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import (
    equipamentos,
    agentes,
    manutencoes,
    operacoes,
    preditivo,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="FOGO — API de Operações Urbanas",
    description="Serviços de monitoramento de ativos, equipes de campo e análise operacional.",
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


@app.get("/api/health", tags=["Status"])
def health_check():
    return {"status": "ok", "app": "FOGO API", "version": "1.0.0"}


app.include_router(equipamentos.router, prefix="/api")
app.include_router(agentes.router, prefix="/api")
app.include_router(manutencoes.router, prefix="/api")
app.include_router(operacoes.router, prefix="/api")
app.include_router(preditivo.router, prefix="/api")
