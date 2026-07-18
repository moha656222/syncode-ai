import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const r = await register(name, email, password);
    setLoading(false);
    if (r.ok) {
      toast.success("Cuenta creada");
      nav("/workspace");
    } else setError(r.error);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 bg-grid">
      <Link to="/" className="absolute top-6 left-6 font-mono-ui text-xs text-zinc-500 hover:text-white flex items-center gap-2" data-testid="back-home">
        <ArrowLeft className="w-3.5 h-3.5" /> VOLVER
      </Link>
      <div className="w-full max-w-md border border-white/15 bg-black/60 p-10 backdrop-blur">
        <div className="mb-8">
          <span className="font-accent-label text-[10px] text-zinc-500">SYNCODE · CREAR</span>
          <h1 className="font-serif-display text-5xl mt-2">Nueva cuenta</h1>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="font-accent-label text-[10px] text-zinc-500 block mb-2">NOMBRE</label>
            <input data-testid="register-name" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border border-white/20 px-4 py-3 font-mono-ui text-sm focus:outline-none focus:border-white" placeholder="Tu nombre" />
          </div>
          <div>
            <label className="font-accent-label text-[10px] text-zinc-500 block mb-2">EMAIL</label>
            <input data-testid="register-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-white/20 px-4 py-3 font-mono-ui text-sm focus:outline-none focus:border-white" placeholder="tu@email.com" />
          </div>
          <div>
            <label className="font-accent-label text-[10px] text-zinc-500 block mb-2">CONTRASEÑA</label>
            <input data-testid="register-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-white/20 px-4 py-3 font-mono-ui text-sm focus:outline-none focus:border-white" placeholder="Mínimo 6 caracteres" />
          </div>

          {error && <div data-testid="register-error" className="border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono-ui text-xs text-red-300">{error}</div>}

          <button data-testid="register-submit" type="submit" disabled={loading}
            className="w-full bg-white text-black font-accent-label text-xs py-4 hover:bg-zinc-300 disabled:opacity-50 transition-colors">
            {loading ? "CREANDO…" : "CREAR CUENTA"}
          </button>
        </form>

        <p className="mt-6 font-mono-ui text-xs text-zinc-500 text-center">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" data-testid="link-login" className="text-white hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
