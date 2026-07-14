# 🚀 Node.js Backend Template - Advanced Node.js, Express & Prisma Architecture

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Este é um template pronto para produção, construído sobre o ecossistema **Node.js**, **Express**, e **Prisma ORM** com **PostgreSQL**. Projetado sob princípios de arquitetura limpa, segurança rígida e gerenciamento hierárquico de acessos, ele serve como a fundação definitiva para aplicações de alta escalabilidade.

## 🛠️ Tecnologias Utilizadas

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express
- **ORM**: Prisma (suporta PostgreSQL, MySQL, SQLite, etc.)
- **Segurança**: JSON Web Token (JWT) e Bcryptjs para hashing de senhas
- **Validação**: Zod para esquemas de dados rigorosos
- **Containerização**: Docker & Docker Compose

---

## 🚀 Funcionalidades Principais

### 🛡️ Segurança e Autenticação

- **Autenticação Avançada:** Fluxo completo baseado em JWT contendo `accessToken` (curto prazo) e `refreshToken` (longo prazo estruturado em tabela e persistido via cookies seguros).
- **Gerenciamento de Sessões:** Invalidação centralizada de todas as sessões ativas de um usuário em eventos críticos (como redefinição de senha).
- **Proteção Criptográfica Automatizada:** Extensão do Prisma Client (`$extends`) que intercepta, valida e hasheia de forma transparente o campo `password` em qualquer gatilho de persistência.
- **Mecanismo Criptográfico de OTP:** Geração de tokens de uso único (OTP) estritos de exatamente 6 dígitos numéricos baseados no módulo nativo `crypto.randomInt` do Node.js, erradicando a previsibilidade estatística e riscos de colisão inerentes ao `Math.random()`.
- **Rate Limiting Restritivo:** Middleware `authLimiter` acoplado nativamente nas rotas de `login`, `register`, `forgot-password` e `reset-password` para mitigação de ataques de força bruta, enumeração e DoS por exaustão de processamento do Bcrypt.

### 👑 Controle de Acesso Baseado em Hierarquia (RBAC)

- **Validação de Escopo:** Sistema inteligente de validação de papéis em rotas administrativas (`validateRoleHierarchy`), distinguindo de forma transparente ações executadas em perfil próprio (`/me`) de alterações operadas em terceiros.
- **Proteção contra Abuso de Poder:** Travas lógicas explícitas que impedem usuários com privilégios de mesmo nível (ex: `admin` editando outro `admin`) ou inferiores de alterarem credenciais superiores (`root`).

### ⚙️ Engenharia e Infraestrutura

- **Validação Rígida de Dados:** Esquemas de requisição e payload controlados e higienizados de ponta a ponta via **Zod Validation**.
- **Tratamento Global de Erros:** Middleware centralizado para interceptação de exceções síncronas/assíncronas com tratamento elegante via classe customizada `AppError`.
- **Conteinerização Isolada:** Ambiente 100% conteinerizado via **Docker** e **Docker Compose**, embarcando o runtime do Node.js e instâncias isoladas do banco PostgreSQL prontas para desenvolvimento ou deploy.
- **Documentação Viva:** Swagger UI acoplado nativamente com mapeamento modularizado de rotas e schemas de payloads em formato JSON.

---

## 🛠️ Arquitetura de Pastas

```text
├── prisma/
│   ├── migrations/          # Histórico de evolução e versionamento do banco
│   └── schema.prisma        # Modelagem de dados e definições de tabelas
├── src/
│   ├── config/              # Inicialização de banco, swagger e multer
│   ├── controllers/         # Interceptadores de requisições e retornos HTTP
│   ├── docs/                # Arquivos JSON de especificação do Swagger
│   ├── middlewares/         # Filtros de autenticação, error handler, rate-limit e validação Zod
│   ├── models/              # Schemas de validação e regras de campos (Zod)
│   ├── routes/              # Roteamento e desacoplamento de endpoints
│   ├── services/            # Camada isolada com as regras de negócio centrais
│   ├── templates/           # Templates estruturados de e-mails do sistema
│   ├── utils/               # Funções utilitárias e ferramentas criptográficas
│   ├── app.js               # Configuração express, middlewares globais e rotas
│   └── server.js            # Inicialização do servidor HTTP e escuta de portas
```

---

## 🏁 Primeiros Passos

### 📋 Pré-requisitos

- **Docker** e **Docker Compose** instalados localmente.
- Gerenciador de pacotes **npm** (ou yarn).

### 🔧 Instalação e Execução

1. **Clone o Repositório:**

   ```bash
   git clone https://github.com/pedromaggot38/api-template
   cd api-template
   ```

2. **Configure as Variáveis de Ambiente:**
   Copie o arquivo de exemplo e ajuste as credenciais conforme seu ambiente:

   ```bash
   cp .env.example .env
   ```

3. **Suba o Ambiente via Docker:**
   O compose cuidará do provisionamento do banco de dados e da inicialização da API automaticamente:

   ```bash
   docker-compose up --build
   ```

   A API estará disponível por padrão em `http://localhost:3000`.

4. **Documentação da API:**
   Acesse a interface interativa do Swagger para testar os endpoints em:
   ```text
   http://localhost:3000/api-docs
   ```

---

## 🔒 Segurança & Boas Práticas Incorporadas

- **Validação Cruzada Segura:** Fluxo de redefinição de senha (`resetUserPassword`) otimizado para buscar o usuário estritamente através do hash do token único e ativo, eliminando dependências redundantes do payload e mitigando furos de enumeração.
- **Garantia de Não-Redundância:** Validações profundas via `bcrypt.compare` aplicadas tanto no fluxo de atualização interna de credenciais (`updateMyPassword`) quanto no reset de senha para impedir que contas sejam sobrescritas com strings idênticas às senhas correntes.
- **Tratamento Assíncrono Seguro:** Roteamentos encapsulados pelo wrapper utilitário `catchAsync`, eliminando a necessidade de blocos repetitivos `try/catch` nos controladores e assegurando que rejeições de Promises sejam repassadas de forma confiável para o barramento do Express.

---

### 🌐 Mapeamento de Rotas da API

#### 🔐 1. Rotas de Autenticação (`/api/v1/auth`)

| Rota               | Método | Descrição                                                                                                 |    Tipo     |
| :----------------- | :----: | :-------------------------------------------------------------------------------------------------------- | :---------: |
| `/setup`           | `GET`  | Verifica se o sistema já possui um usuário soberano (`root`) configurado ou se está virgem.               | **Pública** |
| `/setup`           | `POST` | Inicializa a plataforma criando o primeiro usuário obrigatoriamente com o nível de acesso `root`.         | **Pública** |
| `/signup`          | `POST` | Criação de conta padrão para novos usuários comuns da plataforma.                                         | **Pública** |
| `/signin`          | `POST` | Autentica o usuário por username/senha, gerando os tokens JWT e salvando o Refresh Token nos cookies.     | **Pública** |
| `/refresh`         | `POST` | Consome o Refresh Token armazenado no cookie para renovar e emitir um novo `accessToken` válido.          | **Pública** |
| `/signout`         | `POST` | Invalida a sessão atual no banco de dados e limpa os cookies de Refresh Token do navegador.               | **Pública** |
| `/forgot-password` | `POST` | Solicita a recuperação de conta gerando e enviando um OTP seguro de 6 dígitos via e-mail.                 | **Pública** |
| `/reset-password`  | `POST` | Consome o OTP ativo do banco e redefine a senha do usuário, forçando o logout de todas as outras sessões. | **Pública** |

---

#### 👤 2. Rotas do Perfil Pessoal (`/api/v1/me`)

| Rota          | Método  | Descrição                                                                                     |    Tipo     |
| :------------ | :-----: | :-------------------------------------------------------------------------------------------- | :---------: |
| `/`           |  `GET`  | Retorna as informações detalhadas sobre a conta do usuário logado.                            | **Privada** |
| `/`           | `PATCH` | Atualiza dados cadastrais próprios. Suporta payload híbrido (JSON ou upload de avatar).       | **Privada** |
| `/password`   | `PATCH` | Altera a senha do próprio usuário logado, exigindo a confirmação da senha atual.              | **Privada** |
| `/activation` | `POST`  | Solicita o envio de um novo código OTP para ativação/verificação da conta atual.              | **Privada** |
| `/activation` | `PATCH` | Valida o código OTP enviado e efetiva a ativação/verificação da conta no banco de dados.      | **Privada** |
| `/email`      | `POST`  | Inicia a troca de e-mail enviando um token OTP para o e-mail pretendido.                      | **Privada** |
| `/email`      | `PATCH` | Confirma o OTP enviado ao novo endereço e efetiva a alteração do e-mail principal no banco.   | **Privada** |
| `/deactivate` | `PATCH` | Desativa a própria conta mudando o status para `deactivated` mediante envio da senha correta. | **Privada** |

---

#### 👑 3. Rotas do Painel Administrativo (`/api/v1/users`)

| Rota                       |  Método  | Descrição                                                                                          |             Tipo              |
| :------------------------- | :------: | :------------------------------------------------------------------------------------------------- | :---------------------------: |
| `/`                        |  `GET`   | Lista de forma paginada e com suporte a filtros de busca os usuários cadastrados na plataforma.    | **Privada** (`admin`, `root`) |
| `/`                        |  `POST`  | Cria um novo usuário pré-verificado e ativo direto com o cargo definido, respeitando a hierarquia. | **Privada** (`admin`, `root`) |
| `/{identifier}`            |  `GET`   | Localiza e exibe os detalhes de um usuário específico por ID, Username ou E-mail.                  | **Privada** (`admin`, `root`) |
| `/{identifier}`            | `PATCH`  | Atualiza permissões, status e dados de terceiros respeitando restrições hierárquicas.              | **Privada** (`admin`, `root`) |
| `/{identifier}`            | `DELETE` | Remove permanentemente um usuário do banco e invalida todas as suas sessões vinculadas.            |  **Privada** (`root` apenas)  |
| `/{identifier}/deactivate` | `PATCH`  | Força a desativação administrativa da conta de um terceiro sem necessidade de fornecer senhas.     | **Privada** (`admin`, `root`) |
