# 🚀 Node.js Backend Template - Freelance Ready

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)


Este é um boilerplate robusto e escalável para o desenvolvimento rápido de APIs, utilizando **Node.js**, **Express**, **Prisma ORM** e **Docker**. Ele foi projetado para oferecer uma base segura e organizada para projetos freelancers, com foco em boas práticas de arquitetura e tratamento de erros.

## 🛠️ Tecnologias Utilizadas

* **Runtime**: Node.js (ES Modules)
* **Framework**: Express
* **ORM**: Prisma (suporta PostgreSQL, MySQL, SQLite, etc.)
* **Segurança**: JSON Web Token (JWT) e Bcryptjs para hashing de senhas
* **Validação**: Zod para esquemas de dados rigorosos
* **Containerização**: Docker & Docker Compose

## 🏗️ Arquitetura do Projeto

O projeto segue uma separação clara de responsabilidades para facilitar a manutenção:

* `src/controllers/`: Gerenciamento das requisições e respostas HTTP.
* `src/services/`: Lógica de negócio e integração com o Prisma.
* `src/middlewares/`: Proteção de rotas, CORS e tratamento global de erros.
* `src/models/`: Schemas de validação Zod.
* `src/routes/`: Definição dos endpoints da API.
* `src/utils/`: Utilitários globais e classes de erro personalizadas.

## 🛡️ Segurança e Estabilidade

### Tratamento de Erros Profissional
O template inclui um sistema de tratamento de erros centralizado composto por:
* **AppError**: Uma classe customizada para capturar erros operacionais (ex: 404, 400).
* **Global Error Handler**: Um middleware que diferencia erros em ambiente de **Desenvolvimento** (detalhado) e **Produção** (mensagens amigáveis), além de traduzir erros específicos do Prisma e JWT para o cliente.

### Configuração de CORS
Preparado para comunicação com front-ends em domínios diferentes através de variáveis de ambiente, garantindo que a API não sofra bloqueios de segurança indevidos.

## 🐳 Como Executar (Docker)

Este projeto foi desenhado para rodar totalmente isolado no Docker, eliminando a necessidade de instalar o Node.js localmente.

1.  **Configurar Variáveis de Ambiente**:
    Crie um arquivo `.env` baseado no `.env.example`.

2.  **Subir o Ambiente**:
    ```bash
    docker compose up -d
    ```

3.  **Executar Migrations**:
    ```bash
    docker compose exec app npx prisma migrate dev
    ```

## 📜 Scripts Disponíveis (via Docker)

Como o ambiente é isolado, utilize os atalhos abaixo para gerenciar o sistema:

* `docker compose exec app npm run dev`: Inicia o servidor com Hot-reload (Nodemon).
* `docker compose exec app npx prisma studio`: Abre a interface visual do banco de dados.
* `docker compose exec app npx prisma generate`: Atualiza o cliente do Prisma após mudanças no schema.

---

## 🗄️ Gestão do Banco de Dados (Prisma)

Todos os comandos devem ser executados através do container da aplicação:

### Resetar o Banco de Dados
Para limpar todos os dados e sincronizar o schema do zero (obrigatório em certas mudanças estruturais):
```bash
docker compose exec app npx prisma migrate reset
```

### Sincronizar Novas Tabelas
Sempre que alterar o `schema.prisma`, execute:
```bash
docker compose exec app npx prisma migrate dev --name nome_da_migracao
```

### Interface Visual (Prisma Studio)
Para gerenciar os dados pelo navegador:
```bash
docker compose exec app npx prisma studio
```
