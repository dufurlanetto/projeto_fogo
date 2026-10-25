import React, { forwardRef, useState } from "react";
import { AlertaItem, SeveridadeAlerta } from "../types/index.ts";
import { AlertCircle, AlertTriangle, Info, Bell, ExternalLink } from "lucide-react";
import { useIntersectionAnimation } from "../hooks/useIntersectionAnimation.ts";

interface AlertsPanelProps {
  alertas: AlertaItem[];
  onSelectEquipamento?: (codigo: string) => void;
}

export const AlertsPanel = forwardRef<HTMLDivElement, AlertsPanelProps>(({
  alertas,
  onSelectEquipamento,
}, ref) => {
  const [filter, setFilter] = useState<"todos" | SeveridadeAlerta>("todos");
  const elementoCallbackRef = useIntersectionAnimation(0.5); 

  const filteredAlertas =
    filter === "todos"
      ? alertas
      : alertas.filter((a) => a.severidade === filter);

  const getSeverityBadge = (sev: SeveridadeAlerta) => {
    switch (sev) {
      case "critico":
        return <span className="badge badge-danger"><AlertCircle size={11} /> Crítico</span>;
      case "alerta":
        return <span className="badge badge-warning"><AlertTriangle size={11} /> Atenção</span>;
      default:
        return <span className="badge badge-neutral"><Info size={11} /> Informativo</span>;
    }
  };

  return (
    <div className="card" id="alerts-panel">
      <div className="card-header" style={{justifyContent: 'space-between'}}>
        <h2 className="card-title">
          <Bell size={16} className="text-secondary" />
          <span style={{color: '#000'}}>Fila de Ocorrências & Alertas</span>
          <span className="badge badge-neutral">{alertas.length}</span>
        </h2>

        <select
          id="select-alert-filter"
          className="select-filter text-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="todos">Todas as ocorrências</option>
          <option value="critico">Apenas Críticos</option>
          <option value="alerta">Apenas Atenção</option>
          <option value="informativo">Apenas Informativos</option>
        </select>
      </div>

      <div className="alert-feed" style={{overflowX: 'hidden'}}>
        {filteredAlertas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            Nenhum alerta pendente nesta categoria.
          </div>
        ) : (
          filteredAlertas.map((alerta) => (
            <div key={alerta.id} className="alert-item observar esquerda" ref={ref}>
              <div className="flex-col gap-1" style={{ flex: 1 }}>
                <div className="flex-row items-center gap-2">
                  {getSeverityBadge(alerta.severidade)}
                  <strong style={{ fontSize: "0.825rem", color: "#000" }}>{alerta.titulo}</strong>
                  {alerta.bairro && (
                    <span className="text-xs text-muted">• {alerta.bairro}</span>
                  )}
                </div>
                <p className="text-sm text-secondary" style={{ margin: 0 }}>
                  {alerta.descricao}
                </p>
                <span className="text-xs text-muted">
                  {new Date(alerta.data).toLocaleString("pt-BR")}
                </span>
              </div>

              {alerta.equipamento_codigo && onSelectEquipamento && (
                <button
                  id={`btn-ver-alerta-${alerta.id}`}
                  className="btn btn-secondary btn-sm"
                  onClick={() => onSelectEquipamento(alerta.equipamento_codigo!)}
                  title="Ver no Inventário"
                >
                  <ExternalLink size={12} />
                  <span>Ver Ativo</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
})

AlertsPanel.displayName = 'AlertsPanel';
