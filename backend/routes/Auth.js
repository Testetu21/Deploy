const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { q }  = require('../db');
const { err400, err500 } = require('../helpers/Response');

const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_forte';

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) return err400(res, 'Usuário e senha obrigatórios');

  try {
    const rows = await q(`
      SELECT 
        id_usuario AS id,
        id_funcionario,
        usuario,
        senha,
        nivel_acesso,
        ativo,
        'usuario' AS tipo
      FROM usuario 
      WHERE usuario = ? AND ativo = 1

      UNION

      SELECT 
        id_cliente AS id,
        NULL AS id_funcionario,
        usuario,
        senha,
        nivel_acesso,
        ativo,
        'cliente' AS tipo
      FROM cliente 
      WHERE usuario = ? AND ativo = 1
    `, [usuario, usuario]);

    if (!rows.length) return res.status(401).json({ error: 'Usuário não encontrado' });

    const user = rows[0];
    if (!await bcrypt.compare(senha, user.senha))
      return res.status(401).json({ error: 'Senha incorreta' });

    const token = jwt.sign(
      {
        id: user.id,
        id_funcionario: user.id_funcionario,
        tipo: user.tipo,
        nivel: user.nivel_acesso
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        id_funcionario: user.id_funcionario,
        usuario: user.usuario,
        nivel_acesso: user.nivel_acesso,
        tipo: user.tipo
      },
    });
  } catch (e) { err500(res, e); }
});

// ── CADASTRO ──────────────────────────────────────────────────────────────────
router.post('/cadastro', async (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) return err400(res, 'Usuário e senha obrigatórios');

  try {
    const exists = await q(
      `SELECT usuario FROM usuario WHERE usuario = ? UNION SELECT usuario FROM cliente WHERE usuario = ?`,
      [usuario, usuario]
    );
    if (exists.length) return err400(res, 'Usuário já existe');

    const senhaHash = await bcrypt.hash(senha, 10);
    await q(`INSERT INTO cliente (usuario, senha, ativo, nivel_acesso) VALUES (?, ?, 1, 6)`, [usuario, senhaHash]);
    res.status(201).json({ success: true });
  } catch (e) { err500(res, e); }
});

module.exports = router;
