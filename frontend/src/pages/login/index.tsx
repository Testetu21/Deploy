import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { IconAlert, IconEye } from "../../components/ui/icons";
import "./login.css";
import API_URL from "../../utils/api";

const IconEyeOff = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.58 10.58A3 3 0 0 0 13.42 13.42" />
    <path d="M9.88 4.24A11 11 0 0 1 12 4c7 0 11 8 11 8a20.9 20.9 0 0 1-5.17 5.74" />
    <path d="M6.1 6.1C3.2 8.28 1 12 1 12s4 8 11 8a10.9 10.9 0 0 0 5.2-1.3" />
    <path d="M1 1l22 22" />
    <path d="M8.71 8.71a4 4 0 0 0 5.66 5.66" />
  </svg>
);

async function autenticarComBackend(usuario: string, senha: string) {
  const response = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, senha }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Credenciais inválidas.");

  localStorage.setItem("token", data.token);
  return data.user;
}

export function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function handleLogin() {
    if (!usuario || !senha) {
      setErro("Preencha o usuário e a senha.");
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const user = await autenticarComBackend(usuario, senha);
      sessionStorage.setItem("usuario", JSON.stringify(user));

      if (user.tipo === "cliente") {
        navigate("/loja");
        return;
      }

      switch (user.nivel_acesso) {
        case 1:
        case 2:
          navigate("/dashboard");
          break;
        case 3:
          navigate("/vendas");
          break;
        case 4:
          navigate("/ordem");
          break;
        case 5:
          navigate("/caixa");
          break;
        default:
          navigate("/home");
      }
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="container">
      <div className="primary-container">
        <div className="logo-branding">
          <div className="logo-icon">T</div>
          <div className="logo-text">Tool-Master</div>
        </div>
        <h1>Entre na sua conta</h1>
        <p>
          Trabalhe com as melhores ferramentas para quase qualquer tipo de serviço.
        </p>
      </div>

      <div className="login-container">
        <div className="login-form">
          <h2>Bem-vindo de volta</h2>
          <p>Faça o login para continuar sua experiência.</p>

          {/* Usuário */}
          <div className="label">
            <label>Usuário</label>
          </div>
          <Input
            type="text"
            placeholder="Usuário"
            value={usuario}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUsuario(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
              e.key === "Enter" && handleLogin()
            }
          />

          {/* Senha */}
          <div className="label">
            <label>Senha</label>
          </div>
          <div className="password-field">
            <Input
              type={mostrarSenha ? "text" : "password"}
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSenha(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                e.key === "Enter" && handleLogin()
              }
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setMostrarSenha((v) => !v)}
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {mostrarSenha ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>

          {/* Erro */}
          {erro && (
            <p
              style={{
                color: "red",
                fontSize: "13px",
                marginTop: "8px",
              }}
            >
              <IconAlert
                style={{
                  width: 14,
                  height: 14,
                  marginRight: 6,
                  verticalAlign: "-2px",
                }}
              />
              {erro}
            </p>
          )}

          {/* Botão */}
          <Button type="button" onClick={handleLogin} disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </Button>

          {/* Link */}
          <span>
            Ainda não tem conta? <a href="/sign-up">Criar conta</a>
          </span>
        </div>
      </div>
    </div>
  );
}