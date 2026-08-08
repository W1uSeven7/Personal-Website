# AI 个人主页定制 Agent PRD

## 1. 产品背景

在校大学生求职时，通常需要用简历、项目经历、作品集等材料向招聘方证明自己的能力。但一页 PDF 简历承载的信息有限，很多学生也缺乏独立搭建个人主页、组织项目表达和部署网站的能力。

本项目希望将现有个人主页模板升级为一个面向求职场景的 AI Agent 项目。用户通过对话和模板表单输入个人背景、目标岗位、项目经历和基础资料，Agent 自动生成结构化数据，并基于固定主页模板生成可部署的个人主页。

主页模板参考：

```text
https://w1useven7.github.io/Personal-Website/
```

## 2. 产品定位

面向在校大学生求职的 AI 个人主页定制 Agent。用户只需通过对话输入个人背景、目标岗位、项目经历和风格偏好，Agent 即可自动生成结构化个人主页内容，并辅助完成模块调整、文案整理、视觉风格定制和 GitHub Pages 部署配置。

MVP 阶段聚焦于：

- 基于固定 Jekyll + GitHub Pages 主页模板进行定制；
- 通过“对话 + 模板表单”收集用户信息；
- 将用户信息结构化为 `profile.yml`；
- Agent 自动读取 `profile.yml` 并更新 Jekyll 网站文件；
- 提供本地预览和 GitHub Pages 部署指导。

## 3. 目标用户

核心目标用户是在校求职大学生，尤其是正在投递 AI 产品、互联网产品、技术产品、数据产品等岗位的本科生。

典型用户特征：

- 大三、大四或正在准备实习/校招；
- 有教育背景、项目经历、荣誉奖项或学生工作经历；
- 想要比普通简历更完整地展示自己；
- 不熟悉 Jekyll、GitHub Pages、HTML/CSS 等建站流程；
- 希望通过一个在线主页集中展示个人能力、项目价值和简历入口。

## 4. 核心痛点

1. 简历容量有限，难以展示项目过程、截图和作品链接。
2. 很多学生不知道如何将个人经历结构化展示。
3. 传统个人主页模板需要手动修改代码，门槛较高。
4. GitHub Pages 部署、`baseurl` 配置、资源路径等问题容易出错。
5. 求职学生需要一个可持续更新、可在线访问的个人展示入口。

## 5. MVP 范围

### 5.1 MVP 做什么

- 分阶段收集用户信息；
- 检查必填信息是否完整；
- 校验实习经历、项目经历、技能标签等结构；
- 生成结构化 `profile.yml`；
- 根据 `profile.yml` 自动更新 Jekyll 网站文件；
- 固定使用当前个人主页的简洁白色风格；
- 输出本地预览命令和 GitHub Pages 部署顺序；
- 提供常见部署错误处理建议。

### 5.2 MVP 不做什么

- 不自动登录用户 GitHub；
- 不自动创建 GitHub 仓库；
- 不自动强制推送远程仓库；
- 不做复杂风格选择；
- 不对用户文案做深度改写；
- 不编造项目成果、数据或经历；
- 不支持多用户在线 SaaS 化。

## 6. 页面结构

页面整体参考当前个人主页模板。

左侧栏为个人简介：

- 姓名；
- 头像；
- 一句话签名；
- 所在城市；
- 学校；
- 邮箱；
- 微信；
- GitHub，可选；
- 个人博客，可选。

右侧主体模块顺序固定为：

1. 打招呼/自我介绍；
2. 最新动态；
3. 教育/实习经历；
4. 项目经历；
5. 荣誉奖项；
6. 学生工作；
7. 技能标签；
8. 简历入口。

## 7. 分阶段用户输入流程

MVP 使用“分阶段模板表单 + 缺失项追问 + 结构化生成”的交互方式。

### 阶段 0：Agent 开场与模板说明

Agent 说明产品能力和最终主页参考：

```text
你好，我是 AI 个人主页定制 Agent。
我会基于这个主页模板为你生成一个适合求职展示的个人主页：

https://w1useven7.github.io/Personal-Website/

接下来我会分阶段收集你的信息，并生成结构化 profile.yml，再自动更新 Jekyll 网站文件。
你不需要一次性准备所有内容，缺失项我会逐步追问。
```

### 阶段 1：基础信息与左侧栏

```text
【阶段 1：基础信息】

姓名：
一句话个人签名 bio：
所在城市：
学校：
目标岗位：
邮箱：
微信号：
GitHub 链接（选填）：
个人博客（选填）：

资源文件：
头像请放到 /images/avatar.jpg
微信二维码如有，请放到 /images/wechat_qr.jpg
```

校验规则：

- 姓名、bio、所在城市、学校、目标岗位、邮箱、微信号必填；
- GitHub、个人博客选填；
- 头像文件固定为 `/images/avatar.jpg`；
- 微信二维码选填；
- 若有微信二维码，点击 WeChat 弹出二维码；
- 若无微信二维码，点击 WeChat 复制微信号。

### 阶段 2：首页介绍与最新动态

```text
【阶段 2：首页介绍】

请用 2-3 行介绍你自己，重点体现：
学校 / 年级 / 专业 / 目标岗位 / 求职方向。

【最新动态】选填，最多 10 条。
如果没有，可以写“暂无”。

格式：
时间 + 事件
1.
2.
3.
```

校验规则：

- 首页介绍必须为 2-3 行；
- 最新动态最多 10 条；
- 最新动态为空或写“暂无”时，隐藏“最新动态”模块。

### 阶段 3：教育/实习经历

```text
【阶段 3：教育/实习经历】

教育经历只填写 1 条：

学校：
学历：
专业：
开始时间：
结束时间：
补充说明：

实习经历最多 2 段，没有可写“暂无”。
每段实习经历请写 4 条要点，不要求 STAR。

实习经历 1：
公司/组织：
岗位/角色：
开始时间：
结束时间：
要点 1：
要点 2：
要点 3：
要点 4：

实习经历 2：
公司/组织：
岗位/角色：
开始时间：
结束时间：
要点 1：
要点 2：
要点 3：
要点 4：
```

校验规则：

- 教育经历必填，只允许 1 条；
- 实习经历 0-2 段；
- 如果存在实习经历，每段必须正好 4 条要点；
- 实习经历不强制使用 STAR 标签；
- 渲染时教育经历和实习经历合并到“教育/实习经历”模块；
- 教育/实习经历按最新时间从上到下展示。

### 阶段 4：项目经历

```text
【阶段 4：项目经历】

请填写至少 1 个，最多 3 个项目。
每个项目必须按 STAR 四点填写。

项目图片路径固定为：
项目 1：/images/project_1.png
项目 2：/images/project_2.png
项目 3：/images/project_3.png

项目 1：
项目名称：
项目角色：
开始时间：
结束时间：
Demo 链接（选填）：
代码链接（选填）：
Situation：
Task：
Action：
Result：
```

校验规则：

- 项目经历至少 1 个，最多 3 个；
- 每个项目必须正好 4 条 STAR 要点；
- 每个项目必须包含：
  - `Situation：`
  - `Task：`
  - `Action：`
  - `Result：`
- 项目图片路径固定为 `/images/project_1.png`、`/images/project_2.png`、`/images/project_3.png`；
- 如果项目图片缺失，可以先生成页面，但需要提醒用户补充图片。

### 阶段 5：荣誉奖项、学生工作、技能标签

```text
【阶段 5：补充经历与技能】

荣誉奖项，没有可写“暂无”。
格式：时间 + 奖项名称
1.
2.
3.

学生工作，没有可写“暂无”。
格式：开始时间-结束时间 + 职务/事项 + 简短说明
1.
2.
3.

技能标签：至少 3 个，最多 6 个。
例如：产品设计、需求分析、原型设计、AI 工具使用、数据分析、沟通协作

1.
2.
3.
4.
5.
6.
```

校验规则：

- 荣誉奖项为空或写“暂无”时，隐藏“荣誉奖项”模块；
- 学生工作为空或写“暂无”时，隐藏“学生工作”模块；
- 技能标签至少 3 个，最多 6 个；
- 技能标签超过 6 个时，要求用户删减。

### 阶段 6：资源文件与部署确认

```text
【阶段 6：资源文件与部署】

请确认以下文件已经放到指定位置：

头像：/images/avatar.jpg
简历：/files/resume.pdf
微信二维码（选填）：/images/wechat_qr.jpg
项目图片：
/images/project_1.png
/images/project_2.png
/images/project_3.png

GitHub 仓库名：
GitHub 用户名：
是否准备部署到 GitHub Pages：
```

Agent 根据 GitHub 用户名和仓库名生成：

```yml
url: "https://用户名.github.io"
baseurl: "/仓库名"
```

## 8. profile.yml 数据结构

`profile.yml` 是用户信息的唯一数据源。页面内容由 `profile.yml` 渲染生成。

```yml
site:
  title: "MyWebsite"
  target_role: "AI产品实习生"
  resume_path: "/files/resume.pdf"

profile:
  name: "吴琦"
  avatar: "/images/avatar.jpg"
  bio: "写下我度秒如年难捱的离骚"
  location: "中国重庆市"
  school: "西南大学"
  email: "552394206@qq.com"
  wechat_id: "your_wechat_id"
  wechat_qr: "/images/wechat_qr.jpg"
  github: "https://github.com/yourname"
  blog: "https://your-blog.com"

intro:
  greeting: "你好👋 欢迎来到我的主页！"
  summary:
    - "Hi！我是吴琦，目前就读于西南大学信息管理与信息系统专业。"
    - "我正在寻找 AI 产品岗位的实习机会，关注 AI Agent、效率工具和产品从 0 到 1 的落地。"

news:
  - date: "2026.06"
    content: "完成个人主页 Agent 项目的 MVP 设计。"

education:
  school: "西南大学"
  degree: "本科"
  major: "信息管理与信息系统"
  start: "2023.09"
  end: "2027.06"
  description:
    - "主修信息管理、产品设计、数据分析等相关课程。"

internships:
  - company: "某某公司"
    role: "AI 产品实习生"
    start: "2025.07"
    end: "2025.10"
    points:
      - "负责……"
      - "参与……"
      - "协同……"
      - "输出……"

projects:
  - name: "校园二手交易小程序"
    role: "产品负责人 / 前端开发"
    start: "2025.03"
    end: "2025.05"
    image: "/images/project_1.png"
    links:
      demo: ""
      code: ""
    points:
      - "Situation：……"
      - "Task：……"
      - "Action：……"
      - "Result：……"

awards:
  - date: "2025.12"
    title: "西南大学一等奖学金"

student_services:
  - start: "2024.09"
    end: "2025.09"
    title: "西南大学创新创业部部长"
    description: "负责组织创新创业相关活动，协调项目推进与成员分工。"

skills:
  - "产品设计"
  - "需求分析"
  - "原型设计"
  - "AI 工具使用"
  - "数据分析"
  - "沟通协作"
```

## 9. 字段规则

| 模块 | 字段 | 是否必填 | 规则 |
|---|---|---|---|
| site | title | 是 | 默认 `MyWebsite` |
| site | target_role | 是 | 用户目标岗位 |
| site | resume_path | 是 | 固定 `/files/resume.pdf` |
| profile | name | 是 | 用户姓名 |
| profile | avatar | 是 | 固定 `/images/avatar.jpg` |
| profile | bio | 是 | 一句话个人签名 |
| profile | location | 是 | 所在城市 |
| profile | school | 是 | 学校名称 |
| profile | email | 是 | 邮箱账号 |
| profile | wechat_id | 是 | 微信号 |
| profile | wechat_qr | 否 | 固定 `/images/wechat_qr.jpg`，没有则为空 |
| profile | github | 否 | GitHub 链接 |
| profile | blog | 否 | 个人博客 |
| intro | greeting | 是 | 首页大标题 |
| intro | summary | 是 | 2-3 行自我介绍 |
| news | date/content | 否 | 最多 10 条，空则隐藏 |
| education | 全部字段 | 是 | 只允许 1 条教育经历 |
| internships | company/role/start/end/points | 否 | 最多 2 段，每段必须 4 条 bullet |
| projects | name/role/start/end/image/points | 是 | 至少 1 个，最多 3 个，每个必须 4 条 STAR |
| awards | date/title | 否 | 空或“暂无”则隐藏 |
| student_services | start/end/title/description | 否 | 空或“暂无”则隐藏 |
| skills | 列表 | 是 | 至少 3 个，最多 6 个 |

## 10. 资源命名规则

```text
头像：/images/avatar.jpg
微信二维码：/images/wechat_qr.jpg
项目图片：
  /images/project_1.png
  /images/project_2.png
  /images/project_3.png
简历：/files/resume.pdf
```

## 11. 六个 Agent 分工

### 11.1 信息采集 Agent

负责发放分阶段模板表单、接收用户输入、识别缺失字段并追问。

### 11.2 内容结构化 Agent

负责将用户输入转换为标准 `profile.yml` 数据结构。

### 11.3 文案整理 Agent

MVP 阶段不做深度改写，不编造事实，只做结构化整理和格式规范检查。

### 11.4 页面生成 Agent

负责读取 `profile.yml`，并自动更新 Jekyll 网站文件。

### 11.5 风格定制 Agent

MVP 阶段固定使用当前个人主页的简洁白色风格，不开放风格选择。

### 11.6 部署指导 Agent

负责检查 GitHub Pages 相关配置，并输出本地预览、提交、推送、部署顺序和常见报错处理建议。

## 12. 异常处理

| 场景 | Agent 处理方式 |
|---|---|
| 必填信息缺失 | 指出具体缺失字段并追问 |
| 项目经历少于 1 个 | 要求用户至少补充 1 个项目 |
| 项目经历超过 3 个 | 要求用户选择最多 3 个 |
| 项目未按 STAR 填写 | 指出缺失的 STAR 字段 |
| 实习经历不足 4 条要点 | 要求补齐到 4 条 |
| 技能标签少于 3 个 | 要求补充 |
| 技能标签超过 6 个 | 要求删减 |
| 最新动态超过 10 条 | 要求删减到 10 条以内 |
| 头像文件缺失 | 提醒用户放入 `/images/avatar.jpg` |
| 简历 PDF 缺失 | 提醒用户放入 `/files/resume.pdf` |
| 微信二维码缺失 | 自动切换为点击复制微信号 |
| 项目图片缺失 | 页面可生成，但提醒用户补图 |
| GitHub Pages 页面样式丢失 | 检查 `baseurl` 是否为仓库名 |
| git push 被拒绝 | 提示先 `git pull --rebase origin main` |

## 13. 部署输出

Agent 最终应输出：

1. 已更新的 Jekyll 网站文件；
2. 一份结构化 `profile.yml`；
3. 本地预览命令；
4. GitHub Pages 部署顺序。

示例命令：

```powershell
bundle exec jekyll serve
git add -A
git commit -m "Generate personal website"
git push origin main
```

如果是项目仓库，Agent 需要提醒用户配置：

```yml
url: "https://用户名.github.io"
baseurl: "/仓库名"
```

## 14. MVP 成功标准

MVP 视为成功需要满足：

- 用户能够通过多轮对话完成必填信息补全；
- Agent 能生成符合规范的 `profile.yml`；
- Agent 能根据 `profile.yml` 自动更新 Jekyll 网站文件；
- 页面能本地预览；
- 用户能根据 Agent 指引部署到 GitHub Pages；
- 最终网站包含个人信息、首页介绍、教育/实习经历、项目经历、技能标签、简历入口等核心模块；
- 用户无需理解 Jekyll 文件结构即可完成一次主页定制；
- Agent 不编造经历、不自动执行高风险 Git 操作。

## 15. 后续迭代方向

MVP 完成后可考虑：

- 支持多种视觉风格；
- 支持根据目标岗位进行文案轻度优化；
- 支持上传简历 PDF 后自动解析信息；
- 支持自动检测 GitHub Pages 部署状态；
- 支持 Web 表单版本；
- 支持更多岗位模板，如产品、运营、前端、数据分析、设计等。
