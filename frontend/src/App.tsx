import React, { useEffect, useState, useCallback } from "react";
import { Navbar, TabType } from "./components/Navbar.tsx";
import { KPICards } from "./components/KPICards.tsx";
import { AlertsPanel } from "./components/AlertsPanel.tsx";
import { MapLeaflet } from "./components/MapLeaflet.tsx";
import { EquipamentosTable } from "./components/EquipamentosTable.tsx";
import { AgentesTable } from "./components/AgentesTable.tsx";
import { ManutencoesTable } from "./components/ManutencoesTable.tsx";
import { PredictivePanel } from "./components/PredictivePanel.tsx";
import { fogoApi } from "./api/fogoApi.ts";
import {
  ResumoOperacional,
  AlertaItem,
  ItemMapa,
  Equipamento,
  Agente,
  Manutencao,
  RegiaoPreditiva,
} from "./types/index.ts";
import { AlertTriangle, RefreshCw, TrendingUp } from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [resumo, setResumo] = useState<ResumoOperacional | null>(null);
  const [alertas, setAlertas] = useState<AlertaItem[]>([]);
  const [itensMapa, setItensMapa] = useState<ItemMapa[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [regioes, setRegioes] = useState<RegiaoPreditiva[]>([]);

  const [selectedCodigoFilter, setSelectedCodigoFilter] = useState<string | null>(null);

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
      ]);

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

  const handleSelectEquipamentoFromAlert = (codigo: string) => {
    setSelectedCodigoFilter(codigo);
    setActiveTab("equipamentos");
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendOnline={isBackendOnline}
        onRefresh={() => fetchAllData(false)}
        isRefreshing={isRefreshing}
      />

      <main className="main-content">
        {errorMessage && (
          <div className="alert-item" style={{ background: "var(--status-danger-bg)", borderColor: "var(--status-danger-border)" }}>
            <div className="flex-row items-center gap-2">
              <AlertTriangle size={18} style={{ color: "var(--status-danger)" }} />
              <span className="text-sm" style={{ color: "#fca5a5" }}>{errorMessage}</span>
            </div>
            <button
              id="btn-retry-connection"
              className="btn btn-secondary btn-sm"
              onClick={() => fetchAllData(false)}
            >
              <RefreshCw size={12} />
              <span>Reconectar</span>
            </button>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="fade-in flex-col gap-4">
            <KPICards resumo={resumo} loading={loading} />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.25rem" }}>
              <MapLeaflet items={itensMapa} />
              <AlertsPanel
                alertas={alertas}
                onSelectEquipamento={handleSelectEquipamentoFromAlert}
              />
            </div>

            {regioes.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <TrendingUp size={16} className="text-secondary" />
                    <span>Regiões com Maior Atenção Operacional</span>
                  </h3>
                  <button
                    id="btn-ver-todos-preditivo"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveTab("preditivo")}
                  >
                    Ver Todas as Regiões
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
                  {regioes.slice(0, 4).map((r) => (
                    <div key={r.bairro} className="alert-item flex-col gap-1">
                      <div className="flex-row justify-between items-center" style={{ width: "100%" }}>
                        <strong style={{ fontSize: "0.85rem", color: "#fff" }}>{r.bairro}</strong>
                        <span className="badge text-xs" style={{
                          color: r.pontuacao >= 50 ? "var(--status-danger)" : "var(--status-warning)",
                          background: r.pontuacao >= 50 ? "var(--status-danger-bg)" : "var(--status-warning-bg)"
                        }}>
                          {r.pontuacao} pts
                        </span>
                      </div>
                      <p className="text-xs text-muted" style={{ margin: 0 }}>
                        {r.recomendacoes[0] || "Sem ocorrências críticas registradas."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "mapa" && (
          <div className="fade-in">
            <MapLeaflet items={itensMapa} />
          </div>
        )}

        {activeTab === "equipamentos" && (
          <div className="fade-in">
            <EquipamentosTable
              equipamentos={equipamentos}
              onRefresh={() => fetchAllData(true)}
              selectedCodigoFilter={selectedCodigoFilter}
              onClearCodigoFilter={() => setSelectedCodigoFilter(null)}
            />
          </div>
        )}

        {activeTab === "agentes" && (
          <div className="fade-in">
            <AgentesTable agentes={agentes} />
          </div>
        )}

        {activeTab === "manutencoes" && (
          <div className="fade-in">
            <ManutencoesTable
              manutencoes={manutencoes}
              equipamentos={equipamentos}
              onRefresh={() => fetchAllData(true)}
            />
          </div>
        )}

        {activeTab === "preditivo" && (
          <div className="fade-in">
            <PredictivePanel regioes={regioes} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
