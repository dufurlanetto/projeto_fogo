import React, { useState } from "react";
import { Equipamento, StatusEquipamento, TipoEquipamento } from "../types/index.ts";
import {
  Cpu,
  Search,
  Plus,
  Eye,
  X,
  MapPin,
  CheckCircle,
  AlertCircle,
  Wrench,
} from "lucide-react";
import { fogoApi } from "../api/fogoApi.ts";

interface EquipamentosTableProps {
  equipamentos: Equipamento[];
  onRefresh: () => void;
  selectedCodigoFilter?: string | null;
  onClearCodigoFilter?: () => void;
}

export const EquipamentosTable: React.FC<EquipamentosTableProps> = ({
  equipamentos,
  onRefresh,
  selectedCodigoFilter,
  onClearCodigoFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState(selectedCodigoFilter || "");
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedEquipamento, setSelectedEquipamento] = useState<Equipamento | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [newCodigo, setNewCodigo] = useState("");
  const [newNome, setNewNome] = useState("");
  const [newTipo, setNewTipo] = useState<TipoEquipamento>("camera");
  const [newBairro, setNewBairro] = useState("Centro");
  const [newRua, setNewRua] = useState("");
  const [newLat, setNewLat] = useState("-22.2172");
  const [newLon, setNewLon] = useState("-49.9465");
  const [createError, setCreateError] = useState<string | null>(null);

  const filtered = equipamentos.filter((eq) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCode = eq.codigo.toLowerCase().includes(term);
      const matchName = eq.nome.toLowerCase().includes(term);
      const matchBairro = eq.bairro.toLowerCase().includes(term);
      if (!matchCode && !matchName && !matchBairro) return false;
    }
    if (tipoFilter && eq.tipo !== tipoFilter) return false;
    if (statusFilter && eq.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: StatusEquipamento) => {
    switch (status) {
      case "operacional":
        return <span className="badge badge-success">Operacional</span>;
      case "com_falha":
        return <span className="badge badge-danger">Com Falha</span>;
      case "em_manutencao":
        return <span className="badge badge-warning">Manutenção</span>;
      case "furtado":
        return <span className="badge badge-danger">Furtado</span>;
      case "desativado":
        return <span className="badge badge-neutral">Desativado</span>;
      default:
        return <span className="badge badge-neutral">Não Instalado</span>;
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: StatusEquipamento) => {
    try {
      setActionLoading(true);
      await fogoApi.updateEquipamento(id, { status: newStatus });
      await onRefresh();
      if (selectedEquipamento && selectedEquipamento.id === id) {
        setSelectedEquipamento({ ...selectedEquipamento, status: newStatus });
      }
    } catch (err: any) {
      alert(`Falha ao atualizar status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateEquipamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newCodigo || !newNome) {
      setCreateError("Código e Nome são obrigatórios.");
      return;
    }

    try {
      setActionLoading(true);
      await fogoApi.createEquipamento({
        codigo: newCodigo.trim().toUpperCase(),
        nome: newNome.trim(),
        tipo: newTipo,
        bairro: newBairro.trim(),
        rua: newRua.trim() || undefined,
        cidade: "Marília",
        uf: "SP",
        status: "operacional",
        latitude: parseFloat(newLat) || null,
        longitude: parseFloat(newLon) || null,
        caracteristicas_json: { demonstracao: true, data_registro: new Date().toISOString() },
      });
      setIsCreateModalOpen(false);
      setNewCodigo("");
      setNewNome("");
      await onRefresh();
    } catch (err: any) {
      setCreateError(err.message || "Erro ao cadastrar equipamento.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="card" id="equipamentos-container">
      <div className="card-header">
        <h2 className="card-title">
          <Cpu size={16} className="text-secondary" />
          <span style={{color: '#000'}}>Inventário de Dispositivos e Sensores</span>
          <span className="badge badge-neutral">{filtered.length}</span>
        </h2>

        <button
          id="btn-novo-equipamento"
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={14} />
          <span>Cadastrar Ativo</span>
        </button>
      </div>

      <div className="filter-bar">
        <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
          <Search size={14} className="text-muted" color="#fff" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            id="input-busca-equipamento"
            type="text"
            className="search-input"
            style={{ width: "100%", paddingLeft: "2rem" }}
            placeholder="Buscar por código, identificação ou bairro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          id="select-filtro-tipo"
          className="select-filter"
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="radar">Radar de Velocidade</option>
          <option value="camera">Câmera CFTV / OCR</option>
          <option value="balanca">Balança Rodoviária</option>
          <option value="veiculo">Viatura Operacional</option>
          <option value="cancela">Cancela Automática</option>
          <option value="patinete">Micromobilidade</option>
        </select>

        <select
          id="select-filtro-status"
          className="select-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="operacional">Operacional</option>
          <option value="com_falha">Com Falha</option>
          <option value="em_manutencao">Em Manutenção</option>
          <option value="furtado">Furtado</option>
          <option value="desativado">Desativado</option>
          <option value="nao_instalado">Não Instalado</option>
        </select>

        {selectedCodigoFilter && onClearCodigoFilter && (
          <button
            id="btn-limpar-filtro-codigo"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchTerm("");
              onClearCodigoFilter();
            }}
          >
            <X size={12} />
            <span>Filtro: {selectedCodigoFilter}</span>
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="data-table" id="tabela-equipamentos">
          <thead>
            <tr>
              <th>Código</th>
              <th>Identificação</th>
              <th>Tipo</th>
              <th>Bairro / Localidade</th>
              <th>Status</th>
              <th>Última Telemetria</th>
              <th style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  Nenhum equipamento localizado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filtered.map((eq) => (
                <tr key={eq.id}>
                  <td>
                    <span className="font-mono text-xs" style={{ color: "var(--brand-primary)", fontWeight: 600 }}>
                      {eq.codigo}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{eq.nome}</div>
                    <div className="text-xs text-muted">{eq.marca ? `${eq.marca} ${eq.modelo || ""}` : "—"}</div>
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{eq.tipo}</td>
                  <td>
                    <div className="flex-row items-center gap-1">
                      <MapPin size={12} className="text-muted" />
                      <span>{eq.bairro}</span>
                    </div>
                  </td>
                  <td>{getStatusBadge(eq.status)}</td>
                  <td className="text-xs text-muted font-mono">
                    {eq.ultima_telemetria_em
                      ? new Date(eq.ultima_telemetria_em).toLocaleString("pt-BR")
                      : "Sem sinal"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      id={`btn-detalhe-${eq.codigo}`}
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedEquipamento(eq)}
                    >
                      <Eye size={12} />
                      <span>Inspecionar</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detalhes / Inspeção */}
      {selectedEquipamento && (
        <div className="modal-overlay" onClick={() => setSelectedEquipamento(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex-row justify-between items-center" style={{ marginBottom: "1rem" }}>
              <div className="flex-row items-center gap-2">
                <span className="font-mono" style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)" }}>
                  {selectedEquipamento.codigo}
                </span>
                {getStatusBadge(selectedEquipamento.status)}
              </div>
              <button
                id="btn-fechar-modal-detalhe"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedEquipamento(null)}
              >
                <X size={14} />
              </button>
            </div>

            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>{selectedEquipamento.nome}</h3>

            <div className="grid-2" style={{ marginBottom: "1rem" }}>
              <div className="alert-item flex-col gap-1">
                <span className="text-xs text-muted">Tipo</span>
                <strong style={{ textTransform: "capitalize" }}>{selectedEquipamento.tipo}</strong>
              </div>
              <div className="alert-item flex-col gap-1">
                <span className="text-xs text-muted">Bairro</span>
                <strong>{selectedEquipamento.bairro}</strong>
              </div>
              <div className="alert-item flex-col gap-1">
                <span className="text-xs text-muted">Endereço</span>
                <strong>{selectedEquipamento.rua || "Não informado"}</strong>
              </div>
              <div className="alert-item flex-col gap-1">
                <span className="text-xs text-muted">Coordenadas</span>
                <strong className="font-mono text-xs">
                  {selectedEquipamento.latitude && selectedEquipamento.longitude
                    ? `${selectedEquipamento.latitude.toFixed(4)}, ${selectedEquipamento.longitude.toFixed(4)}`
                    : "Sem coordenadas"}
                </strong>
              </div>
            </div>

            <div style={{ marginBottom: "1rem", background: "var(--bg-app)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
              <span className="text-xs text-muted" style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
                Alterar Estado Operacional:
              </span>
              <div className="flex-row gap-2" style={{ flexWrap: "wrap" }}>
                <button
                  id="btn-status-op"
                  className="btn btn-secondary btn-sm"
                  disabled={actionLoading || selectedEquipamento.status === "operacional"}
                  onClick={() => handleUpdateStatus(selectedEquipamento.id, "operacional")}
                >
                  <CheckCircle size={12} style={{ color: "var(--status-success)" }} />
                  <span>Operacional</span>
                </button>
                <button
                  id="btn-status-falha"
                  className="btn btn-secondary btn-sm"
                  disabled={actionLoading || selectedEquipamento.status === "com_falha"}
                  onClick={() => handleUpdateStatus(selectedEquipamento.id, "com_falha")}
                >
                  <AlertCircle size={12} style={{ color: "var(--status-danger)" }} />
                  <span>Reportar Falha</span>
                </button>
                <button
                  id="btn-status-manut"
                  className="btn btn-secondary btn-sm"
                  disabled={actionLoading || selectedEquipamento.status === "em_manutencao"}
                  onClick={() => handleUpdateStatus(selectedEquipamento.id, "em_manutencao")}
                >
                  <Wrench size={12} style={{ color: "var(--status-warning)" }} />
                  <span>Enviar Manutenção</span>
                </button>
              </div>
            </div>

            {selectedEquipamento.caracteristicas_json && Object.keys(selectedEquipamento.caracteristicas_json).length > 0 && (
              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>
                  Telemetria & Metadados:
                </span>
                <pre style={{ background: "#c8c8ca", padding: "0.65rem", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", color: "var(--text-secondary)", overflowX: "auto" }}>
                  {JSON.stringify(selectedEquipamento.caracteristicas_json, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Cadastro */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex-row justify-between items-center" style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem" }}>Cadastrar Novo Ativo Urbano</h3>
              <button
                id="btn-fechar-modal-cadastro"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={14} />
              </button>
            </div>

            {createError && (
              <div className="alert-item text-xs" style={{ background: "var(--status-danger-bg)", borderColor: "var(--status-danger-border)", color: "#fca5a5", marginBottom: "1rem" }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateEquipamento} className="flex-col gap-3">
              <div className="grid-2">
                <div>
                  <label className="text-xs text-muted" style={{ display: "block", marginBottom: "0.25rem" }}>
                    Código Identificador (ex: RAD-109) *
                  </label>
                  <input
                    id="input-novo-codigo"
                    type="text"
                    className="search-input"
                    style={{ width: "100%" }}
                    required
                    value={newCodigo}
                    onChange={(e) => setNewCodigo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: "block", marginBottom: "0.25rem" }}>
                    Tipo *
                  </label>
                  <select
                    id="select-novo-tipo"
                    className="select-filter"
                    style={{ width: "100%" }}
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value as any)}
                  >
                    <option value="radar">Radar de Velocidade</option>
                    <option value="camera">Câmera de Monitoramento</option>
                    <option value="balanca">Balança Rodoviária</option>
                    <option value="veiculo">Viatura Operacional</option>
                    <option value="cancela">Cancela Automática</option>
                    <option value="patinete">Micromobilidade</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: "block", marginBottom: "0.25rem" }}>
                  Nome / Descrição Operacional *
                </label>
                <input
                  id="input-novo-nome"
                  type="text"
                  className="search-input"
                  style={{ width: "100%" }}
                  required
                  placeholder="ex: Câmera OCR Av. Sampaio Vidal"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label className="text-xs text-muted" style={{ display: "block", marginBottom: "0.25rem" }}>
                    Bairro *
                  </label>
                  <input
                    id="input-novo-bairro"
                    type="text"
                    className="search-input"
                    style={{ width: "100%" }}
                    required
                    value={newBairro}
                    onChange={(e) => setNewBairro(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: "block", marginBottom: "0.25rem" }}>
                    Logradouro / Rua
                  </label>
                  <input
                    id="input-novo-rua"
                    type="text"
                    className="search-input"
                    style={{ width: "100%" }}
                    placeholder="ex: Av. Sampaio Vidal, 450"
                    value={newRua}
                    onChange={(e) => setNewRua(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="text-xs text-muted" style={{ display: "block", marginBottom: "0.25rem" }}>
                    Latitude
                  </label>
                  <input
                    id="input-novo-lat"
                    type="text"
                    className="search-input font-mono"
                    style={{ width: "100%" }}
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: "block", marginBottom: "0.25rem" }}>
                    Longitude
                  </label>
                  <input
                    id="input-novo-lon"
                    type="text"
                    className="search-input font-mono"
                    style={{ width: "100%" }}
                    value={newLon}
                    onChange={(e) => setNewLon(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-row items-center gap-2" style={{ justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  id="btn-submeter-cadastro"
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Cadastrando..." : "Cadastrar Ativo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
