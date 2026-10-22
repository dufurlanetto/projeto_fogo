from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Agente
from app.schemas import AgenteCreate, AgenteUpdate, AgenteResponse

router = APIRouter(prefix="/agentes", tags=["Agentes"])


@router.get("", response_model=List[AgenteResponse])
def listar_agentes(
    status_agente: Optional[str] = Query(None, alias="status", description="Filtrar por status"),
    orgao: Optional[str] = Query(None, description="Filtrar por órgão"),
    bairro: Optional[str] = Query(None, description="Filtrar por bairro base"),
    db: Session = Depends(get_db),
):
    query = db.query(Agente)
    if status_agente:
        query = query.filter(Agente.status == status_agente)
    if orgao:
        query = query.filter(Agente.orgao.ilike(f"%{orgao}%"))
    if bairro:
        query = query.filter(Agente.bairro_base.ilike(f"%{bairro}%"))
    return query.order_by(Agente.id.desc()).all()


@router.post("", response_model=AgenteResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_agente(payload: AgenteCreate, db: Session = Depends(get_db)):
    # Impedir matrícula duplicada
    existente = db.query(Agente).filter(Agente.matricula == payload.matricula).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Matrícula '{payload.matricula}' já cadastrada.",
        )

    agente = Agente(**payload.model_dump())
    db.add(agente)
    db.commit()
    db.refresh(agente)
    return agente


@router.get("/{id}", response_model=AgenteResponse)
def obter_agente(id: int, db: Session = Depends(get_db)):
    agente = db.query(Agente).filter(Agente.id == id).first()
    if not agente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agente não encontrado.")
    return agente


@router.patch("/{id}", response_model=AgenteResponse)
def atualizar_agente(id: int, payload: AgenteUpdate, db: Session = Depends(get_db)):
    agente = db.query(Agente).filter(Agente.id == id).first()
    if not agente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agente não encontrado.")

    dados = payload.model_dump(exclude_unset=True)

    if "matricula" in dados and dados["matricula"] != agente.matricula:
        existente = db.query(Agente).filter(Agente.matricula == dados["matricula"]).first()
        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Matrícula '{dados['matricula']}' já está em uso.",
            )

    for campo, valor in dados.items():
        setattr(agente, campo, valor)

    db.commit()
    db.refresh(agente)
    return agente
