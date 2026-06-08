const router = require('express').Router();
const db = require('../db');

router.get('/produtos', async (req, res) => {
  try {
    const [rows] = await new Promise((resolve, reject) => {
      db.query(
        'SELECT id_produto, nome, preco_venda, quantidade_estoque, garantia, tipo FROM produto WHERE quantidade_estoque > 0 ORDER BY nome',
        (err, result) => (err ? reject(err) : resolve([result]))
      );
    });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao carregar produtos' });
  }
});

router.post('/comprar', async (req, res) => {
  const { itens } = req.body;

  if (!itens?.length) {
    return res.status(400).json({ error: 'Adicione pelo menos um produto' });
  }

  const conn = db;

  try {
    await new Promise((resolve, reject) => conn.beginTransaction(err => err ? reject(err) : resolve()));

    for (const item of itens) {
      const [produto] = await new Promise((resolve, reject) => {
        conn.query(
          'SELECT id_produto, nome, quantidade_estoque FROM produto WHERE id_produto = ? FOR UPDATE',
          [item.id_produto],
          (err, rows) => (err ? reject(err) : resolve(rows))
        );
      });

      if (!produto) {
        throw new Error(`Produto ID ${item.id_produto} não encontrado`);
      }

      if (produto.quantidade_estoque < item.quantidade) {
        throw new Error(`Estoque insuficiente para "${produto.nome}". Disponível: ${produto.quantidade_estoque}`);
      }

      await new Promise((resolve, reject) => {
        conn.query(
          'UPDATE produto SET quantidade_estoque = quantidade_estoque - ? WHERE id_produto = ?',
          [item.quantidade, item.id_produto],
          err => (err ? reject(err) : resolve())
        );
      });
    }

    await new Promise((resolve, reject) => conn.commit(err => err ? reject(err) : resolve()));
    res.json({ success: true, message: 'Compra registrada com sucesso' });
  } catch (error) {
    await new Promise(resolve => conn.rollback(() => resolve()));
    res.status(400).json({ error: error.message || 'Erro ao processar compra' });
  }
});

module.exports = router;
