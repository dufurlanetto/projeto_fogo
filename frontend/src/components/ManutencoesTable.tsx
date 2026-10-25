import React, { useState } from "react";
import { Manutencao, PrioridadeManutencao, StatusManutencao, Equipamento } from "../types/index.ts";
import { ClipboardList, Plus, X, Search } from "lucide-react";
import { fogoApi } from "../api/fogoApi.ts";

interface ManutencoesTableProps {
  manutencoes: Manutencao[];
  equipamentos: Equipamento[];
  onRefresh: () => void;
}

export const ManutencoesTable: React.FC<ManutencoesTableProps> = ({
  manutencoes,
  equipamentos,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedEquipId, setSelectedEquipId] = useState<number>(equipamentos[0]?.id || 1);
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<PrioridadeManutencao>("alta");
  const [responsavel, setResponsavel] = useState("Equipe Técnica Alfa");
  const [observacoes, setObservacoes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = manutencoes.filter((m) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchDesc = m.descricao.toLowerCase().includes(term);
      const matchCod = m.equipamento_codigo?.toLowerCase().includes(term) ?? false;
      const matchResp = m.responsavel?.toLowerCase().includes(term) ?? false;
      if (!matchDesc && !matchCod && !matchResp) return false;
    }
    if (prioridadeFilter && m.prioridade !== prioridadeFilter) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    return true;
  });

  const getPriorityBadge = (prio: PrioridadeManutencao) => {
    switch (prio) {
      case "imediata":
        return <span className="badge badge-danger">Imediata</span>;
      case "alta":
        return <span className="badge badge-warning">Alta</span>;
      case "media":
        return <span className="badge badge-info">Média</span>;
      default:
        return <span className="badge badge-neutral">Baixa</span>;
    }
  };

  const getStatusBadge = (st: StatusManutencao) => {
    switch (st) {
      case "aberta":
        return <span className="badge badge-warning">Aberta</span>;
      case "em_andamento":
        return <span className="badge badge-info">Em Execução</span>;
      case "concluida":
        return <span className="badge badge-success">Concluída</span>;
      default:
        return <span className="badge badge-neutral">Cancelada</span>;
    }
  };

  const handleCreateManutencao = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!descricao.trim()) {
      setFormError("Informe a descrição do serviço.");
      return;
    }

    try {
      setSubmitting(true);
      await fogoApi.createManutencao({
        equipamento_id: Number(selectedEquipId),
        descricao: descricao.trim(),
        prioridade,
        responsavel: responsavel.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      });
      setIsModalOpen(false);
      setDescricao("");
      setObservacoes("");
      await onRefresh();
    } catch (err: any) {
      setFormError(err.message || "Erro ao registrar ordem de serviço.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" id="manutencoes-container">
      <div className="card-header">
        <h2 className="card-title">
          <ClipboardList size={16} className="text-secondary" />
          <span style={{color: '#000'}}>Ordens de Serviço e Manutenção</span>
          <span className="badge badge-neutral">{filtered.length}</span>
        </h2>

        <button
          id="btn-nova-manutencao"
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={14} />
          <span>Nova O.S.</span>
        </button>
      </div>

      <div className="filter-bar">
        <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
          <Search size={14} className="text-muted" color="#fff" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            id="input-busca-manutencao"
            type="text"
            className="search-input"
            style={{ width: "100%", paddingLeft: "2rem" }}
            placeholder="Buscar por chamado, ativo ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          id="select-filtro-prioridade"
          className="select-filter"
          value={prioridadeFilter}
          onChange={(e) => setPrioridadeFilter(e.target.value)}
        >
          <option value="">Todas as prioridades</option>
          <option value="imediata">Imediata</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>

        <select
          id="select-filtro-status-manut"
          className="select-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="aberta">Aberta</option>
          <option value="em_andamento">Em Execução</option>
          <option value="concluida">Concluída</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="data-table" id="tabela-manutencoes">
          <thead>
            <tr>
              <th>O.S.</th>
              <th>Ativo</th>
              <th>Descrição do Serviço</th>
              <th>Prioridade</th>
              <th>Status</th>
              <th>Abertura</th>
              <th>Prazo Estimado</th>
              <th>Técnico / Equipe</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  Nenhuma ordem de serviço encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const isOverdue =
                  m.status === "aberta" &&
                  m.data_prevista &&
                  new Date(m.data_prevista) < new Date();

                return (
                  <tr key={m.id}>
                    <td>
                      <span className="font-mono text-xs text-muted">#{m.id}</span>
                    </td>
                    <td>
                      <div className="font-mono text-xs" style={{ color: "var(--brand-primary)", fontWeight: 600 }}>
                        {m.equipamento_codigo || `ID ${m.equipamento_id}`}
                      </div>
                      <div className="text-xs text-muted">{m.equipamento_nome}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{m.descricao}</div>
                      {m.observacoes && <div className="text-xs text-muted">{m.observacoes}</div>}
                    </td>
                    <td>{getPriorityBadge(m.prioridade)}</td>
                    <td>{getStatusBadge(m.status)}</td>
                    <td className="text-xs text-muted">
                      {new Date(m.data_abertura).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="text-xs">
                      {m.data_prevista ? (
                        <span style={{ color: isOverdue ? "var(--status-danger)" : "var(--text-secondary)", fontWeight: isOverdue ? 600 : 400 }}>
                          {new Date(m.data_prevista).toLocaleDateString("pt-BR")}
                          {isOverdue && " (Atrasada)"}
                        </span>
                      ) : (
                        <span className="text-muted">Não definido</span>
                      )}
                    </td>
                    <td className="text-xs">{m.responsavel || "Não atribuído"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex-row justify-between items-center" style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem" }}>Abrir Nova Ordem de Serviço</h3>
              <button
                id="btn-fechar-modal-manut"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={14} />
              </button>
            </div>

            {formError && (
              <div className="alert-item text-xs" style={{ background: "var(--status-danger-bg)", borderColor: "var(--status-danger-border)", color: "#fca5a5", marginBottom: "1rem" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateManutencao} className="flex-col gap-3">
              <div>
                <label className="text-xs text-muted" style={{ display: "block", marginBottom: "0.25rem" }}>
                  Equipamento / Ativo *
                </label>
                <select
                  id="select-manut-equipamento"
                  className="select-filter"
                  style={{ width: "100%" }}
                  value={selectedEquipId}
                  onChange={(e) => setSelectedEquipId(Number(e.target.value))}
                >
                  {equipamentos.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      [{eq.codigo}] {eq.nome} ({eq.bairro})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: "block", marginBottom: "0.25rem" }}>
                  Descrição da Ocorrência *
                </label>
                <textarea
                  id="input-manut-descricao"
                  className="search-input"
                  rows={3}
                  style={{ width: "100%", resize: "vertical" }}
                  required
                  placeholder="Descreva o problema constatado ou intervenção necessária..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label className="text-xs text-muted" style={{ display: "block", marginBottom: "0.25rem" }}>
                    Prioridade *
                  </label>
                  <select
                    id="select-manut-prioridade"
                    className="select-filter"
                    style={{ width: "100%" }}
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value as any)}
                  >
                    <option value="imediata">Imediata (Urgente)</option>
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted" style={{ display: "block", marginBottom: "0.25rem" }}>
                    Equipe ou Técnico
                  </label>
                  <input
                    id="input-manut-responsavel"
                    type="text"
                    className="search-input"
                    style={{ width: "100%" }}
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: "block", marginBottom: "0.25rem" }}>
                  Observações
                </label>
                <input
                  id="input-manut-observacoes"
                  type="text"
                  className="search-input"
                  style={{ width: "100%" }}
                  placeholder="ex: Contato efetuado com fornecedor / concessionária."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>

              <div className="flex-row items-center gap-2" style={{ justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  id="btn-submeter-manutencao"
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Gravando..." : "Confirmar Ordem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
