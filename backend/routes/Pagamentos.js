const router = require('express').Router();
const auth = require('../middleware/Auth');
const permissao = require('../middleware/permissao');
const { q } = require('../helpers/db');
const { err400, err404, err500, ok } = require('../helpers/Response');

const pCaixa = permissao(1, 2, 5);
const pGerente = permissao(1, 2);

const PAG_SELECT = `
  SELECT
    p.id_pagamento, p.id_venda, p.id_ordem_servico, p.id_cliente,
    p.valor, p.forma_pagamento, p.parcelas, p.status, p.tipo, p.categoria,
    p.data_pagamento, p.data_vencimento, p.descricao,
    p.numero_recibo, p.observacoes, p.created_at,
    p.dia_pagamento,
    c.nome AS cliente_nome, c.cpf_cnpj AS cliente_cpf,
    c.telefone AS cliente_telefone, c.email AS cliente_email
  FROM pagamento p
  LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
`;

// ── HELPER: calcula saldo atual de um caixa ──────────────────────────────────
async function getSaldoCaixa(id_caixa) {
  const [row] = await q(`
    SELECT (valor_abertura + COALESCE((
      SELECT SUM(CASE WHEN tipo='entrada' THEN valor ELSE -valor END)
      FROM movimentacao_caixa WHERE id_caixa = ?
    ), 0)) AS saldo
    FROM caixa WHERE id_caixa = ?
  `, [id_caixa, id_caixa]);
  return row ? Number(row.saldo) : 0;
}

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
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `REC-${ano}${mes}-${String(id).padStart(4, '0')}`;
}

function getDescontoMaximo(valorTotal) {
  if (valorTotal >= 2000) return 20;
  if (valorTotal >= 1000) return 10;
  return 0;
}

// ── LISTAR ────────────────────────────────────────────────────────────────────
router.get('/', auth, pCaixa, async (req, res) => {
  try {
    const isCaixa = Number(req.user.nivel) === 5;
    if (isCaixa) {
      res.json(await q(`
        ${PAG_SELECT}
        WHERE p.status = 'pendente'
          AND p.dia_pagamento IS NULL
          AND p.id_venda IS NOT NULL
        ORDER BY p.created_at DESC
      `));
    } else {
      res.json(await q(`${PAG_SELECT} ORDER BY p.created_at DESC`));
    }
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
      data_emissao: new Date().toISOString(),
      pagamento: pag,
      empresa: { nome: 'ToolMaster', cnpj: '00.000.000/0001-00' },
    });
  } catch (e) { err500(res, e); }
});

// ── CRIAR — sempre despesa ─────────────────────────────────────────────────────
router.post('/', auth, pCaixa, async (req, res) => {
  const {
    valor, forma_pagamento, descricao,
    data_vencimento, observacoes, categoria, status, id_caixa
  } = req.body;

  if (!valor || valor <= 0) return err400(res, 'Valor deve ser maior que zero');
  if (!forma_pagamento) return err400(res, 'Forma de pagamento obrigatória');
  if (!descricao) return err400(res, 'Descrição é obrigatória');
  if (!data_vencimento) return err400(res, 'Data é obrigatória');

  const statusFinal = status === 'pago' ? 'pago' : 'pendente';
  const isGerente = req.user.nivel === 1 || req.user.nivel === 2;

  try {
    let id_caixa_destino = null;

    if (statusFinal === 'pago') {
      if (isGerente && id_caixa) {
        // Admin escolheu o caixa de onde vai sair
        const [caixa] = await q(`SELECT id_caixa, valor_fechamento FROM caixa WHERE id_caixa=?`, [id_caixa]);
        if (!caixa) return err404(res, 'Caixa não encontrado');
        if (caixa.valor_fechamento !== null) return err400(res, 'Esse caixa já está fechado');
        id_caixa_destino = caixa.id_caixa;
      } else {
        // Cashier: usa o caixa aberto automaticamente
        const [caixa] = await q(`SELECT id_caixa FROM caixa WHERE valor_fechamento IS NULL ORDER BY data DESC LIMIT 1`);
        if (!caixa) return err400(res, 'Nenhum caixa aberto');
        id_caixa_destino = caixa.id_caixa;
      }

      const saldo = await getSaldoCaixa(id_caixa_destino);
      if (Number(valor) > saldo) {
        return err400(res, `Saldo insuficiente no caixa. Disponível: R$ ${saldo.toFixed(2)}`);
      }
    }

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
      await movimentarCaixa('saida', valor, `Despesa - ${descricao}`, id_pagamento, id_caixa_destino);
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
const { valor, forma_pagamento, descricao, data_vencimento, observacoes, categoria, pagamento_misto } = req.body;
const descontoPercentual = Number(req.body.desconto_percentual) || 0;

let valorFinal = valor ?? pag.valor;

if (novoStatus === 'pago' && descontoPercentual > 0) {
  if (!pag.id_venda) return err400(res, 'Desconto só pode ser aplicado em pagamentos de venda');
  const descontoMax = getDescontoMaximo(Number(pag.valor));
  if (descontoPercentual > descontoMax)
    return err400(res, `Desconto máximo permitido para este valor é ${descontoMax}%`);
  valorFinal = Math.round(Number(valorFinal) * (1 - descontoPercentual / 100) * 100) / 100;
}

// Valida pagamento misto
if (novoStatus === 'pago' && pagamento_misto?.length > 0) {
  const somaPartes = pagamento_misto.reduce((s, p) => s + Number(p.valor), 0);
  const diff = Math.abs(somaPartes - Number(valorFinal));
  if (diff > 0.01)
    return err400(res, `Soma das partes (R$ ${somaPartes.toFixed(2)}) não bate com o total (R$ ${Number(valorFinal).toFixed(2)})`);
}

const formaFinal = pagamento_misto?.length > 0 ? 'misto' : (forma_pagamento ?? pag.forma_pagamento);

await q(`
  UPDATE pagamento SET
    valor=?, forma_pagamento=?, descricao=?, data_vencimento=?,
    observacoes=?, categoria=?, status=?, desconto_percentual=?
  WHERE id_pagamento=?
`, [
  valorFinal, formaFinal,
  descricao ?? pag.descricao,
  data_vencimento ?? pag.data_vencimento,
  observacoes ?? pag.observacoes,
  categoria ?? pag.categoria,
  novoStatus ?? pag.status,
  descontoPercentual,
  id
]);

if (descontoPercentual > 0 && pag.id_venda) {
  await q(`UPDATE venda SET valor_total=? WHERE id_venda=?`, [valorFinal, pag.id_venda]);
}

if (novoStatus === 'pago' && pag.status !== 'pago') {
  const descFinal = descricao ?? pag.descricao;

  if (pagamento_misto?.length > 0) {
    // Registra uma movimentação por parte do pagamento misto
    for (const parte of pagamento_misto) {
      await movimentarCaixa('entrada', Number(parte.valor),
        `${descFinal} (${parte.forma})`, id);
    }
  } else {
    const tipoMov = pag.tipo === 'despesa' ? 'saida' : 'entrada';
    await movimentarCaixa(tipoMov, valorFinal, `${descFinal}`, id);
  }

  const numeroRecibo = gerarNumeroRecibo(id);
  await q(`UPDATE pagamento SET data_pagamento=NOW(), numero_recibo=? WHERE id_pagamento=?`,
    [numeroRecibo, id]);
}

ok(res, { message: 'Pagamento atualizado com sucesso' });
  } catch (e) { err500(res, e); }
});

// ── EXCLUIR — só gerente ──────────────────────────────────────────────────────
router.delete('/:id', auth, pGerente, async (req, res) => {
  try {
    const [pag] = await q(`SELECT id_pagamento, id_venda, status FROM pagamento WHERE id_pagamento=?`, [req.params.id]);
    if (!pag) return err404(res, 'Pagamento não encontrado');
    if (pag.status === 'pago') return err400(res, 'Não é possível excluir pagamento já confirmado. Cancele primeiro.');

    if (pag.id_venda) {
      // Busca os itens da venda para devolver ao estoque
      const itens = await q(`SELECT id_produto, quantidade FROM item_venda WHERE id_venda=?`, [pag.id_venda]);

      // Devolve a quantidade de cada produto ao estoque
      for (const item of itens) {
        await q(
          `UPDATE produto SET quantidade_estoque = quantidade_estoque + ? WHERE id_produto=?`,
          [item.quantidade, item.id_produto]
        );
      }

      // Apaga todos os pagamentos/parcelas vinculados a essa venda
      await q(`DELETE FROM pagamento WHERE id_venda=?`, [pag.id_venda]);
      // Apaga os itens da venda
      await q(`DELETE FROM item_venda WHERE id_venda=?`, [pag.id_venda]);
      // Apaga a venda
      await q(`DELETE FROM venda WHERE id_venda=?`, [pag.id_venda]);

      return ok(res, { message: 'Pagamento, itens e venda relacionada excluídos com sucesso, estoque devolvido' });
    }

    // Pagamento sem venda (ex: despesa) — exclui só ele
    await q(`DELETE FROM pagamento WHERE id_pagamento=?`, [req.params.id]);
    ok(res, { message: 'Pagamento excluído com sucesso' });
  } catch (e) { err500(res, e); }
});
// ── PARCELAR NO CRÉDITO ───────────────────────────────────────────────────────
router.post('/:id/parcelar', auth, pCaixa, async (req, res) => {
  const { parcelas, dia_pagamento } = req.body;
  const id_pagamento_original = req.params.id;

  if (!parcelas || parcelas < 1 || parcelas > 10)
    return err400(res, 'Parcelas deve ser entre 1 e 10');
  if (!dia_pagamento || dia_pagamento < 1 || dia_pagamento > 31)
    return err400(res, 'Dia de pagamento deve ser entre 1 e 31');

  try {
    const [pag] = await q(`SELECT * FROM pagamento WHERE id_pagamento=?`, [id_pagamento_original]);
    if (!pag) return err404(res, 'Pagamento não encontrado');
    if (pag.status !== 'pendente') return err400(res, 'Só é possível parcelar pagamentos pendentes');

    // Valida limite de parcelas pelo valor
    const valor = Number(pag.valor);
    if (valor < 200) return err400(res, 'Valor mínimo para parcelamento é R$ 200');
    const maxParcelas = Math.min(10, Math.floor((valor - 100) / 200) * 2 + 2);

    const valorParcela = Math.round((Number(pag.valor) / parcelas) * 100) / 100;
    const hoje = new Date();

    // Gera as datas de vencimento baseadas no dia escolhido
    const parcelsGeradas = [];
    for (let i = 0; i < parcelas; i++) {
      const anoVenc = hoje.getFullYear();
      const mesVenc = hoje.getMonth() + i; // pode ser > 11, Date resolve automaticamente

      // Último dia daquele mês específico
      const ultimoDiaMes = new Date(anoVenc, mesVenc + 1, 0).getDate();

      // Se dia_pagamento > dias do mês, usa o último dia disponível
      const diaEfetivo = Math.min(dia_pagamento, ultimoDiaMes);

      const venc = new Date(anoVenc, mesVenc, diaEfetivo);

      // Se é a primeira parcela e o dia já passou, começa no próximo mês
      if (i === 0 && venc <= hoje) {
        const mesProximo = hoje.getMonth() + 1;
        const ultimoDiaMesProximo = new Date(anoVenc, mesProximo + 1, 0).getDate();
        const diaEfetivoProximo = Math.min(dia_pagamento, ultimoDiaMesProximo);
        venc.setFullYear(anoVenc, mesProximo, diaEfetivoProximo);
      }

      const dataVenc = `${venc.getFullYear()}-${String(venc.getMonth() + 1).padStart(2, '0')}-${String(venc.getDate()).padStart(2, '0')}`;

      const valorParcela2 = i === parcelas - 1
        ? Math.round((Number(pag.valor) - valorParcela * (parcelas - 1)) * 100) / 100
        : valorParcela;

      parcelsGeradas.push({ dataVenc, valor: valorParcela2 });
    }

    // Cancela o pagamento original e gera as parcelas
    await q(`DELETE FROM pagamento WHERE id_pagamento=?`, [id_pagamento_original]);

    const ids = [];
    for (let i = 0; i < parcelsGeradas.length; i++) {
      const { dataVenc, valor } = parcelsGeradas[i];
      const descricao = parcelas > 1
        ? `${pag.descricao} - Parcela ${i + 1}/${parcelas}`
        : pag.descricao;

      const r = await q(`
        INSERT INTO pagamento
          (id_cliente, id_venda, id_ordem_servico, valor, forma_pagamento,
           parcelas, status, data_vencimento, descricao, tipo, categoria,
           dia_pagamento)
        VALUES (?, ?, ?, ?, 'cartao_credito', ?, 'pendente', ?, ?, ?, ?, ?)
      `, [
        pag.id_cliente, pag.id_venda, pag.id_ordem_servico,
        valor, parcelas, dataVenc, descricao,
        pag.tipo, pag.categoria, dia_pagamento
      ]);
      ids.push(r.insertId);
    }

    ok(res, {
      message: `${parcelas} parcela(s) gerada(s) com sucesso`,
      parcelas_geradas: ids,
      dia_pagamento,
      valor_parcela: valorParcela,
    });
  } catch (e) { err500(res, e); }
});

async function movimentarCaixa(tipo, valor, descricao, id_referencia = null, id_caixa_forcado = null) {
  let id_caixa = id_caixa_forcado;

  if (!id_caixa) {
    const [caixa] = await q(
      `SELECT id_caixa FROM caixa WHERE valor_fechamento IS NULL ORDER BY data DESC LIMIT 1`
    );
    id_caixa = caixa?.id_caixa;
  }

  if (id_caixa) {
    await q(
      `INSERT INTO movimentacao_caixa (id_caixa, tipo, valor, descricao, id_referencia)
       VALUES (?, ?, ?, ?, ?)`,
      [id_caixa, tipo, valor, descricao, id_referencia]
    );
  }
}

// ── SANGRIA ───────────────────────────────────────────────────────────────────
router.post('/sangria', auth, pCaixa, async (req, res) => {
  const { valor, id_caixa_origem, id_caixa_destino } = req.body;
  const isGerente = req.user.nivel === 1 || req.user.nivel === 2;

  if (!valor || Number(valor) <= 0) return err400(res, 'Valor deve ser maior que zero');
  if (!id_caixa_destino) return err400(res, 'Caixa de destino é obrigatório');

  try {
    // Resolve caixa de origem
    let idOrigem = null;
    if (isGerente && id_caixa_origem) {
      const [c] = await q(`SELECT id_caixa FROM caixa WHERE id_caixa=? AND valor_fechamento IS NULL`, [id_caixa_origem]);
      if (!c) return err400(res, 'Caixa de origem não encontrado ou fechado');
      idOrigem = c.id_caixa;
    } else {
      const [c] = await q(`SELECT id_caixa FROM caixa WHERE valor_fechamento IS NULL ORDER BY data DESC LIMIT 1`);
      if (!c) return err400(res, 'Nenhum caixa aberto');
      idOrigem = c.id_caixa;
    }

    if (idOrigem === Number(id_caixa_destino)) return err400(res, 'Caixa de origem e destino não podem ser o mesmo');

    // Valida caixa destino
    const [caixaDest] = await q(`SELECT id_caixa FROM caixa WHERE id_caixa=? AND valor_fechamento IS NULL`, [id_caixa_destino]);
    if (!caixaDest) return err400(res, 'Caixa de destino não encontrado ou fechado');

    // Valida saldo
    const [saldoRow] = await q(`
      SELECT (valor_abertura + COALESCE((
        SELECT SUM(CASE WHEN tipo='entrada' THEN valor ELSE -valor END)
        FROM movimentacao_caixa WHERE id_caixa = ?
      ), 0)) AS saldo FROM caixa WHERE id_caixa = ?
    `, [idOrigem, idOrigem]);
    const saldo = Number(saldoRow?.saldo || 0);
    if (Number(valor) > saldo) return err400(res, `Saldo insuficiente. Disponível: R$ ${saldo.toFixed(2)}`);

    // Registra saída na origem
    await q(`INSERT INTO movimentacao_caixa (id_caixa, tipo, valor, descricao) VALUES (?, 'saida', ?, ?)`,
      [idOrigem, valor, `Sangria para Caixa #${id_caixa_destino}`]);

    // Registra entrada no destino
    await q(`INSERT INTO movimentacao_caixa (id_caixa, tipo, valor, descricao) VALUES (?, 'entrada', ?, ?)`,
      [id_caixa_destino, valor, `Sangria recebida do Caixa #${idOrigem}`]);

    // ADICIONA ISSO — registra como despesa na tabela pagamento
await q(`
  INSERT INTO pagamento
    (id_cliente, valor, forma_pagamento, parcelas, status,
     data_pagamento, data_vencimento, descricao, tipo)
  VALUES (NULL, ?, 'dinheiro', 1, 'pago', NOW(), CURDATE(), ?, 'despesa')
`, [valor, `Sangria — Caixa #${idOrigem} → Caixa #${id_caixa_destino}`]);

ok(res, { message: 'Sangria realizada com sucesso' });
  } catch (e) { err500(res, e); }
});

router.get('/codigo/:codigo', auth, pCaixa, async (req, res) => {
  try {
    const [pag] = await q(`${PAG_SELECT} WHERE p.codigo_venda = ?`, [req.params.codigo]);
    if (!pag) return err404(res, 'Código não encontrado');
    if (pag.status !== 'pendente') return err400(res, 'Este pagamento já foi processado');
    res.json(pag);
  } catch (e) { err500(res, e); }
});


module.exports = router;