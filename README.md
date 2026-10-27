# Bookshelf Online

**Sua biblioteca pessoal e uma comunidade para compartilhar experiências literárias.**

O **Bookshelf Online** é uma aplicação web full-stack que permite aos leitores descobrir livros, organizar suas estantes, acompanhar o progresso de leitura e interagir com outros usuários.

O projeto combina gerenciamento de leituras e funcionalidades de uma rede social literária, utilizando **React, TypeScript, Node.js, Express e MySQL**.

## Demonstração online

### [Acessar o Bookshelf Online](https://bookshelf-online.vercel.app/)

A aplicação está publicada e disponível para acesso público. É possível criar uma conta, organizar uma biblioteca pessoal, acompanhar leituras, publicar avaliações e interagir com outros leitores.

**Tecnologias principais:** React · TypeScript · Node.js · Express · MySQL

---

## Visão geral

O Bookshelf Online foi desenvolvido para reunir, em uma única plataforma, a organização de uma biblioteca pessoal e a interação entre leitores.

Por meio da integração com a **Open Library API**, os usuários podem pesquisar obras de diferentes gêneros literários, adicioná-las às suas estantes e registrar suas experiências de leitura.

A aplicação também oferece recursos sociais, como avaliações públicas, perfis de usuários, amizades e feeds de atividades.

## Funcionalidades

### Biblioteca pessoal

- Pesquisa e descoberta de livros por meio da Open Library API.
- Organização da estante por status: **Quero ler**, **Lendo** e **Lido**.
- Registro de avaliações e anotações pessoais.
- Marcação de livros favoritos.
- Atualização e remoção de livros da estante.

### Acompanhamento de leitura

- Registro da página atual e do total de páginas.
- Acompanhamento do progresso de leitura.
- Registro de datas de início e conclusão.
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

## Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| Frontend | React, TypeScript, Vite, CSS |
| Backend | Node.js, Express, TypeScript |
| Banco de dados | MySQL |
| Autenticação | JWT, bcryptjs |
| Integração externa | Open Library API |
| Hospedagem frontend | Vercel |
| Hospedagem backend | Render |
| Banco de dados em nuvem | Aiven |
| Versionamento | Git e GitHub |

## Arquitetura

A aplicação utiliza uma arquitetura cliente-servidor, com separação entre interface, API e persistência de dados.

```text
                  Usuário
                     |
                     v
           Frontend (React + Vite)
                   Vercel
                     |
              Requisições HTTP
                     |
                     v
         Backend (Node.js + Express)
                   Render
                     |
                Consultas SQL
                     |
                     v
               MySQL (Aiven)

Frontend ----------> Open Library API
                     Dados bibliográficos
```

O **frontend** é responsável pela interface e pela interação com os usuários.

O **backend** disponibiliza uma API REST para autenticação, gerenciamento de estantes, avaliações, relacionamentos entre usuários e feed de atividades.

O **MySQL** armazena os dados persistentes da aplicação, enquanto a **Open Library** fornece informações bibliográficas para pesquisa e descoberta de livros.

## Hospedagem e deploy

A aplicação está distribuída entre três serviços de nuvem:

- **Vercel:** hospedagem do frontend React, com deploy integrado ao repositório GitHub.
- **Render:** hospedagem e execução da API Node.js e Express.
- **Aiven:** hospedagem do banco de dados MySQL, com conexão SSL/TLS.

O frontend utiliza uma variável de ambiente para identificar o endereço público do backend. O backend utiliza variáveis de ambiente para configurar a conexão com o banco, a autenticação JWT e a origem permitida pelo CORS.

**Observação:** o backend utiliza uma instância gratuita do Render, que pode entrar em repouso após períodos de inatividade. Por isso, a primeira requisição pode demorar um pouco mais.

A pesquisa de livros também depende da disponibilidade e da acessibilidade da Open Library API.

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
│   ├── index.html
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

Inicie o servidor MySQL e execute o arquivo:

`database/schema.sql`

O script contém a estrutura necessária para o banco de dados da aplicação.

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
DB_SSL=false

JWT_SECRET=substitua_por_uma_chave_secreta_segura
FRONTEND_URL=http://localhost:5173
```

Ajuste as credenciais conforme sua instalação do MySQL e utilize uma chave JWT longa, aleatória e privada.

Inicie o backend:

```bash
npm run dev
```

A API estará disponível em:

`http://localhost:3001`

Para verificar a conexão com o banco de dados, acesse:

`http://localhost:3001/api/health`

### 4. Configurar o frontend

Em outro terminal, a partir da pasta principal do projeto:

```bash
cd frontend
npm install
```

Para configurar o endereço da API, crie um arquivo `.env.local` na pasta `frontend`:

```env
VITE_API_URL=http://localhost:3001/api
```

Inicie o frontend:

```bash
npm run dev
```

Acesse o endereço informado pelo Vite, normalmente:

`http://localhost:5173`

O frontend utiliza `VITE_API_URL` para definir o endereço da API, com fallback para o backend local.

## Segurança e configurações

- Credenciais e configurações sensíveis são definidas por variáveis de ambiente.
- O arquivo `.env` não deve ser versionado.
- O arquivo `.env.example` contém apenas valores de referência.
- Senhas são armazenadas com hash bcrypt.
- Rotas privadas utilizam autenticação JWT.
- Consultas SQL utilizam parâmetros para dados fornecidos pelos usuários.
- A conexão com o banco de dados em produção utiliza SSL/TLS.

## Melhorias futuras

- Aprimorar o tratamento de falhas e indisponibilidade da Open Library API.
- Implementar mensagens de erro e opções de nova tentativa para requisições externas.
- Otimizar a experiência em dispositivos móveis.
- Ampliar as funcionalidades de descoberta e recomendação de livros.
- Adicionar testes automatizados.
- Incluir capturas de tela da aplicação na documentação.

## Sobre o projeto

O **Bookshelf Online** foi desenvolvido como projeto de portfólio para aplicar conhecimentos de desenvolvimento web full-stack em uma aplicação com funcionalidades reais.

Seu desenvolvimento envolveu a construção de interfaces com React e TypeScript, criação de uma API REST com Node.js e Express, modelagem e integração de banco de dados relacional, implementação de autenticação, consumo de API externa e publicação em serviços de nuvem.

O projeto demonstra a aplicação prática de conceitos de arquitetura cliente-servidor, persistência de dados, integração entre sistemas e versionamento de código.

**Desenvolvido por [Franciny Kubitzky](https://github.com/franbtzky).**