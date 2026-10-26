from collections import defaultdict
import math
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models import Agente, Equipamento, Historico
from app.schemas import PrevisaoAcidente
from app.services.risco import classificar_nivel


STATUS_EQUIPAMENTO_INDISPONIVEL = {
    "com_falha",
    "desativado",
    "em_manutencao",
    "furtado",
    "nao_instalado",
}

BANDWIDTH_METROS = 500
RAIO_TERRA_METROS = 6_371_000


def _normalizar(texto: str) -> str:
    return " ".join(texto.split()).casefold()


def _distancia_haversine(
    ponto_a: Tuple[float, float], ponto_b: Tuple[float, float]
) -> float:
    latitude_a, longitude_a = map(math.radians, ponto_a)
    latitude_b, longitude_b = map(math.radians, ponto_b)
    delta_latitude = latitude_b - latitude_a
    delta_longitude = longitude_b - longitude_a
    seno_latitude = math.sin(delta_latitude / 2) ** 2
    seno_longitude = math.sin(delta_longitude / 2) ** 2
    a = seno_latitude + math.cos(latitude_a) * math.cos(latitude_b) * seno_longitude
    return 2 * RAIO_TERRA_METROS * math.asin(math.sqrt(min(a, 1)))


def _estimar_densidade_espacial(
    historicos: List[Historico],
) -> Dict[Tuple[str, float, float], int]:
    """Aplica KDE gaussiana e normaliza contra a maior densidade observada."""
    pontos_por_bairro: Dict[str, List[Tuple[float, float]]] = defaultdict(list)
    for item in historicos:
        if item.latitude is None or item.longitude is None:
            continue
        pontos_por_bairro[_normalizar(item.bairro)].append(
            (item.latitude, item.longitude)
        )

    densidades_por_bairro: Dict[str, Dict[Tuple[float, float], float]] = {}
    for bairro, pontos in pontos_por_bairro.items():
        densidades: Dict[Tuple[float, float], float] = {}
        for ponto in set(pontos):
            densidades[ponto] = sum(
                math.exp(
                    -0.5
                    * (_distancia_haversine(ponto, observacao) / BANDWIDTH_METROS) ** 2
                )
                for observacao in pontos
            )
        densidades_por_bairro[bairro] = densidades

    maior_densidade = max(
        (
            densidade
            for densidades in densidades_por_bairro.values()
            for densidade in densidades.values()
        ),
        default=0,
    )
    indices: Dict[Tuple[str, float, float], int] = {}
    if maior_densidade == 0:
        return indices

    for bairro, densidades in densidades_por_bairro.items():
        for ponto, densidade in densidades.items():
            indices[(bairro, ponto[0], ponto[1])] = round(
                100 * densidade / maior_densidade
            )
    return indices


def prever_acidentes(
    db: Session, bairro: Optional[str] = None
) -> List[PrevisaoAcidente]:
    """Estima recorrência e densidade espacial dos acidentes por local.

    O índice espacial é KDE relativo por bairro, não uma probabilidade calibrada.
    A pontuação anterior também considera equipamentos e agentes indisponíveis:
    até 60 pontos pela recorrência e 40 pelos estados operacionais.
    """
    historicos = db.query(Historico).order_by(Historico.id.desc()).all()
    indices_espaciais = _estimar_densidade_espacial(historicos)
    bairro_normalizado = _normalizar(bairro) if bairro else None
    if bairro_normalizado:
        historicos = [
            item
            for item in historicos
            if _normalizar(item.bairro) == bairro_normalizado
        ]
    if not historicos:
        return []

    equipamentos_por_bairro: Dict[str, List[Equipamento]] = defaultdict(list)
    for item in db.query(Equipamento).all():
        equipamentos_por_bairro[_normalizar(item.bairro)].append(item)

    agentes_por_bairro: Dict[str, List[Agente]] = defaultdict(list)
    for item in db.query(Agente).all():
        agentes_por_bairro[_normalizar(item.bairro_base)].append(item)

    contagens: Dict[Tuple[str, str, Optional[float], Optional[float]], int] = defaultdict(int)
    descricoes: Dict[
        Tuple[str, str, Optional[float], Optional[float]], Tuple[str, str]
    ] = {}
    for item in historicos:
        chave = (
            _normalizar(item.bairro),
            _normalizar(item.parecer),
            item.latitude,
            item.longitude,
        )
        contagens[chave] += 1
        descricoes.setdefault(chave, (item.bairro.strip(), item.parecer.strip()))

    resultado: List[PrevisaoAcidente] = []
    for (bairro_chave, parecer_chave, latitude, longitude), ocorrencias in contagens.items():
        bairro_descricao, parecer = descricoes[
            (bairro_chave, parecer_chave, latitude, longitude)
        ]
        equipamentos = equipamentos_por_bairro[bairro_chave]
        agentes = agentes_por_bairro[bairro_chave]
        equipamentos_indisponiveis = sum(
            1
            for item in equipamentos
            if _normalizar(item.status) in STATUS_EQUIPAMENTO_INDISPONIVEL
        )
        agentes_indisponiveis = sum(
            1 for item in agentes if _normalizar(item.status) == "indisponivel"
        )
        pontos_historico = min(ocorrencias * 15, 60)
        pontos_equipamentos = (
            25 * equipamentos_indisponiveis / len(equipamentos)
            if equipamentos
            else 0
        )
        pontos_agentes = (
            15 * agentes_indisponiveis / len(agentes) if agentes else 0
        )
        pontuacao = round(pontos_historico + pontos_equipamentos + pontos_agentes)

        resultado.append(
            PrevisaoAcidente(
                bairro=bairro_descricao,
                parecer=parecer,
                ocorrencias_historicas=ocorrencias,
                pontuacao=pontuacao,
                nivel=classificar_nivel(pontuacao),
                total_equipamentos=len(equipamentos),
                equipamentos_indisponiveis=equipamentos_indisponiveis,
                total_agentes=len(agentes),
                agentes_indisponiveis=agentes_indisponiveis,
                latitude=latitude,
                longitude=longitude,
                indice_densidade_modelo=(
                    indices_espaciais.get((bairro_chave, latitude, longitude))
                    if latitude is not None and longitude is not None
                    else None
                ),
            )
        )

    resultado.sort(
        key=lambda item: (
            item.indice_densidade_modelo
            if item.indice_densidade_modelo is not None
            else -1,
            item.pontuacao,
            item.ocorrencias_historicas,
        ),
        reverse=True,
    )
    return resultado
