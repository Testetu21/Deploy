function permissao(...niveis) {
  return (req, res, next) => {
    if (!niveis.includes(Number(req.user.nivel))) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
}

module.exports = permissao;