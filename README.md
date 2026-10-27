# Big Brother — Ferramenta Onisciente de Gestão e Operações

## Visão Geral
O Big Brother é um protótipo de aplicação web desenvolvido para o contexto de cidades inteligentes. Seu objetivo é centralizar informações sobre equipamentos urbanos, apoiar o acompanhamento das operações e transformar dados históricos em indicadores que auxiliem o planejamento e a tomada de decisão.

O projeto foi desenvolvido para o **Coder Challenge DSIN 2026** e integra gestão de recursos, visualização geográfica e análise de ocorrências em uma única aplicação.

## Objetivos do projeto

- Centralizar o cadastro e o acompanhamento de equipamentos urbanos e agentes operacionais
- Facilitar a visualização da disponibilidade dos recursos e das necessidades de manutenção
- Consolidar indicadores e alertas para apoiar o monitoramento das operações
- Explorar dados históricos e informações geográficas para identificar regiões que merecem maior atenção operacional

## Funcionalidades

### 1. Inventário Inteligente da Cidade

Permite organizar e consultar informações sobre os recursos urbanos cadastrados

- Cadastro e consulta de equipamentos
- Acompanhamento de status e disponibilidade
- Gestão de agentes operacionais
- Registro e acompanhamento de manutenções

### 2. Central de Operações da Cidade

Reúne informações operacionais em uma visão centralizada

- Dashboard com indicadores de operação
- Visualização geográfica dos recursos em mapa interativo
- Consulta da disponibilidade de equipamentos e agentes
- Exibição de alertas operacionais e informações relevantes para o acompanhamento da cidade

### 3. Cidade Preditiva

Utiliza dados históricos e informações espaciais para apoiar a identificação de áreas suscetíveis à acidentes ou que necessitam de mais atenção

- Análise da recorrência de ocorrências por região
- Identificação de concentrações geográficas de acidentes
- Cálculo de indicadores relativos de densidade espacial
- Consideração da disponibilidade local de equipamentos e agentes
- Classificação de regiões segundo indicadores de atenção operacional

> **Importante:** os indicadores da Cidade Preditiva são exploratórios e baseados em heurísticas. Eles não representam probabilidades calibradas de acidentes nem garantem a previsão de eventos futuros.

---

## Arquitetura

A aplicação utiliza uma arquitetura cliente-servidor, separando a interface visual, a API e a persistência dos dados.

![Diagrama de Arquitetura](https://mermaid.ink/img/pako:eNplkk1OwzAQha9izQpEW9IE0jRCSP1DgAoUGrEAszD2kEYkduU4glJ6GM7AEXoxXBcCErPys78347FnCVwJhBiecvXCZ0wbkgypppLY6N1TONFKGpTi6FHvH98g44bskWQxxynX2XwjbjODFB5-TH1r6k3OyM1omjjTZGFmSlrwhJXGnvxhB5YdsIIJRgQSwYQqnWV6Pe7lfIbF4g88vN-h0GeSq3-wu8FuTY5s2vH6M824yysxXX_yTDn6TAq7LZTGkiBhcv2RZyWW33XqzslRs3n8TuE0SSZkn5xPry4pvJN-3aUDyKguudWDurOtdk8JDUh1JiA2usIGFKgLtpGw3LAUjG3U3j-2S42iem0Kpp-bXOVKU6ByZf1zJu-UKn5SaFWlM4ifWF5aVc0FMzjMWKrZL2L_DPVAVdJAHIYuBcRLeIX4IPRafhR1D9p-GARhZA8XEAftlh9GnW7k-VG3HflBsGrAmyvqtaLOoWfDD71Ox_MPG4AiM0pfbGfHjdDqC3mCtQk?type=png)

### Fluxo de funcionamento

1. O usuário interage com a interface web
2. O frontend realiza requisições HTTP à API REST
3. O backend valida os dados e executa as regras de negócio
4. As informações são consultadas ou persistidas no banco SQLite
5. A API retorna os resultados em JSON para apresentação na interface

Essa separação facilita a manutenção do código e permite evoluir o frontend e o backend de forma independente.

## Tecnologias utilizadas

| Camada | Tecnologias | Finalidade |
|---|---|---|
| Frontend | React, TypeScript e Vite | Interface e desenvolvimento da aplicação web |
| Navegação | React Router | Organização das páginas |
| Mapas | Leaflet e React-Leaflet | Visualização geográfica interativa |
| Gráficos | Recharts | Apresentação de indicadores |
| Ícones | Lucide React | Elementos visuais da interface |
| Backend | Python e FastAPI | Implementação da API REST |
| Validação | Pydantic | Validação e estruturação dos dados |
| Persistência | SQLAlchemy e SQLite | Mapeamento objeto-relacional e armazenamento |
| Comunicação | HTTP e JSON | Integração entre frontend e backend |

## Estrutura do projeto

```text
projeto_fogo/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
|   |   |── predictions.py
│   │   ├── routers/
│   │   │   ├── equipamentos.py
│   │   │   ├── agentes.py
│   │   │   ├── manutencoes.py
│   │   │   ├── operacoes.py
│   │   │   └── preditivo.py
│   │   └── services/
│   │       ├── indicadores.py
│   │       └── risco.py
│   ├── seed.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/
│       │   └── client.ts
│       ├── types/
│       │   └── index.ts
│       └── ...
└── README.md
```

## Como executar o projeto

### Pré-requisitos

Antes de iniciar, instale:

- Python 3.11 ou superior.
- Node.js e npm.
- Git.

### 1. Clone o repositório

```bash
git clone https://github.com/dufurlanetto/projeto_fogo.git
cd projeto_fogo
```

### 2. Configure o backend

Acesse a pasta do backend:

```bash
cd backend
```

Crie e ative um ambiente virtual.

**Windows — PowerShell:**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux ou macOS:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Carregue os dados demonstrativos:

```bash
python seed.py
```

Inicie o servidor:

```bash
uvicorn app.main:app --reload --port 8000
```

Com o backend em execução, os endereços disponíveis são:

- **Documentação interativa da API:** http://localhost:8000/docs
- **Health check:** http://localhost:8000/api/health

### 3. Configure o frontend

Em outro terminal, a partir da raiz do repositório:

```bash
cd frontend
npm install
npm run dev
```

Acesse a aplicação pelo endereço informado pelo Vite, normalmente:

http://localhost:5173

Mantenha os dois servidores em execução enquanto utiliza o sistema.

<br>
<br>

<p align="center">
  **Desenvolvido para o Coder Challenge DSIN 2026**
</p>
