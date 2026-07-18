from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr


# ---- DB ----
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---- App ----
app = FastAPI(title="SynCode AI API")
api = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"


# ============== Models ==============
class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str = "user"
    created_at: datetime


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=80)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChatMessage(BaseModel):
    role: str  # user | assistant | system
    content: str
    ai: Optional[str] = None  # chatgpt | copilot | gemini | grok | ultra | system
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProjectCreate(BaseModel):
    name: str
    prompt: str = ""
    template: Optional[str] = None


class Project(BaseModel):
    id: str
    user_id: str
    name: str
    prompt: str
    template: Optional[str] = None
    html_content: str = ""
    ai_active: List[str] = Field(default_factory=lambda: ["chatgpt", "copilot", "gemini", "grok"])
    ultra_mode: bool = False
    locked_components: List[str] = Field(default_factory=list)
    messages: List[ChatMessage] = Field(default_factory=list)
    versions: List[dict] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ChatRequest(BaseModel):
    project_id: str
    message: str
    active_ais: List[str] = Field(default_factory=lambda: ["chatgpt", "copilot", "gemini", "grok"])
    ultra_mode: bool = False


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    html_content: Optional[str] = None
    ai_active: Optional[List[str]] = None
    ultra_mode: Optional[bool] = None
    locked_components: Optional[List[str]] = None


# ============== Auth helpers ==============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )


def public_user(doc: dict) -> dict:
    return {
        "id": doc["id"],
        "email": doc["email"],
        "name": doc["name"],
        "role": doc.get("role", "user"),
        "created_at": doc["created_at"],
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


# ============== Mock AI Generation ==============
AI_PERSONAS = {
    "chatgpt": {"name": "ChatGPT", "role": "Razonamiento estratégico", "color": "#10A37F"},
    "copilot": {"name": "Copilot", "role": "Programación de élite", "color": "#007AFF"},
    "gemini": {"name": "Gemini", "role": "Búsqueda y datos", "color": "#3B82F6"},
    "grok": {"name": "Grok", "role": "Creatividad y revisión", "color": "#F59E0B"},
}


SECTOR_TEMPLATES = [
    {"id": "ecommerce", "name": "Tienda Online", "category": "ecommerce", "description": "Catálogo, carrito, checkout y filtros.", "icon": "ShoppingBag"},
    {"id": "restaurant", "name": "Restaurante", "category": "hospitality", "description": "Menú, reservas y galería de platos.", "icon": "UtensilsCrossed"},
    {"id": "portfolio", "name": "Portfolio Creativo", "category": "personal", "description": "Vitrina de trabajos y contacto.", "icon": "Palette"},
    {"id": "saas", "name": "Landing SaaS", "category": "saas", "description": "Hero, features, pricing y testimonios.", "icon": "Rocket"},
    {"id": "dashboard", "name": "Panel Admin", "category": "dashboard", "description": "Métricas, tablas y gráficas.", "icon": "BarChart3"},
    {"id": "barber", "name": "Barbería", "category": "services", "description": "Servicios, equipo y reservas.", "icon": "Scissors"},
    {"id": "realestate", "name": "Inmobiliaria", "category": "services", "description": "Listings, mapas y filtros.", "icon": "Home"},
    {"id": "academy", "name": "Academia", "category": "education", "description": "Cursos, profesores e inscripciones.", "icon": "GraduationCap"},
]


def mock_generate_html(prompt: str, template: Optional[str] = None, ultra: bool = False) -> str:
    """Generates a beautiful sample HTML based on prompt + template."""
    title = prompt.strip()[:60] or (template or "Proyecto SynCode")
    accent = "#FFFFFF" if ultra else "#10A37F"
    template_block = ""
    if template == "ecommerce":
        template_block = """
        <section class="grid">
          <div class="card"><div class="img" style="background:linear-gradient(135deg,#1a1a1a,#2a2a2a)"></div><h3>Air Runner X</h3><p>$129.00</p></div>
          <div class="card"><div class="img" style="background:linear-gradient(135deg,#0f3a2a,#1a5a3f)"></div><h3>Trail Pro Verde</h3><p>$159.00</p></div>
          <div class="card"><div class="img" style="background:linear-gradient(135deg,#3a1a1a,#5a2a2a)"></div><h3>Urban Classic</h3><p>$99.00</p></div>
          <div class="card"><div class="img" style="background:linear-gradient(135deg,#2a2a3a,#3a3a5a)"></div><h3>Court Elite</h3><p>$179.00</p></div>
        </section>
        """
    elif template == "restaurant":
        template_block = """
        <section class="grid">
          <div class="card"><h3>Risotto Trufa Negra</h3><p>Especialidad de la casa</p></div>
          <div class="card"><h3>Ribeye 400gr</h3><p>Maduración 30 días</p></div>
          <div class="card"><h3>Tarta de Limón</h3><p>Postre de autor</p></div>
        </section>
        """
    elif template == "saas":
        template_block = """
        <section class="features">
          <div class="card"><h3>Velocidad</h3><p>Despliegue en minutos.</p></div>
          <div class="card"><h3>Seguridad</h3><p>Cifrado de extremo a extremo.</p></div>
          <div class="card"><h3>Escalabilidad</h3><p>Crece sin límites.</p></div>
        </section>
        """
    else:
        template_block = """
        <section class="hero-secondary">
          <p>Construido con IAs colaborando en tiempo real.</p>
        </section>
        """

    return f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{title}</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Inter', system-ui, sans-serif; background:#0a0a0a; color:#fff; line-height:1.6; }}
  .nav {{ display:flex; justify-content:space-between; align-items:center; padding: 24px 48px; border-bottom: 1px solid #222; }}
  .brand {{ font-weight: 800; letter-spacing: -0.02em; font-size: 20px; }}
  .nav a {{ color:#aaa; text-decoration:none; margin-left: 24px; font-size:14px; }}
  .hero {{ padding: 96px 48px; text-align:left; max-width: 1200px; }}
  .hero h1 {{ font-size: 72px; font-weight: 800; letter-spacing: -0.04em; line-height:1.05; }}
  .hero p {{ margin-top: 24px; color:#aaa; max-width:560px; font-size:18px; }}
  .btn {{ display:inline-block; margin-top:32px; padding:14px 28px; background:{accent}; color:#000; font-weight:700; text-decoration:none; }}
  .grid {{ display:grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap:1px; background:#222; padding:1px; }}
  .card {{ background:#0f0f0f; padding:24px; }}
  .card .img {{ width:100%; height:200px; margin-bottom:16px; }}
  .card h3 {{ font-size:18px; margin-bottom:8px; }}
  .card p {{ color:#888; font-size:14px; }}
  .features {{ display:grid; grid-template-columns: repeat(3,1fr); gap:24px; padding: 48px; }}
  .hero-secondary {{ padding: 48px; color:#aaa; border-top:1px solid #222; }}
  footer {{ padding: 48px; border-top: 1px solid #222; color:#666; font-size:13px; }}
</style></head>
<body>
  <nav class="nav">
    <div class="brand">{title}</div>
    <div><a href="#">Inicio</a><a href="#">Productos</a><a href="#">Contacto</a></div>
  </nav>
  <section class="hero">
    <h1>{title}</h1>
    <p>Generado por SynCode AI usando una arquitectura multi‑modelo. Edita cualquier sección con instrucciones en lenguaje natural.</p>
    <a href="#" class="btn">Comenzar</a>
  </section>
  {template_block}
  <footer>© {datetime.now().year} {title} · Construido con SynCode AI</footer>
</body></html>"""


def synthesize_chat_response(message: str, active_ais: List[str], ultra: bool) -> dict:
    """Returns mock multi-AI conversation steps + final code."""
    steps = []
    if ultra:
        steps.append({"ai": "system", "content": "Activando modo ULTRA · sincronizando 4 modelos…", "phase": "boot"})
        steps.append({"ai": "chatgpt", "content": "Analizo la estructura óptima del proyecto y propongo arquitectura por componentes.", "phase": "analyze"})
        steps.append({"ai": "gemini", "content": "Recopilo referencias de UX para la categoría solicitada y ajusto patrones.", "phase": "research"})
        steps.append({"ai": "copilot", "content": "Genero el HTML/CSS modular siguiendo el plan acordado.", "phase": "code"})
        steps.append({"ai": "grok", "content": "Reviso accesibilidad, claridad visual y propongo micro mejoras.", "phase": "review"})
        steps.append({"ai": "ultra", "content": "Consenso alcanzado. Desplegando vista previa.", "phase": "done"})
    else:
        if "chatgpt" in active_ais:
            steps.append({"ai": "chatgpt", "content": "He estructurado el proyecto en secciones: nav, hero, contenido y footer.", "phase": "analyze"})
        if "gemini" in active_ais:
            steps.append({"ai": "gemini", "content": "Datos de mercado integrados. Estilo aplicado.", "phase": "research"})
        if "copilot" in active_ais:
            steps.append({"ai": "copilot", "content": "Código generado y compilado. Listo para vista previa.", "phase": "code"})
        if "grok" in active_ais:
            steps.append({"ai": "grok", "content": "Revisión final aprobada · 0 problemas detectados.", "phase": "review"})
    return {"steps": steps}


# ============== Routes: Auth ==============
@api.post("/auth/register")
async def register(payload: RegisterRequest, response: Response):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    user_resp = {**user, "created_at": datetime.fromisoformat(user["created_at"])}
    token = create_access_token(user["id"], email)
    set_auth_cookie(response, token)
    return {"user": public_user(user_resp), "access_token": token}


@api.post("/auth/login")
async def login(payload: LoginRequest, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    token = create_access_token(user["id"], email)
    set_auth_cookie(response, token)
    user_resp = {**user, "created_at": datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]}
    return {"user": public_user(user_resp), "access_token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    user_resp = {**user, "created_at": datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]}
    return public_user(user_resp)


# ============== Routes: Projects ==============
@api.post("/projects")
async def create_project(payload: ProjectCreate, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    initial_html = mock_generate_html(payload.prompt or payload.name, payload.template)
    project = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": payload.name,
        "prompt": payload.prompt or "",
        "template": payload.template,
        "html_content": initial_html,
        "ai_active": ["chatgpt", "copilot", "gemini", "grok"],
        "ultra_mode": False,
        "locked_components": [],
        "messages": [],
        "versions": [{"version": 1, "html": initial_html, "label": "Inicial", "created_at": now}],
        "created_at": now,
        "updated_at": now,
    }
    await db.projects.insert_one(project)
    project.pop("_id", None)
    return project


@api.get("/projects")
async def list_projects(user: dict = Depends(get_current_user)):
    projects = await db.projects.find({"user_id": user["id"]}, {"_id": 0}).sort("updated_at", -1).to_list(200)
    # Light list for sidebar
    return [
        {"id": p["id"], "name": p["name"], "template": p.get("template"), "updated_at": p["updated_at"]}
        for p in projects
    ]


@api.get("/projects/{project_id}")
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id, "user_id": user["id"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return project


@api.patch("/projects/{project_id}")
async def update_project(project_id: str, payload: ProjectUpdate, user: dict = Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Sin cambios")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.projects.update_one({"id": project_id, "user_id": user["id"]}, {"$set": update})
    project = await db.projects.find_one({"id": project_id, "user_id": user["id"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return project


@api.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    res = await db.projects.delete_one({"id": project_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return {"ok": True}


# ============== Routes: Chat / Generation ==============
@api.post("/chat")
async def chat(payload: ChatRequest, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": payload.project_id, "user_id": user["id"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    now_iso = datetime.now(timezone.utc).isoformat()
    user_msg = {"role": "user", "content": payload.message, "ai": None, "timestamp": now_iso}
    response = synthesize_chat_response(payload.message, payload.active_ais, payload.ultra_mode)

    # Generate new HTML version (simulation)
    new_html = mock_generate_html(payload.message, project.get("template"), payload.ultra_mode)
    versions = project.get("versions", [])
    new_version = {
        "version": len(versions) + 1,
        "html": new_html,
        "label": payload.message[:48],
        "created_at": now_iso,
    }

    ai_msgs = [
        {"role": "assistant", "content": s["content"], "ai": s["ai"], "phase": s.get("phase"), "timestamp": now_iso}
        for s in response["steps"]
    ]

    new_messages = project.get("messages", []) + [user_msg] + ai_msgs

    await db.projects.update_one(
        {"id": payload.project_id, "user_id": user["id"]},
        {"$set": {
            "messages": new_messages,
            "html_content": new_html,
            "ultra_mode": payload.ultra_mode,
            "ai_active": payload.active_ais,
            "updated_at": now_iso,
        }, "$push": {"versions": new_version}},
    )

    return {
        "steps": response["steps"],
        "html_content": new_html,
        "version": new_version,
    }


@api.post("/projects/{project_id}/restore/{version}")
async def restore_version(project_id: str, version: int, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id, "user_id": user["id"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    target = next((v for v in project["versions"] if v["version"] == version), None)
    if not target:
        raise HTTPException(status_code=404, detail="Versión no encontrada")
    await db.projects.update_one(
        {"id": project_id, "user_id": user["id"]},
        {"$set": {"html_content": target["html"], "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True, "html_content": target["html"]}


# ============== Routes: Templates / Misc ==============
@api.get("/templates")
async def get_templates():
    return SECTOR_TEMPLATES


@api.get("/ai-agents")
async def get_agents():
    return [
        {"id": k, **v} for k, v in AI_PERSONAS.items()
    ]


@api.get("/")
async def root():
    return {"service": "SynCode AI", "status": "online"}


# ============== Startup ==============
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.projects.create_index([("user_id", 1), ("updated_at", -1)])

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@syncode.ai").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "syncode2026")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ---- Mount router + CORS ----
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("syncode")
