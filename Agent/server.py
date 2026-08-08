import json
from copy import deepcopy
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlparse

from core.ai_summary import generate_homepage_summaries, load_env_files
from core.check_info import ValidationError, validate_homepage_info
from core.collect_info import parse_profile_from_request
from core.config import AGENT_DIR, HOST, PORT, WEB_DIR
from core.generate_website import generate_real_template_site


class AgentRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def translate_path(self, path):
        parsed_path = unquote(urlparse(path).path)

        if parsed_path == "/":
            return str(WEB_DIR / "index.html")

        if parsed_path.startswith("/generated/"):
            return str(AGENT_DIR / parsed_path.lstrip("/"))

        return str(WEB_DIR / parsed_path.lstrip("/"))

    def send_json(self, status_code: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/api/generate-homepage":
            self.send_json(404, {"message": "接口不存在"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length).decode("utf-8")

            profile = parse_profile_from_request(raw_body)
            validate_homepage_info(profile)

            homepage = generate_homepage_summaries(deepcopy(profile))
            generated = generate_real_template_site(homepage)

            self.send_json(200, {"homepage": homepage, **generated})
        except ValidationError as exc:
            self.send_json(400, {"message": "信息填写不完整", "errors": exc.errors})
        except Exception as exc:
            self.send_json(500, {"message": str(exc)})


def main():
    load_env_files()
    server = ThreadingHTTPServer((HOST, PORT), AgentRequestHandler)
    print(f"AI 个人主页生成器已启动：http://{HOST}:{PORT}")
    print("按 Ctrl+C 停止服务。")
    server.serve_forever()


if __name__ == "__main__":
    main()
