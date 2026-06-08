const router   = require('express').Router();
const bcrypt   = require('bcrypt');
const auth     = require('../middleware/Auth');
const permissao = require('../middleware/permissao'); // 👈 adicione
const { q, buildSet } = require('../db');
const { err400, err404, err500, ok } = require('../helpers/Response');

// níveis que podem mexer com clientes: admin(1), gerente(2), vendedor(3)
const pVendedor = permissao(1, 2, 3);
// técnico (4) pode apenas ler clientes para abrir OS
const pLeitura  = permissao(1, 2, 3, 4);

// ── LISTAR ────────────────────────────────────────────────────────────────────
router.get('/', auth, pLeitura, async (req, res) => {
  try {
    res.json(await q(`SELECT id_cliente,nome,cpf_cnpj,telefone,email,\`endereço\` AS endereco,ativo,usuario,nivel_acesso FROM cliente WHERE ativo=1 ORDER BY nome`));
  } catch (e) { err500(res, e); }
});

// ── BUSCAR POR ID ─────────────────────────────────────────────────────────────
router.get('/:id', auth, pLeitura, async (req, res) => {
  try {
    const r = await q(
      `SELECT id_cliente,nome,cpf_cnpj,telefone,email,\`endereço\` AS endereco,ativo,usuario,nivel_acesso FROM cliente WHERE id_cliente=?`,
      [req.params.id]
    );
    r.length ? res.json(r[0]) : err404(res, 'Cliente não encontrado');
  } catch (e) { err500(res, e); }
});

// ── CRIAR ─────────────────────────────────────────────────────────────────────
router.post('/', auth, pVendedor, async (req, res) => {  // 👈
  const { nome, cpf_cnpj, telefone, email, endereco, usuario, senha, nivel_acesso } = req.body;
  if (!nome || !usuario || !senha) return err400(res, 'Campos obrigatórios: nome, usuario, senha');

  try {
    const exists = await q(
      `SELECT usuario FROM usuario WHERE usuario=? UNION SELECT usuario FROM cliente WHERE usuario=?`,
      [usuario, usuario]
    );
    if (exists.length) return err400(res, 'Usuário já existe');

    const senhaHash = await bcrypt.hash(senha, 10);
    const r = await q(
      `INSERT INTO cliente (nome,cpf_cnpj,telefone,email,\`endereço\`,ativo,usuario,senha,nivel_acesso) VALUES (?,?,?,?,?,1,?,?,?)`,
      [nome, cpf_cnpj || null, telefone || null, email || null, endereco || null, usuario, senhaHash, nivel_acesso || 6]
    );
    res.status(201).json({ success: true, message: 'Cliente criado com sucesso', id_cliente: r.insertId });
  } catch (e) { err500(res, e); }
});

// ── ATUALIZAR ─────────────────────────────────────────────────────────────────
router.put('/:id', auth, pVendedor, async (req, res) => {  // 👈
  const { id } = req.params;
  try {
    const exists = await q(`SELECT id_cliente FROM cliente WHERE id_cliente=?`, [id]);
    if (!exists.length) return err404(res, 'Cliente não encontrado');

    const { cols, vals } = buildSet(req.body, ['nome', 'cpf_cnpj', 'telefone', 'email', 'ativo', 'usuario']);
    if (req.body.endereco !== undefined) { cols.push('`endereço` = ?'); vals.push(req.body.endereco); }
    if (req.body.senha) { cols.push('senha = ?'); vals.push(await bcrypt.hash(req.body.senha, 10)); }
    if (!cols.length) return err400(res, 'Nenhum campo para atualizar');

    await q(`UPDATE cliente SET ${cols.join(', ')} WHERE id_cliente=?`, [...vals, id]);
    ok(res, { message: 'Cliente atualizado com sucesso' });
  } catch (e) { err500(res, e); }
});

// ── EXCLUIR / DESATIVAR ───────────────────────────────────────────────────────
// Vendedor NÃO pode excluir — apenas admin(1) e gerente(2)
router.delete('/:id', auth, permissao(1, 2), async (req, res) => {  // 👈 só admin e gerente
  const { id } = req.params;
  try {
    const exists = await q(`SELECT id_cliente FROM cliente WHERE id_cliente=?`, [id]);
    if (!exists.length) return err404(res, 'Cliente não encontrado');

    const [{ total }] = await q(`SELECT COUNT(*) AS total FROM venda WHERE id_cliente=?`, [id]);
    if (total > 0) {
      await q(`UPDATE cliente SET ativo=0 WHERE id_cliente=?`, [id]);
      return ok(res, { message: 'Cliente desativado com sucesso', softDelete: true });
    }
    await q(`DELETE FROM cliente WHERE id_cliente=?`, [id]);
    ok(res, { message: 'Cliente excluído com sucesso' });
  } catch (e) { err500(res, e); }
});

module.exports = router;
