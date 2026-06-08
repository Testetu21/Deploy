const router   = require('express').Router();
const auth     = require('../middleware/Auth');
const permissao = require('../middleware/permissao');
const { q, buildSet } = require('../db');
const pGerente = permissao(1, 2);
const { err400, err404, err500, ok } = require('../helpers/Response');

// ── LISTAR ────────────────────────────────────────────────────────────────────
router.get('/', auth, pGerente, async (req, res) => {
  try {
    res.json(await q(`SELECT id_fornecedor,nome,telefone,email,endereco FROM fornecedor ORDER BY nome`));
  } catch (e) { err500(res, e); }
});

// ── BUSCAR POR ID ─────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await q(`SELECT id_fornecedor,nome,telefone,email,endereco FROM fornecedor WHERE id_fornecedor=?`, [req.params.id]);
    r.length ? res.json(r[0]) : err404(res, 'Fornecedor não encontrado');
  } catch (e) { err500(res, e); }
});

// ── CRIAR ─────────────────────────────────────────────────────────────────────
router.post('/', auth, pGerente, async (req, res) => {
  const { nome, telefone, email, endereco } = req.body;
  if (!nome) return err400(res, 'Campo obrigatório: nome');
  try {
    const r = await q(
      `INSERT INTO fornecedor (nome,telefone,email,endereco) VALUES (?,?,?,?)`,
      [nome, telefone || null, email || null, endereco || null]
    );
    res.status(201).json({ success: true, message: 'Fornecedor criado com sucesso', id_fornecedor: r.insertId });
  } catch (e) { err500(res, e); }
});

// ── ATUALIZAR ─────────────────────────────────────────────────────────────────
router.put('/:id', auth, pGerente, async (req, res) => {
  const { id } = req.params;
  try {
    const exists = await q(`SELECT id_fornecedor FROM fornecedor WHERE id_fornecedor=?`, [id]);
    if (!exists.length) return err404(res, 'Fornecedor não encontrado');

    const { cols, vals } = buildSet(req.body, ['nome', 'telefone', 'email', 'endereco']);
    if (!cols.length) return err400(res, 'Nenhum campo para atualizar');

    await q(`UPDATE fornecedor SET ${cols.join(', ')} WHERE id_fornecedor=?`, [...vals, id]);
    ok(res, { message: 'Fornecedor atualizado com sucesso' });
  } catch (e) { err500(res, e); }
});

// ── EXCLUIR ───────────────────────────────────────────────────────────────────
router.delete('/:id', auth, pGerente, async (req, res) => {
  const { id } = req.params;
  try {
    const exists = await q(`SELECT id_fornecedor FROM fornecedor WHERE id_fornecedor=?`, [id]);
    if (!exists.length) return err404(res, 'Fornecedor não encontrado');

    const [{ total }] = await q(`SELECT COUNT(*) AS total FROM produto WHERE id_fornecedor=?`, [id]);
    if (total > 0) return err400(res, `Não é possível excluir fornecedor com ${total} produto(s) vinculado(s)`);

    await q(`DELETE FROM fornecedor WHERE id_fornecedor=?`, [id]);
    ok(res, { message: 'Fornecedor excluído com sucesso' });
  } catch (e) { err500(res, e); }
});

module.exports = router;
