from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Equipamento, Agente, Manutencao
from app.schemas import ResumoOperacional, AlertaItem, SeveridadeAlerta, ItemMapa


def ensure_utc(dt):
    if not dt:
        return datetime.now(timezone.utc)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def obter_resumo_operacional(db: Session) -> ResumoOperacional:
    agora = datetime.now(timezone.utc)

    equipamentos = db.query(Equipamento).filter(Equipamento.status != "desativado").all()
    total = len(equipamentos)
    operacionais = sum(1 for e in equipamentos if e.status == "operacional")
    indisponiveis = sum(1 for e in equipamentos if e.status in {"com_falha", "furtado", "nao_instalado", "em_manutencao"})

    disponibilidade = round((operacionais / total) * 100, 1) if total > 0 else None

    agentes_ativos = (
        db.query(func.count(Agente.id))
        .filter(Agente.status.in_(["ativo", "em_servico"]))
        .scalar() or 0
    )

    manutencoes_abertas = (
        db.query(Manutencao)
        .filter(Manutencao.status.in_(["aberta", "em_andamento"]))
        .all()
    )

    criticas = sum(1 for m in manutencoes_abertas if m.prioridade == "imediata")
    atrasadas = sum(
        1 for m in manutencoes_abertas
        if m.data_prevista and ensure_utc(m.data_prevista) < agora
    )

    return ResumoOperacional(
        total_equipamentos=total,
        operacionais=operacionais,
        indisponiveis=indisponiveis,
        disponibilidade_percentual=disponibilidade,
        agentes_ativos=agentes_ativos,
        manutencoes_criticas=criticas,
        manutencoes_atrasadas=atrasadas,
    )


def obter_alertas_operacionais(db: Session) -> List[AlertaItem]:
    agora = datetime.now(timezone.utc)
    alertas: List[AlertaItem] = []

    # Falhas em equipamentos
    for eq in db.query(Equipamento).filter(Equipamento.status == "com_falha"):
        alertas.append(
            AlertaItem(
                id=f"eq-falha-{eq.id}",
                tipo="equipamento_falha",
                severidade=SeveridadeAlerta.CRITICO,
                titulo=f"Equipamento inoperante: {eq.codigo}",
                descricao=f"{eq.nome} ({eq.tipo}) com interrupção registrada em {eq.bairro}.",
                equipamento_id=eq.id,
                equipamento_codigo=eq.codigo,
                bairro=eq.bairro,
                data=ensure_utc(eq.atualizado_em),
            )
        )

    # Manutenções emergenciais
    imediatas = (
        db.query(Manutencao)
        .join(Equipamento)
        .filter(
            Manutencao.prioridade == "imediata",
            Manutencao.status.in_(["aberta", "em_andamento"]),
        )
    )
    for m in imediatas:
        codigo = m.equipamento.codigo if m.equipamento else "Equipamento"
        bairro = m.equipamento.bairro if m.equipamento else None
        alertas.append(
            AlertaItem(
                id=f"manut-critica-{m.id}",
                tipo="manutencao_imediata",
                severidade=SeveridadeAlerta.CRITICO,
                titulo=f"O.S. Imediata: {codigo}",
                descricao=f"Chamado #{m.id}: {m.descricao}",
                equipamento_id=m.equipamento_id,
                equipamento_codigo=codigo,
                bairro=bairro,
                data=ensure_utc(m.data_abertura),
            )
        )

    # Manutenções com prazo vencido
    abertas = (
        db.query(Manutencao)
        .join(Equipamento)
        .filter(
            Manutencao.status.in_(["aberta", "em_andamento"]),
            Manutencao.data_prevista.isnot(None),
        )
    )
    for m in abertas:
        data_prev = ensure_utc(m.data_prevista)
        if data_prev < agora and m.prioridade != "imediata":
            codigo = m.equipamento.codigo if m.equipamento else "Equipamento"
            alertas.append(
                AlertaItem(
                    id=f"manut-atrasada-{m.id}",
                    tipo="manutencao_atrasada",
                    severidade=SeveridadeAlerta.ALERTA,
                    titulo=f"O.S. Atrasada: {codigo}",
                    descricao=f"Prazo expirou em {data_prev.strftime('%d/%m/%Y %H:%M')}. Responsável: {m.responsavel or 'Não atribuído'}.",
                    equipamento_id=m.equipamento_id,
                    equipamento_codigo=codigo,
                    bairro=m.equipamento.bairro if m.equipamento else None,
                    data=data_prev,
                )
            )

    # Ocorrências especiais (furtos / desativações)
    especiais = db.query(Equipamento).filter(Equipamento.status.in_(["furtado", "nao_instalado", "desativado"]))
    for eq in especiais:
        alertas.append(
            AlertaItem(
                id=f"eq-info-{eq.id}",
                tipo="equipamento_status_especial",
                severidade=SeveridadeAlerta.INFORMATIVO,
                titulo=f"Ativo {eq.status.replace('_', ' ').capitalize()}: {eq.codigo}",
                descricao=f"{eq.nome} ({eq.bairro}) registrado como '{eq.status}'.",
                equipamento_id=eq.id,
                equipamento_codigo=eq.codigo,
                bairro=eq.bairro,
                data=ensure_utc(eq.atualizado_em),
            )
        )

    alertas.sort(key=lambda a: ensure_utc(a.data), reverse=True)
    return alertas


def obter_itens_mapa(db: Session) -> List[ItemMapa]:
    itens: List[ItemMapa] = []

    for eq in db.query(Equipamento).filter(Equipamento.latitude.isnot(None), Equipamento.longitude.isnot(None)):
        itens.append(
            ItemMapa(
                id=eq.id,
                categoria="equipamento",
                identificador=eq.codigo,
                nome=eq.nome,
                tipo_ou_funcao=eq.tipo,
                status=eq.status,
                bairro=eq.bairro,
                latitude=eq.latitude,
                longitude=eq.longitude,
                detalhes={
                    "marca": eq.marca,
                    "modelo": eq.modelo,
                    "rua": eq.rua,
                    "cidade": eq.cidade,
                },
            )
        )

    for ag in db.query(Agente).filter(Agente.latitude.isnot(None), Agente.longitude.isnot(None)):
        itens.append(
            ItemMapa(
                id=ag.id,
                categoria="agente",
                identificador=ag.matricula,
                nome=ag.nome,
                tipo_ou_funcao=ag.funcao,
                status=ag.status,
                bairro=ag.bairro_base,
                latitude=ag.latitude,
                longitude=ag.longitude,
                detalhes={
                    "orgao": ag.orgao,
                    "bairro_base": ag.bairro_base,
                },
            )
        )

    return itens
