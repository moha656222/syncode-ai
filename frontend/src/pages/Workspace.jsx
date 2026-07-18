import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Settings as SettingsIcon, Plus, FileCode2, History, Cpu, Lock, Eye, GitCompare, Upload, Send, Sparkles, ChevronRight, FolderOpen, ChevronDown, X, ArrowLeft, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const AGENTS = [
  { id: "chatgpt", name: "ChatGPT", role: "Razonamiento", color: "#10A37F" },
  { id: "copilot", name: "Copilot", role: "Programación", color: "#007AFF" },
  { id: "gemini", name: "Gemini", role: "Búsqueda", color: "#3B82F6" },
  { id: "grok", name: "Grok", role: "Revisión", color: "#F59E0B" },
];

export default function Workspace() {
  const { projectId } = useParams();
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [activeAIs, setActiveAIs] = useState(["chatgpt", "copilot", "gemini", "grok"]);
  const [ultra, setUltra] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [phaseStream, setPhaseStream] = useState([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showTechnical, setShowTechnical] = useState(true);
  const [lockedComponents, setLockedComponents] = useState([]);
  const fileRef = useRef(null);

  // Load projects list
  useEffect(() => {
    api.get("/projects").then((r) => setProjects(r.data));
  }, []);

  // Load specific project
  useEffect(() => {
    if (projectId) {
      api.get(`/projects/${projectId}`).then((r) => {
        setProject(r.data);
        setActiveAIs(r.data.ai_active || activeAIs);
        setUltra(!!r.data.ultra_mode);
        setLockedComponents(r.data.locked_components || []);
      }).catch(() => {
        toast.error("Proyecto no encontrado");
        nav("/workspace");
      });
    } else if (projects.length === 0) {
      setProject(null);
    } else {
      // pick most recent
      nav(`/workspace/${projects[0].id}`);
    }
  }, [projectId, projects.length]);

  const toggleAI = (id) => {
    if (ultra) return;
    setActiveAIs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSend = async () => {
    if (!input.trim() || !project || loading) return;
    setLoading(true);
    setPhaseStream([]);
    const message = input;
    setInput("");

    // Optimistic user message
    setProject((p) => ({ ...p, messages: [...(p.messages || []), { role: "user", content: message, timestamp: new Date().toISOString() }] }));

    // Simulate phase streaming visually before API resolves
    const phases = ultra
      ? ["Activando ULTRA · sincronizando 4 modelos…", "Analizando intención…", "Estructurando componentes…", "Generando código…", "Revisando accesibilidad…", "Casi listo…"]
      : ["Analizando intención…", "Estructurando componentes…", "Generando código…", "Optimizando…"];

    let cancelled = false;
    (async () => {
      for (const p of phases) {
        if (cancelled) break;
        await new Promise((r) => setTimeout(r, 380));
        setPhaseStream((s) => [...s, p]);
      }
    })();

    try {
      const { data } = await api.post("/chat", { project_id: project.id, message, active_ais: activeAIs, ultra_mode: ultra });
      cancelled = true;
      // Refresh project
      const fresh = await api.get(`/projects/${project.id}`);
      setProject(fresh.data);
      setPhaseStream([]);
      toast.success(ultra ? "ULTRA · consenso alcanzado" : "Generación completada");
      // Refresh project list
      api.get("/projects").then((r) => setProjects(r.data));
    } catch (e) {
      cancelled = true;
      toast.error("Error en la generación");
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = async (name, prompt) => {
    const { data } = await api.post("/projects", { name: name || "Nuevo Proyecto", prompt: prompt || "" });
    setShowNewProject(false);
    setProjects((p) => [{ id: data.id, name: data.name, updated_at: data.updated_at }, ...p]);
    nav(`/workspace/${data.id}`);
  };

  const handleDeleteProject = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("¿Eliminar este proyecto?")) return;
    await api.delete(`/projects/${id}`);
    setProjects((p) => p.filter((x) => x.id !== id));
    if (project?.id === id) nav("/workspace");
    toast.success("Proyecto eliminado");
  };

  const restoreVersion = async (v) => {
    const { data } = await api.post(`/projects/${project.id}/restore/${v}`);
    setProject((p) => ({ ...p, html_content: data.html_content }));
    setShowVersions(false);
    toast.success(`Restaurada v${v}`);
  };

  const toggleLock = (comp) => {
    const next = lockedComponents.includes(comp) ? lockedComponents.filter((x) => x !== comp) : [...lockedComponents, comp];
    setLockedComponents(next);
    api.patch(`/projects/${project.id}`, { locked_components: next });
  };

  const handleFileUpload = (e) => {
    const f = e.target.files?.[0];
    if (f) toast.success(`Archivo recibido · ${f.name} (${(f.size / 1024).toFixed(1)}KB)`);
  };

  return (
    <div className="h-screen w-screen bg-[#050505] text-zinc-100 flex overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/10 bg-[#050505] flex flex-col" data-testid="workspace-sidebar">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="workspace-logo">
            <div className="w-7 h-7 border border-white flex items-center justify-center font-serif-display">S</div>
            <span className="font-accent-label text-[10px]">SYNCODE</span>
          </Link>
        </div>

        <button
          data-testid="new-project-btn"
          onClick={() => setShowNewProject(true)}
          className="m-3 px-3 py-3 bg-white text-black font-accent-label text-[10px] hover:bg-zinc-300 flex items-center justify-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" /> NUEVO PROYECTO
        </button>

        <div className="px-3 py-2 font-accent-label text-[9px] text-zinc-600 flex items-center justify-between">
          <span>HISTORIAL · {projects.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/workspace/${p.id}`}
              data-testid={`project-${p.id}`}
              className={`group block px-3 py-2.5 mb-1 font-mono-ui text-xs border-l-2 ${project?.id === p.id ? "border-white bg-white/5 text-white" : "border-transparent text-zinc-400 hover:text-white hover:bg-white/5"}`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{p.name}</span>
                <button onClick={(e) => handleDeleteProject(p.id, e)} className="opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-3 h-3 text-zinc-500 hover:text-red-400" />
                </button>
              </div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{new Date(p.updated_at).toLocaleDateString("es-ES")}</div>
            </Link>
          ))}
          {projects.length === 0 && <p className="px-3 py-4 font-mono-ui text-[10px] text-zinc-600">Sin proyectos. Crea el primero.</p>}
        </div>

        <div className="border-t border-white/10 p-3 space-y-1">
          <Link to="/templates" className="flex items-center gap-2 px-2 py-2 font-mono-ui text-xs text-zinc-400 hover:text-white" data-testid="sidebar-templates">
            <FolderOpen className="w-3.5 h-3.5" /> Plantillas
          </Link>
          <Link to="/settings" className="flex items-center gap-2 px-2 py-2 font-mono-ui text-xs text-zinc-400 hover:text-white" data-testid="sidebar-settings">
            <SettingsIcon className="w-3.5 h-3.5" /> Ajustes
          </Link>
          <div className="px-2 pt-3 border-t border-white/10 mt-3 font-mono-ui text-[10px] text-zinc-500 truncate">
            {user?.email}
          </div>
        </div>
      </aside>

      {/* CHAT COLUMN */}
      <section className="w-[420px] border-r border-white/10 bg-[#0a0a0a] flex flex-col" data-testid="workspace-chat">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="font-accent-label text-[9px] text-zinc-500">PROYECTO</span>
            <h2 className="font-serif-display text-xl truncate max-w-[260px]">{project?.name || "Sin proyecto"}</h2>
          </div>
          {project && <span className="font-mono-ui text-[10px] text-zinc-500">v{project.versions?.length || 1}</span>}
        </div>

        {/* AI Selector */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="font-accent-label text-[9px] text-zinc-500">AGENTES ACTIVOS</span>
            <button
              onClick={() => setUltra(!ultra)}
              data-testid="ultra-toggle"
              className={`font-accent-label text-[9px] px-2.5 py-1 transition-all ${ultra ? "bg-white text-black ultra-active" : "border border-white/30 text-zinc-300 hover:border-white"}`}
            >
              {ultra ? "● ULTRA ACTIVO" : "○ ACTIVAR ULTRA"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {AGENTS.map((a) => {
              const active = ultra || activeAIs.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => toggleAI(a.id)}
                  data-testid={`ai-toggle-${a.id}`}
                  disabled={ultra}
                  className={`group p-2.5 border text-left transition-colors ${active ? "" : "opacity-40 border-white/10"}`}
                  style={{ borderColor: active ? a.color : undefined, backgroundColor: active ? `${a.color}10` : undefined }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.color }} />
                    <span className="font-mono-ui text-[11px] font-bold" style={{ color: active ? a.color : "#888" }}>{a.name}</span>
                  </div>
                  <div className="font-mono-ui text-[9px] text-zinc-500 mt-1">{a.role}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${ultra && loading ? "ultra-active" : ""}`} data-testid="chat-messages">
          {!project && (
            <div className="h-full flex items-center justify-center text-center px-6">
              <div>
                <Sparkles className="w-8 h-8 text-zinc-700 mx-auto mb-4" strokeWidth={1.2} />
                <p className="font-mono-ui text-xs text-zinc-500">Crea un proyecto para empezar</p>
              </div>
            </div>
          )}
          {project?.messages?.length === 0 && (
            <div className="border border-white/10 p-4 fade-up">
              <span className="font-accent-label text-[9px] text-zinc-500">SISTEMA</span>
              <p className="font-mono-ui text-xs text-zinc-300 mt-2">Describe tu idea o pide cambios. Las IAs responderán según su rol.</p>
            </div>
          )}
          {project?.messages?.map((m, i) => {
            const agent = AGENTS.find((a) => a.id === m.ai);
            const isUser = m.role === "user";
            const isUltra = m.ai === "ultra";
            const isSystem = m.ai === "system";
            return (
              <div key={i} className={`fade-up ${isUser ? "ml-auto max-w-[85%]" : "max-w-[95%]"}`} style={{ animationDelay: `${i * 50}ms` }}>
                {isUser ? (
                  <div className="border-r-2 border-white pr-3 text-right">
                    <span className="font-accent-label text-[9px] text-zinc-500">TÚ</span>
                    <p className="font-mono-ui text-xs text-white mt-1">{m.content}</p>
                  </div>
                ) : (
                  <div className="border-l-2 pl-3" style={{ borderColor: isUltra ? "#fff" : isSystem ? "#888" : agent?.color || "#888" }}>
                    <span className="font-accent-label text-[9px]" style={{ color: isUltra ? "#fff" : isSystem ? "#888" : agent?.color || "#888" }}>
                      {isUltra ? "ULTRA" : isSystem ? "SISTEMA" : agent?.name?.toUpperCase() || "IA"}
                    </span>
                    <p className="font-mono-ui text-xs text-zinc-200 mt-1">{m.content}</p>
                  </div>
                )}
              </div>
            );
          })}
          {phaseStream.map((p, i) => (
            <div key={`p-${i}`} className="fade-up font-mono-ui text-[11px] text-zinc-500 pl-2 border-l border-zinc-700">
              › {p}
            </div>
          ))}
          {loading && phaseStream.length === 0 && <div className="font-mono-ui text-[11px] text-zinc-500 cursor-blink">› INICIALIZANDO</div>}
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 mb-2">
            <input ref={fileRef} type="file" onChange={handleFileUpload} className="hidden" accept=".xlsx,.csv,.pdf,.png,.jpg,.zip" />
            <button onClick={() => fileRef.current?.click()} data-testid="upload-btn" className="border border-white/15 hover:border-white p-2" title="Importar archivo">
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
            </button>
            <span className="font-mono-ui text-[9px] text-zinc-600">XLSX · PDF · ZIP · IMG</span>
          </div>
          <div className="border border-white/15 focus-within:border-white">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend(); }}
              placeholder="Crea una tienda de zapatillas con carrito y modo oscuro…"
              data-testid="chat-input"
              className="w-full bg-transparent p-3 font-mono-ui text-xs text-white placeholder:text-zinc-600 resize-none focus:outline-none"
              rows={3}
              disabled={!project || loading}
            />
            <div className="flex items-center justify-between px-3 py-2 border-t border-white/10">
              <span className="font-mono-ui text-[9px] text-zinc-600">⌘+ENTER · ENVIAR</span>
              <button onClick={handleSend} disabled={!project || loading || !input.trim()} data-testid="chat-send"
                className="font-accent-label text-[10px] px-3 py-1.5 bg-white text-black hover:bg-zinc-300 disabled:opacity-40 flex items-center gap-1.5">
                {loading ? "GENERANDO" : "ENVIAR"} <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PREVIEW + TECHNICAL */}
      <main className={`flex-1 flex ${ultra && loading ? "ultra-active" : ""}`}>
        <div className="flex-1 flex flex-col bg-[#050505]" data-testid="workspace-preview">
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              </div>
              <span className="ml-3 font-mono-ui text-[10px] text-zinc-500">PREVIEW · syncode.local/{project?.id?.slice(0, 8) || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowVersions(!showVersions)} data-testid="versions-btn" className="font-accent-label text-[9px] px-2 py-1 border border-white/15 hover:border-white flex items-center gap-1.5">
                <History className="w-3 h-3" /> v{project?.versions?.length || 0}
              </button>
              <button onClick={() => setShowTechnical(!showTechnical)} data-testid="technical-toggle" className="font-accent-label text-[9px] px-2 py-1 border border-white/15 hover:border-white flex items-center gap-1.5">
                <FileCode2 className="w-3 h-3" /> {showTechnical ? "OCULTAR" : "MOSTRAR"} TÉCNICO
              </button>
            </div>
          </div>

          {showVersions && project && (
            <div className="absolute top-[120px] right-72 z-30 w-72 bg-black border border-white/20 max-h-80 overflow-y-auto" data-testid="versions-panel">
              <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                <span className="font-accent-label text-[9px]">HISTORIAL</span>
                <button onClick={() => setShowVersions(false)}><X className="w-3 h-3 text-zinc-400" /></button>
              </div>
              {[...(project.versions || [])].reverse().map((v) => (
                <button key={v.version} onClick={() => restoreVersion(v.version)} data-testid={`version-${v.version}`}
                  className="w-full text-left px-3 py-2 hover:bg-white/5 border-b border-white/10 group">
                  <div className="font-mono-ui text-[11px] text-white">v{v.version} · {v.label}</div>
                  <div className="font-mono-ui text-[9px] text-zinc-500 mt-0.5">{new Date(v.created_at).toLocaleString("es-ES")}</div>
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 p-4">
            {project?.html_content ? (
              <iframe
                title="preview"
                srcDoc={project.html_content}
                className="w-full h-full bg-white rounded-lg"
                data-testid="preview-iframe"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="h-full border border-white/10 flex items-center justify-center">
                <div className="text-center">
                  <Eye className="w-8 h-8 text-zinc-700 mx-auto mb-3" strokeWidth={1.2} />
                  <p className="font-mono-ui text-xs text-zinc-500">La vista previa aparecerá aquí</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TECHNICAL PANEL */}
        {showTechnical && (
          <aside className="w-72 border-l border-white/10 bg-[#0a0a0a] flex flex-col" data-testid="technical-panel">
            <div className="px-4 py-3 border-b border-white/10">
              <span className="font-accent-label text-[9px] text-zinc-500">PANEL TÉCNICO</span>
            </div>

            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <FileCode2 className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-accent-label text-[9px] text-zinc-500">ESTRUCTURA</span>
              </div>
              <ul className="font-mono-ui text-[11px] text-zinc-300 space-y-1">
                <li>📁 {project?.name?.toLowerCase().replace(/\s+/g, "-") || "proyecto"}/</li>
                <li className="pl-4">📄 index.html</li>
                <li className="pl-4">📁 styles/</li>
                <li className="pl-8">📄 main.css</li>
                <li className="pl-4">📁 components/</li>
                <li className="pl-8">📄 Header.jsx</li>
                <li className="pl-8">📄 Hero.jsx</li>
                <li className="pl-8">📄 Footer.jsx</li>
              </ul>
            </div>

            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-accent-label text-[9px] text-zinc-500">BLOQUEO DE COMPONENTES</span>
              </div>
              <div className="space-y-1.5">
                {["header", "hero", "footer", "checkout"].map((c) => {
                  const locked = lockedComponents.includes(c);
                  return (
                    <button key={c} onClick={() => toggleLock(c)} data-testid={`lock-${c}`}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 border ${locked ? "border-amber-500/50 bg-amber-500/5 text-amber-400" : "border-white/10 text-zinc-400 hover:border-white/30"}`}>
                      <span className="font-mono-ui text-[11px]">{c}</span>
                      <span className="font-accent-label text-[9px]">{locked ? "● LOCK" : "○ FREE"}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-accent-label text-[9px] text-zinc-500">LOG TIEMPO REAL</span>
              </div>
              <div className="font-mono-ui text-[10px] space-y-1 text-zinc-400">
                <div className="text-emerald-400">› ChatGPT · listo</div>
                <div className="text-blue-400">› Copilot · listo</div>
                <div className="text-blue-300">› Gemini · listo</div>
                <div className="text-amber-400">› Grok · listo</div>
                {ultra && <div className="text-white cursor-blink">› ULTRA · sincronizado</div>}
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* NEW PROJECT MODAL */}
      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onCreate={handleNewProject} />}
    </div>
  );
}

function NewProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-6" data-testid="new-project-modal">
      <div className="w-full max-w-lg border border-white/20 bg-[#0a0a0a] p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="font-accent-label text-[10px] text-zinc-500">NUEVO PROYECTO</span>
            <h2 className="font-serif-display text-3xl mt-1">Da vida a tu idea</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-400 hover:text-white" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="font-accent-label text-[10px] text-zinc-500 block mb-2">NOMBRE</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi tienda online"
              data-testid="new-project-name"
              className="w-full bg-transparent border border-white/20 px-3 py-3 font-mono-ui text-sm focus:outline-none focus:border-white" />
          </div>
          <div>
            <label className="font-accent-label text-[10px] text-zinc-500 block mb-2">DESCRIBE TU PROYECTO</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Una tienda de zapatillas moderna con carrito, filtros, modo oscuro y traducción…"
              data-testid="new-project-prompt"
              rows={4}
              className="w-full bg-transparent border border-white/20 px-3 py-3 font-mono-ui text-sm focus:outline-none focus:border-white resize-none" />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 font-accent-label text-[10px] py-3 border border-white/20 hover:border-white">
            CANCELAR
          </button>
          <button onClick={async () => { setBusy(true); await onCreate(name, prompt); setBusy(false); }} disabled={busy || !name.trim()}
            data-testid="new-project-create"
            className="flex-1 font-accent-label text-[10px] py-3 bg-white text-black hover:bg-zinc-300 disabled:opacity-50">
            {busy ? "CREANDO…" : "CREAR PROYECTO"}
          </button>
        </div>
      </div>
    </div>
  );
}
