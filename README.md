# 🚀 API Template - Fastify, Prisma & PostgreSQL

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Um template robusto, escalável e de alto desempenho para construção de APIs RESTful utilizando a stack moderna do ecossistema Node.js.

Projetado com base nas melhores práticas de arquitetura limpa, segurança e performance, o projeto utiliza **Fastify** para máximo throughput e baixo consumo de memória, **Prisma ORM** com **PostgreSQL** para persistência relacional confiável, além de validação estrita via **TypeBox** e documentação automatizada via **Swagger**.

---

## 🛠️ Tecnologias Utilizadas

- **Runtime**: Node.js (ES Modules)
- **Framework Web**: Fastify
- **ORM**: Prisma (PostgreSQL)
- **Validação de Schemas**: TypeBox (Integração nativa com os hooks e compilador do Fastify)
- **Documentação Interativa**: Fastify Swagger & Swagger UI (OpenAPI 3.0 com examples)
- **Upload de Arquivos**: Fastify Multipart via streams assíncronos (sem uso de memória buffer desnecessária)
- **Segurança**: JSON Web Token (JWT), Cookies HttpOnly e Bcryptjs para hashing seguro de senhas
- **Containerização**: Docker & Docker Compose

---

## 🚀 Funcionalidades Principais

### 🛡️ Autenticação Avançada e RBAC

- **Setup Inicial do Sistema:** Verificação e criação do primeiro usuário do sistema (forçado como `root`) através de rotas dedicadas de setup.
- **Fluxo de Sessão Completo:** Autenticação baseada em JWT com `accessToken` de curta duração e `refreshToken` persistido em banco de dados e gerenciado com segurança via cookies.
- **Recuperação de Acesso e Verificações:** Fluxo de ativação de conta, troca de e-mail e redefinição de senha com tokens numéricos OTP gerados com tempo de expiração e enviados por e-mail.
- **Controle de Permissões (RBAC):** Níveis de privilégio estruturados com middleware de proteção e restrição granular de rotas.

### ⚡ Performance e Tratamento Centralizado

- **Validação Estrita em Tempo de Execução:** Validação e higienização automática de `body`, `querystring` e `params` diretamente na camada de rotas via schemas TypeBox.
- **Upload via Streams:** Processamento direto no disco para avatares e imagens estáticas, prevenindo travamento do event loop e vazamentos de memória por uploads pesados.
- **Paginação Genérica (`paginate`):** Utilitário dinâmico acoplado ao Prisma para padronização de paginação (`page`, `limit`, `skip`, `take`, ordenação e contagem agregada).
- **Sanitização de Payloads (`resfc`):** Padronização de respostas JSON (`status`, `message`, `data`, `meta`) com remoção automática recursiva de campos sensíveis (como `password`).
- **ErrorHandler Centralizado:** Captura e tradução de erros de validação do Fastify e falhas operacionais conhecidas do Prisma (`P2002`, `P2025`, `P2003`, `P2000`).

---

## 🛠️ Arquitetura de Pastas

```text
api-template/
├── logs/                    # Arquivos de log gerados pela aplicação
├── prisma/                  # Configurações e migrações do Prisma ORM
│   ├── migrations/          # Histórico de versionamento do banco de dados
│   ├── migration_lock.toml  # Lock de controle do Prisma
│   └── schema.prisma        # Modelagem das entidades relacionais
├── src/                     # Código-fonte principal da aplicação
│   ├── config/              # Instâncias de banco de dados e plugins
│   ├── controllers/         # Orquestração das requisições e respostas HTTP
│   ├── middlewares/         # Interceptadores (Autenticação, Upload, Error Handler)
│   ├── models/              # Schemas de validação estrita (TypeBox)
│   ├── routes/              # Mapeamento e definição de todos os endpoints
│   ├── services/            # Camada de regras de negócio e persistência
│   ├── templates/           # Templates de e-mail em HTML (OTP, Ativação)
│   ├── utils/               # Utilitários de paginação, formatação, tokens e logging
│   ├── app.js               # Instância do Fastify, hooks e registro de plugins
│   └── server.js            # Ponto de entrada que levanta o servidor HTTP
├── uploads/                 # Diretório local para armazenamento de arquivos
├── .dockerignore            # Arquivos ignorados na criação da imagem Docker
├── .env                     # Variáveis de ambiente sensíveis (ignorado no Git)
├── .env.example             # Template público das variáveis de ambiente
├── .gitignore               # Arquivos e diretórios ignorados no controle de versão
├── .prettierrc              # Regras de formatação do código
├── docker-compose.yml       # Orquestração dos serviços (API + PostgreSQL)
├── Dockerfile               # Instruções de build da imagem da aplicação
├── entrypoint.sh            # Script de inicialização executado dentro do container
├── eslint.config.js         # Padronização e qualidade de código
├── jsconfig.json            # Configuração de caminhos absolutos para o IntelliSense
├── package-lock.json        # Árvore de dependências exatas
├── package.json             # Metadados do projeto, scripts e dependências
├── prisma.config.js         # Configurações adicionais de inicialização do Prisma
└── README.md                # Documentação central do projeto
```

---

## 🏁 Primeiros Passos

### 📋 Pré-requisitos

- **Node.js** (v24) instalado localmente (para execução manual).
- **Docker** e **Docker Compose** instalados (recomendado).

### 🔧 Instalação e Execução

1. **Clone o Repositório:**

   ```bash
   git clone https://github.com/pedromaggot38/api-template.git
   cd api-template
   ```

2. **Configure as Variáveis de Ambiente:**
   Copie o arquivo de exemplo e ajuste as credenciais de banco, portas, secrets de JWT e configurações de SMTP:

   ```bash
   cp .env.example .env
   ```

3. **Executando Localmente:**

   ```bash
   # Instale as dependências
   npm install

   # Gere o Prisma Client e rode as migrações
   npx prisma generate
   npx prisma migrate dev

   # Inicie a aplicação em modo desenvolvimento
   npm run dev
   ```

4. **Executando via Docker:**

   ```bash
   docker compose up --build
   ```

A API estará disponível por padrão em `http://localhost:3000`.

---

## 📚 Documentação da API (Swagger)

A documentação interativa OpenAPI/Swagger é construída e exposta nativamente em tempo de execução.

Com o servidor rodando, acesse no navegador:

- **Swagger UI**: `http://localhost:3000/docs`

---

## 🌐 Mapeamento Completo de Rotas da API

### 🔐 1. Autenticação (`/api/v1/auth`)

Gerencia setup inicial, credenciais, sessões e fluxos de recuperação de senha. Rotas **públicas**.

| Rota               | Método  | Descrição                                                           |
| :----------------- | :-----: | :------------------------------------------------------------------ |
| `/setup`           |  `GET`  | Verifica se o sistema já possui um usuário `root` configurado.      |
| `/setup`           | `POST`  | Cria o primeiro usuário do sistema (forçado com privilégio `root`). |
| `/register`        | `POST`  | Cadastro padrão de novos usuários no sistema.                       |
| `/login`           | `POST`  | Autentica o usuário e retorna `accessToken` e cookies de sessão.    |
| `/logout`          | `POST`  | Encerra a sessão e revoga o token de refresh.                       |
| `/refresh-token`   | `POST`  | Emite um novo `accessToken` utilizando o Refresh Token ativo.       |
| `/forgot-password` | `POST`  | Envia um código OTP para o e-mail para redefinição de senha.        |
| `/reset-password`  | `PATCH` | Redefine a senha utilizando o código OTP validado.                  |

---

### 👤 2. Perfil do Usuário Logado (`/api/v1/me`)

Gerenciamento das informações da própria conta. Requer autenticação (`protect`).

| Rota          | Método  | Descrição                                                                     |
| :------------ | :-----: | :---------------------------------------------------------------------------- |
| `/`           |  `GET`  | Retorna os dados completos do perfil do usuário logado.                       |
| `/`           | `PATCH` | Atualiza dados cadastrais e realiza upload de avatar (`multipart/form-data`). |
| `/password`   | `PATCH` | Altera a senha atual da conta.                                                |
| `/activation` | `POST`  | Solicita novo envio de código OTP para ativação de conta.                     |
| `/activation` | `PATCH` | Valida o código OTP e ativa a conta no sistema.                               |
| `/email`      | `POST`  | Solicita alteração de e-mail (envia OTP de confirmação).                      |
| `/email`      | `PATCH` | Valida o OTP e atualiza o endereço de e-mail.                                 |
| `/deactivate` | `PATCH` | Desativa temporariamente a própria conta.                                     |

---

### 👥 3. Gestão Administrativa de Usuários (`/api/v1/users`)

Módulo administrativo para gerenciamento de contas. Requer privilégios elevados.

| Rota                       |  Método  | Descrição                                                 |    Restrição    |
| :------------------------- | :------: | :-------------------------------------------------------- | :-------------: |
| `/`                        |  `GET`   | Lista usuários de forma paginada com filtros e ordenação. | `admin`, `root` |
| `/`                        |  `POST`  | Criação manual de usuário com definição de cargo/status.  | `admin`, `root` |
| `/{id}`                    |  `GET`   | Busca detalhes completos de um usuário específico por ID. | `admin`, `root` |
| `/{id}`                    | `PATCH`  | Atualiza cadastros e status de contas de terceiros.       | `admin`, `root` |
| `/{id}`                    | `DELETE` | Remove ou desativa permanentemente o registro do usuário. |  `root` apenas  |
| `/{identifier}/deactivate` | `PATCH`  | Desativa administrativamente a conta de um terceiro.      | `admin`, `root` |
