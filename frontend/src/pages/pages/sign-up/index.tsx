import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { IconAlert } from "../../components/ui/icons";
import "../login/login.css";
import API_URL from "../../utils/api";

function formatarTelefone(valor: string) {
  const nums = valor.replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 2)  return nums.length ? `(${nums}` : "";
  if (nums.length <= 7)  return `(${nums.slice(0,2)}) ${nums.slice(2)}`;
  if (nums.length <= 11) return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`;
  return valor;
}

export function SignUp() {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail]               = useState("");
  const [usuario, setUsuario]           = useState("");
  const [telefone, setTelefone]         = useState("");
  const [senha, setSenha]               = useState("");
  const [erro, setErro]                 = useState("");
  const [carregando, setCarregando]     = useState(false);
  const navigate = useNavigate();

  function handleTelefone(e: React.ChangeEvent<HTMLInputElement>) {
    setTelefone(formatarTelefone(e.target.value));
  }

  function validarEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  async function handleCadastro() {
    if (!nomeCompleto || !usuario || !senha) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    if (email && !validarEmail(email)) {
      setErro("Informe um e-mail válido.");
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const res = await fetch(`${API_URL}/api/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeCompleto, email, usuario, senha, telefone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao criar conta.");
        setCarregando(false);
        return;
      }

      navigate("/");
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <div className="container">
        <div className="primary-container">
          <div className="logo-branding">
            <div className="logo-icon">T</div>
            <div className="logo-text">Tool-Master</div>
          </div>
          <h1>Crie sua conta</h1>
          <p>
            Trabalhe com as melhores ferramentas para quase qualquer tipo de serviço.
          </p>
        </div>

        <div className="login-container login-container-signup">
          <div className="login-form">
            <h2>Crie sua conta</h2>
            <p>Preencha os campos para criar sua conta.</p>

            <div className="label"><label>Nome Completo *</label></div>
            <Input
              type="text"
              placeholder="Seu nome completo"
              value={nomeCompleto}
              onChange={e => setNomeCompleto(e.target.value)}
            />

            <div className="label"><label>E-mail <span style={{color:"#aaa", fontWeight:400}}>(opcional)</span></label></div>
              <Input
                type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
                  onInvalid={(e) => e.currentTarget.setCustomValidity("Informe um e-mail válido")}
                  onInput={(e) => e.currentTarget.setCustomValidity("")}
            />

            <div className="label"><label>Usuário *</label></div>
            <Input
              type="text"
              placeholder="Crie um nome de usuário"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
            />

            <div className="label"><label>Telefone <span style={{color:"#aaa", fontWeight:400}}>(opcional)</span></label></div>
            <Input
              type="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={handleTelefone}
              maxLength={15}
            />

            <div className="label"><label>Senha</label></div>
            <Input
              type="password"
              placeholder="Crie uma senha forte"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCadastro()}
            />

            {erro && (
              <p style={{ color: "red", fontSize: "13px", marginTop: "8px", alignSelf: "flex-start", width: "100%" }}>
                <IconAlert style={{ width: 14, height: 14, marginRight: 6, verticalAlign: "-2px" }} /> {erro}
              </p>
            )}

            <Button type="button" onClick={handleCadastro} disabled={carregando}>
              {carregando ? "Criando conta..." : "Criar conta"}
            </Button>

            <span>Já tem uma conta? <a href="/">Fazer login</a></span>
          </div>
        </div>
      </div>
    </>
  );
}