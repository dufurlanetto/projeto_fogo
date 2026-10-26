from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator, model_validator
import json


class TipoEquipamento(str, Enum):
    RADAR = "radar"
    CAMERA = "camera"
    BALANCA = "balanca"
    VEICULO = "veiculo"
    CANCELA = "cancela"
    PATINETE = "patinete"
    OUTRO = "outro"


class StatusEquipamento(str, Enum):
    OPERACIONAL = "operacional"
    COM_FALHA = "com_falha"
    DESATIVADO = "desativado"
    FURTADO = "furtado"
    NAO_INSTALADO = "nao_instalado"
    EM_MANUTENCAO = "em_manutencao"


class StatusAgente(str, Enum):
    ATIVO = "ativo"
    EM_SERVICO = "em_servico"
    INDISPONIVEL = "indisponivel"


class PrioridadeManutencao(str, Enum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    IMEDIATA = "imediata"


class StatusManutencao(str, Enum):
    ABERTA = "aberta"
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"


# --- Schemas de Manutenção ---

class ManutencaoBase(BaseModel):
    descricao: str = Field(..., min_length=3)
    prioridade: PrioridadeManutencao = PrioridadeManutencao.MEDIA
    status: StatusManutencao = StatusManutencao.ABERTA
    data_prevista: Optional[datetime] = None
    data_conclusao: Optional[datetime] = None
    responsavel: Optional[str] = None
    observacoes: Optional[str] = None


class ManutencaoCreate(ManutencaoBase):
    equipamento_id: int


class ManutencaoUpdate(BaseModel):
    descricao: Optional[str] = None
    prioridade: Optional[PrioridadeManutencao] = None
    status: Optional[StatusManutencao] = None
    data_prevista: Optional[datetime] = None
    data_conclusao: Optional[datetime] = None
    responsavel: Optional[str] = None
    observacoes: Optional[str] = None


class ManutencaoResponse(ManutencaoBase):
    id: int
    equipamento_id: int
    data_abertura: datetime
    equipamento_codigo: Optional[str] = None
    equipamento_nome: Optional[str] = None

    class Config:
        from_attributes = True


#id = Column(Integer, primary_key=True, index=True)
#    parecer = Column(String(150), nullable=False)
#    dt_acontecimento = Column(DateTime, nullable=False)
#    horario_acontecimento = Column(DateTime, nullable=False)
#    rua = Column(String(150), nullable=False)
#    bairro = Column(String(100), nullable=False)
#    cidade = Column(String(50), nullable=False)
#    uf = Column(String(2), nullable=False)
#    cep = Column(String(9), nullable=False)
#    latitude = Column(Integer(), nullable=False)
#    longiture = Column(Integer(), nullable=False)

class HistoricoBase(BaseModel):
    id: int
    parecer: str
    dt_acontecimento: str
    horario_acontecimento: str
    rua: str
    bairro: str
    cidade: str
    uf: str
    cep: str
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)

class HistoricoResponse(HistoricoBase):
    id: int
    parecer: str
    dt_acontecimento: str
    horario_acontecimento: str
    rua: str
    bairro: str
    cidade: str
    uf: str
    cep: str
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)


# --- Schemas de Equipamento ---

class EquipamentoBase(BaseModel):
    codigo: str = Field(..., min_length=2, max_length=50)
    tipo: TipoEquipamento
    nome: str = Field(..., min_length=2, max_length=150)
    marca: Optional[str] = None
    modelo: Optional[str] = None
    numero_serie: Optional[str] = None
    status: StatusEquipamento = StatusEquipamento.OPERACIONAL
    rua: Optional[str] = None
    bairro: str = Field(..., min_length=2, max_length=100)
    cidade: str = Field(default="Marília", max_length=100)
    uf: str = Field(default="SP", min_length=2, max_length=2)
    cep: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    caracteristicas_json: Optional[Dict[str, Any]] = None

    @field_validator("codigo")
    @classmethod
    def clean_codigo(cls, v: str) -> str:
        return v.strip().upper()


class EquipamentoCreate(EquipamentoBase):
    pass


class EquipamentoUpdate(BaseModel):
    codigo: Optional[str] = None
    tipo: Optional[TipoEquipamento] = None
    nome: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    numero_serie: Optional[str] = None
    status: Optional[StatusEquipamento] = None
    rua: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    cep: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    caracteristicas_json: Optional[Dict[str, Any]] = None
    ultima_telemetria_em: Optional[datetime] = None


class EquipamentoResponse(BaseModel):
    id: int
    codigo: str
    tipo: str
    nome: str
    marca: Optional[str] = None
    modelo: Optional[str] = None
    numero_serie: Optional[str] = None
    status: str
    rua: Optional[str] = None
    bairro: str
    cidade: str
    uf: str
    cep: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    caracteristicas_json: Dict[str, Any] = {}
    ultima_telemetria_em: Optional[datetime] = None
    criado_em: datetime
    atualizado_em: datetime
    manutencoes: List[ManutencaoResponse] = []

    class Config:
        from_attributes = True

    @model_validator(mode="before")
    @classmethod
    def parse_caracteristicas(cls, data: Any):
        if hasattr(data, "caracteristicas_json") and isinstance(data.caracteristicas_json, str):
            try:
                data.caracteristicas_json = json.loads(data.caracteristicas_json or "{}")
            except Exception:
                data.caracteristicas_json = {}
        elif isinstance(data, dict) and isinstance(data.get("caracteristicas_json"), str):
            try:
                data["caracteristicas_json"] = json.loads(data["caracteristicas_json"] or "{}")
            except Exception:
                data["caracteristicas_json"] = {}
        return data


# --- Schemas de Agente ---

class AgenteBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=150)
    matricula: str = Field(..., min_length=2, max_length=50)
    orgao: str = Field(..., min_length=2, max_length=100)
    funcao: str = Field(..., min_length=2, max_length=100)
    status: StatusAgente = StatusAgente.ATIVO
    bairro_base: str = Field(..., min_length=2, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)

    @field_validator("matricula")
    @classmethod
    def clean_matricula(cls, v: str) -> str:
        return v.strip().upper()


class AgenteCreate(AgenteBase):
    pass


class AgenteUpdate(BaseModel):
    nome: Optional[str] = None
    matricula: Optional[str] = None
    orgao: Optional[str] = None
    funcao: Optional[str] = None
    status: Optional[StatusAgente] = None
    bairro_base: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)


class AgenteResponse(AgenteBase):
    id: int
    atualizado_em: datetime

    class Config:
        from_attributes = True


# --- Schemas para Operações (Resumo, Alertas, Mapa) ---

class ResumoOperacional(BaseModel):
    total_equipamentos: int
    operacionais: int
    indisponiveis: int
    disponibilidade_percentual: Optional[float] = None
    agentes_ativos: int
    manutencoes_criticas: int
    manutencoes_atrasadas: int


class SeveridadeAlerta(str, Enum):
    CRITICO = "critico"
    ALERTA = "alerta"
    INFORMATIVO = "informativo"


class AlertaItem(BaseModel):
    id: str
    tipo: str
    severidade: SeveridadeAlerta
    titulo: str
    descricao: str
    equipamento_id: Optional[int] = None
    equipamento_codigo: Optional[str] = None
    bairro: Optional[str] = None
    data: datetime


class ItemMapa(BaseModel):
    id: int
    categoria: str  # "equipamento" | "agente"
    identificador: str  # codigo ou matricula
    nome: str
    tipo_ou_funcao: str
    status: str
    bairro: str
    latitude: float
    longitude: float
    detalhes: Optional[Dict[str, Any]] = None


# --- Schemas para Cidade Preditiva ---

class NivelAtencao(str, Enum):
    BAIXA = "Baixa atenção"
    MODERADA = "Atenção moderada"
    ALTA = "Atenção alta"
    MUITO_ALTA = "Atenção muito alta"


class FatoresRegiao(BaseModel):
    equipamentos_falha: int
    manutencoes_imediatas: int
    manutencoes_atrasadas: int
    equipamentos_furtados_indisponiveis: int


class RegiaoPreditiva(BaseModel):
    bairro: str
    pontuacao: int
    nivel: NivelAtencao
    total_equipamentos: int
    fatores: FatoresRegiao
    recomendacoes: List[str]


class PrevisaoAcidente(BaseModel):
    bairro: str
    parecer: str
    ocorrencias_historicas: int
    pontuacao: int
    nivel: NivelAtencao
    total_equipamentos: int
    equipamentos_indisponiveis: int
    total_agentes: int
    agentes_indisponiveis: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    indice_densidade_modelo: Optional[int] = None
