require('dotenv').config();
const express = require('express');
const morgan  = require('morgan');

const cron = require('node-cron');
const { rodarBaixaAutomatica } = require('./jobs/baixaAutomatica');
const { cancelarOrcamentosVencidos } = require('./jobs/cancelarOrcamentosVencidos');
// Roda todo dia à meia-noite
cron.schedule('0 0 * * *', () => {
  rodarBaixaAutomatica();
   cancelarOrcamentosVencidos();
});

// Roda uma vez ao iniciar o servidor (para pegar parcelas do dia)
rodarBaixaAutomatica();
cancelarOrcamentosVencidos();

const app  = express();
const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.json({ status: 'Backend online' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ── MIDDLEWARES ───────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());
app.use(morgan('dev'));

// ── ROTAS ─────────────────────────────────────────────────────────────────────
app.use('/api',               require('./routes/Auth'));
app.use('/api/dashboard',     require('./routes/Dashboard'));
app.use('/api/produtos',      require('./routes/Produtos'));
app.use('/api/clientes',      require('./routes/Cliente'));
app.use('/api/fornecedores',  require('./routes/Fornecedores'));
app.use('/api/funcionarios',  require('./routes/Funcionario'));
app.use('/api/cargos',        require('./routes/Funcionario'));
app.use('/api/vendas',        require('./routes/Vendas'));
app.use('/api/notificacoes',  require('./routes/Notificacoes'));
app.use('/api/OrdemServico',  require('./routes/OrdemServico'));
app.use('/api/orcamentos',    require('./routes/Orcamentos'));
app.use('/api/caixa',         require('./routes/Caixa'));
app.use('/api/pagamentos',    require('./routes/Pagamentos'));
app.use('/api/movimentacoes', require('./routes/movimentacoes'));
app.use('/api/loja',          require('./routes/Loja'));
app.use('/api/relatorios',    require('./routes/Relatorios'));

// ── ERRO GLOBAL ───────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
