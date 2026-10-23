from datetime import datetime, timezone
import json
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Historico(Base):
    __tablename__ = "historico"

    id = Column(Integer, primary_key=True, index=True)
    parecer = Column(String(150), nullable=False)
    dt_acontecimento = Column(String, nullable=False)
    horario_acontecimento = Column(String, nullable=False)
    rua = Column(String(150), nullable=False)
    bairro = Column(String(100), nullable=False)
    cidade = Column(String(50), nullable=False)
    uf = Column(String(2), nullable=False)
    cep = Column(String(9), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)


class Equipamento(Base):
    __tablename__ = "equipamentos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, index=True, nullable=False)
    tipo = Column(String(50), nullable=False)  # radar, camera, balanca, veiculo, cancela, patinete, outro
    nome = Column(String(150), nullable=False)
    marca = Column(String(100), nullable=True)
    modelo = Column(String(100), nullable=True)
    numero_serie = Column(String(100), nullable=True)
    status = Column(
        String(50),
        nullable=False,
        default="operacional",
    )  # operacional, com_falha, desativado, furtado, nao_instalado, em_manutencao
    rua = Column(String(200), nullable=True)
    bairro = Column(String(100), nullable=False, index=True)
    cidade = Column(String(100), nullable=False, default="Marília")
    uf = Column(String(2), nullable=False, default="SP")
    cep = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    caracteristicas_json = Column(Text, nullable=False, default="{}")
    ultima_telemetria_em = Column(DateTime(timezone=True), nullable=True)
    criado_em = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    atualizado_em = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)", name="check_latitude"),
        CheckConstraint("longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0)", name="check_longitude"),
    )

    manutencoes = relationship(
        "Manutencao",
        back_populates="equipamento",
        cascade="all, delete-orphan",
        order_by="desc(Manutencao.data_abertura)",
    )


class Agente(Base):
    __tablename__ = "agentes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    matricula = Column(String(50), unique=True, index=True, nullable=False)
    orgao = Column(String(100), nullable=False)  # CET, GCM, Defesa Civil, etc.
    funcao = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="ativo")  # ativo, em_servico, indisponivel
    bairro_base = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    atualizado_em = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)", name="check_agente_latitude"),
        CheckConstraint("longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0)", name="check_agente_longitude"),
    )


class Manutencao(Base):
    __tablename__ = "manutencoes"

    id = Column(Integer, primary_key=True, index=True)
    equipamento_id = Column(Integer, ForeignKey("equipamentos.id", ondelete="CASCADE"), nullable=False, index=True)
    descricao = Column(Text, nullable=False)
    prioridade = Column(String(50), nullable=False, default="media")  # baixa, media, alta, imediata
    status = Column(String(50), nullable=False, default="aberta")  # aberta, em_andamento, concluida, cancelada
    data_abertura = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    data_prevista = Column(DateTime(timezone=True), nullable=True)
    data_conclusao = Column(DateTime(timezone=True), nullable=True)
    responsavel = Column(String(150), nullable=True)
    observacoes = Column(Text, nullable=True)

    equipamento = relationship("Equipamento", back_populates="manutencoes")
