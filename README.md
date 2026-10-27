# Bookshelf Online

**Sua biblioteca pessoal e uma comunidade para compartilhar experiências literárias.**

O Bookshelf Online é uma aplicação web full-stack que permite aos leitores descobrir livros, organizar suas estantes, acompanhar o progresso de leitura e interagir com outros usuários.

Desenvolvido com **React, TypeScript, Node.js, Express e MySQL**, o projeto integra funcionalidades de gerenciamento de leituras com recursos de uma rede social literária.

> **Status:** aplicação desenvolvida e testada localmente. Hospedagem pública em preparação.

## Visão geral

O Bookshelf Online foi desenvolvido para reunir, em uma única plataforma, o gerenciamento de uma biblioteca pessoal e a interação entre leitores.

Além de pesquisar livros por meio da Open Library, os usuários podem registrar suas leituras, avaliar obras, publicar comentários e acompanhar as atividades da comunidade.

## Funcionalidades

### Biblioteca pessoal
- Pesquisa de livros integrada à Open Library API.
- Organização da estante por status: **Quero ler**, **Lendo** e **Lido**.
- Registro de avaliações e anotações pessoais.
- Marcação de livros favoritos.
- Remoção e atualização de livros da estante.

### Acompanhamento de leitura
- Registro da página atual e do total de páginas.
- Acompanhamento do progresso de leitura.
- Datas de início e conclusão.
- Atualização do status de leitura.

### Comunidade literária
- Publicação de avaliações e comentários sobre livros.
- Visualização de avaliações de outros leitores.
- Feed de atividades da comunidade.
- Feed exclusivo de amigos.
- Pesquisa de usuários e visualização de perfis públicos.
- Envio, aceitação e gerenciamento de solicitações de amizade.

### Autenticação
- Cadastro e login de usuários.
- Armazenamento de senhas com hash bcrypt.
- Autenticação baseada em JSON Web Tokens (JWT).
- Proteção de rotas privadas no backend.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Frontend | React, TypeScript, Vite, CSS |
| Backend | Node.js, Express, TypeScript |
| Banco de dados | MySQL |
| Autenticação | JWT, bcryptjs |
| Integração externa | Open Library API |
| Versionamento | Git e GitHub |

## Arquitetura

A aplicação utiliza uma arquitetura cliente-servidor, com separação entre interface, API e persistência de dados.

```text
Frontend (React + Vite)
          |
          | Requisições HTTP
          v
Backend (Node.js + Express)
          |
          | Consultas SQL
          v
       MySQL

Frontend ───> Open Library API
```

O backend é responsável pela autenticação, gerenciamento das estantes, avaliações, relacionamentos entre usuários e feed de atividades.

O MySQL armazena os dados da aplicação, enquanto a Open Library fornece informações bibliográficas para a pesquisa de livros.

## Estrutura do projeto

```text
bookshelf-online/
├── backend/
│   ├── src/
│   │   ├── db.ts
│   │   ├── reviews.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── database/
│   └── schema.sql
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   └── package.json
├── .gitignore
└── README.md
```

## Como executar localmente

### Pré-requisitos

- Node.js e npm
- MySQL
- Git

### 1. Clonar o repositório

```bash
git clone https://github.com/franbtzky/bookshelf-online.git
cd bookshelf-online
```

### 2. Configurar o banco de dados

Inicie seu servidor MySQL e execute o arquivo:

`database/schema.sql`

O script cria o banco de dados `bookshelf_online` e as tabelas necessárias para a aplicação.

### 3. Configurar o backend

Acesse a pasta do backend e instale as dependências:

```bash
cd backend
npm install
```

Crie um arquivo `.env` com base no `.env.example`:

```env
PORT=3001

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=bookshelf_online

JWT_SECRET=substitua_por_uma_chave_secreta_segura
FRONTEND_URL=http://localhost:5173
```

Ajuste as credenciais conforme sua instalação do MySQL e utilize uma chave JWT longa, aleatória e privada.

Inicie o backend:

```bash
npm run dev
```

A API estará disponível em `http://localhost:3001`.

### 4. Configurar o frontend

Em outro terminal, a partir da pasta principal do projeto:

```bash
cd frontend
npm install
npm run dev
```

Acesse o endereço informado pelo Vite, normalmente:

`http://localhost:5173`

**Observação:** nesta versão, o frontend utiliza `http://localhost:3001/api` como endereço da API. Para hospedar a aplicação, esse endereço deverá ser configurado para o backend publicado.

## Segurança e configurações

- As credenciais do banco de dados são configuradas por variáveis de ambiente.
- O arquivo `.env` não deve ser versionado.
- O arquivo `.env.example` contém apenas valores de referência.
- Senhas são armazenadas com hash bcrypt.
- As rotas privadas utilizam autenticação JWT.
- As consultas SQL utilizam parâmetros para dados fornecidos pelos usuários.

## Próximas etapas

- Publicação do frontend, backend e banco de dados na nuvem.
- Configuração das URLs e variáveis de ambiente de produção.
- Inclusão de capturas de tela da aplicação.
- Disponibilização de um link público para demonstração.

## Sobre o projeto

O Bookshelf Online foi desenvolvido como projeto de portfólio para aplicar conceitos
