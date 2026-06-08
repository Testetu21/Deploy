const router = require('express').Router();
const auth   = require('../middleware/Auth');
const permissao = require('../middleware/permissao');
const { q }  = require('../db');
const { err500, ok } = require('../helpers/Response');

const pTecnico = permissao(1, 2, 3, 4, 5); // qualquer funcionário logado

// GET /api/notificacoes — busca notificações do usuário logado
router.get('/', auth, pTecnico, async (req, res) => {
  try {
    res.json(await q(
      `SELECT * FROM notificacao
       WHERE id_funcionario = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    ));
  } catch (e) { err500(res, e); }
});

// GET /api/notificacoes/nao-lidas — contador do sino
router.get('/nao-lidas', auth, pTecnico, async (req, res) => {
  try {
    const [r] = await q(
      `SELECT COUNT(*) AS total FROM notificacao
       WHERE id_funcionario = ? AND lida = 0`,
      [req.user.id]
    );
    res.json({ total: r.total });
  } catch (e) { err500(res, e); }
});

// PATCH /api/notificacoes/:id/lida — marca uma como lida
router.patch('/:id/lida', auth, pTecnico, async (req, res) => {
  try {
    await q(
      `UPDATE notificacao SET lida = 1
       WHERE id_notificacao = ? AND id_funcionario = ?`,
      [req.params.id, req.user.id]
    );
    ok(res, { message: 'Notificação marcada como lida' });
  } catch (e) { err500(res, e); }
});

// PATCH /api/notificacoes/todas/lidas — marca todas como lidas
router.patch('/todas/lidas', auth, pTecnico, async (req, res) => {
  try {
    await q(
      `UPDATE notificacao SET lida = 1 WHERE id_funcionario = ?`,
      [req.user.id]
    );
    ok(res, { message: 'Todas marcadas como lidas' });
  } catch (e) { err500(res, e); }
});

module.exports = router;
