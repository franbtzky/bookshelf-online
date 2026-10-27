# Bookshelf Online

O **Bookshelf Online** é uma aplicação web full-stack para organizar leituras, acompanhar o progresso dos livros e interagir com outros leitores.

A plataforma permite criar uma biblioteca pessoal, descobrir livros por meio da Open Library e compartilhar experiências de leitura com a comunidade.

## Funcionalidades

- Cadastro e autenticação de usuários.
- Pesquisa de livros integrada à API Open Library.
- Estante pessoal com os status *Quero ler*, *Lendo* e *Lido*.
- Acompanhamento de páginas lidas e datas de leitura.
- Avaliação de livros e anotações pessoais.
- Marcação de livros favoritos.
- Publicação de avaliações para a comunidade.
- Pesquisa de usuários e visualização de perfis públicos.
- Envio, aceitação e gerenciamento de solicitações de amizade.
- Feed de atividades da comunidade e de amigos.
- Interface responsiva para computadores e dispositivos móveis.

## Tecnologias utilizadas

**Frontend**
- React
- TypeScript
- Vite
- CSS

**Backend**
- Node.js
- Express
- TypeScript
- JWT
- bcryptjs

**Banco de dados**
- MySQL

**Integração externa**
- Open Library API

## Estrutura do projeto

```text
bookshelf-online/
├── backend/
│   └── src/
│       ├── db.ts
│       ├── reviews.ts
│       └── server.ts
├── database/
│   └── schema.sql
├── frontend/
│   ├── public/
│   └── src/
└── README.md
```

## Como executar localmente

### Pré-requisitos

- Node.js e npm
- MySQL
- Git

### 1. Clonar o repositório

```bash
git clone URL_DO_REPOSITORIO
cd bookshelf-online
```

### 2. Configurar o banco de dados

Execute o arquivo `database/schema.sql` no MySQL para criar o banco `bookshelf_online` e suas tabelas.

### 3. Configurar o backend

```bash
cd backend
npm install
```

Copie o arquivo `.env.example` para `.env` e configure as variáveis de ambiente, incluindo a conexão com o MySQL e uma chave secreta para autenticação JWT.

Inicie o servidor:

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

Acesse o endereço exibido pelo Vite, normalmente `http://localhost:5173`.

## Status do projeto

Aplicação desenvolvida e testada localmente. Publicação online em preparação.

## Objetivo

Projeto desenvolvido para aplicar conhecimentos de desenvolvimento full-stack, incluindo construção de interfaces, APIs REST, autenticação, persistência de dados relacionais e integração com serviços externos.
