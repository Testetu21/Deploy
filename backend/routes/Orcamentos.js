const router   = require('express').Router();
const auth     = require('../middleware/Auth');
const permissao = require('../middleware/permissao');
const { q, buildSet } = require('../db');
const { err400, err404, err500, ok } = require('../helpers/Response');

const pGerente = permissao(1, 2);
const pTecnico = permissao(1, 2, 4);

// ── helper notificação ────────────────────────────────────────────────────────
async function notificar(id_funcionario, titulo, mensagem) {
  try {
    await q(`INSERT INTO notificacao (id_funcionario, titulo, mensagem) VALUES (?, ?, ?)`,
      [id_funcionario, titulo, mensagem]);
  } catch (e) { console.error('Erro ao criar notificação:', e.message); }
}

function statusToDb(status) {
  if (status === 1 || status === '1' || status === 'aceito') return 'aceito';
  if (status === 2 || status === '2' || status === 'cancelado') return 'cancelado';
  return 'pendente';
}

function statusToText(status) {
  if (status === 'aceito' || status === 1 || status === '1') return 'aceito';
  if (status === 'cancelado' || status === 2 || status === '2') return 'cancelado';
  return 'pendente';
}

// ── helper: cria OS a partir de orçamento ────────────────────────────────────
async function criarOSdoOrcamento(orc) {
  const r = await q(
    `INSERT INTO ordem_servico
       (id_cliente, id_tecnico, descricao_problema, status, status_execucao, id_orcamento, data_abertura)
     VALUES (?, ?, ?, 0, 0, ?, NOW())`,
    [
      orc.id_cliente,
      orc.id_tecnico || null,
      orc.descricao  || 'Gerado a partir de orçamento',
      orc.id_orcamento, // 👈 vincula sempre
    ]
  );

  if (orc.id_tecnico) {
    await notificar(
      orc.id_tecnico,
      `Nova OS #${r.insertId} gerada a partir de orçamento`,
      `O orçamento #${orc.id_orcamento} foi aceito e gerou uma nova OS. Acesse o sistema para avaliação.`
    );
  }

  return r.insertId;
}

// ── LISTAR ────────────────────────────────────────────────────────────────────
router.get('/', auth, pTecnico, async (req, res) => {
  try {
    const rows = await q(`
      SELECT o.id_orcamento, o.id_cliente, o.descricao, o.valor_total, o.validade,
             CASE
               WHEN o.status = 'aceito' THEN 'aceito'
               WHEN o.status = 'cancelado' THEN 'cancelado'
               ELSE 'pendente'
             END AS status,
             c.nome AS nome_cliente
      FROM orcamento o
      LEFT JOIN cliente c ON c.id_cliente = o.id_cliente
      ORDER BY o.id_orcamento DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error('ERRO REAL:', e);
    res.status(500).json({ error: e.message });
  }
});

// ── DISPONÍVEIS (para vincular a OS) ─────────────────────────────────────────
router.get('/disponiveis', auth, pTecnico, async (req, res) => {
  try {
    const rows = await q(`
      SELECT 
        o.id_orcamento,
        o.id_cliente,
        o.descricao,
        o.valor_total,
        c.nome AS nome_cliente
      FROM orcamento o
      LEFT JOIN cliente c ON c.id_cliente = o.id_cliente
      LEFT JOIN ordem_servico os ON os.id_orcamento = o.id_orcamento
      WHERE o.status = 'aceito'
        AND os.id_orcamento IS NULL
      ORDER BY o.id_orcamento DESC
    `);

    res.json(rows);
  } catch (e) { 
    err500(res, e); 
  }
});

// ── BUSCAR POR ID ─────────────────────────────────────────────────────────────
router.get('/:id', auth, pTecnico, async (req, res) => {
  try {
    const r = await q(`
      SELECT o.*,
             CASE
               WHEN o.status = 'aceito' THEN 'aceito'
               WHEN o.status = 'cancelado' THEN 'cancelado'
               ELSE 'pendente'
             END AS status_text
      FROM orcamento o
      WHERE o.id_orcamento=?
    `, [req.params.id]);
    if (!r.length) return err404(res, 'Orçamento não encontrado');
    const orcamento = r[0];
    res.json({ ...orcamento, status: orcamento.status_text || statusToText(orcamento.status) });
  } catch (e) { err500(res, e); }
});

// ── CRIAR — gerente, admin e técnico ─────────────────────────────────────────
router.post('/', auth, pTecnico, async (req, res) => {
  const { id_cliente, descricao, valor_total, validade, status, tipo } = req.body;
  if (!id_cliente || !valor_total || !validade)
    return err400(res, 'Campos obrigatórios: id_cliente, valor_total, validade');

  try {
    const statusDb = statusToDb(status);
    const r = await q(
      `INSERT INTO orcamento (id_cliente, descricao, valor_total, validade, status, tipo)
       VALUES (?,?,?,?,?,?)`,
      [id_cliente, descricao || null, valor_total, validade, statusDb, tipo || 'normal']
    );
    const id_orcamento = r.insertId;

    // Se já criado como aceito e tipo OS → cria OS imediatamente
    const isOS = tipo === 'os' || Number(tipo) === 1;
    if (isOS && statusDb === 1) {
      await criarOSdoOrcamento({ id_cliente, id_tecnico: null, descricao, id_orcamento });
    }

    res.status(201).json({ success: true, id_orcamento });
  } catch (e) {
    console.error(e);
    err500(res, e);
  }
});

// ── ATUALIZAR — só gerente e admin ───────────────────────────────────────────
router.put('/:id', auth, pGerente, async (req, res) => {
  const { id } = req.params;
  try {
    const [orc] = await q(`SELECT * FROM orcamento WHERE id_orcamento=?`, [id]);
    if (!orc) return err404(res, 'Orçamento não encontrado');

    // 👇 ADICIONE ISSO
    if (statusToText(orc.status) === 'aceito') {
      return err400(res, 'Orçamento aceito não pode ser editado');
    }

    const payload = { ...req.body };
    if (payload.status !== undefined) payload.status = statusToDb(payload.status);

    const { cols, vals } = buildSet(payload, ['id_cliente', 'descricao', 'valor_total', 'validade', 'status', 'tipo']);
    if (!cols.length) return err400(res, 'Nada para atualizar');

    await q(`UPDATE orcamento SET ${cols.join(', ')} WHERE id_orcamento=?`, [...vals, id]);

    const novoStatus = req.body.status !== undefined ? req.body.status : statusToText(orc.status);
    const novoTipo   = req.body.tipo   !== undefined ? req.body.tipo   : orc.tipo;
    const isOS       = novoTipo === 'os' || Number(novoTipo) === 1;

    // Cria OS se virou aceito e é tipo OS — e ainda não tem OS vinculada
    if (isOS && (novoStatus === 'aceito' || novoStatus === 1)) {
      const existing = await q(
        `SELECT id_ordem_servico FROM ordem_servico WHERE id_orcamento=?`,
        [id]
      );
      if (!existing.length) {
        await criarOSdoOrcamento({ ...orc, id_orcamento: Number(id) });
      }
    }

    ok(res, { message: 'Orçamento atualizado com sucesso' });
  } catch (e) {
    console.error(e);
    err500(res, e);
  }
});

// ── ACEITAR ───────────────────────────────────────────────────────────────────
router.put('/:id/aceitar', auth, pGerente, async (req, res) => {
  try {
    const [orc] = await q(`SELECT * FROM orcamento WHERE id_orcamento=?`, [req.params.id]);
    if (!orc) return err404(res, 'Orçamento não encontrado');
    if (statusToText(orc.status) === 'aceito') return err400(res, 'Orçamento já foi aceito');

    await q(`UPDATE orcamento SET status='aceito' WHERE id_orcamento=?`, [req.params.id]);

    const isOS = orc.tipo === 'os' || Number(orc.tipo) === 1;
    if (isOS) {
      await criarOSdoOrcamento(orc);
    }

    ok(res, { message: 'Orçamento aceito com sucesso' });
  } catch (e) { err500(res, e); }
});

// ── CANCELAR ──────────────────────────────────────────────────────────────────
router.put('/:id/cancelar', auth, pGerente, async (req, res) => {
  try {
    await q(`UPDATE orcamento SET status='cancelado' WHERE id_orcamento=?`, [req.params.id]);
    ok(res, { message: 'Orçamento cancelado' });
  } catch (e) { err500(res, e); }
});

// ── EXCLUIR — só gerente e admin ─────────────────────────────────────────────
router.delete('/:id', auth, pGerente, async (req, res) => {
  try {
    const exists = await q(`SELECT id_orcamento FROM orcamento WHERE id_orcamento=?`, [req.params.id]);
    if (!exists.length) return err404(res, 'Orçamento não encontrado');

    // 👇 ADICIONE ISSO
    const osVinculada = await q(
      `SELECT id_ordem_servico FROM ordem_servico WHERE id_orcamento=?`,
      [req.params.id]
    );
    if (osVinculada.length) {
      return err400(res, `Exclua primeiro a OS #${osVinculada[0].id_ordem_servico} vinculada a este orçamento`);
    }

    await q(`DELETE FROM orcamento WHERE id_orcamento=?`, [req.params.id]);
    ok(res, { message: 'Orçamento deletado com sucesso' });
  } catch (e) { err500(res, e); }
});

module.exports = router;
