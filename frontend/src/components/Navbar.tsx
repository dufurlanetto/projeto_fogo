import React from "react";
import {
  LayoutDashboard,
  MapPin,
  Cpu,
  Users,
  ClipboardList,
  TrendingUp,
  RefreshCw,
  Radio,
} from "lucide-react";

export type TabType =
  | "dashboard"
  | "mapa"
  | "equipamentos"
  | "agentes"
  | "manutencoes"
  | "preditivo";

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isBackendOnline: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isBackendOnline,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand-section">
          <div className="brand-badge">
            <Radio size={15} />
            <span>FOGO</span>
          </div>
          <div className="brand-meta">
            <span className="brand-title">Centro de Operações Urbanas</span>
            <span className="brand-subtitle">EMDURB • Marília / SP</span>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Navegação">
          <button
            id="tab-dashboard"
            className={`nav-tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={15} />
            <span>Visão Geral</span>
          </button>

          <button
            id="tab-mapa"
            className={`nav-tab-btn ${activeTab === "mapa" ? "active" : ""}`}
            onClick={() => setActiveTab("mapa")}
          >
            <MapPin size={15} />
            <span>Mapa</span>
          </button>

          <button
            id="tab-equipamentos"
            className={`nav-tab-btn ${activeTab === "equipamentos" ? "active" : ""}`}
            onClick={() => setActiveTab("equipamentos")}
          >
            <Cpu size={15} />
            <span>Ativos</span>
          </button>

          <button
            id="tab-agentes"
            className={`nav-tab-btn ${activeTab === "agentes" ? "active" : ""}`}
            onClick={() => setActiveTab("agentes")}
          >
            <Users size={15} />
            <span>Equipes</span>
          </button>

          <button
            id="tab-manutencoes"
            className={`nav-tab-btn ${activeTab === "manutencoes" ? "active" : ""}`}
            onClick={() => setActiveTab("manutencoes")}
          >
            <ClipboardList size={15} />
            <span>Ordens de Serviço</span>
          </button>

          <button
            id="tab-preditivo"
            className={`nav-tab-btn ${activeTab === "preditivo" ? "active" : ""}`}
            onClick={() => setActiveTab("preditivo")}
          >
            <TrendingUp size={15} />
            <span>Risco por Região</span>
          </button>
        </nav>

        <div className="flex-row items-center gap-3">
          <button
            id="btn-refresh-global"
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            title="Sincronizar dados"
          >
            <RefreshCw size={13} className={isRefreshing ? "spin-icon" : ""} />
            <span>Atualizar</span>
          </button>

          <div
            id="status-backend-pill"
            className="status-pill"
            style={{
              color: isBackendOnline ? "var(--status-success)" : "var(--status-danger)",
              borderColor: isBackendOnline ? "var(--status-success-border)" : "var(--status-danger-border)",
            }}
          >
            <div
              className="pulse-dot"
              style={{ background: isBackendOnline ? "var(--status-success)" : "var(--status-danger)" }}
            />
            <span>{isBackendOnline ? "Serviço Operacional" : "Sem Conexão"}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
