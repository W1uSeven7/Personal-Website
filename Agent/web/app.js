const form = document.querySelector("#homepageForm");
const validationBox = document.querySelector("#validationBox");
const generateButton = document.querySelector("#generateButton");
const resumePdfInput = document.querySelector("#resumePdfInput");
const resumeFileName = document.querySelector("#resumeFileName");
const resumeUploadStatus = document.querySelector("#resumeUploadStatus");

const PRESENT_TEXT = "至今";
const TIME_RANGE_ERROR = "结束时间不能早于开始时间";

function getValue(formData, key) {
  return (formData.get(key) || "").toString().trim();
}

function getFile(formData, key) {
  const file = formData.get(key);
  if (!(file instanceof File) || !file.name || file.size === 0) {
    return null;
  }
  return file;
}

function isPdfFile(file) {
  const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf");
  const hasPdfMimeType = file.type === "application/pdf";
  return hasPdfExtension && hasPdfMimeType;
}

function readUpload(formData, key, options = {}) {
  const file = getFile(formData, key);
  if (!file) {
    return Promise.resolve(null);
  }

  if (options.validate && !options.validate(file)) {
    return Promise.reject(new Error(options.errorMessage || "文件格式不正确"));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        filename: file.name,
        content_type: file.type,
        data_url: reader.result,
      });
    };
    reader.onerror = () => reject(new Error(`${file.name} 读取失败，请重新选择文件。`));
    reader.readAsDataURL(file);
  });
}

async function collectUploads(formData) {
  const [avatar, internshipLogo, projectImage, resumePdf] = await Promise.all([
    readUpload(formData, "avatarFile"),
    readUpload(formData, "internLogoFile"),
    readUpload(formData, "projectImageFile"),
    readUpload(formData, "resumePdfFile", {
      validate: isPdfFile,
      errorMessage: "仅支持上传 PDF 文件",
    }),
  ]);

  return {
    avatar,
    internship_logo: internshipLogo,
    project_image: projectImage,
    resume_pdf: resumePdf,
  };
}

function normalizeSentence(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return "";
  return /[。？！?!]$/.test(trimmed) ? trimmed : `${trimmed}。`;
}

function buildEducationDescription(formData) {
  const gpa = getValue(formData, "gpa");
  const rank = getValue(formData, "rank");
  const majorCourses = getValue(formData, "majorCourses");
  const parts = [];

  if (gpa) parts.push(`GPA: ${gpa}`);
  if (rank) parts.push(`Rank: ${rank}`);

  const prefix = parts.join(", ");
  const courseText = majorCourses ? `主修课程: ${normalizeSentence(majorCourses)}` : "";

  if (prefix && courseText) return `${prefix}; ${courseText}`;
  if (prefix) return prefix;
  return courseText;
}

function parseEducationDescription(description) {
  const text = (description || "").trim();
  if (!text) return { gpa: "", rank: "", majorCourses: "" };

  const gpaMatch = text.match(/GPA[:：]\s*([^,，;；]+)/i);
  const rankMatch = text.match(/Rank[:：]\s*([^,，;；]+)/i);
  const courseMatch =
    text.match(/主修课程[:：]\s*(.+)$/i) ||
    text.match(/课程(?:包括|：|:)\s*(.+)$/i);

  return {
    gpa: gpaMatch ? gpaMatch[1].trim() : "",
    rank: rankMatch ? rankMatch[1].trim() : "",
    majorCourses: courseMatch ? courseMatch[1].trim().replace(/[。.]$/, "") : "",
  };
}

function initializeEducationFields() {
  const source = form.elements.eduDescSource?.value || "";
  const parsed = parseEducationDescription(source);

  if (form.elements.gpa && !form.elements.gpa.value) {
    form.elements.gpa.value = parsed.gpa;
  }

  if (form.elements.rank && !form.elements.rank.value) {
    const allowedRanks = Array.from(form.elements.rank.options).map((option) => option.value);
    if (allowedRanks.includes(parsed.rank)) {
      form.elements.rank.value = parsed.rank;
    }
  }

  if (form.elements.majorCourses && !form.elements.majorCourses.value) {
    form.elements.majorCourses.value = parsed.majorCourses;
  }
}

function normalizeMonthValue(value) {
  const text = (value || "").toString().trim();
  if (!text) return "";
  if (text === PRESENT_TEXT) return PRESENT_TEXT;

  const match = text.match(/^(\d{4})[.\-/年](\d{1,2})(?:月)?$/);
  if (!match) return text;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return text;
  return `${year}.${String(month).padStart(2, "0")}`;
}

function monthToNumber(value) {
  const normalized = normalizeMonthValue(value);
  if (!normalized || normalized === PRESENT_TEXT) return null;

  const match = normalized.match(/^(\d{4})\.(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 12 + Number(match[2]);
}

function isEndBeforeStart(start, end) {
  const startNumber = monthToNumber(start);
  const endNumber = monthToNumber(end);
  return startNumber !== null && endNumber !== null && endNumber < startNumber;
}

function validateTimeRange(start, end) {
  if (!start || !end || end === PRESENT_TEXT) return "";
  return isEndBeforeStart(start, end) ? TIME_RANGE_ERROR : "";
}

function getTimeRangeErrors(profile) {
  const errors = [];

  const ranges = [
    ["教育经历", profile.education.start, profile.education.end],
    ...profile.internships.map((item, index) => [`实习经历 ${index + 1}`, item.start, item.end]),
    ...profile.projects.map((item, index) => [`项目经历 ${index + 1}`, item.start, item.end]),
    ...profile.student_work.map((item, index) => [`学生工作 ${index + 1}`, item.start, item.end]),
  ];

  ranges.forEach(([label, start, end]) => {
    const message = validateTimeRange(start, end);
    if (message) errors.push(`${label}：${message}`);
  });

  return errors;
}

function buildProfile(formData) {
  const internship = {
    company: getValue(formData, "internCompany"),
    role: getValue(formData, "internRole"),
    start: normalizeMonthValue(getValue(formData, "internStart")),
    end: normalizeMonthValue(getValue(formData, "internEnd")),
    summary: "",
    bullets: [
      getValue(formData, "internBullet1"),
      getValue(formData, "internBullet2"),
      getValue(formData, "internBullet3"),
      getValue(formData, "internBullet4"),
    ].filter(Boolean),
  };
  const internships = internship.company || internship.role || internship.bullets.length > 0
    ? [internship]
    : [];

  const awards = [
    {
      date: normalizeMonthValue(getValue(formData, "awardDate1")),
      content: getValue(formData, "awardContent1"),
    },
    {
      date: normalizeMonthValue(getValue(formData, "awardDate2")),
      content: getValue(formData, "awardContent2"),
    },
  ].filter((award) => award.date || award.content);

  const studentWork = [
    {
      start: normalizeMonthValue(getValue(formData, "workStart1")),
      end: normalizeMonthValue(getValue(formData, "workEnd1")),
      role: getValue(formData, "workRole1"),
      organization: getValue(formData, "workOrg1"),
      content: getValue(formData, "workContent1"),
    },
  ].filter((item) => item.role || item.content || item.organization);

  const skills = [
    {
      name: getValue(formData, "skill1"),
      description: getValue(formData, "skillDesc1"),
      tags: [getValue(formData, "skill1")].filter(Boolean),
    },
    {
      name: getValue(formData, "skill2"),
      description: getValue(formData, "skillDesc2"),
      tags: [getValue(formData, "skill2")].filter(Boolean),
    },
    {
      name: getValue(formData, "skill3"),
      description: getValue(formData, "skillDesc3"),
      tags: [getValue(formData, "skill3")].filter(Boolean),
    },
  ].filter((skill) => skill.name);

  const selfIntro = getValue(formData, "selfIntro");

  return {
    profile: {
      name: getValue(formData, "name"),
      avatar: "/images/avatar.jpg",
      bio: getValue(formData, "bio"),
      location: {
        text: getValue(formData, "location"),
        url: "https://gaode.com/place/B0017875LP",
      },
      school: {
        text: getValue(formData, "school"),
        url: "https://www.swu.edu.cn/",
      },
      email: getValue(formData, "email"),
      wechat_id: getValue(formData, "wechatId"),
      github: getValue(formData, "github"),
      blog: getValue(formData, "blog"),
    },
    intro: {
      // 后端模板仍读取 intro.greeting 和 intro.summary。
      // 新表单只暴露“自我介绍”，因此这里保留固定开场标题，并将自我介绍映射到 summary。
      greeting: "你好👋 欢迎来到我的主页！",
      summary: selfIntro ? [selfIntro] : [],
    },
    education: {
      school: getValue(formData, "eduSchool"),
      major: getValue(formData, "major"),
      degree: getValue(formData, "degree"),
      start: normalizeMonthValue(getValue(formData, "eduStart")),
      end: normalizeMonthValue(getValue(formData, "eduEnd")),
      description: buildEducationDescription(formData),
    },
    internships,
    projects: [
      {
        name: getValue(formData, "projectName"),
        role: getValue(formData, "projectRole"),
        start: normalizeMonthValue(getValue(formData, "projectStart")),
        end: normalizeMonthValue(getValue(formData, "projectEnd")),
        image: "/images/project_1.png",
        summary: "",
        links: {
          project: "",
          code: getValue(formData, "projectCode"),
        },
        star: {
          situation: getValue(formData, "situation"),
          task: getValue(formData, "task"),
          action: getValue(formData, "action"),
          result: getValue(formData, "result"),
        },
      },
    ],
    awards,
    student_work: studentWork,
    skills,
    resume: {
      label: getValue(formData, "resumeLabel") || "个人简历 PDF",
      path: "/files/resume.pdf",
    },
  };
}

function validateProfile(profile, formData) {
  const errors = [];
  const requiredPairs = [
    ["姓名", profile.profile.name],
    ["一句话介绍", profile.profile.bio],
    ["所在城市", profile.profile.location.text],
    ["学校", profile.profile.school.text],
    ["邮箱", profile.profile.email],
    ["微信号", profile.profile.wechat_id],
    ["自我介绍", profile.intro.summary[0]],
    ["教育学校", profile.education.school],
    ["专业", profile.education.major],
    ["学历", profile.education.degree],
    ["教育开始时间", profile.education.start],
    ["教育结束时间", profile.education.end],
    ["项目名称", profile.projects[0].name],
    ["项目角色", profile.projects[0].role],
    ["项目开始时间", profile.projects[0].start],
    ["项目结束时间", profile.projects[0].end],
  ];

  requiredPairs.forEach(([label, value]) => {
    if (!value) errors.push(`${label}不能为空`);
  });

  if (profile.profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.profile.email)) {
    errors.push("邮箱格式不正确");
  }

  const resumePdf = getFile(formData, "resumePdfFile");
  if (resumePdf && !isPdfFile(resumePdf)) {
    errors.push("仅支持上传 PDF 文件");
  }

  const internship = profile.internships[0];
  if (internship) {
    if (!internship.company) errors.push("实习公司/组织不能为空");
    if (!internship.role) errors.push("实习岗位不能为空");
    if (!internship.start) errors.push("实习开始时间不能为空");
    if (!internship.end) errors.push("实习结束时间不能为空");
    if (internship.bullets.length !== 4) {
      errors.push(`实习经历需要 4 条描述，目前有 ${internship.bullets.length} 条`);
    }
  }

  const project = profile.projects[0];
  const projectFields = [
    ["项目背景", project.star.situation],
    ["你的任务", project.star.task],
    ["你做了什么", project.star.action],
    ["项目结果", project.star.result],
  ];

  projectFields.forEach(([label, value]) => {
    if (!value) errors.push(`${label}不能为空`);
  });

  if (profile.skills.length < 3) {
    errors.push(`技能优势至少填写 3 个，目前有 ${profile.skills.length} 个`);
  }

  profile.awards.forEach((award, index) => {
    if ((award.date && !award.content) || (!award.date && award.content)) {
      errors.push(`荣誉奖项 ${index + 1} 的时间和名称需要同时填写`);
    }
  });

  profile.student_work.forEach((item, index) => {
    if (!item.role || !item.content) {
      errors.push(`学生工作 ${index + 1} 至少需要填写角色和描述`);
    }
    if (!item.start) errors.push(`学生工作 ${index + 1} 开始时间不能为空`);
    if (!item.end) errors.push(`学生工作 ${index + 1} 结束时间不能为空`);
  });

  errors.push(...getTimeRangeErrors(profile));

  return errors;
}

function renderValidation(errors, type = "default") {
  validationBox.classList.remove("is-valid", "is-invalid", "is-loading");

  if (type === "loading") {
    validationBox.classList.add("is-loading");
    validationBox.innerHTML = `
      <strong>正在生成主页</strong>
      <p>AI 正在整理你的实习和项目经历，并生成真实主页预览，请稍等片刻。</p>
    `;
    return;
  }

  if (errors.length === 0) {
    validationBox.classList.add("is-valid");
    validationBox.innerHTML = `
      <strong>信息完整</strong>
      <p>可以生成主页了。</p>
    `;
    return;
  }

  validationBox.classList.add("is-invalid");
  validationBox.innerHTML = `
    <strong>还有 ${errors.length} 个地方需要补全</strong>
    <ul>${errors.map((error) => `<li>${error}</li>`).join("")}</ul>
  `;
}

async function generateHomepage(profile) {
  const response = await fetch("/api/generate-homepage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });

  const result = await response.json();
  if (!response.ok) {
    const message = Array.isArray(result.errors) ? result.errors.join("；") : result.message;
    throw new Error(message || "主页生成失败，请稍后再试。");
  }

  return result;
}

function setResumeUploadStatus(message, type = "default") {
  if (!resumeUploadStatus) return;
  resumeUploadStatus.textContent = message;
  resumeUploadStatus.className = `upload-status ${type ? `is-${type}` : ""}`.trim();
}

function setResumeFileName(message) {
  if (!resumeFileName) return;
  resumeFileName.textContent = message;
}

resumePdfInput?.addEventListener("change", async () => {
  const file = resumePdfInput.files?.[0];
  setResumeFileName("");
  setResumeUploadStatus("");

  if (!file) return;

  if (!isPdfFile(file)) {
    resumePdfInput.value = "";
    setResumeUploadStatus("仅支持上传 PDF 文件", "error");
    renderValidation(["仅支持上传 PDF 文件"]);
    return;
  }

  const uploadFormData = new FormData(form);
  resumePdfInput.disabled = true;
  generateButton.disabled = true;
  setResumeUploadStatus("上传中...", "loading");

  try {
    await readUpload(uploadFormData, "resumePdfFile", {
      validate: isPdfFile,
      errorMessage: "仅支持上传 PDF 文件",
    });
    setResumeFileName(file.name);
    setResumeUploadStatus("上传成功", "success");
  } catch {
    resumePdfInput.value = "";
    setResumeFileName("");
    setResumeUploadStatus("上传失败，请重试", "error");
  } finally {
    resumePdfInput.disabled = false;
    generateButton.disabled = false;
  }
});

form.addEventListener("reset", () => {
  setResumeFileName("");
  setResumeUploadStatus("");
  window.setTimeout(() => {
    initializeEducationFields();
  }, 0);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const profile = buildProfile(formData);
  const errors = validateProfile(profile, formData);
  renderValidation(errors);

  if (errors.length > 0) return;

  generateButton.disabled = true;
  generateButton.textContent = "正在生成...";
  renderValidation([], "loading");

  try {
    profile._uploads = await collectUploads(formData);
    const result = await generateHomepage(profile);
    window.location.href = result.preview_url;
  } catch (error) {
    renderValidation([error.message || "主页生成失败，请稍后再试。"]);
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = "生成主页";
  }
});

initializeEducationFields();
