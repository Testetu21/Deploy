const err500 = (res, e) => { console.error('[500]', e); return res.status(500).json({ error: e.message || 'Erro interno' }); };
const err400 = (res, msg) => res.status(400).json({ error: msg });
const err404 = (res, msg) => res.status(404).json({ error: msg });
const ok    = (res, data) => res.json({ success: true, ...data });

module.exports = { err500, err400, err404, ok };