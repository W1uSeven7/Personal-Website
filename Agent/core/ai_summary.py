import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .config import DEEPSEEK_API_URL, DEEPSEEK_MODEL, ENV_PATHS


SUMMARY_PROMPT = (
    "你是一个面向 AI 产品岗求职的个人主页文案助手。"
    "请根据用户提供的经历描述，生成一到两句话的主页展示 summary。"
    "写作目标：让面试官快速看出用户的角色、关键动作、项目价值或结果。"
    "表达要求：具体、自然、有产品感，不要像流水账，不要只是压缩原文。"
    "避免使用“提升了能力”“积累了经验”“打下基础”等空泛表述。"
    "字数控制在 40 到 80 个中文字符。只输出 summary 本文，不要输出标题、解释或引号。"
)


def load_env_file(path):
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue

        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        if key and key not in os.environ:
            os.environ[key] = value


def load_env_files():
    for path in ENV_PATHS:
        load_env_file(path)


def call_deepseek(user_prompt: str) -> str:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise RuntimeError("缺少生成服务密钥，请先完成本地配置。")

    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": SUMMARY_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.35,
        "stream": False,
    }

    request = Request(
        DEEPSEEK_API_URL,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=40) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"AI 生成失败：HTTP {exc.code} {body}") from exc
    except URLError as exc:
        raise RuntimeError(f"AI 生成服务暂时不可用：{exc.reason}") from exc

    try:
        summary = result["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("AI 返回内容异常，请稍后重试。") from exc

    return summary.strip(" \n\r\t\"“”")


def build_internship_prompt(item: dict) -> str:
    bullets = item.get("bullets") or []
    return "\n".join(
        [
            "经历类型：实习经历",
            f"公司/组织：{item.get('company', '')}",
            f"岗位：{item.get('role', '')}",
            "写作倾向：突出业务流程理解、AI 工具使用、需求梳理、效率提升或产品落地价值。",
            "经历描述：",
            *[f"{index}. {bullet}" for index, bullet in enumerate(bullets, start=1)],
        ]
    )


def build_project_prompt(item: dict) -> str:
    star = item.get("star") or {}
    return "\n".join(
        [
            "经历类型：项目经历",
            f"项目名称：{item.get('name', '')}",
            f"角色：{item.get('role', '')}",
            "写作倾向：突出从问题发现、需求分析、原型/开发到 MVP 交付的完整过程，体现产品思维。",
            "经历描述：",
            f"1. 项目背景：{star.get('situation', '')}",
            f"2. 我的任务：{star.get('task', '')}",
            f"3. 我做了什么：{star.get('action', '')}",
            f"4. 项目结果：{star.get('result', '')}",
        ]
    )


def generate_homepage_summaries(homepage: dict) -> dict:
    internships = homepage.get("internships") or []
    for item in internships:
        if item.get("company") or item.get("role") or item.get("bullets"):
            item["summary"] = call_deepseek(build_internship_prompt(item))

    projects = homepage.get("projects") or []
    for item in projects:
        item["summary"] = call_deepseek(build_project_prompt(item))

    return homepage
