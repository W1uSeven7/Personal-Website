import re


class ValidationError(ValueError):
    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__("；".join(errors))


def get(data: dict, dotted_path: str):
    current = data
    for key in dotted_path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def is_blank(value) -> bool:
    return value is None or value == "" or value == [] or value == {}


def normalize_month(value: str) -> str:
    text = (value or "").strip()
    if text == "至今":
        return text

    match = re.match(r"^(\d{4})[.\-/年](\d{1,2})(?:月)?$", text)
    if not match:
        return text

    year = int(match.group(1))
    month = int(match.group(2))
    if not 1 <= month <= 12:
        return text
    return f"{year}.{month:02d}"


def month_to_number(value: str):
    normalized = normalize_month(value)
    if not normalized or normalized == "至今":
        return None

    match = re.match(r"^(\d{4})\.(\d{2})$", normalized)
    if not match:
        return None
    return int(match.group(1)) * 12 + int(match.group(2))


def is_valid_month_or_present(value: str) -> bool:
    normalized = normalize_month(value)
    return normalized == "至今" or bool(re.match(r"^\d{4}\.(0[1-9]|1[0-2])$", normalized))


def validate_time_range(label: str, start: str, end: str, errors: list[str]):
    if is_blank(start):
        errors.append(f"{label}开始时间不能为空")
        return
    if is_blank(end):
        errors.append(f"{label}结束时间不能为空")
        return

    if not is_valid_month_or_present(start):
        errors.append(f"{label}开始时间格式应为 YYYY.MM")
    if not is_valid_month_or_present(end):
        errors.append(f"{label}结束时间格式应为 YYYY.MM 或 至今")

    start_number = month_to_number(start)
    end_number = month_to_number(end)
    if start_number is not None and end_number is not None and end_number < start_number:
        errors.append(f"{label}：结束时间不能早于开始时间")


def validate_homepage_info(profile: dict):
    errors = []

    required_paths = [
        ("姓名", "profile.name"),
        ("一句话介绍", "profile.bio"),
        ("所在城市", "profile.location.text"),
        ("学校", "profile.school.text"),
        ("邮箱", "profile.email"),
        ("微信号", "profile.wechat_id"),
        ("自我介绍", "intro.summary"),
        ("教育学校", "education.school"),
        ("专业", "education.major"),
        ("学历", "education.degree"),
        ("项目经历", "projects"),
        ("简历入口", "resume.path"),
    ]

    for label, path in required_paths:
        if is_blank(get(profile, path)):
            errors.append(f"{label}不能为空")

    email = get(profile, "profile.email")
    if email and not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        errors.append("邮箱格式不正确")

    education = profile.get("education") or {}
    validate_time_range("教育经历", education.get("start"), education.get("end"), errors)

    internships = profile.get("internships") or []
    if len(internships) > 2:
        errors.append(f"实习经历最多 2 段，目前有 {len(internships)} 段")
    for index, item in enumerate(internships, start=1):
        if is_blank(item.get("company")):
            errors.append(f"第 {index} 段实习公司/组织不能为空")
        if is_blank(item.get("role")):
            errors.append(f"第 {index} 段实习岗位不能为空")
        validate_time_range(f"第 {index} 段实习经历", item.get("start"), item.get("end"), errors)
        bullets = item.get("bullets") or []
        if len(bullets) != 4:
            errors.append(f"第 {index} 段实习经历需要 4 条描述，目前有 {len(bullets)} 条")

    projects = profile.get("projects") or []
    if not 1 <= len(projects) <= 3:
        errors.append(f"项目经历至少 1 个、最多 3 个，目前有 {len(projects)} 个")
    for index, item in enumerate(projects, start=1):
        if is_blank(item.get("name")):
            errors.append(f"第 {index} 个项目名称不能为空")
        if is_blank(item.get("role")):
            errors.append(f"第 {index} 个项目角色不能为空")
        validate_time_range(f"第 {index} 个项目经历", item.get("start"), item.get("end"), errors)

        star = item.get("star") or {}
        for label, key in [
            ("项目背景", "situation"),
            ("你的任务", "task"),
            ("你做了什么", "action"),
            ("项目结果", "result"),
        ]:
            if is_blank(star.get(key)):
                errors.append(f"第 {index} 个项目的{label}不能为空")

    student_work = profile.get("student_work") or []
    for index, item in enumerate(student_work, start=1):
        if not item.get("role") or not item.get("content"):
            errors.append(f"学生工作 {index} 至少需要填写角色和描述")
        validate_time_range(f"学生工作 {index}", item.get("start"), item.get("end"), errors)

    skills = profile.get("skills") or []
    if not 3 <= len(skills) <= 6:
        errors.append(f"技能标签至少 3 个、最多 6 个，目前有 {len(skills)} 个")

    if errors:
        raise ValidationError(errors)
