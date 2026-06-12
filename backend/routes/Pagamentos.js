const router   = require('express').Router();
const auth     = require('../middleware/Auth');
const permissao = require('../middleware/permissao');
const { q }    = require('../helpers/db');
const { err400, err404, err500, ok } = require('../helpers/Response');

const pCaixa   = permissao(1, 2, 5);
const pGerente = permissao(1, 2);

const PAG_SELECT = `
  SELECT
    p.id_pagamento, p.id_venda, p.id_ordem_servico, p.id_cliente,
    p.valor, p.forma_pagamento, p.parcelas, p.status, p.tipo, p.categoria,
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

    res.json({
      numero_recibo: pag.numero_recibo || gerarNumeroRecibo(pag.id_pagamento),
      data_emissao:  new Date().toISOString(),
      pagamento:     pag,
      empresa: { nome: 'ToolMaster', cnpj: '00.000.000/0001-00' },
    });
  } catch (e) { err500(res, e); }
});

// ── CRIAR — sempre despesa ─────────────────────────────────────────────────────
router.post('/', auth, pCaixa, async (req, res) => {
  const {
    valor, forma_pagamento, descricao,
    data_vencimento, observacoes, categoria, status
  } = req.body;

  if (!valor || valor <= 0)   return err400(res, 'Valor deve ser maior que zero');
  if (!forma_pagamento)       return err400(res, 'Forma de pagamento obrigatória');
  if (!descricao)             return err400(res, 'Descrição é obrigatória');
  if (!data_vencimento)       return err400(res, 'Data é obrigatória');

  const statusFinal = status === 'pago' ? 'pago' : 'pendente';

  try {
    const r = await q(`
      INSERT INTO pagamento
        (id_cliente, valor, forma_pagamento, parcelas, status,
         data_pagamento, data_vencimento, descricao, observacoes, tipo, categoria)
      VALUES (NULL, ?, ?, 1, ?, ?, ?, ?, ?, 'despesa', ?)
    `, [
      valor, forma_pagamento, statusFinal,
      statusFinal === 'pago' ? new Date() : null,
      data_vencimento, descricao, observacoes || null, categoria || null,
    ]);

    const id_pagamento = r.insertId;

    if (statusFinal === 'pago') {
      await movimentarCaixa('saida', valor, `Despesa - ${descricao}`, id_pagamento);
      const numeroRecibo = gerarNumeroRecibo(id_pagamento);
      await q(`UPDATE pagamento SET numero_recibo=? WHERE id_pagamento=?`, [numeroRecibo, id_pagamento]);
    }

    res.status(201).json({ success: true, id_pagamento });
  } catch (e) { err500(res, e); }
});

// ── ATUALIZAR ─────────────────────────────────────────────────────────────────
router.put('/:id', auth, pCaixa, async (req, res) => {
  const { id } = req.params;
  try {
    const [pag] = await q(`SELECT * FROM pagamento WHERE id_pagamento=?`, [id]);
    if (!pag) return err404(res, 'Pagamento não encontrado');

    const novoStatus = req.body.status;

    // ── SE JÁ ESTÁ PAGO: só pode mudar status ──
    if (pag.status === 'pago') {
      if (!novoStatus) return err400(res, 'Pagamento confirmado: só é possível alterar o status');

      if (novoStatus === 'pago') {
        return ok(res, { message: 'Nenhuma alteração necessária' });
      }

      // pago → pendente ou cancelado: estorna o caixa
      const tipoEstorno = pag.tipo === 'despesa' ? 'entrada' : 'saida';
      await movimentarCaixa(tipoEstorno, pag.valor, `Estorno pagamento #${pag.id_pagamento}`, pag.id_pagamento);

      await q(
        `UPDATE pagamento SET status=?, data_pagamento=NULL WHERE id_pagamento=?`,
        [novoStatus, id]
      );
      return ok(res, { message: 'Status atualizado e caixa estornado' });
    }

    // ── SE NÃO ESTÁ PAGO: edita tudo ──
    const { valor, forma_pagamento, descricao, data_vencimento, observacoes, categoria } = req.body;

    await q(`
      UPDATE pagamento SET
        valor=?, forma_pagamento=?, descricao=?, data_vencimento=?,
        observacoes=?, categoria=?, status=?
      WHERE id_pagamento=?
    `, [
      valor ?? pag.valor,
      forma_pagamento ?? pag.forma_pagamento,
      descricao ?? pag.descricao,
      data_vencimento ?? pag.data_vencimento,
      observacoes ?? pag.observacoes,
      categoria ?? pag.categoria,
      novoStatus ?? pag.status,
      id
    ]);

    // Se virou "pago" agora → movimenta caixa
    if (novoStatus === 'pago' && pag.status !== 'pago') {
      const valorFinal = valor ?? pag.valor;
      const descFinal  = descricao ?? pag.descricao;
      const tipoMov = pag.tipo === 'despesa' ? 'saida' : 'entrada';

      await movimentarCaixa(tipoMov, valorFinal, `Despesa - ${descFinal}`, id);

      const numeroRecibo = gerarNumeroRecibo(id);
      await q(
        `UPDATE pagamento SET data_pagamento=NOW(), numero_recibo=? WHERE id_pagamento=?`,
        [numeroRecibo, id]
      );
    }

    ok(res, { message: 'Pagamento atualizado com sucesso' });
  } catch (e) { err500(res, e); }
});

// ── EXCLUIR — só gerente ──────────────────────────────────────────────────────
router.delete('/:id', auth, pGerente, async (req, res) => {
  try {
    const [pag] = await q(`SELECT id_pagamento, status FROM pagamento WHERE id_pagamento=?`, [req.params.id]);
    if (!pag) return err404(res, 'Pagamento não encontrado');
    if (pag.status === 'pago') return err400(res, 'Não é possível excluir pagamento já confirmado. Cancele primeiro.');
    await q(`DELETE FROM pagamento WHERE id_pagamento=?`, [req.params.id]);
    ok(res, { message: 'Pagamento excluído com sucesso' });
  } catch (e) { err500(res, e); }
});

module.exports = router;