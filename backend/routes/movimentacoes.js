const router = require('express').Router();
const auth   = require('../middleware/Auth');
const permissao = require('../middleware/permissao');
const { q }  = require('../db');
const { err500 } = require('../helpers/Response');

const pCaixa = permissao(1, 2, 5);

function calcularTotais(movs) {
  const totais = movs.reduce((acc, m) => {
    if (m.tipo === 'entrada') acc.entradas += Number(m.valor);
    else acc.saidas += Number(m.valor);
    return acc;
  }, { entradas: 0, saidas: 0 });

  totais.saldo = totais.entradas - totais.saidas;
  return totais;
}

function dataValida(data) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(data || ''));
}

// ── FILTRAR POR DIA E/OU CAIXA ────────────────────────────────────────────────
router.get('/filtro', auth, pCaixa, async (req, res) => {
  try {
    const { data, id_caixa } = req.query;

    let sql = `
      SELECT
        m.*,
        c.id_funcionario,
        f.nome AS funcionario_nome
      FROM movimentacao_caixa m
      INNER JOIN caixa c ON c.id_caixa = m.id_caixa
      LEFT JOIN funcionario f ON f.id_funcionario = c.id_funcionario
      WHERE 1=1
    `;
    const params = [];

    if (data && dataValida(data)) {
      sql += ' AND DATE(m.data) = ?';
      params.push(data);
    }

    if (id_caixa) {
      sql += ' AND m.id_caixa = ?';
      params.push(id_caixa);
    }

    sql += ' ORDER BY m.data DESC';

    const movs = await q(sql, params);
    res.json({ movimentacoes: movs, totais: calcularTotais(movs) });
  } catch (e) { err500(res, e); }
});

// ── LISTAR DO CAIXA ABERTO ────────────────────────────────────────────────────
router.get('/', auth, pCaixa, async (req, res) => {
  try {
    const [caixa] = await q(
      `SELECT id_caixa FROM caixa WHERE valor_fechamento IS NULL ORDER BY data DESC LIMIT 1`
    );
    if (!caixa) return res.json({ caixa: null, movimentacoes: [], totais: { entradas: 0, saidas: 0, saldo: 0 } });

    const movs = await q(`
      SELECT m.*, f.nome AS funcionario_nome
      FROM movimentacao_caixa m
      INNER JOIN caixa c ON c.id_caixa = m.id_caixa
      LEFT JOIN funcionario f ON f.id_funcionario = c.id_funcionario
      WHERE m.id_caixa = ? ORDER BY m.data DESC
    `, [caixa.id_caixa]);

    res.json({ id_caixa: caixa.id_caixa, movimentacoes: movs, totais: calcularTotais(movs) });
  } catch (e) { err500(res, e); }
});

// ── LISTAR POR CAIXA ESPECÍFICO ───────────────────────────────────────────────
router.get('/caixa/:id', auth, pCaixa, async (req, res) => {
  try {
    const movs = await q(`
      SELECT m.*, f.nome AS funcionario_nome
      FROM movimentacao_caixa m
      INNER JOIN caixa c ON c.id_caixa = m.id_caixa
      LEFT JOIN funcionario f ON f.id_funcionario = c.id_funcionario
      WHERE m.id_caixa = ? ORDER BY m.data DESC
    `, [req.params.id]);

    res.json({ movimentacoes: movs, totais: calcularTotais(movs) });
  } catch (e) { err500(res, e); }
});

// ── MOVIMENTAÇÕES DO DIA (todos os caixas) ───────────────────────────────────
router.get('/hoje', auth, pCaixa, async (req, res) => {
  try {
    const movs = await q(`
      SELECT m.*, f.nome AS funcionario_nome
      FROM movimentacao_caixa m
      INNER JOIN caixa c ON c.id_caixa = m.id_caixa
      LEFT JOIN funcionario f ON f.id_funcionario = c.id_funcionario
      WHERE DATE(m.data) = CURDATE()
      ORDER BY m.data DESC
    `);

    res.json({ movimentacoes: movs, totais: calcularTotais(movs) });
  } catch (e) { err500(res, e); }
});

module.exports = router;
