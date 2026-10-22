from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ResumoOperacional, AlertaItem, ItemMapa
from app.services.indicadores import (
    obter_resumo_operacional,
    obter_alertas_operacionais,
    obter_itens_mapa,
)

router = APIRouter(prefix="/operacoes", tags=["Central de Operações"])


@router.get("/resumo", response_model=ResumoOperacional)
def get_resumo_operacional(db: Session = Depends(get_db)):
    """Retorna contadores operacionais consolidados e percentual de disponibilidade."""
    return obter_resumo_operacional(db)


@router.get("/alertas", response_model=List[AlertaItem])
def get_alertas_operacionais(db: Session = Depends(get_db)):
    """Retorna lista de alertas em tempo real categorizados por criticidade."""
    return obter_alertas_operacionais(db)


@router.get("/mapa", response_model=List[ItemMapa])
def get_itens_mapa(db: Session = Depends(get_db)):
    """Retorna equipamentos e agentes com coordenadas geográficas válidas para o Leaflet."""
    return obter_itens_mapa(db)
