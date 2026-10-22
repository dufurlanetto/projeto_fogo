import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Equipamento
from app.schemas import EquipamentoCreate, EquipamentoUpdate, EquipamentoResponse

router = APIRouter(prefix="/equipamentos", tags=["Equipamentos"])


@router.get("", response_model=List[EquipamentoResponse])
def listar_equipamentos(
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    status_eq: Optional[str] = Query(None, alias="status", description="Filtrar por status"),
    bairro: Optional[str] = Query(None, description="Filtrar por bairro"),
    busca: Optional[str] = Query(None, description="Busca textual por código, nome ou número de série"),
    db: Session = Depends(get_db),
):
    query = db.query(Equipamento)

    if tipo:
        query = query.filter(Equipamento.tipo == tipo)
    if status_eq:
        query = query.filter(Equipamento.status == status_eq)
    if bairro:
        query = query.filter(Equipamento.bairro.ilike(f"%{bairro}%"))
    if busca:
        termo = f"%{busca}%"
        query = query.filter(
            or_(
                Equipamento.codigo.ilike(termo),
                Equipamento.nome.ilike(termo),
                Equipamento.numero_serie.ilike(termo),
            )
        )

    return query.order_by(Equipamento.id.desc()).all()


@router.post("", response_model=EquipamentoResponse, status_code=status.HTTP_201_CREATED)
def criar_equipamento(payload: EquipamentoCreate, db: Session = Depends(get_db)):
    # Impedir código duplicado
    existente = db.query(Equipamento).filter(Equipamento.codigo == payload.codigo).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Código de equipamento '{payload.codigo}' já cadastrado.",
        )

    dados = payload.model_dump()
    caracteristicas = dados.pop("caracteristicas_json", {}) or {}
    
    equipamento = Equipamento(
        **dados,
        caracteristicas_json=json.dumps(caracteristicas)
    )
    db.add(equipamento)
    db.commit()
    db.refresh(equipamento)
    return equipamento


@router.get("/{id}", response_model=EquipamentoResponse)
def obter_equipamento(id: int, db: Session = Depends(get_db)):
    equipamento = db.query(Equipamento).filter(Equipamento.id == id).first()
    if not equipamento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipamento não encontrado.")
    return equipamento


@router.patch("/{id}", response_model=EquipamentoResponse)
def atualizar_equipamento(id: int, payload: EquipamentoUpdate, db: Session = Depends(get_db)):
    equipamento = db.query(Equipamento).filter(Equipamento.id == id).first()
    if not equipamento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipamento não encontrado.")

    dados = payload.model_dump(exclude_unset=True)

    if "codigo" in dados and dados["codigo"] != equipamento.codigo:
        existente = db.query(Equipamento).filter(Equipamento.codigo == dados["codigo"]).first()
        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Código de equipamento '{dados['codigo']}' já está em uso.",
            )

    if "caracteristicas_json" in dados:
        equipamento.caracteristicas_json = json.dumps(dados.pop("caracteristicas_json") or {})

    for campo, valor in dados.items():
        setattr(equipamento, campo, valor)

    db.commit()
    db.refresh(equipamento)
    return equipamento


@router.delete("/{id}", response_model=EquipamentoResponse)
def desativar_equipamento(id: int, db: Session = Depends(get_db)):
    """Desativação lógica para preservar histórico de manutenção e integridade."""
    equipamento = db.query(Equipamento).filter(Equipamento.id == id).first()
    if not equipamento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipamento não encontrado.")

    equipamento.status = "desativado"
    db.commit()
    db.refresh(equipamento)
    return equipamento
