const mysql = require('mysql2');

const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  port:               Number(process.env.DB_PORT) || 3306,
  charset:            'utf8mb4',
  dateStrings:        true,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
});

pool.getConnection((err, conn) => {
  if (err) { console.warn('⚠️  Banco não conectado:', err.message); return; }
  console.log('✅ Conectado ao banco MySQL');
  conn.release();
});

function q(sql, params) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function buildSet(body, fields) {
  const cols = [], vals = [];
  fields.forEach((f) => {
    if (body[f] !== undefined) {
      cols.push(`${f} = ?`);
      vals.push(body[f]);
    }
  });
  return { cols, vals };
}

module.exports = pool;
module.exports.q = q;
module.exports.buildSet = buildSet;
