const router   = require('express').Router();
const bcrypt   = require('bcrypt');
const auth     = require('../middleware/Auth');
const permissao = require('../middleware/permissao');
const { q, buildSet } = require('../db');
const { err400, err404, err500, ok } = require('../helpers/Response');

const pGerente = permissao(1, 2);

// ── LISTAR ────────────────────────────────────────────────────────────────────
router.get('/', auth, pGerente, async (req, res) => {
  try {
    const sql = req.query.cargo
      ? `SELECT f.id_funcionario,f.nome,f.cargo,f.salario,f.percentual_comissao,f.ativo,n.nome AS nome_cargo FROM funcionario f LEFT JOIN nivel_acesso n ON n.id_nivel_acesso=f.cargo WHERE f.cargo=?`
      : `SELECT f.id_funcionario,f.nome,f.cargo,f.salario,f.percentual_comissao,f.ativo,n.nome AS nome_cargo FROM funcionario f LEFT JOIN nivel_acesso n ON n.id_nivel_acesso=f.cargo`;
    res.json(await q(sql, req.query.cargo ? [req.query.cargo] : []));
  } catch (e) { err500(res, e); }
});

// ── LISTAR CARGOS ─────────────────────────────────────────────────────────────
router.get('/cargos', auth, pGerente, async (req, res) => {
  try {
    res.json(await q(`SELECT id_nivel_acesso,nome FROM nivel_acesso WHERE id_nivel_acesso<>6 ORDER BY id_nivel_acesso`));
  } catch (e) { err500(res, e); }
});

// ── BUSCAR POR ID ─────────────────────────────────────────────────────────────
router.get('/:id', auth, pGerente, async (req, res) => {
  try {
    const r = await q(
      `SELECT f.*,n.nome AS nome_cargo FROM funcionario f LEFT JOIN nivel_acesso n ON n.id_nivel_acesso=f.cargo WHERE f.id_funcionario=?`,
      [req.params.id]
    );
    r.length ? res.json(r[0]) : err404(res, 'Funcionário não encontrado');
  } catch (e) { err500(res, e); }
});

// ── CRIAR ─────────────────────────────────────────────────────────────────────
router.post('/', auth, pGerente, async (req, res) => {
  const { nome, cargo, salario, percentual_comissao, ativo, usuario, senha } = req.body;
  if (!nome || !cargo || !salario) return err400(res, 'Campos obrigatórios: nome, cargo, salario');

  try {
    const cargoExists = await q(`SELECT id_nivel_acesso FROM nivel_acesso WHERE id_nivel_acesso=?`, [cargo]);
    if (!cargoExists.length) return err400(res, 'Cargo não encontrado');

    const r = await q(
      `INSERT INTO funcionario (nome,cargo,salario,percentual_comissao,ativo) VALUES (?,?,?,?,?)`,
      [nome, cargo, salario, percentual_comissao || 0, ativo ?? 1]
    );

    if (usuario && senha) {
      const hash = await bcrypt.hash(senha, 10);
      await q(
        `INSERT INTO usuario (usuario,senha,nivel_acesso,ativo,data_criacao,id_funcionario) VALUES (?,?,?,1,NOW(),?)`,
        [usuario, hash, cargo, r.insertId]
      ).catch(e => console.error('Erro ao criar usuário:', e));
    }

    res.status(201).json({ success: true, message: 'Funcionário criado com sucesso', id_funcionario: r.insertId });
  } catch (e) { err500(res, e); }
});

// ── ATUALIZAR ─────────────────────────────────────────────────────────────────
router.put('/:id', auth, pGerente, async (req, res) => {
  const { id } = req.params;
  const { cargo, usuario, senha } = req.body;

  try {
    const exists = await q(`SELECT id_funcionario FROM funcionario WHERE id_funcionario=?`, [id]);
    if (!exists.length) return err404(res, 'Funcionário não encontrado');

    const { cols, vals } = buildSet(req.body, ['nome', 'cargo', 'salario', 'percentual_comissao', 'ativo']);
    if (cols.length) await q(`UPDATE funcionario SET ${cols.join(', ')} WHERE id_funcionario=?`, [...vals, id]);

    if (usuario || senha) {
      const userRows  = await q(`SELECT id_usuario FROM usuario WHERE id_funcionario=?`, [id]);
      const cargoAtual = cargo || (await q(`SELECT cargo FROM funcionario WHERE id_funcionario=?`, [id]))[0]?.cargo;

      if (userRows.length) {
        const { cols: uc, vals: uv } = buildSet({ usuario, nivel_acesso: cargo }, ['usuario', 'nivel_acesso']);
        if (senha) { uc.push('senha = ?'); uv.push(await bcrypt.hash(senha, 10)); }
        if (uc.length) await q(`UPDATE usuario SET ${uc.join(', ')} WHERE id_usuario=?`, [...uv, userRows[0].id_usuario]);
      } else if (usuario && senha) {
        await q(
          `INSERT INTO usuario (usuario,senha,nivel_acesso,ativo,data_criacao,id_funcionario) VALUES (?,?,?,1,NOW(),?)`,
          [usuario, await bcrypt.hash(senha, 10), cargoAtual, id]
        );
      }
    }

    ok(res, { message: 'Funcionário atualizado com sucesso' });
  } catch (e) { err500(res, e); }
});

// ── EXCLUIR / DESATIVAR ───────────────────────────────────────────────────────
router.delete('/:id', auth, pGerente, async (req, res) => {
  const { id } = req.params;
  try {
    const exists = await q(`SELECT id_funcionario FROM funcionario WHERE id_funcionario=?`, [id]);
    if (!exists.length) return err404(res, 'Funcionário não encontrado');

    const [[{ total: tv }], [{ total: tos }]] = await Promise.all([
      q(`SELECT COUNT(*) AS total FROM venda WHERE id_vendedor=?`, [id]),
      q(`SELECT COUNT(*) AS total FROM ordem_servico WHERE id_tecnico=?`, [id]),
    ]);

    if (tv > 0 || tos > 0) {
      await q(`UPDATE funcionario SET ativo=0 WHERE id_funcionario=?`, [id]);
      await q(`UPDATE usuario SET ativo=0 WHERE id_funcionario=?`, [id]);
      return ok(res, { message: 'Funcionário desativado com sucesso', softDelete: true });
    }

    await q(`DELETE FROM usuario WHERE id_funcionario=?`, [id]);
    await q(`DELETE FROM funcionario WHERE id_funcionario=?`, [id]);
    ok(res, { message: 'Funcionário excluído com sucesso' });
  } catch (e) { err500(res, e); }
});

module.exports = router;
