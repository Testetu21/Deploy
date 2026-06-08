// Retorna um middleware que só deixa passar os níveis informados
function permissao(...niveis) {
  return (req, res, next) => {
    if (!niveis.includes(req.user.nivel)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
}

module.exports = permissao;