# ToolMaster - Sistema de Gestão

Estrutura reorganizada com separação clara entre frontend e backend.

## 📁 Estrutura do Projeto

```
├── backend/           # API Node.js + Express
│   ├── server.js      # Servidor principal
│   ├── db.js          # Configuração do banco de dados
│   ├── package.json
│   ├── helpers/       # Funções auxiliares
│   ├── middleware/    # Middleware de autenticação, etc
│   └── routes/        # Rotas da API
│
└── frontend/          # React + TypeScript + Vite
    ├── src/
    │   ├── main.tsx
    │   ├── pages/     # Páginas da aplicação
    │   ├── components/# Componentes React
    │   ├── hooks/
    │   ├── lib/
    │   ├── utils/
    │   └── styles/
    ├── package.json
    └── vite.config.ts
```

## 🚀 Como Rodar

### Backend (Porta 3001)
```bash
cd backend
npm install
npm start
```

### Frontend (Porta 5173)
```bash
cd frontend
npm install
npm run dev
```

## 🔗 Conexão

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Token**: Stored em `localStorage`

## 📝 Notas

- As URLs da API no frontend estão configuradas para `http://localhost:3001/api`
- Authentication usa JWT armazenado em localStorage
- CORS está configurado no backend

## ⚙️ Configuração local (.env)

- Copie o arquivo de exemplo do backend e ajuste conforme necessário:

```bash
cd backend
cp .env.example .env
# (No Windows PowerShell) Copy-Item .env.example .env
```

- Valores padrões no `.env.example` apontam para um MySQL local em `localhost:3306`.
- Certifique-se de ter o MySQL rodando e com o banco `toolmaster` criado, ou ajuste `DB_NAME`.

## 🐳 Rodar o banco com Docker Compose

Se você não tem MySQL local, use o `docker-compose` incluso para subir um container MySQL e o Adminer (GUI):

```bash
# Na raiz do projeto
docker compose up -d

# Verifique containers
docker compose ps
```

Isso irá:
- Subir o MySQL na porta `3306` com o banco `toolmaster` e usuário `toolmaster`.
- Subir o Adminer em `http://localhost:8080` (use MySQL, host `127.0.0.1`, usuário `toolmaster`, senha `toolmaster_pass`).

Depois de subir o container, copie o `.env` do backend e inicie a API:

```bash
cd backend
cp .env.example .env   # PowerShell: Copy-Item .env.example .env
npm install
npm start
```

Agora abra o frontend normalmente (`cd frontend && npm run dev`).

## 🚩 Deploy no Railway (notas rápidas)

- No serviço do backend no Railway, configure estas variáveis de ambiente:

```
DB_HOST=switchback.proxy.rlwy.net
DB_PORT=51964
DB_USER=root
DB_PASSWORD=KfQqZXSjXTtajDsXGjHZNFxzvxKhuDti
DB_NAME=railway
JWT_SECRET=loja_ferramentas_2026
NODE_ENV=production
PORT=${{PORT}}
```

- No serviço do frontend, configure `VITE_API_URL` apontando para a URL pública do backend (sem `/api` no final). Exemplo:

```
VITE_API_URL=https://backend-production.up.railway.app
```

- Depois de ajustar as variáveis, faça redeploy do frontend no Railway.

- Observações: se `VITE_API_URL` não estiver configurado, o frontend usa `http://localhost:3001` como fallback (evita apontar para o hostname do frontend).
