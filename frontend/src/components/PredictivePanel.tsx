import React, { useCallback, useEffect, useState } from "react";
import { RegiaoPreditiva, NivelAtencao, ItemMapa, AlertaItem, ResumoOperacional, Equipamento, Agente, Manutencao, PrevisaoAcidente } from "../types/index.ts";
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
  const [previsoesAcidentes, setPrevisoesAcidentes] = useState<PrevisaoAcidente[]>([]);
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
          previsoesAcidentesData,
        ] = await Promise.all([
          fogoApi.getResumo(),
          fogoApi.getAlertas(),
          fogoApi.getItensMapa(),
          fogoApi.getEquipamentos(),
          fogoApi.getAgentes(),
          fogoApi.getManutencoes(),
          fogoApi.getRegioesPreditivas(),
          fogoApi.getPrevisoesAcidentes(),
        ])
          setResumo(resumoData);
          setAlertas(alertasData);
          setItensMapa(mapaData);
          setEquipamentos(equipData);
          setAgentes(agentesData);
          setManutencoes(manutData);
          setRegioes(regioesData);
          setPrevisoesAcidentes(previsoesAcidentesData);
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
            <span>{showFormula ? "Fechar explicação" : "Como o risco é calculado?"}</span>
            {showFormula ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.25rem", marginTop: '25px' }}>
          <MapLeaflet
            comPrevisao={true}
            items={itensMapa}
            previsoesAcidentes={previsoesAcidentes}
          />
        </div>  

        {showFormula && (
          <div
            className="alert-item text-lg"
            style={{ marginTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}
          >
            <strong>KDE (Estimativa de Densidade por Kernel):</strong>{" "}
            O algoritmo soma a influência dos acidentes históricos em cada local,
            dando mais peso aos pontos próximos (largura de referência de 500 m).
            O resultado é normalizado de 0 a 100 em relação à maior concentração
            observada: quanto maior o índice, maior a concentração histórica no
            entorno. É um indicador relativo, não uma probabilidade de acidente.
          </div>
        )}
      </div>
    </div>
  );
};