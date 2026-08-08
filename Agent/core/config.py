from pathlib import Path


AGENT_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = AGENT_DIR.parent
WEB_DIR = AGENT_DIR / "web"
TEMPLATE_PATH = AGENT_DIR / "templates" / "about.md.j2"
GENERATED_DIR = AGENT_DIR / "generated"
ENV_PATHS = [AGENT_DIR / ".env", ROOT_DIR / ".env"]

HOST = "127.0.0.1"
PORT = 8000

DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
