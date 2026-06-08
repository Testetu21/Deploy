const router = require('express').Router();
const auth = require('../middleware/Auth');
const permissao = require('../middleware/permissao');
const { q } = require('../db');

const pAdmin = permissao(1, 2);

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

router.get('/:tipo', auth, pAdmin, async (req, res) => {
  const tipo = req.params.tipo;
  const today = new Date();
  const data_fim = req.query.data_fim || formatDate(today);
  const data_inicio = req.query.data_inicio || formatDate(new Date(today.getTime() - 30 * 86400000));

  try {
    switch (tipo) {
      case 'vendas-periodo': {
        const dataInicio = (data_inicio || '').trim();
        const dataFim    = (data_fim    || '').trim();

        const rows = await q(
          `SELECT DATE_FORMAT(data_venda, '%d/%m/%Y') AS periodo,
                  COUNT(*) AS quantidade,
                  COALESCE(SUM(valor_total), 0) AS receita
           FROM venda
           WHERE DATE(data_venda) BETWEEN ? AND ?
           GROUP BY DATE(data_venda)
           ORDER BY data_venda DESC`,
          [dataInicio, dataFim]
        );

        const safeRows = Array.isArray(rows) ? rows : [];
        const totalTransacoes = safeRows.reduce((sum, row) => sum + Number(row.quantidade || 0), 0);
        const totalReceita = safeRows.reduce((sum, row) => sum + Number(row.receita || 0), 0);

        return res.json({
          summary: safeRows.length
            ? `${safeRows.length} dia(s) com vendas entre ${dataInicio} e ${dataFim}. Total: ${totalTransacoes} transações, R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
            : `Nenhuma venda encontrada entre ${dataInicio} e ${dataFim}.`,
          headers: ['Período', 'Quantidade', 'Receita'],
          rows: safeRows.map((row) => [
            row.periodo || '-',
            String(row.quantidade || 0),
            `R$ ${Number(row.receita || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          ]),
        });
      }

      case 'estoques-criticos': {
        const rows = await q(
          `SELECT nome AS produto,
                  quantidade_estoque AS estoque_atual,
                  estoque_minimo,
                  IFNULL((SELECT nome FROM fornecedor WHERE id_fornecedor = produto.id_fornecedor), 'Sem fornecedor') AS fornecedor
           FROM produto
           WHERE quantidade_estoque <= estoque_minimo
           ORDER BY quantidade_estoque ASC
           LIMIT 20`
        );
        return res.json({
          summary: `${rows.length} produto(s) com estoque no nível crítico ou abaixo do mínimo.`,
          headers: ['Produto', 'Estoque Atual', 'Estoque Mínimo', 'Fornecedor'],
          rows: rows.map((row) => [row.produto, String(row.estoque_atual), String(row.estoque_minimo), row.fornecedor]),
        });
      }

      case 'ordens-servico': {
        const rows = await q(
          `SELECT os.id_ordem_servico AS os,
                  c.nome AS cliente,
                  f.nome AS tecnico,
                  os.descricao_problema AS descricao,
                  CASE
                    WHEN os.status = 0 THEN 'Aberta'
                    WHEN os.status = 1 THEN 'Em andamento'
                    WHEN os.status = 2 THEN 'Concluída'
                    ELSE 'Outro'
                  END AS status,
                  DATE_FORMAT(os.data_abertura, '%d/%m/%Y') AS data_abertura
           FROM ordem_servico os
           LEFT JOIN cliente c ON c.id_cliente = os.id_cliente
           LEFT JOIN funcionario f ON f.id_funcionario = os.id_tecnico
           ORDER BY os.data_abertura DESC
           LIMIT 20`
        );
        return res.json({
          summary: `${rows.length} ordens de serviço carregadas do sistema.`,
          headers: ['OS', 'Cliente', 'Técnico', 'Descrição', 'Status', 'Data Abertura'],
          rows: rows.map((row) => [String(row.os), row.cliente || '-', row.tecnico || 'Sem técnico', row.descricao, row.status, row.data_abertura]),
        });
      }

      case 'garantias-processadas': {
        const rows = await q(
          `SELECT r.id_reparo AS id_garantia,
                  r.id_ordem_servico AS os,
                  COALESCE(c.nome, 'Sem cliente') AS cliente,
                  DATE_FORMAT(r.data, '%d/%m/%Y') AS data_reparo,
                  CONCAT('R$ ', FORMAT(r.custo, 2, 'pt_BR')) AS custo_reparo
           FROM reparo r
           LEFT JOIN ordem_servico os ON os.id_ordem_servico = r.id_ordem_servico
           LEFT JOIN cliente c ON c.id_cliente = os.id_cliente
           ORDER BY r.id_reparo DESC
           LIMIT 20`
        );
        return res.json({
          summary: `${rows.length} reparo(s) com garantia registrado(s) no sistema.`,
          headers: ['ID', 'OS', 'Cliente', 'Data do Reparo', 'Custo'],
          rows: rows.map((row) => [String(row.id_garantia), String(row.os), row.cliente, row.data_reparo, row.custo_reparo]),
        });
      }

      case 'comissoes-vendedor': {
        const rows = await q(
          `SELECT f.nome AS vendedor,
                  COUNT(v.id_venda) AS vendas,
                  COALESCE(SUM(v.valor_total * COALESCE(f.percentual_comissao, 0) / 100), 0) AS comissao,
                  CONCAT(ROUND(COALESCE(f.percentual_comissao, 0), 0), '%') AS percentual
           FROM funcionario f
           LEFT JOIN venda v ON v.id_vendedor = f.id_funcionario AND v.status = 1
           GROUP BY f.id_funcionario
           ORDER BY comissao DESC
           LIMIT 20`
        );
        return res.json({
          summary: `Comissões calculadas com base nas vendas finais registradas no banco.`,
          headers: ['Vendedor', 'Vendas', 'Comissão', 'Percentual'],
          rows: rows.map((row) => [row.vendedor, String(row.vendas), `R$ ${Number(row.comissao).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, row.percentual]),
        });
      }

      case 'produtos-maior-margem': {
        const rows = await q(
          `SELECT nome AS produto,
                  ROUND((preco_venda - preco_custo) / preco_custo * 100, 0) AS margem,
                  preco_venda,
                  preco_custo
           FROM produto
           WHERE preco_custo > 0
           ORDER BY margem DESC
           LIMIT 20`
        );
        return res.json({
          summary: `Produtos com maior margem de lucro baseada nos preços cadastrados.`,
          headers: ['Produto', 'Margem', 'Preço Venda', 'Preço Compra'],
          rows: rows.map((row) => [row.produto, `${row.margem}%`, `R$ ${Number(row.preco_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, `R$ ${Number(row.preco_custo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]),
        });
      }

      case 'clientes-inadiplentes': {
        const rows = await q(
          `SELECT c.nome AS cliente,
                  c.telefone,
                  COALESCE(SUM(p.valor), 0) AS valor_aberto,
                  MAX(DATE_FORMAT(p.data_vencimento, '%d/%m/%Y')) AS ultimo_vencimento
           FROM pagamento p
           LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
           WHERE p.status = 'pendente' AND DATE(p.data_vencimento) < CURDATE()
           GROUP BY c.id_cliente
           HAVING valor_aberto > 0
           ORDER BY valor_aberto DESC
           LIMIT 20`
        );
        return res.json({
          summary: `${rows.length} cliente(s) com faturas vencidas registrados no sistema.`,
          headers: ['Cliente', 'Telefone', 'Valor em Aberto', 'Último Vencimento'],
          rows: rows.map((row) => [row.cliente, row.telefone || '-', `R$ ${Number(row.valor_aberto).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, row.ultimo_vencimento || '-']),
        });
      }

      case 'historico-precos-compra': {
        const rows = await q(
          `SELECT nome AS produto,
                  DATE_FORMAT(NOW(), '%d/%m/%Y') AS data,
                  preco_custo AS preco_compra,
                  CONCAT(ROUND((preco_venda - preco_custo) / preco_custo * 100, 0), '%') AS variacao
           FROM produto
           WHERE preco_custo > 0
           ORDER BY nome
           LIMIT 20`
        );
        return res.json({
          summary: `Preços de compra atuais aplicados aos produtos cadastrados no estoque.`,
          headers: ['Produto', 'Data', 'Preço Compra', 'Variação'],
          rows: rows.map((row) => [row.produto, row.data, `R$ ${Number(row.preco_compra).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, row.variacao]),
        });
      }

      case 'performance-tecnica': {
        const rows = await q(
          `SELECT f.nome AS tecnico,
                  COUNT(os.id_ordem_servico) AS total_ordens,
                  SUM(CASE WHEN os.status = 2 THEN 1 ELSE 0 END) AS ordens_concluidas,
                  SUM(CASE WHEN os.status = 1 THEN 1 ELSE 0 END) AS ordens_andamento,
                  CONCAT(ROUND(100 * SUM(CASE WHEN os.status = 2 THEN 1 ELSE 0 END) / COUNT(os.id_ordem_servico), 0), '%') AS taxa_conclusao
           FROM funcionario f
           LEFT JOIN ordem_servico os ON os.id_tecnico = f.id_funcionario
           WHERE f.ativo = 1
           GROUP BY f.id_funcionario
           HAVING total_ordens > 0
           ORDER BY ordens_concluidas DESC
           LIMIT 20`
        );
        return res.json({
          summary: `${rows.length} técnico(s) com ordens de serviço registradas.`,
          headers: ['Técnico', 'Total OS', 'Concluídas', 'Em Andamento', 'Taxa de Conclusão'],
          rows: rows.map((row) => [row.tecnico, String(row.total_ordens), String(row.ordens_concluidas), String(row.ordens_andamento), row.taxa_conclusao]),
        });
      }

      case 'fluxo-caixa-diario': {
        const rows = await q(
          `SELECT DATE_FORMAT(dia_ref, '%d/%m/%Y') AS dia,
                  COALESCE(SUM(entradas), 0) AS entradas,
                  COALESCE(SUM(saidas), 0)   AS saidas,
                  COALESCE(SUM(entradas), 0) - COALESCE(SUM(saidas), 0) AS saldo
           FROM (
             SELECT DATE(data_pagamento) AS dia_ref,
                    COALESCE(SUM(valor), 0) AS entradas,
                    0 AS saidas
             FROM pagamento
             WHERE status = 'pago'
               AND data_pagamento IS NOT NULL
               AND DATE(data_pagamento) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             GROUP BY DATE(data_pagamento)
             UNION ALL
             SELECT DATE(data) AS dia_ref,
                    0 AS entradas,
                    COALESCE(SUM(custo), 0) AS saidas
             FROM reparo
             WHERE data IS NOT NULL
               AND DATE(data) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             GROUP BY DATE(data)
           ) AS mov
           WHERE dia_ref IS NOT NULL
           GROUP BY dia_ref
           ORDER BY dia_ref DESC
           LIMIT 30`
        );

        const safeRows = Array.isArray(rows) ? rows : [];

        return res.json({
          summary: safeRows.length
            ? `Fluxo de caixa dos últimos 30 dias — ${safeRows.length} dia(s) com movimentação.`
            : `Nenhuma movimentação registrada nos últimos 30 dias.`,
          headers: ['Data', 'Entradas', 'Saídas', 'Saldo'],
          rows: safeRows.map((row) => [
            row.dia || '-',
            `R$ ${Number(row.entradas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `R$ ${Number(row.saidas   || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `R$ ${Number(row.saldo    || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          ]),
        });
      }

      case 'devolucao-trocas': {
        const rows = await q(
          `SELECT v.id_venda AS pedido,
                  'Devolução' AS tipo,
                  v.valor_total AS valor,
                  CASE WHEN v.status = 0 THEN 'Cancelado' ELSE 'Ativo' END AS status
           FROM venda v
           WHERE v.status = 0
           ORDER BY v.data_venda DESC
           LIMIT 20`
        );
        return res.json({
          summary: `${rows.length} devolução(ões) registradas como vendas canceladas.`,
          headers: ['Pedido', 'Tipo', 'Valor', 'Status'],
          rows: rows.map((row) => [String(row.pedido), row.tipo, `R$ ${Number(row.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, row.status]),
        });
      }

      case 'previsao-demanda': {
        const rows = await q(
          `SELECT p.nome AS produto,
                  COALESCE(SUM(iv.quantidade), 0) AS demanda_estimada,
                  p.quantidade_estoque AS estoque_atual,
                  CONCAT('Repor ', GREATEST(0, LEAST(9999, ROUND((COALESCE(SUM(iv.quantidade), 0) * 1.2) - p.quantidade_estoque))), '') AS recomendacao
           FROM produto p
           LEFT JOIN item_venda iv ON iv.id_produto = p.id_produto
           LEFT JOIN venda v ON v.id_venda = iv.id_venda AND v.status = 1
           WHERE v.data_venda >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
           GROUP BY p.id_produto
           ORDER BY demanda_estimada DESC
           LIMIT 20`
        );
        return res.json({
          summary: `Previsão de demanda com base nas vendas dos últimos 30 dias.`,
          headers: ['Produto', 'Demanda Estimada', 'Estoque Atual', 'Recomendação'],
          rows: rows.map((row) => [row.produto, String(row.demanda_estimada), String(row.estoque_atual), row.recomendacao]),
        });
      }

      default:
        return res.status(404).json({ error: 'Relatório inválido' });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
