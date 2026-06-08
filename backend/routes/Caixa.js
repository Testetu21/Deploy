const router   = require('express').Router();
const auth     = require('../middleware/Auth');
const permissao = require('../middleware/permissao');
const { q }    = require('../db');
const { err400, err404, err500, ok } = require('../helpers/Response');

const pCaixa  = permissao(1, 2, 5);
const pGerente = permissao(1, 2);

const CAIXA_SELECT = `
  SELECT
    c.id_caixa, c.data, c.valor_abertura, c.valor_fechamento,
    c.observacoes, c.status, c.id_funcionario,
    f.nome AS funcionario_nome,
    COALESCE((
      SELECT SUM(CASE WHEN tipo='entrada' THEN valor ELSE -valor END)
      FROM movimentacao_caixa WHERE id_caixa = c.id_caixa
    ), 0) AS total_movimentacoes,
    (c.valor_abertura + COALESCE((
      SELECT SUM(CASE WHEN tipo='entrada' THEN valor ELSE -valor END)
      FROM movimentacao_caixa WHERE id_caixa = c.id_caixa
    ), 0)) AS saldo_atual,
    COALESCE((
      SELECT SUM(valor) FROM movimentacao_caixa
      WHERE id_caixa = c.id_caixa AND tipo='entrada'
    ), 0) AS total_entradas,
    COALESCE((
      SELECT SUM(valor) FROM movimentacao_caixa
      WHERE id_caixa = c.id_caixa AND tipo='saida'
    ), 0) AS total_saidas
  FROM caixa c
  LEFT JOIN funcionario f ON f.id_funcionario = c.id_funcionario
`;

// ── RESUMO DO DIA ─────────────────────────────────────────────────────────────
router.get('/resumo/dia', auth, pCaixa, async (req, res) => {
  try {
    const [caixa] = await q(`${CAIXA_SELECT} WHERE DATE(c.data)=CURDATE() ORDER BY c.data DESC LIMIT 1`);
    if (!caixa) return res.json({ status: 'fechado', message: 'Nenhum caixa aberto hoje' });

    const [pagamentos] = await q(`
      SELECT
        COUNT(*) AS qtd_pagamentos,
        COALESCE(SUM(valor), 0) AS total_recebido
      FROM pagamento
      WHERE DATE(data_pagamento) = CURDATE() AND status = 'pago'
    `);

    const [despesas] = await q(`
      SELECT COALESCE(SUM(valor), 0) AS total_despesas
      FROM despesa
      WHERE DATE(data) = CURDATE() AND status = 'pago'
    `);

    res.json({
      ...caixa,
      status: caixa.valor_fechamento ? 'fechado' : 'aberto',
      ...pagamentos,
      ...despesas,
    });
  } catch (e) { err500(res, e); }
});

// ── LISTAR TODOS ─────────────────────────────────────────────────────────────
router.get('/', auth, pCaixa, async (req, res) => {
  try {
    res.json(await q(`${CAIXA_SELECT} ORDER BY c.data DESC`));
  } catch (e) { err500(res, e); }
});

// ── HISTÓRICO COM FILTRO ─────────────────────────────────────────────────────
router.get('/historico', auth, pCaixa, async (req, res) => {
  const { data_inicio, data_fim } = req.query;
  let sql = `${CAIXA_SELECT} WHERE 1=1`;
  const params = [];
  if (data_inicio) { sql += ' AND DATE(c.data) >= ?'; params.push(data_inicio); }
  if (data_fim)    { sql += ' AND DATE(c.data) <= ?'; params.push(data_fim); }
  sql += ' ORDER BY c.data DESC';
  try {
    const rows = await q(sql, params);
    res.json({
      total_registros:  rows.length,
      total_entradas:   rows.reduce((s, r) => s + Number(r.total_entradas), 0),
      total_saidas:     rows.reduce((s, r) => s + Number(r.total_saidas), 0),
      saldo_total:      rows.reduce((s, r) => s + Number(r.saldo_atual), 0),
      registros: rows,
    });
  } catch (e) { err500(res, e); }
});

// ── CAIXA ABERTO ATUAL ────────────────────────────────────────────────────────
router.get('/aberto', auth, pCaixa, async (req, res) => {
  try {
    const [caixa] = await q(`${CAIXA_SELECT} WHERE c.valor_fechamento IS NULL ORDER BY c.data DESC LIMIT 1`);
    if (!caixa) return res.json(null);
    res.json({ ...caixa, status: 'aberto' });
  } catch (e) { err500(res, e); }
});

// ── BUSCAR POR ID ─────────────────────────────────────────────────────────────
router.get('/:id', auth, pCaixa, async (req, res) => {
  try {
    const [caixa] = await q(`${CAIXA_SELECT} WHERE c.id_caixa = ?`, [req.params.id]);
    if (!caixa) return err404(res, 'Caixa não encontrado');

    const movs = await q(`
      SELECT * FROM movimentacao_caixa
      WHERE id_caixa = ? ORDER BY data DESC
    `, [req.params.id]);

    res.json({ ...caixa, movimentacoes: movs });
  } catch (e) { err500(res, e); }
});

// ── ABRIR CAIXA ───────────────────────────────────────────────────────────────
router.post('/', auth, pCaixa, async (req, res) => {
  const { valor_abertura, id_funcionario } = req.body;
  if (valor_abertura === undefined)
    return err400(res, 'Campos obrigatórios: valor_abertura');
  if (Number(valor_abertura) < 0)
    return err400(res, 'Valor de abertura não pode ser negativo');

  try {
    // Resolve id_funcionario: use provided value or prefer authenticated user's id_funcionario
    let funcId = id_funcionario ? Number(id_funcionario) : null;
    if (!funcId) {
      if (req.user && req.user.id_funcionario) {
        funcId = req.user.id_funcionario;
      } else {
        const [func] = await q(`SELECT id_funcionario FROM funcionario WHERE id_usuario=? LIMIT 1`, [req.user.id]);
        if (func) funcId = func.id_funcionario;
      }
    }
    if (!funcId) return err400(res, 'Funcionário não encontrado para o usuário atual');

    const [aberto] = await q(
      `SELECT id_caixa FROM caixa WHERE valor_fechamento IS NULL ORDER BY data DESC LIMIT 1`
    );
    if (aberto) return err400(res, 'Já existe um caixa aberto. Feche-o antes de abrir outro.');

    const r = await q(
      `INSERT INTO caixa (data, valor_abertura, valor_fechamento, id_funcionario, status)
       VALUES (NOW(), ?, NULL, ?, 1)`,
      [valor_abertura, funcId]
    );
    res.status(201).json({ success: true, message: 'Caixa aberto com sucesso', id_caixa: r.insertId });
  } catch (e) { err500(res, e); }
});

// ── EDITAR CAIXA ──────────────────────────────────────────────────────────────
router.put('/:id', auth, pCaixa, async (req, res) => {
  const { data, valor_abertura, id_funcionario } = req.body;
  try {
    const [exists] = await q(`SELECT id_caixa FROM caixa WHERE id_caixa=?`, [req.params.id]);
    if (!exists) return err404(res, 'Caixa não encontrado');
    await q(
      `UPDATE caixa SET data=?, valor_abertura=?, id_funcionario=? WHERE id_caixa=?`,
      [data, valor_abertura, id_funcionario, req.params.id]
    );
    ok(res, { message: 'Caixa atualizado com sucesso' });
  } catch (e) { err500(res, e); }
});

// ── FECHAR CAIXA ──────────────────────────────────────────────────────────────
router.put('/:id/fechar', auth, pCaixa, async (req, res) => {
  const { valor_fechamento, observacoes } = req.body;
  if (valor_fechamento === undefined) return err400(res, 'Valor de fechamento é obrigatório');

  try {
    const [caixa] = await q(`${CAIXA_SELECT} WHERE c.id_caixa = ? AND c.valor_fechamento IS NULL`, [req.params.id]);
    if (!caixa) return err404(res, 'Caixa não encontrado ou já está fechado');

    const saldo    = Number(caixa.saldo_atual);
    const fechamento = Number(valor_fechamento);
    const diferenca  = Math.abs(fechamento - saldo);

    await q(
      `UPDATE caixa SET valor_fechamento=?, observacoes=?, status=0 WHERE id_caixa=?`,
      [fechamento, observacoes || null, req.params.id]
    );

    ok(res, {
      message: 'Caixa fechado com sucesso',
      saldo_esperado: saldo,
      valor_informado: fechamento,
      diferenca: diferenca > 0 ? diferenca : 0,
      status: diferenca > 0.01 ? 'divergente' : 'conferido',
    });
  } catch (e) { err500(res, e); }
});

// ── EXCLUIR — só gerente/admin ───────────────────────────────────────────────
router.delete('/:id', auth, pGerente, async (req, res) => {
  try {
    const [exists] = await q(`SELECT id_caixa FROM caixa WHERE id_caixa=?`, [req.params.id]);
    if (!exists) return err404(res, 'Caixa não encontrado');
    // Remove movimentações vinculadas antes de deletar (evita erro de FK)
    await q(`DELETE FROM movimentacao_caixa WHERE id_caixa=?`, [req.params.id]);
    await q(`DELETE FROM caixa WHERE id_caixa=?`, [req.params.id]);
    ok(res, { message: 'Caixa excluído com sucesso' });
  } catch (e) { err500(res, e); }
});

module.exports = router;
