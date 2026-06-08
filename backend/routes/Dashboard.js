const router = require('express').Router();
const auth   = require('../middleware/Auth');
const { q }  = require('../db');
const { err500 } = require('../helpers/Response');

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [vendasDia, ordensAbertas, totalClientes, totalEstoque, recentes] = await Promise.all([
      q(`SELECT COALESCE(SUM(valor_total),0) AS total, COUNT(*) AS quantidade FROM venda WHERE DATE(data_venda)=CURDATE()`),
      q(`SELECT COUNT(*) AS total FROM ordem_servico WHERE status=1`),
      q(`SELECT COUNT(*) AS total FROM cliente WHERE ativo=1`),
      q(`SELECT COALESCE(SUM(quantidade_estoque),0) AS total FROM produto`),
      q(`SELECT v.id_venda, v.data_venda, v.valor_total,
           COALESCE(c.nome,'Cliente não identificado') AS nome_cliente,
           GROUP_CONCAT(DISTINCT p.nome SEPARATOR ', ') AS produtos,
           COALESCE(SUM(iv.quantidade),0) AS total_itens
         FROM venda v
         LEFT JOIN cliente c ON c.id_cliente=v.id_cliente
         LEFT JOIN item_venda iv ON iv.id_venda=v.id_venda
         LEFT JOIN produto p ON p.id_produto=iv.id_produto
         GROUP BY v.id_venda ORDER BY v.data_venda DESC LIMIT 5`),
    ]);

    res.json({
      vendas_dia:       vendasDia[0].total,
      qtd_vendas_dia:   vendasDia[0].quantidade,
      ordens_abertas:   ordensAbertas[0].total,
      total_clientes:   totalClientes[0].total,
      total_estoque:    totalEstoque[0].total,
      atividade_recente: recentes.map(r => ({ ...r, produtos: r.produtos || 'Sem produtos' })),
    });
  } catch (e) { err500(res, e); }
});

module.exports = router;
