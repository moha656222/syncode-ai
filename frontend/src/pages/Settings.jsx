import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Cpu, KeyRound, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Settings() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ai-agents`).then((r) => r.json()).then(setAgents);
  }, []);

  const handleLogout = async () => {
    await logout();
    nav("/");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      <header className="border-b border-white/10 px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link to="/workspace" className="flex items-center gap-2 font-mono-ui text-xs text-zinc-400 hover:text-white" data-testid="settings-back">
          <ArrowLeft className="w-3.5 h-3.5" /> WORKSPACE
        </Link>
        <span className="font-accent-label text-xs">AJUSTES</span>
      </header>

      <section className="max-w-[1200px] mx-auto px-6 lg:px-12 py-16">
        <h1 className="font-serif-display text-5xl sm:text-7xl tracking-tighter mb-12">Ajustes</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-white/10">
          <div className="lg:col-span-2 bg-[#0a0a0a] p-8">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-4 h-4 text-zinc-400" strokeWidth={1.2} />
              <span className="font-accent-label text-[10px] text-zinc-500">PERFIL</span>
            </div>
            <h2 className="font-serif-display text-3xl mb-6">{user?.name || "—"}</h2>
            <div className="grid grid-cols-2 gap-6 font-mono-ui text-xs">
              <div>
                <div className="text-zinc-500">EMAIL</div>
                <div className="mt-1 text-white">{user?.email}</div>
              </div>
              <div>
                <div className="text-zinc-500">ROL</div>
                <div className="mt-1 text-white uppercase">{user?.role || "user"}</div>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <KeyRound className="w-4 h-4 text-zinc-400" strokeWidth={1.2} />
              <span className="font-accent-label text-[10px] text-zinc-500">SESIÓN</span>
            </div>
            <p className="font-mono-ui text-xs text-zinc-400 mb-6 flex-1">
              Sesión activa con cookies seguras. Cierra sesión para finalizar el acceso desde este dispositivo.
            </p>
            <button onClick={handleLogout} data-testid="logout-btn" className="font-accent-label text-[10px] py-3 border border-white/20 hover:border-white hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2">
              <LogOut className="w-3.5 h-3.5" /> CERRAR SESIÓN
            </button>
          </div>

          <div className="lg:col-span-3 bg-[#0a0a0a] p-8">
            <div className="flex items-center gap-3 mb-6">
              <Cpu className="w-4 h-4 text-zinc-400" strokeWidth={1.2} />
              <span className="font-accent-label text-[10px] text-zinc-500">MODELOS DISPONIBLES</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
              {agents.map((a) => (
                <div key={a.id} className="bg-[#050505] p-6">
                  <span className="w-2 h-2 inline-block rounded-full" style={{ backgroundColor: a.color }} />
                  <h3 className="font-serif-display text-2xl mt-3" style={{ color: a.color }}>{a.name}</h3>
                  <p className="font-mono-ui text-xs text-zinc-400 mt-2">{a.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
