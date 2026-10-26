from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.predictions import prever_acidentes
from app.schemas import PrevisaoAcidente, RegiaoPreditiva
from app.services.risco import obter_regioes_preditivas

router = APIRouter(prefix="/preditivo", tags=["Cidade Preditiva"])


@router.get("/regioes", response_model=List[RegiaoPreditiva])
def get_regioes_preditivas(db: Session = Depends(get_db)):
    """Retorna todas as regiões ordenadas por pontuação heurística decrescente."""
    return obter_regioes_preditivas(db)


@router.get("/regioes/{bairro}", response_model=RegiaoPreditiva)
def get_detalhe_regiao(bairro: str, db: Session = Depends(get_db)):
    """Retorna detalhes e fatores de atenção operacional para um bairro específico."""
    regioes = obter_regioes_preditivas(db)
    for r in regioes:
        if r.bairro.lower() == bairro.lower():
            return r
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Região/bairro '{bairro}' não encontrada no inventário.",
    )


@router.get("/acidentes/{bairro}", response_model=List[PrevisaoAcidente])
def get_previsoes_acidentes(bairro: str, db: Session = Depends(get_db)):
    """Estima risco por tipo de acidente usando histórico e disponibilidade local."""
    previsoes = prever_acidentes(db, bairro)
    if not previsoes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nenhum acidente encontrado no histórico do bairro '{bairro}'.",
        )
    return previsoes


@router.get("/acidentes", response_model=List[PrevisaoAcidente])
def get_todas_previsoes_acidentes(db: Session = Depends(get_db)):
    """Retorna previsões de acidentes para todos os bairros com histórico."""
    return prever_acidentes(db)
