const { q } = require('../helpers/Db');

function gerarNumeroRecibo(id) {
  const d = new Date();
  return `REC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${String(id).padStart(4,'0')}`;
}

async function movimentarCaixa(tipo, valor, descricao, id_referencia) {
  const [caixa] = await q(
    `SELECT id_caixa FROM caixa WHERE valor_fechamento IS NULL ORDER BY data DESC LIMIT 1`
  );
  if (caixa) {
    await q(
      `INSERT INTO movimentacao_caixa (id_caixa, tipo, valor, descricao, id_referencia)
       VALUES (?, ?, ?, ?, ?)`,
      [caixa.id_caixa, tipo, valor, descricao, id_referencia]
    );
  }
}

function ultimoDiaMes(ano, mes) {
  // mes é 0-indexed (0=jan, 11=dez)
  return new Date(ano, mes + 1, 0).getDate();
}

async function rodarBaixaAutomatica() {
  const hoje     = new Date();
  const diaHoje  = hoje.getDate();
  const mesHoje  = hoje.getMonth();   // 0-indexed
  const anoHoje  = hoje.getFullYear();

  console.log(`[CRON] Rodando baixa automática — ${diaHoje}/${mesHoje + 1}/${anoHoje}`);

  try {
    // Busca TODAS as parcelas pendentes com dia_pagamento definido
    // cujo data_vencimento já chegou ou passou (mês/ano <= hoje)
    const parcelas = await q(`
      SELECT * FROM pagamento
      WHERE status = 'pendente'
        AND dia_pagamento IS NOT NULL
        AND (
          YEAR(data_vencimento) < ?
          OR (YEAR(data_vencimento) = ? AND MONTH(data_vencimento) <= ?)
        )
    `, [anoHoje, anoHoje, mesHoje + 1]);

    const parcelasBaixar = parcelas.filter(pag => {
      const venc = new Date(pag.data_vencimento);
      const anoVenc = venc.getFullYear();
      const mesVenc = venc.getMonth(); // 0-indexed

      const ultimoDiaDoMesVenc = ultimoDiaMes(anoVenc, mesVenc);
      const diaEfetivo = Math.min(Number(pag.dia_pagamento), ultimoDiaDoMesVenc);

      // Se o mês de vencimento já passou → baixa sempre
      if (anoVenc < anoHoje) return true;
      if (anoVenc === anoHoje && mesVenc < mesHoje) return true;

      // Se é o mês atual → só baixa se o dia efetivo já chegou
      if (anoVenc === anoHoje && mesVenc === mesHoje) {
        return diaHoje >= diaEfetivo;
      }

      return false;
    });

    console.log(`[CRON] ${parcelasBaixar.length} parcela(s) para baixar`);

    for (const pag of parcelasBaixar) {
      try {
        const numeroRecibo = gerarNumeroRecibo(pag.id_pagamento);

        await q(`
          UPDATE pagamento
          SET status='pago', data_pagamento=NOW(), numero_recibo=?
          WHERE id_pagamento=?
        `, [numeroRecibo, pag.id_pagamento]);

        await movimentarCaixa(
          'entrada',
          pag.valor,
          pag.descricao || `Parcela automática #${pag.id_pagamento}`,
          pag.id_pagamento
        );

        const venc = new Date(pag.data_vencimento);
        const ultimoDia = ultimoDiaMes(venc.getFullYear(), venc.getMonth());
        const diaEfetivo = Math.min(Number(pag.dia_pagamento), ultimoDia);
        console.log(`[CRON] Parcela #${pag.id_pagamento} baixada — R$ ${pag.valor} (dia escolhido: ${pag.dia_pagamento}, dia efetivo: ${diaEfetivo})`);
      } catch (e) {
        console.error(`[CRON] Erro na parcela #${pag.id_pagamento}:`, e.message);
      }
    }
  } catch (e) {
    console.error('[CRON] Erro geral:', e.message);
  }
}

module.exports = { rodarBaixaAutomatica };