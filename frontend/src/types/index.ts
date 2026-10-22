export type StatusEquipamento =
  | "operacional"
  | "com_falha"
  | "desativado"
  | "furtado"
  | "nao_instalado"
  | "em_manutencao";

export type TipoEquipamento =
  | "radar"
  | "camera"
  | "balanca"
  | "veiculo"
  | "cancela"
  | "patinete"
  | "outro";

export type StatusAgente = "ativo" | "em_servico" | "indisponivel";

export type PrioridadeManutencao = "baixa" | "media" | "alta" | "imediata";

export type StatusManutencao = "aberta" | "em_andamento" | "concluida" | "cancelada";

export interface Manutencao {
  id: number;
  equipamento_id: number;
  descricao: string;
  prioridade: PrioridadeManutencao;
  status: StatusManutencao;
  data_abertura: string;
  data_prevista: string | null;
  data_conclusao: string | null;
  responsavel: string | null;
  observacoes: string | null;
  equipamento_codigo?: string;
  equipamento_nome?: string;
}

export interface Equipamento {
  id: number;
  codigo: string;
  tipo: TipoEquipamento;
  nome: string;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  status: StatusEquipamento;
  rua: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string | null;
  latitude: number | null;
  longitude: number | null;
  caracteristicas_json: Record<string, any>;
  ultima_telemetria_em: string | null;
  criado_em: string;
  atualizado_em: string;
  manutencoes?: Manutencao[];
}

export interface Agente {
  id: number;
  nome: string;
  matricula: string;
  orgao: string;
  funcao: string;
  status: StatusAgente;
  bairro_base: string;
  latitude: number | null;
  longitude: number | null;
  atualizado_em: string;
}

export interface ResumoOperacional {
  total_equipamentos: number;
  operacionais: number;
  indisponiveis: number;
  disponibilidade_percentual: number | null;
  agentes_ativos: number;
  manutencoes_criticas: number;
  manutencoes_atrasadas: number;
}

export type SeveridadeAlerta = "critico" | "alerta" | "informativo";

export interface AlertaItem {
  id: string;
  tipo: string;
  severidade: SeveridadeAlerta;
  titulo: string;
  descricao: string;
  equipamento_id: number | null;
  equipamento_codigo: string | null;
  bairro: string | null;
  data: string;
}

export interface ItemMapa {
  id: number;
  categoria: "equipamento" | "agente";
  identificador: string;
  nome: string;
  tipo_ou_funcao: string;
  status: string;
  bairro: string;
  latitude: number;
  longitude: number;
  detalhes?: Record<string, any>;
}

export type NivelAtencao =
  | "Baixa atenção"
  | "Atenção moderada"
  | "Atenção alta"
  | "Atenção muito alta";

export interface FatoresRegiao {
  equipamentos_falha: number;
  manutencoes_imediatas: number;
  manutencoes_atrasadas: number;
  equipamentos_furtados_indisponiveis: number;
}

export interface RegiaoPreditiva {
  bairro: string;
  pontuacao: number;
  nivel: NivelAtencao;
  total_equipamentos: number;
  fatores: FatoresRegiao;
  recomendacoes: string[];
}
