import { Link } from "react-router-dom";
import { Sparkles, Boxes, Layers, FileCode2, ArrowRight, Lock, GitBranch, FileSearch, Wand2, Cpu } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const AGENTS = [
  { id: "chatgpt", name: "ChatGPT", role: "Razonamiento estratégico", color: "#10A37F" },
  { id: "copilot", name: "Copilot", role: "Programación de élite", color: "#007AFF" },
  { id: "gemini", name: "Gemini", role: "Búsqueda y datos", color: "#3B82F6" },
  { id: "grok", name: "Grok", role: "Creatividad y revisión", color: "#F59E0B" },
];

const FEATURES = [
  { icon: Cpu, title: "Modo ULTRA", desc: "Las cuatro IAs colaboran en paralelo, debaten internamente y entregan la mejor solución consolidada." },
  { icon: Wand2, title: "Edición exacta", desc: "Pide cambios milimétricos. SynCode toca solo lo que pediste, nada más, nunca." },
  { icon: GitBranch, title: "Versiones y diff", desc: "Historial completo, modo compare y vuelta a cualquier estado anterior con un clic." },
  { icon: Lock, title: "Bloqueo de componentes", desc: "Protege header, checkout o footer. Las IAs no podrán tocarlos sin tu permiso." },
  { icon: FileSearch, title: "Importación masiva", desc: "Sube Excels, PDFs, ZIPs o imágenes. La plataforma detecta y rellena tu proyecto." },
  { icon: Layers, title: "Plantillas por sector", desc: "Tienda, restaurante, portfolio, dashboard, inmobiliaria, academia y más." },
];

export default function Landing() {
  const { user } = useAuth();
  const ctaTo = user ? "/workspace" : "/register";

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 overflow-x-hidden">
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" data-testid="brand-link">
            <div className="w-7 h-7 border border-white flex items-center justify-center font-serif-display text-lg">S</div>
            <span className="font-accent-label text-xs">SYNCODE · AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-10 font-mono-ui text-xs text-zinc-400">
            <a href="#agents" className="hover:text-white transition-colors">Agentes</a>
            <a href="#features" className="hover:text-white transition-colors">Capacidades</a>
            <Link to="/templates" className="hover:text-white transition-colors" data-testid="nav-templates">Plantillas</Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/workspace" data-testid="nav-workspace" className="font-accent-label text-xs px-4 py-2 bg-white text-black hover:bg-zinc-300 transition-colors">
                ABRIR WORKSPACE
              </Link>
            ) : (
              <>
                <Link to="/login" data-testid="nav-login" className="font-mono-ui text-xs text-zinc-300 hover:text-white">Iniciar sesión</Link>
                <Link to="/register" data-testid="nav-register" className="font-accent-label text-xs px-4 py-2 bg-white text-black hover:bg-zinc-300 transition-colors">
                  COMENZAR
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div
          className="absolute inset-0 bg-grid opacity-50"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1762279389042-9439bfb6c155?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920')", backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/75 to-[#050505]" />
        <div className="absolute inset-0 vignette pointer-events-none" />

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 grid lg:grid-cols-12 gap-12 py-32">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="font-accent-label text-[10px] text-zinc-400">CUATRO IAs · UN SOLO EQUIPO</span>
            </div>
            <h1 className="font-serif-display text-5xl sm:text-6xl lg:text-[7.5rem] leading-[0.95] tracking-tighter mb-8">
              Una idea.<br />
              <span className="italic text-zinc-400">Cuatro mentes.</span><br />
              Un producto real.
            </h1>
            <p className="font-mono-ui text-sm sm:text-base text-zinc-400 max-w-2xl mb-12 leading-relaxed">
              SynCode AI orquesta a ChatGPT, Copilot, Gemini y Grok como un equipo de élite que diseña, programa, revisa
              y despliega tu proyecto en tiempo real. Tú solo escribes la idea.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to={ctaTo} data-testid="hero-cta" className="group flex items-center gap-3 bg-white text-black font-accent-label text-xs px-6 py-4 hover:bg-zinc-300 transition-colors">
                CREAR PROYECTO <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/templates" data-testid="hero-templates" className="font-accent-label text-xs px-6 py-4 border border-white/20 hover:border-white text-zinc-300 hover:text-white transition-colors">
                VER PLANTILLAS
              </Link>
            </div>
          </div>

          <aside className="lg:col-span-4 self-end">
            <div className="border border-white/10 bg-black/60 backdrop-blur p-5 font-mono-ui text-xs space-y-2">
              <div className="text-zinc-500">$ syncode init</div>
              <div className="text-emerald-400">› Analizando intención del usuario…</div>
              <div className="text-blue-400">› Estructurando componentes…</div>
              <div className="text-amber-400">› Revisando accesibilidad…</div>
              <div className="text-zinc-100 cursor-blink">› Vista previa lista</div>
            </div>
          </aside>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="border-y border-white/10 py-5 overflow-hidden bg-[#0a0a0a]">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="flex gap-12 px-12 font-accent-label text-xs text-zinc-500">
              {["SÍNTESIS EN TIEMPO REAL", "MÚLTIPLES MODELOS", "ARQUITECTURA ULTRA", "EDICIÓN EXACTA", "VERSIONES INFINITAS", "IMPORTACIÓN MASIVA", "PLANTILLAS POR SECTOR"].map((t, i) => (
                <span key={`${j}-${i}`} className="whitespace-nowrap">◆ {t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* AGENTS */}
      <section id="agents" className="py-32 border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 mb-16">
            <div className="lg:col-span-4">
              <span className="font-accent-label text-[10px] text-zinc-500">01 · ROLES</span>
            </div>
            <div className="lg:col-span-8">
              <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-7xl leading-[0.95] tracking-tighter">
                Cada IA tiene <span className="italic text-zinc-500">su fortaleza.</span><br />
                Juntas son imparables.
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-l border-t border-white/10">
            {AGENTS.map((agent) => (
              <div key={agent.id} data-testid={`agent-card-${agent.id}`} className="border-r border-b border-white/10 p-8 group hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }} />
                  <span className="font-accent-label text-[10px] text-zinc-500">AGENTE</span>
                </div>
                <h3 className="font-serif-display text-3xl mb-3" style={{ color: agent.color }}>{agent.name}</h3>
                <p className="font-mono-ui text-xs text-zinc-400">{agent.role}</p>
                <div className="mt-8 pt-8 border-t border-white/10 font-mono-ui text-[10px] text-zinc-600">
                  STATUS · DISPONIBLE
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 border border-white/20 bg-gradient-to-br from-white/5 to-transparent p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <span className="font-accent-label text-[10px] text-zinc-500">MODO ULTRA</span>
              <h3 className="font-serif-display text-4xl mt-2">Todos a la vez. Consenso real.</h3>
              <p className="font-mono-ui text-xs text-zinc-400 mt-3 max-w-xl">
                Activa ULTRA y los cuatro modelos debaten, comparan y entregan una respuesta sólida como un consejo técnico.
              </p>
            </div>
            <Link to={ctaTo} data-testid="ultra-cta" className="font-accent-label text-xs px-6 py-4 bg-white text-black hover:bg-zinc-300 self-start">
              ACTIVAR ULTRA
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-32 border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="mb-16">
            <span className="font-accent-label text-[10px] text-zinc-500">02 · CAPACIDADES</span>
            <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-7xl leading-[0.95] tracking-tighter mt-4">
              Más que un asistente. <br /><span className="italic text-zinc-500">Un equipo técnico completo.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-white/10">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="border-r border-b border-white/10 p-8 group hover:bg-white/[0.03] transition-colors">
                  <Icon className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors mb-6" strokeWidth={1.2} />
                  <h3 className="font-serif-display text-2xl mb-2">{f.title}</h3>
                  <p className="font-mono-ui text-xs text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="py-32 border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="mb-16">
            <span className="font-accent-label text-[10px] text-zinc-500">03 · FLUJO</span>
            <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-7xl leading-[0.95] tracking-tighter mt-4">
              Del prompt al producto<br />en <span className="italic text-zinc-500">cuatro pasos.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { n: "01", t: "Escribe tu idea", d: "Lenguaje natural. Sin tecnicismos." },
              { n: "02", t: "Las IAs preguntan", d: "Detectan datos faltantes y proponen." },
              { n: "03", t: "Generan en vivo", d: "Vista previa real, no solo código." },
              { n: "04", t: "Editas y exportas", d: "Cambios exactos · GitHub · ZIP." },
            ].map((step) => (
              <div key={step.n} className="border border-white/10 p-8 hover:border-white/40 transition-colors">
                <div className="font-serif-display text-6xl text-zinc-700 mb-6">{step.n}</div>
                <h3 className="font-serif-display text-2xl mb-2">{step.t}</h3>
                <p className="font-mono-ui text-xs text-zinc-500">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="font-serif-display text-5xl sm:text-6xl lg:text-8xl leading-[0.95] tracking-tighter mb-8">
            ¿Listo para construir<br />sin tocar el código?
          </h2>
          <p className="font-mono-ui text-sm text-zinc-400 max-w-xl mx-auto mb-12">
            Empieza con cualquier plantilla, importa tus archivos o describe tu idea desde cero.
          </p>
          <Link to={ctaTo} data-testid="footer-cta" className="inline-flex items-center gap-3 bg-white text-black font-accent-label text-xs px-8 py-5 hover:bg-zinc-300 transition-colors">
            <Sparkles className="w-4 h-4" /> EMPEZAR AHORA
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between gap-6 font-mono-ui text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border border-white/40 flex items-center justify-center font-serif-display">S</div>
            <span>© {new Date().getFullYear()} SynCode AI · Síntesis y código.</span>
          </div>
          <div className="flex gap-8">
            <a href="#features" className="hover:text-white">Capacidades</a>
            <a href="#agents" className="hover:text-white">Agentes</a>
            <Link to="/templates" className="hover:text-white">Plantillas</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
