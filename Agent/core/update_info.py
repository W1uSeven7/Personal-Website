from pathlib import Path

from .config import TEMPLATE_PATH


def load_yaml_tools():
    try:
        import yaml
    except ImportError as exc:
        raise RuntimeError("缺少 YAML 处理依赖，请先安装项目依赖。") from exc
    return yaml


def render_about_template(homepage: dict) -> str:
    try:
        from jinja2 import Environment, FileSystemLoader, select_autoescape
    except ImportError as exc:
        raise RuntimeError("缺少页面模板渲染依赖，请先安装项目依赖。") from exc

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_PATH.parent)),
        autoescape=select_autoescape(default=False),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    template = env.get_template(TEMPLATE_PATH.name)
    return template.render(**homepage)


def write_profile(site_dir: Path, homepage: dict):
    yaml = load_yaml_tools()
    profile_path = site_dir / "Agent" / "profile.yml"
    profile_path.parent.mkdir(parents=True, exist_ok=True)
    profile_path.write_text(
        yaml.safe_dump(homepage, allow_unicode=True, sort_keys=False, width=1000),
        encoding="utf-8",
    )


def update_about_page(site_dir: Path, homepage: dict):
    about_markdown = render_about_template(homepage)
    about_path = site_dir / "_pages" / "about.md"
    about_path.parent.mkdir(parents=True, exist_ok=True)
    about_path.write_text(about_markdown, encoding="utf-8")


def update_config(config_path: Path, homepage: dict, preview_baseurl: str):
    yaml = load_yaml_tools()
    data = yaml.safe_load(config_path.read_text(encoding="utf-8")) or {}
    profile = homepage.get("profile") or {}

    data["name"] = profile.get("name") or data.get("name")
    data["url"] = ""
    data["baseurl"] = preview_baseurl

    author = data.get("author") or {}
    author["name"] = profile.get("name") or author.get("name")
    avatar = profile.get("avatar") or "/images/avatar.jpg"
    author["avatar"] = avatar.replace("\\", "/").split("/")[-1]
    author["bio"] = profile.get("bio") or author.get("bio")
    author["location"] = (profile.get("location") or {}).get("text") or author.get("location")
    author["employer"] = (profile.get("school") or {}).get("text") or author.get("employer")
    author["email"] = profile.get("email") or author.get("email")

    github = profile.get("github") or ""
    if github.startswith("https://github.com/"):
        author["github"] = github.rstrip("/").split("/")[-1]
    elif github:
        author["github"] = github

    author["WeChat"] = "/images/wechat_qr.jpg"
    data["author"] = author

    config_path.write_text(
        yaml.safe_dump(data, allow_unicode=True, sort_keys=False, width=1000),
        encoding="utf-8",
    )


def update_site_info(site_dir: Path, homepage: dict, preview_baseurl: str):
    write_profile(site_dir, homepage)
    update_about_page(site_dir, homepage)

    config_path = site_dir / "_config.yml"
    if config_path.exists():
        update_config(config_path, homepage, preview_baseurl)
