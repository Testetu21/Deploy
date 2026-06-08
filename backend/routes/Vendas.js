const router    = require('express').Router();
const db        = require('../db');
const auth      = require('../middleware/Auth');
const permissao = require('../middleware/permissao');
const { q }     = require('../db');
const { err400, err404, err500, ok } = require('../helpers/Response');

function getConnection() {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) reject(err);
      else resolve(connection);
    });
  });
}

function queryConn(connection, sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function begin(connection) {
  return new Promise((resolve, reject) => {
    connection.beginTransaction(err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function commit(connection) {
  return new Promise((resolve, reject) => {
    connection.commit(err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function rollback(connection) {
  return new Promise(resolve => {
    connection.rollback(() => resolve());
  });
}

const pVendedor = permissao(1, 2, 3);

// ── ESTATÍSTICAS — só admin e gerente ────────────────────────────────────────
router.get('/estatisticas', auth, permissao(1, 2), async (req, res) => {
  const fmts = {
    dia: ['DATE(data_venda)', '%d/%m/%Y'],
    mes: ['DATE_FORMAT(data_venda,"%Y-%m")', '%m/%Y'],
    ano: ['YEAR(data_venda)', '%Y'],
  };
  const [grp, fmt] = fmts[req.query.periodo] || fmts.dia;
  try {
    const rows = await q(
      `SELECT DATE_FORMAT(data_venda,'${fmt}') AS periodo, COUNT(*) AS quantidade, COALESCE(SUM(valor_total),0) AS total
       FROM venda WHERE status=1 GROUP BY ${grp} ORDER BY data_venda DESC LIMIT 30`
    );
    res.json({
      total_vendas:     rows.reduce((a, r) => a + r.total, 0),
      total_transacoes: rows.reduce((a, r) => a + r.quantidade, 0),
      dados: rows,
    });
  } catch (e) { err500(res, e); }
});

// ── VENDAS POR CLIENTE ────────────────────────────────────────────────────────
router.get('/cliente/:id', auth, pVendedor, async (req, res) => {
  try {
    res.json(await q(
      `SELECT v.id_venda,v.valor_total,v.data_venda,v.status,f.nome AS vendedor_nome
       FROM venda v LEFT JOIN funcionario f ON f.id_funcionario=v.id_vendedor
       WHERE v.id_cliente=? ORDER BY v.data_venda DESC`,
      [req.params.id]
    ));
  } catch (e) { err500(res, e); }
});

// ── VENDAS POR PERÍODO — só admin e gerente ───────────────────────────────────
router.get('/periodo', auth, permissao(1, 2), async (req, res) => {
  const { data_inicio, data_fim } = req.query;
  if (!data_inicio || !data_fim) return err400(res, 'data_inicio e data_fim obrigatórias');
  try {
    const rows = await q(
      `SELECT v.id_venda,v.valor_total,v.data_venda,v.status,c.nome AS cliente_nome,f.nome AS vendedor_nome
       FROM venda v
       LEFT JOIN cliente c ON c.id_cliente=v.id_cliente
       LEFT JOIN funcionario f ON f.id_funcionario=v.id_vendedor
       WHERE DATE(v.data_venda) BETWEEN ? AND ? ORDER BY v.data_venda DESC`,
      [data_inicio, data_fim]
    );
    res.json({ total_periodo: rows.reduce((a, r) => a + r.valor_total, 0), quantidade: rows.length, vendas: rows });
  } catch (e) { err500(res, e); }
});

// ── LISTAR — vendedor vê só as próprias vendas ────────────────────────────────
router.get('/', auth, pVendedor, async (req, res) => {
  try {
    const isVendedor = req.user.nivel === 3;
    const sql = `
      SELECT v.id_venda,v.valor_total,v.data_venda,v.status,
             c.nome AS cliente_nome,c.id_cliente,
             f.nome AS vendedor_nome,f.id_funcionario AS vendedor_id
      FROM venda v
      LEFT JOIN cliente c ON c.id_cliente=v.id_cliente
      LEFT JOIN funcionario f ON f.id_funcionario=v.id_vendedor
      ${isVendedor ? 'WHERE v.id_vendedor = ?' : ''}
      ORDER BY v.data_venda DESC
    `;
    const params = isVendedor ? [req.user.id_funcionario] : [];
    res.json(await q(sql, params));
  } catch (e) { err500(res, e); }
});

// ── BUSCAR POR ID ─────────────────────────────────────────────────────────────
router.get('/:id', auth, pVendedor, async (req, res) => {
  try {
    const [venda, itens] = await Promise.all([
      q(`SELECT v.*,c.nome AS cliente_nome,c.cpf_cnpj,c.telefone,f.nome AS vendedor_nome,f.id_funcionario AS vendedor_id
         FROM venda v LEFT JOIN cliente c ON c.id_cliente=v.id_cliente LEFT JOIN funcionario f ON f.id_funcionario=v.id_vendedor
         WHERE v.id_venda=?`, [req.params.id]),
      q(`SELECT iv.*,p.nome AS produto_nome,(iv.quantidade*iv.valor_unitario) AS subtotal
         FROM item_venda iv LEFT JOIN produto p ON p.id_produto=iv.id_produto WHERE iv.id_venda=?`, [req.params.id]),
    ]);
    if (!venda.length) return err404(res, 'Venda não encontrada');

    // Vendedor só pode ver suas próprias vendas
    if (req.user.nivel === 3 && venda[0].vendedor_id !== req.user.id_funcionario) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json({ ...venda[0], itens });
  } catch (e) { err500(res, e); }
});

// ── CRIAR ─────────────────────────────────────────────────────────────────────
router.post('/', auth, pVendedor, async (req, res) => {
  const { id_cliente, id_vendedor, itens, valor_total, desconto } = req.body;

  if (!id_vendedor) return err400(res, 'Vendedor é obrigatório');
  if (!id_cliente) return err400(res, 'Cliente é obrigatório');
  if (!itens?.length) return err400(res, 'Adicione pelo menos um produto');

  if (req.user.nivel === 3 && Number(id_vendedor) !== Number(req.user.id_funcionario)) {
    return res.status(403).json({ error: 'Você só pode registrar vendas para você mesmo' });
  }

  let connection;

  try {
    const [cliente] = await q(
      `SELECT id_cliente, nome FROM cliente WHERE id_cliente=? AND ativo=1`,
      [id_cliente]
    );

    if (!cliente) return err400(res, 'Cliente não encontrado ou inativo');

    connection = await getConnection();
    await begin(connection);

    const valorFinal = desconto ? Number(valor_total) - Number(desconto) : Number(valor_total);

    for (const item of itens) {
      const [produto] = await queryConn(
        connection,
        `SELECT quantidade_estoque, nome FROM produto WHERE id_produto=? FOR UPDATE`,
        [item.id_produto]
      );

      if (!produto) throw new Error(`Produto ID ${item.id_produto} não encontrado`);
      if (Number(item.quantidade) <= 0) throw new Error(`Quantidade inválida para "${produto.nome}"`);

      if (Number(produto.quantidade_estoque) < Number(item.quantidade)) {
        throw new Error(`Estoque insuficiente para "${produto.nome}". Disponível: ${produto.quantidade_estoque}`);
      }
    }

    const resultVenda = await queryConn(
      connection,
      `INSERT INTO venda (id_cliente, id_vendedor, valor_total, data_venda, status)
       VALUES (?, ?, ?, NOW(), 1)`,
      [id_cliente, id_vendedor, valorFinal]
    );

    const id_venda = resultVenda.insertId;

    await queryConn(
      connection,
      `INSERT INTO item_venda (id_venda, id_produto, quantidade, valor_unitario) VALUES ?`,
      [itens.map(i => [id_venda, i.id_produto, i.quantidade, i.valor_unitario])]
    );

    for (const item of itens) {
      const resultEstoque = await queryConn(
        connection,
        `UPDATE produto 
         SET quantidade_estoque = quantidade_estoque - ?
         WHERE id_produto = ? AND quantidade_estoque >= ?`,
        [item.quantidade, item.id_produto, item.quantidade]
      );

      if (!resultEstoque.affectedRows) {
        throw new Error('Não foi possível atualizar o estoque de um dos produtos');
      }

      await queryConn(
        connection,
        `INSERT INTO movimentacao_estoque 
         (id_produto, tipo, quantidade, motivo, id_funcionario)
         VALUES (?, 'saida', ?, ?, ?)`,
        [
          item.id_produto,
          item.quantidade,
          `Venda #${id_venda}`,
          req.user.id_funcionario || null
        ]
      );
    }

    await commit(connection);
    connection.release();

    res.status(201).json({
      success: true,
      message: 'Venda registrada com sucesso',
      id_venda,
      cliente: cliente.nome,
      valor_total: valorFinal
    });

  } catch (e) {
    if (connection) {
      await rollback(connection);
      connection.release();
    }

    res.status(400).json({ error: e.message });
  }
});

// ── CANCELAR — só admin e gerente ────────────────────────────────────────────
router.put('/:id/cancelar', auth, permissao(1, 2), async (req, res) => {
  const { id } = req.params;
  try {
    const [venda] = await q(`SELECT id_venda,status FROM venda WHERE id_venda=?`, [id]);
    if (!venda) return err404(res, 'Venda não encontrada');
    if (venda.status === 0) return err400(res, 'Venda já está cancelada');

    const itens = await q(`SELECT id_produto,quantidade FROM item_venda WHERE id_venda=?`, [id]);

    await new Promise((resolve, reject) => db.beginTransaction(e => e ? reject(e) : resolve()));
    try {
      await q(`UPDATE venda SET status=0 WHERE id_venda=?`, [id]);
      await Promise.all(itens.map(i =>
        q(`UPDATE produto SET quantidade_estoque=quantidade_estoque+? WHERE id_produto=?`, [i.quantidade, i.id_produto])
      ));
      await new Promise((resolve, reject) => db.commit(e => e ? reject(e) : resolve()));
      ok(res, { message: 'Venda cancelada e estoque restaurado' });
    } catch (e) {
      await new Promise(r => db.rollback(r));
      throw e;
    }
  } catch (e) { err500(res, e); }
});

// ── EXCLUIR — só admin ────────────────────────────────────────────────────────
router.delete('/:id', auth, permissao(1), async (req, res) => {
  try {
    const [venda] = await q(`SELECT id_venda FROM venda WHERE id_venda=?`, [req.params.id]);
    if (!venda) return err404(res, 'Venda não encontrada');
    await q(`UPDATE venda SET status=0 WHERE id_venda=?`, [req.params.id]);
    ok(res, { message: 'Venda cancelada com sucesso' });
  } catch (e) { err500(res, e); }
});

module.exports = router;
