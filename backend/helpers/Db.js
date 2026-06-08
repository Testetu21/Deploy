const db = require('../db');

/** Promisifica db.query */
const q = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, params, (err, r) => (err ? reject(err) : resolve(r)))
  );

/** Constrói SET dinâmico: buildSet({nome, email}, ['nome','email']) */
const buildSet = (body, fields) => {
  const cols = [], vals = [];
  fields.forEach(f => {
    if (body[f] !== undefined) {
      cols.push(`${f} = ?`);
      vals.push(body[f]);
    }
  });
  return { cols, vals };
};

module.exports = { q, buildSet };