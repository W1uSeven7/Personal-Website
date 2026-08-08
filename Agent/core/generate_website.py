import os
import shutil
import subprocess
import time
from pathlib import Path

from .collect_info import apply_uploaded_images
from .config import GENERATED_DIR, ROOT_DIR
from .update_info import update_site_info


AGENT_AVATAR_STYLE = """

/* Agent preview: keep uploaded avatars circular even when source image is rectangular. */
.sidebar .author__avatar img {
  width: 175px;
  height: 175px;
  object-fit: cover;
  object-position: center;
  border-radius: 50%;
}
"""


def should_ignore(path: Path) -> bool:
    relative = path.relative_to(ROOT_DIR)
    parts = set(relative.parts)

    ignored_exact = {
        ".git",
        "_site",
        "Agent",
        "node_modules",
        ".bundle",
        ".vs",
        ".codex",
        ".agents",
    }

    if parts & ignored_exact:
        return True

    if len(relative.parts) >= 2 and relative.parts[0] == "vendor" and relative.parts[1] == "bundle":
        return True

    if path.name == ".env" or path.name.startswith(".env."):
        return True

    return False


def copy_template_site(target_dir: Path):
    target_dir.mkdir(parents=True, exist_ok=True)

    for current_root, dirs, files in os.walk(ROOT_DIR):
        current_path = Path(current_root)

        dirs[:] = [
            dirname
            for dirname in dirs
            if not should_ignore(current_path / dirname)
        ]

        if should_ignore(current_path):
            continue

        for filename in files:
            source = current_path / filename
            if should_ignore(source):
                continue

            relative = source.relative_to(ROOT_DIR)
            target = target_dir / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)


def apply_agent_preview_styles(site_dir: Path):
    main_scss = site_dir / "assets" / "css" / "main.scss"
    if not main_scss.exists():
        return

    content = main_scss.read_text(encoding="utf-8")
    if "Agent preview: keep uploaded avatars circular" in content:
        return

    main_scss.write_text(content.rstrip() + AGENT_AVATAR_STYLE, encoding="utf-8")


def build_jekyll_site(site_dir: Path):
    result = subprocess.run(
        "bundle exec jekyll build",
        cwd=site_dir,
        shell=True,
        text=True,
        capture_output=True,
        timeout=180,
    )

    if result.returncode != 0:
        raise RuntimeError(
            "主页模板构建失败，请检查本地 Jekyll 环境。\n"
            f"STDOUT:\n{result.stdout}\n"
            f"STDERR:\n{result.stderr}"
        )


def generate_real_template_site(homepage: dict) -> dict:
    site_id = time.strftime("%Y%m%d-%H%M%S")
    target_root = GENERATED_DIR / site_id
    site_dir = target_root / "site"
    preview_baseurl = f"/generated/{site_id}/site/_site"

    copy_template_site(site_dir)
    apply_agent_preview_styles(site_dir)
    apply_uploaded_images(site_dir, homepage)
    update_site_info(site_dir, homepage, preview_baseurl)
    build_jekyll_site(site_dir)

    return {
        "site_id": site_id,
        "preview_url": f"{preview_baseurl}/",
    }
