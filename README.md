# BIG BROTHER — Ferramenta Onisciente de Gestão e Operações

> **Protótipo Demonstrativo Integrado** de gestão de equipamentos urbanos, monitoramento operacional e análise preventiva da cidade.

---

## 🏗️ Visão Geral da Arquitetura

O sistema BIG BROTHER foi projetado como uma aplicação web única, enxuta e desacoplada, composta por:
1. **Inventário Inteligente da Cidade**: Cadastro, consulta e gestão do ciclo de vida de equipamentos urbanos e agentes.
2. **Central de Operações da Cidade**: Dashboard unificado com indicadores de disponibilidade, visualização em mapa interativo (Leaflet) e lista de alertas operacionais por severidade.
3. **Cidade Preditiva**: Motores heurísticos explicáveis que calculam a atenção operacional por bairro e estimam a recorrência de acidentes com base no histórico e na disponibilidade local de equipamentos e agentes. As pontuações são indicadores, não probabilidades calibradas.

Todas as três camadas consomem **a mesma fonte de verdade**: uma API REST em **FastAPI** conectada a um banco relacional **SQLite**.

---

## 🛠️ Tecnologias Utilizadas

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.x, Pydantic V2, SQLite.
- **Frontend**: React, TypeScript, Vite, React Router, Leaflet / React-Leaflet, Recharts, Lucide React.
- **Transparência**: Dados demonstrativos fictícios georreferenciados na cidade de Marília, SP.

---

## 📁 Estrutura de Diretórios

```text
fogo/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # Inicialização FastAPI, CORS e roteamento
│   │   ├── database.py          # Conexão SQLAlchemy, sessão e Foreign Keys SQLite
│   │   ├── models.py            # Modelos: Equipamento, Agente, Manutencao
│   │   ├── schemas.py           # Schemas Pydantic e validações
│   │   ├── routers/             # Rotas organizadas por módulo (/api/...)
│   │   │   ├── equipamentos.py
│   │   │   ├── agentes.py
│   │   │   ├── manutencoes.py
│   │   │   ├── operacoes.py
│   │   │   └── preditivo.py
│   │   └── services/            # Lógica de negócio desacoplada
│   │       ├── indicadores.py   # Cálculo de resumo, KPIs e alertas
│   │       └── risco.py         # Heurística explicável de atenção operacional
│   ├── seed.py                  # Carga de dados de demonstração (idempotente)
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api/
        │   └── client.ts        # Cliente HTTP centralizado (GET/POST/PATCH/DELETE)
        ├── types/
        │   └── index.ts         # Contratos e tipos TypeScript
        └── ...
```

---

## 🚀 Como Executar

### 1. Backend (FastAPI + SQLite)

A partir da pasta `backend`:

```powershell
# 1. Ativar ambiente virtual
.\.venv\Scripts\Activate.ps1

# 2. Popular o banco com dados de teste demonstrativos (idempotente)
python seed.py

# 3. Iniciar o servidor com reload automático
uvicorn app.main:app --reload --port 8000
```

- Documentação Swagger interativa: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- Previsões de acidentes: `GET /api/preditivo/acidentes` retorna previsões de todos os bairros com histórico; `GET /api/preditivo/acidentes/{bairro}` filtra por bairro. Um estimador KDE gaussiano com raio de influência de 500 m calcula um índice espacial relativo ao maior valor encontrado no histórico. Na seção **Risco por Região**, os pop-ups mostram esse índice, além da recorrência e disponibilidade local. O índice KDE é exploratório, não uma probabilidade calibrada; os dados atuais são demonstrativos e ainda limitados para validar previsões futuras. A pontuação operacional também considera a recorrência, equipamentos indisponíveis e agentes indisponíveis.

---

### 2. Frontend (React + Vite + TypeScript)

A partir da pasta `frontend`:

```bash
npm install
npm run dev
```

- Acesso ao frontend: [http://localhost:5173](http://localhost:5173)