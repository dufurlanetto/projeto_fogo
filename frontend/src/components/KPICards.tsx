import React from "react";
import { ResumoOperacional } from "../types/index.ts";
import {
  Server,
  Activity,
  AlertOctagon,
  Users,
  Wrench,
  ClockAlert,
} from "lucide-react";

interface KPICardsProps {
  resumo: ResumoOperacional | null;
  loading: boolean;
}

export const KPICards: React.FC<KPICardsProps> = ({ resumo, loading }) => {
  if (loading || !resumo) {
    return (
      <div className="kpi-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="kpi-card" style={{ opacity: 0.5 }}>
            <div className="kpi-top"><span>Carregando...</span></div>
            <div className="kpi-value">--</div>
          </div>
        ))}
      </div>
    );
  }

  const disp = resumo.disponibilidade_percentual ?? 0;
  const dispColor = disp >= 90 ? "var(--status-success)" : disp >= 75 ? "var(--status-warning)" : "var(--status-danger)";

  return (
    <div className="kpi-grid" id="kpi-grid">
      <div className="kpi-card" id="kpi-total">
        <div className="kpi-top">
          <span>Ativos Cadastrados</span>
          <Server size={16} className="text-secondary" />
        </div>
        <div className="kpi-value">{resumo.total_equipamentos}</div>
        <span className="kpi-subtext">Total monitorado no município</span>
      </div>

      <div className="kpi-card" id="kpi-disponibilidade">
        <div className="kpi-top">
          <span>Taxa de Disponibilidade</span>
          <Activity size={16} style={{ color: dispColor }} />
        </div>
        <div className="kpi-value" style={{ color: dispColor }}>
          {disp.toFixed(1)}%
        </div>
        <span className="kpi-subtext">{resumo.operacionais} ativos transmitindo normalmente</span>
      </div>

      <div className="kpi-card" id="kpi-indisponiveis">
        <div className="kpi-top">
          <span>Inoperantes / Falhas</span>
          <AlertOctagon size={16} style={{ color: resumo.indisponiveis > 0 ? "var(--status-danger)" : "var(--text-muted)" }} />
        </div>
        <div className="kpi-value" style={{ color: resumo.indisponiveis > 0 ? "var(--status-danger)" : "#fff" }}>
          {resumo.indisponiveis}
        </div>
        <span className="kpi-subtext">Falha, furto ou manutenção</span>
      </div>

      <div className="kpi-card" id="kpi-agentes">
        <div className="kpi-top">
          <span>Equipes em Campo</span>
          <Users size={16} className="text-secondary" />
        </div>
        <div className="kpi-value">{resumo.agentes_ativos}</div>
        <span className="kpi-subtext">EMDURB, Trânsito e Defesa Civil</span>
      </div>

      <div className="kpi-card" id="kpi-manutencoes-criticas">
        <div className="kpi-top">
          <span>O.S. Imediatas</span>
          <Wrench size={16} style={{ color: resumo.manutencoes_criticas > 0 ? "var(--status-warning)" : "var(--text-muted)" }} />
        </div>
        <div className="kpi-value" style={{ color: resumo.manutencoes_criticas > 0 ? "var(--status-warning)" : "#fff" }}>
          {resumo.manutencoes_criticas}
        </div>
        <span className="kpi-subtext">Chamados com prioridade urgente</span>
      </div>

      <div className="kpi-card" id="kpi-manutencoes-atrasadas">
        <div className="kpi-top">
          <span>O.S. Atrasadas</span>
          <ClockAlert size={16} style={{ color: resumo.manutencoes_atrasadas > 0 ? "var(--status-danger)" : "var(--text-muted)" }} />
        </div>
        <div className="kpi-value" style={{ color: resumo.manutencoes_atrasadas > 0 ? "var(--status-danger)" : "#fff" }}>
          {resumo.manutencoes_atrasadas}
        </div>
        <span className="kpi-subtext">Prazo estimado de entrega expirado</span>
      </div>
    </div>
  );
};
