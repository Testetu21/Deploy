const { q } = require('../db');

async function cancelarOrcamentosVencidos() {
  try {
    const result = await q(`
      UPDATE orcamento 
      SET status = 'cancelado'
      WHERE status = 'pendente'
        AND validade < CURDATE()
    `);
    console.log(`✅ Orçamentos vencidos cancelados: ${result.affectedRows}`);
  } catch (e) {
    console.error('Erro ao cancelar orçamentos vencidos:', e.message);
  }
}

module.exports = { cancelarOrcamentosVencidos };