import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, UtensilsCrossed, Palette, Rocket, BarChart3, Scissors, Home, GraduationCap } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

const ICON_MAP = { ShoppingBag, UtensilsCrossed, Palette, Rocket, BarChart3, Scissors, Home, GraduationCap };

export default function Templates() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [creating, setCreating] = useState(null);

  useEffect(() => {
    api.get("/templates").then((r) => setItems(r.data));
  }, []);

  const handleUseTemplate = async (tpl) => {
    if (!user) {
      window.location.href = "/register";
      return;
    }
    setCreating(tpl.id);
    try {
      const { data } = await api.post("/projects", {
        name: `${tpl.name} · Nuevo`,
        prompt: `Crea una plataforma estilo ${tpl.name.toLowerCase()}: ${tpl.description}`,
        template: tpl.id,
      });
      window.location.href = `/workspace/${data.id}`;
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      <header className="border-b border-white/10 px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-mono-ui text-xs text-zinc-400 hover:text-white" data-testid="templates-back">
          <ArrowLeft className="w-3.5 h-3.5" /> SYNCODE · INICIO
        </Link>
        <Link to={user ? "/workspace" : "/login"} className="font-accent-label text-xs px-4 py-2 bg-white text-black hover:bg-zinc-300">
          {user ? "WORKSPACE" : "ACCEDER"}
        </Link>
      </header>

      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-20">
        <span className="font-accent-label text-[10px] text-zinc-500">PLANTILLAS · POR SECTOR</span>
        <h1 className="font-serif-display text-5xl sm:text-7xl tracking-tighter mt-3 mb-4">
          Empieza con un esqueleto<br /><span className="italic text-zinc-500">listo para tu negocio.</span>
        </h1>
        <p className="font-mono-ui text-sm text-zinc-400 max-w-2xl mb-16">
          Cada plantilla está optimizada para su sector. Las IAs la adaptarán a tu marca, datos y preferencias.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 border-l border-t border-white/10">
          {items.map((tpl) => {
            const Icon = ICON_MAP[tpl.icon] || Rocket;
            return (
              <article key={tpl.id} className="border-r border-b border-white/10 p-8 group hover:bg-white/5 transition-colors flex flex-col" data-testid={`template-${tpl.id}`}>
                <div className="flex items-center justify-between mb-8">
                  <Icon className="w-6 h-6 text-zinc-300" strokeWidth={1.2} />
                  <span className="font-accent-label text-[9px] text-zinc-600">{tpl.category}</span>
                </div>
                <h3 className="font-serif-display text-3xl mb-2">{tpl.name}</h3>
                <p className="font-mono-ui text-xs text-zinc-400 mb-8 flex-1">{tpl.description}</p>
                <button
                  onClick={() => handleUseTemplate(tpl)}
                  disabled={creating === tpl.id}
                  data-testid={`template-use-${tpl.id}`}
                  className="font-accent-label text-[10px] py-3 border border-white/20 hover:border-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                >
                  {creating === tpl.id ? "CREANDO…" : "USAR PLANTILLA"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
