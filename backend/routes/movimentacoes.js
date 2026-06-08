const router = require('express').Router();
const auth   = require('../middleware/Auth');
const permissao = require('../middleware/permissao');
const { q }  = require('../db');
const { err500 } = require('../helpers/Response');

const pCaixa = permissao(1, 2, 5);

// ── LISTAR DO CAIXA ABERTO ────────────────────────────────────────────────────
router.get('/', auth, pCaixa, async (req, res) => {
  try {
    const [caixa] = await q(
      `SELECT id_caixa FROM caixa WHERE valor_fechamento IS NULL ORDER BY data DESC LIMIT 1`
    );
    if (!caixa) return res.json({ caixa: null, movimentacoes: [], totais: { entradas: 0, saidas: 0, saldo: 0 } });

    const movs = await q(`
      SELECT * FROM movimentacao_caixa
      WHERE id_caixa = ? ORDER BY data DESC
    `, [caixa.id_caixa]);

    const totais = movs.reduce((acc, m) => {
      if (m.tipo === 'entrada') acc.entradas += Number(m.valor);
      else acc.saidas += Number(m.valor);
      return acc;
    }, { entradas: 0, saidas: 0 });

    totais.saldo = totais.entradas - totais.saidas;

    res.json({ id_caixa: caixa.id_caixa, movimentacoes: movs, totais });
  } catch (e) { err500(res, e); }
});

// ── LISTAR POR CAIXA ESPECÍFICO ───────────────────────────────────────────────
router.get('/caixa/:id', auth, pCaixa, async (req, res) => {
  try {
    const movs = await q(`
      SELECT * FROM movimentacao_caixa
      WHERE id_caixa = ? ORDER BY data DESC
    `, [req.params.id]);

    const totais = movs.reduce((acc, m) => {
      if (m.tipo === 'entrada') acc.entradas += Number(m.valor);
      else acc.saidas += Number(m.valor);
      return acc;
    }, { entradas: 0, saidas: 0 });

    totais.saldo = totais.entradas - totais.saidas;

    res.json({ movimentacoes: movs, totais });
  } catch (e) { err500(res, e); }
});

module.exports = router;
