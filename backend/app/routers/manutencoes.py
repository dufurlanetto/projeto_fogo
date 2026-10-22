from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Manutencao, Equipamento
from app.schemas import ManutencaoCreate, ManutencaoUpdate, ManutencaoResponse

router = APIRouter(prefix="/manutencoes", tags=["Manutenções"])


def to_response(m: Manutencao) -> ManutencaoResponse:
    return ManutencaoResponse(
        id=m.id,
        equipamento_id=m.equipamento_id,
        descricao=m.descricao,
        prioridade=m.prioridade,
        status=m.status,
        data_abertura=m.data_abertura,
        data_prevista=m.data_prevista,
        data_conclusao=m.data_conclusao,
        responsavel=m.responsavel,
        observacoes=m.observacoes,
        equipamento_codigo=m.equipamento.codigo if m.equipamento else None,
        equipamento_nome=m.equipamento.nome if m.equipamento else None,
    )


@router.get("", response_model=List[ManutencaoResponse])
def listar_manutencoes(
    status_m: Optional[str] = Query(None, alias="status", description="Filtrar por status"),
    prioridade: Optional[str] = Query(None, description="Filtrar por prioridade"),
    equipamento_id: Optional[int] = Query(None, description="Filtrar por equipamento"),
    db: Session = Depends(get_db),
):
    query = db.query(Manutencao).join(Equipamento)
    if status_m:
        query = query.filter(Manutencao.status == status_m)
    if prioridade:
        query = query.filter(Manutencao.prioridade == prioridade)
    if equipamento_id:
        query = query.filter(Manutencao.equipamento_id == equipamento_id)

    itens = query.order_by(Manutencao.data_abertura.desc()).all()
    return [to_response(m) for m in itens]


@router.post("", response_model=ManutencaoResponse, status_code=status.HTTP_201_CREATED)
def abrir_manutencao(payload: ManutencaoCreate, db: Session = Depends(get_db)):
    equipamento = db.query(Equipamento).filter(Equipamento.id == payload.equipamento_id).first()
    if not equipamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipamento ID {payload.equipamento_id} não existe.",
        )

    # Se a manutenção for aberta e o equipamento não estiver em manutenção, podemos opcionalmente atualizar status
    if payload.status == "em_andamento" and equipamento.status == "operacional":
        equipamento.status = "em_manutencao"

    manutencao = Manutencao(**payload.model_dump())
    db.add(manutencao)
    db.commit()
    db.refresh(manutencao)
    return to_response(manutencao)


@router.get("/{id}", response_model=ManutencaoResponse)
def obter_manutencao(id: int, db: Session = Depends(get_db)):
    manutencao = db.query(Manutencao).filter(Manutencao.id == id).first()
    if not manutencao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manutenção não encontrada.")
    return to_response(manutencao)


@router.patch("/{id}", response_model=ManutencaoResponse)
def atualizar_manutencao(id: int, payload: ManutencaoUpdate, db: Session = Depends(get_db)):
    manutencao = db.query(Manutencao).filter(Manutencao.id == id).first()
    if not manutencao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manutenção não encontrada.")

    dados = payload.model_dump(exclude_unset=True)

    # Se concluiu a manutenção e não informou data de conclusão, registra agora
    if dados.get("status") == "concluida" and not dados.get("data_conclusao"):
        manutencao.data_conclusao = datetime.now(timezone.utc)

    for campo, valor in dados.items():
        setattr(manutencao, campo, valor)

    db.commit()
    db.refresh(manutencao)
    return to_response(manutencao)
