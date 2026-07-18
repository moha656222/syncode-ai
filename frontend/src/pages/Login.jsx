import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const r = await login(email, password);
    setLoading(false);
    if (r.ok) {
      toast.success("Sesión iniciada");
      nav("/workspace");
    } else {
      setError(r.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 bg-grid">
      <Link to="/" className="absolute top-6 left-6 font-mono-ui text-xs text-zinc-500 hover:text-white flex items-center gap-2" data-testid="back-home">
        <ArrowLeft className="w-3.5 h-3.5" /> VOLVER
      </Link>
      <div className="w-full max-w-md border border-white/15 bg-black/60 p-10 backdrop-blur">
        <div className="mb-8">
          <span className="font-accent-label text-[10px] text-zinc-500">SYNCODE · ACCESO</span>
          <h1 className="font-serif-display text-5xl mt-2">Iniciar sesión</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-accent-label text-[10px] text-zinc-500 block mb-2">EMAIL</label>
            <input
              data-testid="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-white/20 px-4 py-3 font-mono-ui text-sm focus:outline-none focus:border-white"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="font-accent-label text-[10px] text-zinc-500 block mb-2">CONTRASEÑA</label>
            <input
              data-testid="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-white/20 px-4 py-3 font-mono-ui text-sm focus:outline-none focus:border-white"
              placeholder="••••••••"
            />
          </div>

          {error && <div data-testid="login-error" className="border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono-ui text-xs text-red-300">{error}</div>}

          <button
            data-testid="login-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-accent-label text-xs py-4 hover:bg-zinc-300 disabled:opacity-50 transition-colors"
          >
            {loading ? "AUTENTICANDO…" : "ENTRAR"}
          </button>
        </form>

        <p className="mt-6 font-mono-ui text-xs text-zinc-500 text-center">
          ¿No tienes cuenta?{" "}
          <Link to="/register" data-testid="link-register" className="text-white hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
