import React, { useState } from "react";
import { Agente, StatusAgente } from "../types/index.ts";
import { Users, Search, MapPin, UserCheck, UserX, Shield } from "lucide-react";

interface AgentesTableProps {
  agentes: Agente[];
}

export const AgentesTable: React.FC<AgentesTableProps> = ({ agentes }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const filtered = agentes.filter((ag) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchNome = ag.nome.toLowerCase().includes(term);
      const matchMatricula = ag.matricula.toLowerCase().includes(term);
      const matchBairro = ag.bairro_base.toLowerCase().includes(term);
      const matchOrgao = ag.orgao.toLowerCase().includes(term);
      if (!matchNome && !matchMatricula && !matchBairro && !matchOrgao) return false;
    }
    if (statusFilter && ag.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: StatusAgente) => {
    switch (status) {
      case "ativo":
        return <span className="badge badge-success"><UserCheck size={11} /> Disponível</span>;
      case "em_servico":
        return <span className="badge badge-info"><Shield size={11} /> Em Atendimento</span>;
      default:
        return <span className="badge badge-neutral"><UserX size={11} /> Indisponível</span>;
    }
  };

  return (
    <div className="card" id="agentes-container">
      <div className="card-header">
        <h2 className="card-title">
          <Users size={16} className="text-secondary" />
          <span>Equipes e Agentes de Campo</span>
          <span className="badge badge-neutral">{filtered.length}</span>
        </h2>
      </div>

      <div className="filter-bar">
        <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
          <Search size={14} className="text-muted" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            id="input-busca-agente"
            type="text"
            className="search-input"
            style={{ width: "100%", paddingLeft: "2rem" }}
            placeholder="Buscar por nome, matrícula, órgão ou base..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          id="select-filtro-status-agente"
          className="select-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="ativo">Disponível</option>
          <option value="em_servico">Em Atendimento</option>
          <option value="indisponivel">Indisponível</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="data-table" id="tabela-agentes">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Nome</th>
              <th>Órgão / Função</th>
              <th>Base Operacional</th>
              <th>Status</th>
              <th>Última Posição</th>
              <th>Sincronização</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  Nenhuma equipe encontrada com os filtros atuais.
                </td>
              </tr>
            ) : (
              filtered.map((ag) => (
                <tr key={ag.id}>
                  <td>
                    <span className="font-mono text-xs" style={{ color: "var(--brand-primary)", fontWeight: 600 }}>
                      {ag.matricula}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{ag.nome}</td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{ag.orgao}</span>
                    <span className="text-xs text-muted" style={{ marginLeft: "0.4rem" }}>({ag.funcao})</span>
                  </td>
                  <td>
                    <div className="flex-row items-center gap-1">
                      <MapPin size={12} className="text-muted" />
                      <span>{ag.bairro_base}</span>
                    </div>
                  </td>
                  <td>{getStatusBadge(ag.status)}</td>
                  <td className="font-mono text-xs text-muted">
                    {ag.latitude && ag.longitude
                      ? `${ag.latitude.toFixed(4)}, ${ag.longitude.toFixed(4)}`
                      : "Sem GPS"}
                  </td>
                  <td className="text-xs text-muted">
                    {new Date(ag.atualizado_em).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
