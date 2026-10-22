import { apiGet, apiPost, apiPatch } from "./client.ts";
import {
  Equipamento,
  Agente,
  Manutencao,
  ResumoOperacional,
  AlertaItem,
  ItemMapa,
  RegiaoPreditiva,
} from "../types/index.ts";

export interface EquipamentoFilters {
  tipo?: string;
  status?: string;
  bairro?: string;
  busca?: string;
}

export const fogoApi = {
  // Saúde da API
  async checkHealth(): Promise<{ status: string; app: string; version: string }> {
    return apiGet<{ status: string; app: string; version: string }>("/health");
  },

  // Operações
  async getResumo(): Promise<ResumoOperacional> {
    return apiGet<ResumoOperacional>("/operacoes/resumo");
  },

  async getAlertas(): Promise<AlertaItem[]> {
    return apiGet<AlertaItem[]>("/operacoes/alertas");
  },

  async getItensMapa(): Promise<ItemMapa[]> {
    return apiGet<ItemMapa[]>("/operacoes/mapa");
  },

  // Equipamentos
  async getEquipamentos(filters?: EquipamentoFilters): Promise<Equipamento[]> {
    const params = new URLSearchParams();
    if (filters?.tipo) params.append("tipo", filters.tipo);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.bairro) params.append("bairro", filters.bairro);
    if (filters?.busca) params.append("busca", filters.busca);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiGet<Equipamento[]>(`/equipamentos${queryString}`);
  },

  async getEquipamentoById(id: number): Promise<Equipamento> {
    return apiGet<Equipamento>(`/equipamentos/${id}`);
  },

  async createEquipamento(payload: Partial<Equipamento>): Promise<Equipamento> {
    return apiPost<Equipamento>("/equipamentos", payload);
  },

  async updateEquipamento(id: number, payload: Partial<Equipamento>): Promise<Equipamento> {
    return apiPatch<Equipamento>(`/equipamentos/${id}`, payload);
  },

  // Agentes
  async getAgentes(): Promise<Agente[]> {
    return apiGet<Agente[]>("/agentes");
  },

  // Manutenções
  async getManutencoes(params?: { status?: string; prioridade?: string }): Promise<Manutencao[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.prioridade) query.append("prioridade", params.prioridade);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiGet<Manutencao[]>(`/manutencoes${qs}`);
  },

  async createManutencao(payload: {
    equipamento_id: number;
    descricao: string;
    prioridade: string;
    responsavel?: string;
    observacoes?: string;
  }): Promise<Manutencao> {
    return apiPost<Manutencao>("/manutencoes", payload);
  },

  // Cidade Preditiva
  async getRegioesPreditivas(): Promise<RegiaoPreditiva[]> {
    return apiGet<RegiaoPreditiva[]>("/preditivo/regioes");
  },
};
