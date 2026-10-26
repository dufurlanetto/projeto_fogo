import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { ItemMapa, PrevisaoAcidente } from "../types/index.ts";
import { RefreshCw } from "lucide-react";

interface MapLeafletProps {
  items: ItemMapa[];
  onSelectItem?: (identificador: string) => void;
  previsoesAcidentes?: PrevisaoAcidente[];
  comPrevisao?: boolean;
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

export const MapLeaflet: React.FC<MapLeafletProps> = ({
  items,
  previsoesAcidentes = [],
  comPrevisao = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeFilter, setActiveFilter] = useState<"todos" | "equipamento" | "agente" | "falhas" | "previsões">("todos");

  const filteredItems = items.filter((item) => {
    if (activeFilter === "todos") return true;
    if (activeFilter === "equipamento") return item.categoria === "equipamento" && !['com_falha', 'desativado', 'furtado'].includes(item.status);
    if (activeFilter === "agente") return item.categoria === "agente";
    if (activeFilter === "falhas") return item.status === "com_falha" || item.status === "furtado";
    if (activeFilter === "previsões") return false;
    return true;
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-22.2139, -49.9458],
      zoom: 13,
      attributionControl: false,
    });

    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 16,
      attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    const bounds = L.latLngBounds([]);

    filteredItems.forEach((item) => {
      if (typeof item.latitude !== "number" || typeof item.longitude !== "number") return;

      let markerColor = "#10b981";
      let symbol = "•";

      if (item.categoria === "agente") {
        markerColor = "#3b82f6";
        symbol = "A";
      } else if (item.status === "com_falha") {
        markerColor = "#ef4444";
        symbol = "!";
      } else if (item.status === "em_manutencao") {
        markerColor = "#f59e0b";
        symbol = "M";
      } else if (item.status === "furtado" || item.status === "desativado") {
        markerColor = "#64748b";
        symbol = "x";
      }

      const customIcon = L.divIcon({
        className: "custom-map-marker",
        html: `
          <div style="
            background: ${markerColor};
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            border: 2px solid #0f172a;
            box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            cursor: pointer;
          ">${symbol}</div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -11],
      });

      const marker = L.marker([item.latitude, item.longitude], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: inherit; min-width: 180px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #94a3b8;">
              ${item.categoria === "agente" ? "Equipe de Campo" : "Dispositivo"}
            </span>
            <span style="font-size: 10px; padding: 1px 5px; border-radius: 4px; background: rgba(255,255,255,0.08); color: ${markerColor}; font-weight: 600;">
              ${item.status.replace("_", " ")}
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #94a3b8; margin-bottom: 2px;">
            ${item.nome}
          </div>
          <div style="font-size: 11px; color: #94a3b8;">
            <strong>Cód:</strong> ${item.identificador} • <strong>Bairro:</strong> ${item.bairro}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersGroup.addLayer(marker);
      bounds.extend([item.latitude, item.longitude]);
    });

  if (comPrevisao) {
    previsoesAcidentes.forEach((previsao) => {
      if (
        typeof previsao.latitude !== "number" ||
        typeof previsao.longitude !== "number"
      ) {
        return;
      }

      if (activeFilter !== "previsões" && activeFilter !== "todos") {
        return;
      }

      const marker = L.marker([previsao.latitude, previsao.longitude], {
        icon: L.divIcon({
          className: "custom-map-marker accident-risk-marker",
          html: `
            <div style="
              background: #dc2626;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              border: 2px solid #fff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.55);
              cursor: pointer;
            ">!</div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        }),
      });
      
      marker.bindPopup(`
        <div style="font-family: inherit; min-width: 210px; padding: 2px;">
          <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #dc2626; margin-bottom: 4px;">
            Possível acidente — risco ${escapeHtml(previsao.nivel)}
          </div>
          <div style="font-size: 13px; color: #000; line-height: 1.6;">
            <div><strong>Bairro:</strong> ${escapeHtml(previsao.bairro)}</div>
            <div><strong>Ocorrências históricas:</strong> ${previsao.ocorrencias_historicas}</div>
            <div><strong>Índice espacial KDE relativo ao histórico:</strong> ${previsao.indice_densidade_modelo ?? "indisponível"}${previsao.indice_densidade_modelo === null ? "" : "/100"}</div>
            <div><strong>Equipamentos indisponíveis:</strong> ${previsao.equipamentos_indisponiveis}/${previsao.total_equipamentos}</div>
            <div><strong>Agentes indisponíveis:</strong> ${previsao.agentes_indisponiveis}/${previsao.total_agentes}</div>
          </div>
        </div>
      `);
      markersGroup.addLayer(marker);
      bounds.extend([previsao.latitude, previsao.longitude]);
    })
  };

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [filteredItems, previsoesAcidentes]);

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    const bounds = L.latLngBounds([]);
    filteredItems.forEach((item) => {
      if (typeof item.latitude === "number" && typeof item.longitude === "number") {
        bounds.extend([item.latitude, item.longitude]);
      }
    });
    previsoesAcidentes.forEach((previsao) => {
      if (
        typeof previsao.latitude === "number" &&
        typeof previsao.longitude === "number"
      ) {
        bounds.extend([previsao.latitude, previsao.longitude]);
      }
    });
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
      return;
    }
    mapInstanceRef.current.setView([-22.2139, -49.9458], 13);
  };

  return (
    <div className="card" id="map-section" style={{border: 'none', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div className="card-header">

        <div className="flex-row items-center gap-2">
          <div className="nav-tabs">
            <button
              id="filter-map-todos"
              className={`nav-tab-btn btn-sm ${activeFilter === "todos" ? "active" : ""}`}
              onClick={() => setActiveFilter("todos")}
            >
              Todos ({items.length})
            </button>
            <button
              id="filter-map-equip"
              className={`nav-tab-btn btn-sm ${activeFilter === "equipamento" ? "active" : ""}`}
              onClick={() => setActiveFilter("equipamento")}
            >
              Ativos
            </button>
            <button
              id="filter-map-agentes"
              className={`nav-tab-btn btn-sm ${activeFilter === "agente" ? "active" : ""}`}
              onClick={() => setActiveFilter("agente")}
            >
              Equipes
            </button>
            <button
              id="filter-map-falhas"
              className={`nav-tab-btn btn-sm ${activeFilter === "falhas" ? "active" : ""}`}
              onClick={() => setActiveFilter("falhas")}
            >
              Falhas
            </button>
            { comPrevisao &&
            <button
              id="filter-map-equip"
              className={`nav-tab-btn btn-sm ${activeFilter === "previsões" ? "active" : ""}`}
              onClick={() => setActiveFilter("previsões")}
            >
              Previsões
            </button>
          }
          </div>

          <button
            id="btn-map-recenter"
            className="btn btn-secondary btn-sm"
            onClick={handleResetView}
            title="Recentralizar no município"
          >
            <RefreshCw size={12} />
            <span>Centralizar</span>
          </button>
        </div>
      </div>

      <div ref={mapContainerRef} className="map-container" id="leaflet-map-canvas" />

      <div className="flex-row items-center gap-4 text-xs text-muted" style={{ marginTop: "0.75rem", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Legenda:</span>
      {previsoesAcidentes.length > 0 && (
        <div className="flex-row items-center gap-1">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626" }} />
          <span>Possível acidente (clique para detalhes)</span>
        </div>
      )}
        <div className="flex-row items-center gap-1">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
          <span>Operacional</span>
        </div>
        <div className="flex-row items-center gap-1">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
          <span>Falha</span>
        </div>
        <div className="flex-row items-center gap-1">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
          <span>Manutenção</span>
        </div>
        <div className="flex-row items-center gap-1">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }} />
          <span>Equipe</span>
        </div>
        <div className="flex-row items-center gap-1">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#64748b" }} />
          <span>Inativo / Furto</span>
        </div>
      </div>
    </div>
  );
};
