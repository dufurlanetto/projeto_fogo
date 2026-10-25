import React, { useCallback, useEffect, useState } from "react";
import { RegiaoPreditiva, NivelAtencao, ItemMapa, AlertaItem, ResumoOperacional, Equipamento, Agente, Manutencao } from "../types/index.ts";
import { TrendingUp, HelpCircle, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { MapLeaflet } from "./MapLeaflet.tsx";
import { fogoApi } from "../api/fogoApi.ts";
import { AlertsPanel } from "./AlertsPanel.tsx";

interface PredictivePanelProps {
  regioes: RegiaoPreditiva[];
}

export const PredictivePanel: React.FC<PredictivePanelProps> = ({ regioes }) => {
  const [showFormula, setShowFormula] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>();
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [itensMapa, setItensMapa] = useState<ItemMapa[]>([]);
  const [resumo, setResumo] = useState<ResumoOperacional | null>(null);
  const [alertas, setAlertas] = useState<AlertaItem[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [regiooes, setRegioes] = useState<RegiaoPreditiva[]>([]);

  const getScoreColor = (pontuacao: number) => {
    if (pontuacao >= 75) return "var(--status-danger)";
    if (pontuacao >= 50) return "var(--status-warning)";
    if (pontuacao >= 25) return "var(--status-info)";
    return "var(--status-success)";
  };

  const getNivelBadge = (nivel: NivelAtencao) => {
    switch (nivel) {
      case "Atenção muito alta":
        return <span className="badge badge-danger">Muito Alta</span>;
      case "Atenção alta":
        return <span className="badge badge-warning">Alta</span>;
      case "Atenção moderada":
        return <span className="badge badge-info">Moderada</span>;
      default:
        return <span className="badge badge-success">Normal</span>;
    }
  };

  const fetchAllData = useCallback(async (isSilent = false) => {
      if (!isSilent) setIsRefreshing(true);
      setErrorMessage(null);
  
      try {
        await fogoApi.checkHealth();
        setIsBackendOnline(true);
  
        const [
          resumoData,
          alertasData,
          mapaData,
          equipData,
          agentesData,
          manutData,
          regioesData,
        ] = await Promise.all([
          fogoApi.getResumo(),
          fogoApi.getAlertas(),
          fogoApi.getItensMapa(),
          fogoApi.getEquipamentos(),
          fogoApi.getAgentes(),
          fogoApi.getManutencoes(),
          fogoApi.getRegioesPreditivas(),
        ])
          setResumo(resumoData);
          setAlertas(alertasData);
          setItensMapa(mapaData);
          setEquipamentos(equipData);
          setAgentes(agentesData);
          setManutencoes(manutData);
          setRegioes(regioesData);
        } catch (err: any) {
          setIsBackendOnline(false);
          setErrorMessage("Serviço de retaguarda indisponível em http://localhost:8000. Verifique se o processo backend está em execução.");
        } finally {
          setLoading(false);
          setIsRefreshing(false);
        }
      }, []);

      useEffect(() => {
        fetchAllData();
        const interval = setInterval(() => fetchAllData(true), 30000);
        return () => clearInterval(interval);
      }, [fetchAllData]);
  

  return (
    <div className="flex-col gap-4" id="cidade-preditiva-container">
      <div className="card">
        <div className="flex-row justify-between items-center" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div className="flex-row items-center gap-2" style={{ marginBottom: "0.25rem" }}>
              <TrendingUp size={18} className="text-secondary" />
              <h2 style={{ fontSize: "1.1rem" }}>Índice de Atenção Operacional por Bairro</h2>
            </div>
            <p className="text-sm text-secondary">
              Indicador composto para priorização de equipes com base em ativos inoperantes, chamados urgentes e prazos vencidos.
            </p>
          </div>

          <button
            id="btn-toggle-formula"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowFormula(!showFormula)}
          >
            <HelpCircle size={13} />
            <span>{showFormula ? "Fechar Critérios" : "Critérios de Pontuação"}</span>
            {showFormula ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.25rem", marginTop: '25px' }}>
          <MapLeaflet items={itensMapa}/>
        </div>  

        {showFormula && (
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
            <span className="text-xs text-muted" style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
              Fórmula de ponderação (Escala de 0 a 100):
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem" }}>
              <div className="alert-item text-xs">
                <strong>+20 pts</strong> por ativo com falha
              </div>
              <div className="alert-item text-xs">
                <strong>+20 pts</strong> por O.S. imediata em aberto
              </div>
              <div className="alert-item text-xs">
                <strong>+10 pts</strong> por O.S. atrasada
              </div>
              <div className="alert-item text-xs">
                <strong>+10 pts</strong> por furto ou ativo não instalado
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pred-grid">
        {regioes.map((reg) => {
          const color = getScoreColor(reg.pontuacao);
          return (
            <div key={reg.bairro} className="pred-card">
              <div className="flex-row justify-between items-center">
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>{reg.bairro}</h3>
                  <span className="text-xs text-muted">{reg.total_equipamentos} ativos monitorados</span>
                </div>
                {getNivelBadge(reg.nivel)}
              </div>

              <div>
                <div className="flex-row justify-between items-center" style={{ marginBottom: "0.35rem" }}>
                  <span className="text-xs text-secondary">Pontuação de Risco</span>
                  <strong style={{ color, fontSize: "1.1rem" }}>{reg.pontuacao} <span className="text-xs text-muted">/ 100</span></strong>
                </div>
                <div className="pred-score-bar">
                  <div className="pred-score-fill" style={{ width: `${Math.min(reg.pontuacao, 100)}%`, background: color }} />
                </div>
              </div>

              <div style={{ background: "#fff", padding: "0.65rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem", fontSize: "0.75rem" }}>
                  <span className="text-secondary">• Falhas: <strong>{reg.fatores.equipamentos_falha}</strong></span>
                  <span className="text-secondary">• O.S. Imediatas: <strong>{reg.fatores.manutencoes_imediatas}</strong></span>
                  <span className="text-secondary">• O.S. Atrasadas: <strong>{reg.fatores.manutencoes_atrasadas}</strong></span>
                  <span className="text-secondary">• Inativos/Furtos: <strong>{reg.fatores.equipamentos_furtados_indisponiveis}</strong></span>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                  Ações Recomendadas:
                </span>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {reg.recomendacoes.map((rec, idx) => (
                    <li key={idx} className="text-xs text-secondary flex-row items-center gap-1">
                      <AlertCircle size={11} style={{ color, flexShrink: 0 }} />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}