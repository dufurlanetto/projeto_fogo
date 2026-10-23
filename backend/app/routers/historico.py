import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Historico
from app.schemas import HistoricoResponse

router = APIRouter(prefix="/historico", tags=["Historico"])


@router.get("", response_model=List[HistoricoResponse])
def listar_historico(
    db: Session = Depends(get_db),
):
    query = db.query(Historico)

    return query.order_by(Historico.id.desc()).all()

