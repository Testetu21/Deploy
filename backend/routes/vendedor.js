const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Middleware: vendedor (3), gerente (2) ou admin (1)
function apenasVendedor(req, res, next) {
  if (![1, 2, 3].includes(req.user.nivel_acesso)) {
    return res.status(403).json({ erro: 'Acesso negado' });
  }
  next();
}

// ─── CLIENTES ───────────────────────────────────────────

// Listar todos os 
router.get('/clientes', auth, apenasVendedor, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id_cliente, nome, cpf_cnpj, telefone, email, endereço AS endereco, ativo
       FROM cliente WHERE ativo = 1 ORDER BY nome`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Buscar um cliente pelo ID
router.get('/clientes/:id', auth, apenasVendedor, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id_cliente, nome, cpf_cnpj, telefone, email, endereço AS endereco
       FROM cliente WHERE id_cliente = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Cliente não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Cadastrar novo cliente
router.post('/clientes', auth, apenasVendedor, async (req, res) => {
  const { nome, cpf_cnpj, telefone, email, endereco } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
  try {
    const [result] = await db.query(
      `INSERT INTO cliente (nome, cpf_cnpj, telefone, email, \`endereço\`, ativo, nivel_acesso)
       VALUES (?, ?, ?, ?, ?, 1, 6)`,
      [nome, cpf_cnpj, telefone, email, endereco]
    );
    res.status(201).json({ id_cliente: result.insertId, nome });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'CPF/CNPJ já cadastrado' });
    }
    res.status(500).json({ erro: err.message });
  }
});

// Editar cliente
router.put('/clientes/:id', auth, apenasVendedor, async (req, res) => {
  const { nome, cpf_cnpj, telefone, email, endereco } = req.body;
  try {
    await db.query(
      `UPDATE cliente SET nome=?, cpf_cnpj=?, telefone=?, email=?, \`endereço\`=?
       WHERE id_cliente=?`,
      [nome, cpf_cnpj, telefone, email, endereco, req.params.id]
    );
    res.json({ mensagem: 'Cliente atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ─── PRODUTOS ───────────────────────────────────────────

// Listar produtos disponíveis para venda
router.get('/produtos', auth, apenasVendedor, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id_produto, nome, preco_venda, quantidade_estoque
       FROM produto WHERE quantidade_estoque > 0 ORDER BY nome`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ─── VENDAS ─────────────────────────────────────────────

// Listar vendas do vendedor logado
router.get('/vendas', auth, apenasVendedor, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.id_venda, c.nome AS cliente_nome, v.valor_total, v.data_venda, v.status
       FROM venda v
       JOIN cliente c ON c.id_cliente = v.id_cliente
       WHERE v.id_vendedor = ?
       ORDER BY v.data_venda DESC`,
      [req.user.id_funcionario]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Detalhes de uma venda
router.get('/vendas/:id', auth, apenasVendedor, async (req, res) => {
  try {
    const [venda] = await db.query(
      `SELECT v.*, c.nome AS cliente_nome
       FROM venda v JOIN cliente c ON c.id_cliente = v.id_cliente
       WHERE v.id_venda = ?`,
      [req.params.id]
    );
    if (!venda.length) return res.status(404).json({ erro: 'Venda não encontrada' });

    const [itens] = await db.query(
      `SELECT iv.*, p.nome AS produto_nome
       FROM item_venda iv JOIN produto p ON p.id_produto = iv.id_produto
       WHERE iv.id_venda = ?`,
      [req.params.id]
    );
    res.json({ ...venda[0], itens });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Criar nova venda
router.post('/vendas', auth, apenasVendedor, async (req, res) => {
  const { id_cliente, itens } = req.body;
  // itens = [{ id_produto, quantidade, valor_unitario }]

  if (!id_cliente || !itens?.length) {
    return res.status(400).json({ erro: 'Cliente e itens são obrigatórios' });
  }

  const valor_total = itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO venda (id_cliente, id_vendedor, valor_total, data_venda, status)
       VALUES (?, ?, ?, NOW(), 1)`,
      [id_cliente, req.user.id_funcionario, valor_total]
    );
    const id_venda = result.insertId;

    for (const item of itens) {
      // Verifica estoque
      const [[prod]] = await conn.query(
        `SELECT quantidade_estoque FROM produto WHERE id_produto = ? FOR UPDATE`,
        [item.id_produto]
      );
      if (prod.quantidade_estoque < item.quantidade) {
        throw new Error(`Estoque insuficiente para o produto #${item.id_produto}`);
      }

      await conn.query(
        `INSERT INTO item_venda (id_venda, id_produto, quantidade, valor_unitario)
         VALUES (?, ?, ?, ?)`,
        [id_venda, item.id_produto, item.quantidade, item.valor_unitario]
      );

      await conn.query(
        `UPDATE produto SET quantidade_estoque = quantidade_estoque - ? WHERE id_produto = ?`,
        [item.quantidade, item.id_produto]
      );
    }

    await conn.commit();
    res.status(201).json({ id_venda, valor_total });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ erro: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
