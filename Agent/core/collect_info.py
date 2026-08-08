import base64
import json
from pathlib import Path

from .config import ALLOWED_IMAGE_EXTENSIONS


def parse_profile_from_request(raw_body: str) -> dict:
    try:
        profile = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise ValueError("提交的信息格式不正确，请刷新页面后重试。") from exc

    if not isinstance(profile, dict):
        raise ValueError("提交的信息格式不正确，请刷新页面后重试。")

    return profile


def safe_image_extension(filename: str, content_type: str = "") -> str:
    extension = Path(filename or "").suffix.lower()
    if extension in ALLOWED_IMAGE_EXTENSIONS:
        return ".jpg" if extension == ".jpeg" else extension

    content_type = (content_type or "").lower()
    if "png" in content_type:
        return ".png"
    if "webp" in content_type:
        return ".webp"
    if "gif" in content_type:
        return ".gif"
    return ".jpg"


def decode_upload(upload: dict) -> bytes:
    data_url = upload.get("data_url") or ""
    if "," not in data_url:
        raise ValueError("文件上传失败，请重新选择文件。")

    _, encoded = data_url.split(",", 1)
    try:
        return base64.b64decode(encoded)
    except Exception as exc:
        raise ValueError("文件上传内容无法解析，请重新选择文件。") from exc


def save_image_upload(images_dir: Path, upload: dict | None, basename: str) -> str | None:
    if not upload:
        return None

    extension = safe_image_extension(upload.get("filename", ""), upload.get("content_type", ""))
    filename = f"{basename}{extension}"
    target = images_dir / filename
    target.write_bytes(decode_upload(upload))
    return f"/images/{filename}"


def is_pdf_upload(upload: dict) -> bool:
    filename = (upload.get("filename") or "").lower()
    content_type = upload.get("content_type") or ""
    return filename.endswith(".pdf") and content_type == "application/pdf"


def save_pdf_upload(files_dir: Path, upload: dict | None) -> tuple[str, str] | None:
    if not upload:
        return None

    if not is_pdf_upload(upload):
        raise ValueError("仅支持上传 PDF 文件")

    filename = "resume_uploaded.pdf"
    target = files_dir / filename
    target.write_bytes(decode_upload(upload))
    return f"/files/{filename}", upload.get("filename") or "个人简历 PDF"


def apply_uploaded_assets(site_dir: Path, homepage: dict):
    uploads = homepage.pop("_uploads", {}) or {}

    images_dir = site_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    avatar_path = save_image_upload(images_dir, uploads.get("avatar"), "avatar_uploaded")
    if avatar_path:
        homepage.setdefault("profile", {})["avatar"] = avatar_path

    internship_logo_path = save_image_upload(images_dir, uploads.get("internship_logo"), "internship_logo_uploaded")
    if internship_logo_path and homepage.get("internships"):
        homepage["internships"][0]["logo"] = internship_logo_path

    project_image_path = save_image_upload(images_dir, uploads.get("project_image"), "project_1_uploaded")
    if project_image_path and homepage.get("projects"):
        homepage["projects"][0]["image"] = project_image_path

    files_dir = site_dir / "files"
    files_dir.mkdir(parents=True, exist_ok=True)
    resume_result = save_pdf_upload(files_dir, uploads.get("resume_pdf"))
    if resume_result:
        resume_path, original_filename = resume_result
        resume = homepage.setdefault("resume", {})
        resume["path"] = resume_path
        resume["uploaded_filename"] = original_filename


def apply_uploaded_images(site_dir: Path, homepage: dict):
    """Backward-compatible wrapper for older imports."""
    apply_uploaded_assets(site_dir, homepage)
