const router   = require('express').Router();
const auth     = require('../middleware/Auth');
const permissao = require('../middleware/permissao');
const { q }    = require('../db');
const { err400, err404, err500, ok } = require('../helpers/Response');

const pCaixa  = permissao(1, 2, 5);
const pGerente = permissao(1, 2);

const PAG_SELECT = `
  SELECT
    p.id_pagamento, p.id_venda, p.id_ordem_servico, p.id_cliente, p.id_despesa,
    p.valor, p.forma_pagamento, p.parcelas, p.status,
    p.data_pagamento, p.data_vencimento, p.descricao,
    p.numero_recibo, p.observacoes, p.created_at,
    c.nome AS cliente_nome, c.cpf_cnpj AS cliente_cpf,
    c.telefone AS cliente_telefone, c.email AS cliente_email
  FROM pagamento p
  LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
`;

// ── HELPER: movimenta caixa ───────────────────────────────────────────────────
async function movimentarCaixa(tipo, valor, descricao, id_referencia = null) {
  const [caixa] = await q(
    `SELECT id_caixa FROM caixa WHERE valor_fechamento IS NULL ORDER BY data DESC LIMIT 1`
  );
  if (caixa) {
    await q(
      `INSERT INTO movimentacao_caixa (id_caixa, tipo, valor, descricao, id_referencia)
       VALUES (?, ?, ?, ?, ?)`,
      [caixa.id_caixa, tipo, valor, descricao, id_referencia]
    );
  }
}

// ── HELPER: gera número do recibo ─────────────────────────────────────────────
function gerarNumeroRecibo(id) {
  const data = new Date();
  const ano  = data.getFullYear();
  const mes  = String(data.getMonth() + 1).padStart(2, '0');
  return `REC-${ano}${mes}-${String(id).padStart(4, '0')}`;
}

// ── LISTAR ────────────────────────────────────────────────────────────────────
router.get('/', auth, pCaixa, async (req, res) => {
  try {
    res.json(await q(`${PAG_SELECT} ORDER BY p.created_at DESC`));
  } catch (e) { err500(res, e); }
});

// ── PENDENTES ─────────────────────────────────────────────────────────────────
router.get('/pendentes', auth, pCaixa, async (req, res) => {
  try {
    res.json(await q(`${PAG_SELECT} WHERE p.status='pendente' ORDER BY p.data_vencimento ASC`));
  } catch (e) { err500(res, e); }
});

// ── BUSCAR POR ID ─────────────────────────────────────────────────────────────
router.get('/:id', auth, pCaixa, async (req, res) => {
  try {
    const [pag] = await q(`${PAG_SELECT} WHERE p.id_pagamento=?`, [req.params.id]);
    if (!pag) return err404(res, 'Pagamento não encontrado');
    res.json(pag);
  } catch (e) { err500(res, e); }
});

// ── DADOS DO RECIBO ───────────────────────────────────────────────────────────
router.get('/:id/recibo', auth, pCaixa, async (req, res) => {
  try {
    const [pag] = await q(`${PAG_SELECT} WHERE p.id_pagamento=?`, [req.params.id]);
    if (!pag) return err404(res, 'Pagamento não encontrado');
    if (pag.status !== 'pago') return err400(res, 'Só é possível emitir recibo de pagamentos confirmados');

    // Busca dados da empresa (funcionário que fez o caixa)
    const [empresa] = await q(`SELECT * FROM usuario WHERE nivel_acesso=1 LIMIT 1`);

    res.json({
      numero_recibo:    pag.numero_recibo || gerarNumeroRecibo(pag.id_pagamento),
      data_emissao:     new Date().toISOString(),
      pagamento:        pag,
      empresa: {
        nome: 'ToolMaster',
        cnpj: '00.000.000/0001-00',
      },
    });
  } catch (e) { err500(res, e); }
});

// ── CRIAR ─────────────────────────────────────────────────────────────────────
router.post('/', auth, pCaixa, async (req, res) => {
  const {
    valor, forma_pagamento, id_cliente, id_despesa,
    id_venda, id_ordem_servico, parcelas, status,
    descricao, data_pagamento, data_vencimento, observacoes
  } = req.body;

  if (!valor || valor <= 0)   return err400(res, 'Valor deve ser maior que zero');
  if (!forma_pagamento)       return err400(res, 'Forma de pagamento obrigatória');
  if (!id_cliente)            return err400(res, 'Cliente é obrigatório');
  if (!data_vencimento)       return err400(res, 'Data de vencimento é obrigatória');

  try {
    const r = await q(`
      INSERT INTO pagamento
        (id_cliente, id_despesa, id_venda, id_ordem_servico, valor,
         forma_pagamento, parcelas, status, data_pagamento, data_vencimento,
         descricao, observacoes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      id_cliente, id_despesa || null, id_venda || null, id_ordem_servico || null,
      valor, forma_pagamento, parcelas || 1, status || 'pendente',
      data_pagamento || null, data_vencimento,
      descricao || null, observacoes || null,
    ]);

    const id_pagamento = r.insertId;

    // Se já criado como pago → movimenta caixa e gera recibo
    if (status === 'pago') {
      const tipoMov = id_despesa ? 'saida' : 'entrada';
      const descMov = id_despesa
        ? `Despesa - ${descricao || ''}`
        : `Recebimento - ${descricao || 'Pagamento'}`;

      await movimentarCaixa(tipoMov, valor, descMov, id_pagamento);

      const numeroRecibo = gerarNumeroRecibo(id_pagamento);
      await q(`UPDATE pagamento SET numero_recibo=? WHERE id_pagamento=?`, [numeroRecibo, id_pagamento]);
    }

    res.status(201).json({ success: true, id_pagamento });
  } catch (e) { err500(res, e); }
});


// ── EDITAR PAGAMENTO ─────────────────────────────────────────────────────────
router.put('/:id', auth, pCaixa, async (req, res) => {
  try {
    const [pag] = await q(`SELECT * FROM pagamento WHERE id_pagamento=?`, [req.params.id]);
    if (!pag) return err404(res, 'Pagamento não encontrado');
    if (pag.status === 'pago') return err400(res, 'Pagamento já confirmado não pode ser editado');

    const { valor, forma_pagamento, id_cliente, id_venda, status, descricao, data_pagamento, data_vencimento } = req.body;
    const { buildSet } = require('../helpers/Db');
    const { cols, vals } = buildSet(req.body, [
      'valor', 'forma_pagamento', 'id_cliente', 'id_venda',
      'status', 'descricao', 'data_pagamento', 'data_vencimento'
    ]);
    if (!cols.length) return err400(res, 'Nada para atualizar');

    await q(`UPDATE pagamento SET ${cols.join(', ')} WHERE id_pagamento=?`, [...vals, req.params.id]);
    ok(res, { message: 'Pagamento atualizado com sucesso' });
  } catch (e) { err500(res, e); }
});

// ── BAIXAR PAGAMENTO (receber) ────────────────────────────────────────────────
router.put('/:id/baixar', auth, pCaixa, async (req, res) => {
  const { forma_pagamento, observacoes } = req.body;
  try {
    const [pag] = await q(`SELECT * FROM pagamento WHERE id_pagamento=?`, [req.params.id]);
    if (!pag)               return err404(res, 'Pagamento não encontrado');
    if (pag.status === 'pago') return err400(res, 'Pagamento já está baixado');

    const numeroRecibo = gerarNumeroRecibo(pag.id_pagamento);

    await q(
      `UPDATE pagamento SET status='pago', data_pagamento=NOW(),
       numero_recibo=?, forma_pagamento=COALESCE(?,forma_pagamento),
       observacoes=COALESCE(?,observacoes)
       WHERE id_pagamento=?`,
      [numeroRecibo, forma_pagamento || null, observacoes || null, req.params.id]
    );

    // Movimenta caixa
    const tipoMov = pag.id_despesa ? 'saida' : 'entrada';
    const descMov = pag.id_despesa
      ? `Despesa paga - ${pag.descricao || ''}`
      : `Recebimento #${pag.id_pagamento} - ${pag.descricao || ''}`;

    await movimentarCaixa(tipoMov, pag.valor, descMov, pag.id_pagamento);

    ok(res, { message: 'Pagamento baixado com sucesso', numero_recibo: numeroRecibo });
  } catch (e) { err500(res, e); }
});

// ── CANCELAR ─────────────────────────────────────────────────────────────────
router.put('/:id/cancelar', auth, pGerente, async (req, res) => {
  try {
    const [pag] = await q(`SELECT * FROM pagamento WHERE id_pagamento=?`, [req.params.id]);
    if (!pag) return err404(res, 'Pagamento não encontrado');
    if (pag.status === 'cancelado') return err400(res, 'Já está cancelado');

    await q(`UPDATE pagamento SET status='cancelado' WHERE id_pagamento=?`, [req.params.id]);

    // Se estava pago, estorna no caixa
    if (pag.status === 'pago') {
      const tipoEstorno = pag.id_despesa ? 'entrada' : 'saida';
      await movimentarCaixa(tipoEstorno, pag.valor, `Estorno pagamento #${pag.id_pagamento}`, pag.id_pagamento);
    }

    ok(res, { message: 'Pagamento cancelado' });
  } catch (e) { err500(res, e); }
});

// ── EXCLUIR — só gerente ──────────────────────────────────────────────────────
router.delete('/:id', auth, pGerente, async (req, res) => {
  try {
    const [exists] = await q(`SELECT id_pagamento, status FROM pagamento WHERE id_pagamento=?`, [req.params.id]);
    if (!exists) return err404(res, 'Pagamento não encontrado');
    if (exists.status === 'pago') return err400(res, 'Não é possível excluir pagamento já confirmado. Cancele primeiro.');
    await q(`DELETE FROM pagamento WHERE id_pagamento=?`, [req.params.id]);
    ok(res, { message: 'Pagamento excluído com sucesso' });
  } catch (e) { err500(res, e); }
});

module.exports = router;
