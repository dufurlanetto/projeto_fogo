from collections import defaultdict
from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session
from app.models import Equipamento, Manutencao
from app.schemas import RegiaoPreditiva, NivelAtencao, FatoresRegiao


def calcular_pontuacao(falhas: int, imediatas: int, atrasadas: int, inativos: int) -> int:
    total = (falhas * 20) + (imediatas * 20) + (atrasadas * 10) + (inativos * 10)
    return min(100, max(0, total))


def classificar_nivel(pontuacao: int) -> NivelAtencao:
    if pontuacao <= 24:
        return NivelAtencao.BAIXA
    if pontuacao <= 49:
        return NivelAtencao.MODERADA
    if pontuacao <= 74:
        return NivelAtencao.ALTA
    return NivelAtencao.MUITO_ALTA


def gerar_recomendacoes(nivel: NivelAtencao, falhas: int, imediatas: int, atrasadas: int, inativos: int) -> List[str]:
    recs = []
    if nivel == NivelAtencao.BAIXA:
        recs.append("Manter rotina operacional regular.")
    elif nivel == NivelAtencao.MODERADA:
        recs.append("Reforçar inspeção preventiva e acompanhar ordens em aberto.")
    elif nivel == NivelAtencao.ALTA:
        recs.append("Deslocar equipe técnica e priorizar ativos com falha.")
    else:
        recs.append("Intervenção imediata: coordenar plantão técnico com equipe de trânsito.")

    if imediatas:
        recs.append(f"{imediatas} chamado(s) emergencial(is) aguardando atendimento.")
    if falhas:
        recs.append(f"{falhas} equipamento(s) sem sinal ou com pane.")
    if atrasadas:
        recs.append(f"{atrasadas} ordem(ns) de serviço ultrapassaram a data prevista.")
    if inativos:
        recs.append(f"{inativos} ocorrência(s) de furto ou equipamento pendente de instalação.")

    return recs


def obter_regioes_preditivas(db: Session) -> List[RegiaoPreditiva]:
    agora = datetime.now(timezone.utc)

    equipamentos = db.query(Equipamento).all()
    manutencoes = db.query(Manutencao).join(Equipamento).all()

    bairros_equipamentos = defaultdict(list)
    for eq in equipamentos:
        if eq.bairro:
            bairros_equipamentos[eq.bairro].append(eq)

    bairros_manutencoes = defaultdict(list)
    for m in manutencoes:
        if m.equipamento and m.equipamento.bairro:
            bairros_manutencoes[m.equipamento.bairro].append(m)

    todos_bairros = sorted(set(bairros_equipamentos.keys()) | set(bairros_manutencoes.keys()))
    resultado: List[RegiaoPreditiva] = []

    for bairro in todos_bairros:
        eqs = bairros_equipamentos[bairro]
        mans = bairros_manutencoes[bairro]

        falhas = sum(1 for e in eqs if e.status == "com_falha")
        inativos = sum(1 for e in eqs if e.status in {"furtado", "nao_instalado"})
        imediatas = sum(1 for m in mans if m.prioridade == "imediata" and m.status in {"aberta", "em_andamento"})

        atrasadas = 0
        for m in mans:
            if m.status in {"aberta", "em_andamento"} and m.data_prevista:
                dt = m.data_prevista if m.data_prevista.tzinfo else m.data_prevista.replace(tzinfo=timezone.utc)
                if dt < agora:
                    atrasadas += 1

        pontos = calcular_pontuacao(falhas, imediatas, atrasadas, inativos)
        nivel = classificar_nivel(pontos)

        resultado.append(
            RegiaoPreditiva(
                bairro=bairro,
                pontuacao=pontos,
                nivel=nivel,
                total_equipamentos=len(eqs),
                fatores=FatoresRegiao(
                    equipamentos_falha=falhas,
                    manutencoes_imediatas=imediatas,
                    manutencoes_atrasadas=atrasadas,
                    equipamentos_furtados_indisponiveis=inativos,
                ),
                recomendacoes=gerar_recomendacoes(nivel, falhas, imediatas, atrasadas, inativos),
            )
        )

    resultado.sort(key=lambda r: r.pontuacao, reverse=True)
    return resultado
