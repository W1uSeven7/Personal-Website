# AI 个人主页定制 Agent

这个目录承载「AI 个人主页定制 Agent」项目，和外层真实个人主页代码隔离。

当前 MVP 的核心目标是：面向不懂代码的在校大学生，用户只需要在网页端填写个人信息、经历和技能，点击「生成主页」后，系统会基于当前个人主页模板生成一份独立的真实 Jekyll 主页预览。

## 使用方式

在项目根目录运行：

```powershell
python Agent\server.py
```

启动后访问：

```text
http://127.0.0.1:8000
```

网页端流程：

1. 用户填写基础信息、教育经历、实习经历、项目经历、荣誉奖项、学生工作、技能优势和简历入口。
2. 用户可上传头像、公司 logo、项目展示图。
3. 点击「生成主页」。
4. 后端调用 DeepSeek 生成实习和项目经历 summary。
5. 后端复制当前 Jekyll 个人主页模板，生成一份独立站点副本。
6. 后端写入 `profile.yml`、`_pages/about.md`、`_config.yml`，并保存上传图片到生成站点的 `images` 目录。
7. 后端运行 Jekyll build，并跳转到真实构建后的主页预览。

生成结果会保存在：

```text
Agent/generated/
```

该目录已经加入 `.gitignore`，不会提交到 GitHub。

## 当前源码结构

```text
Agent/
├── profile.yml
├── requirements.txt
├── README.md
├── server.py
├── core/
│   ├── __init__.py
│   ├── ai_summary.py
│   ├── check_info.py
│   ├── collect_info.py
│   ├── config.py
│   ├── generate_website.py
│   └── update_info.py
├── templates/
│   └── about.md.j2
└── web/
    ├── app.js
    ├── index.html
    └── styles.css
```

## 后端模块分工

- `server.py`：HTTP 服务入口，只负责路由、接收请求和返回 JSON。
- `core/check_info.py`：校验用户是否缺失必填字段，以及项目、实习、技能数量是否符合要求。
- `core/collect_info.py`：解析前端提交的数据，处理头像、公司 logo、项目展示图等上传图片。
- `core/ai_summary.py`：读取本地 `.env`，调用 DeepSeek API 生成经历 summary。
- `core/update_info.py`：更新生成站点中的 `profile.yml`、`_pages/about.md`、`_config.yml`。
- `core/generate_website.py`：复制主页模板、生成独立站点副本、运行 Jekyll build 并返回预览地址。
- `core/config.py`：统一维护路径、端口、模型名等配置。

## 敏感信息

DeepSeek API Key 放在：

```text
Agent/.env
```

示例：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
```

不要把 `.env` 提交到 GitHub。
