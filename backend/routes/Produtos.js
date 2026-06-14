const router   = require('express').Router();
const auth     = require('../middleware/Auth');
const permissao = require('../middleware/permissao');
const { q, buildSet } = require('../db');
const { err400, err404, err500, ok } = require('../helpers/Response');

const pGerente = permissao(1, 2);
const pEstoque = permissao(1, 2, 3);

// ── LISTAR ────────────────────────────────────────────────────────────────────
router.get('/', auth, pEstoque, async (req, res) => {
  try {
    res.json(await q(`SELECT id_produto,nome,tipo,preco_custo,preco_venda,quantidade_estoque,estoque_minimo,garantia,id_fornecedor FROM produto`));
  } catch (e) { err500(res, e); }
});

// ── BUSCAR POR ID ─────────────────────────────────────────────────────────────
router.get('/:id', auth, pEstoque, async (req, res) => {
  try {
    const r = await q(
      `SELECT p.*,f.nome AS nome_fornecedor FROM produto p LEFT JOIN fornecedor f ON f.id_fornecedor=p.id_fornecedor WHERE p.id_produto=?`,
      [req.params.id]
    );
    r.length ? res.json(r[0]) : err404(res, 'Produto não encontrado');
  } catch (e) { err500(res, e); }
});

// ── CRIAR ─────────────────────────────────────────────────────────────────────
router.post('/', auth, pEstoque, async (req, res) => {
  const { nome, tipo, preco_custo, preco_venda, quantidade_estoque, estoque_minimo, garantia, id_fornecedor } = req.body;

  if (!nome || !preco_custo || !preco_venda || !id_fornecedor)
    return err400(res, 'Campos obrigatórios: nome, preco_custo, preco_venda, id_fornecedor');
  if (preco_custo <= 0 || preco_venda <= 0)
    return err400(res, 'Preços devem ser maiores que zero');
  if (preco_venda <= preco_custo)
    return err400(res, 'Preço de venda deve ser maior que o de custo');

  try {
    const forn = await q(`SELECT id_fornecedor FROM fornecedor WHERE id_fornecedor=?`, [id_fornecedor]);
    if (!forn.length) return err400(res, 'Fornecedor não encontrado');

    const r = await q(
      `INSERT INTO produto (nome,tipo,preco_custo,preco_venda,quantidade_estoque,estoque_minimo,garantia,id_fornecedor) VALUES (?,?,?,?,?,?,?,?)`,
      [nome, tipo || 1, preco_custo, preco_venda, quantidade_estoque || 0, estoque_minimo || 0, garantia || 12, id_fornecedor]
    );
    res.status(201).json({ success: true, message: 'Produto criado com sucesso', id_produto: r.insertId });
  } catch (e) { err500(res, e); }
});

// ── ATUALIZAR ─────────────────────────────────────────────────────────────────
router.put('/:id', auth, pEstoque, async (req, res) => {
  const { id } = req.params;
  try {
    const exists = await q(`SELECT id_produto FROM produto WHERE id_produto=?`, [id]);
    if (!exists.length) return err404(res, 'Produto não encontrado');

    const { cols, vals } = buildSet(req.body, ['nome', 'tipo', 'preco_custo', 'preco_venda', 'quantidade_estoque', 'estoque_minimo', 'garantia', 'id_fornecedor']);
    if (!cols.length) return err400(res, 'Nenhum campo para atualizar');

    await q(`UPDATE produto SET ${cols.join(', ')} WHERE id_produto=?`, [...vals, id]);
    ok(res, { message: 'Produto atualizado com sucesso' });
  } catch (e) { err500(res, e); }
});

// ── EXCLUIR ───────────────────────────────────────────────────────────────────
router.delete('/:id', auth, pEstoque, async (req, res) => {
  const { id } = req.params;
  try {
    const exists = await q(`SELECT id_produto FROM produto WHERE id_produto=?`, [id]);
    if (!exists.length) return err404(res, 'Produto não encontrado');

    const [{ total }] = await q(`SELECT COUNT(*) AS total FROM item_venda WHERE id_produto=?`, [id]);
    if (total > 0) return err400(res, `Não é possível excluir produto com ${total} venda(s) vinculada(s)`);

    await q(`DELETE FROM produto WHERE id_produto=?`, [id]);
    ok(res, { message: 'Produto excluído com sucesso' });
  } catch (e) { err500(res, e); }
});

module.exports = router;
