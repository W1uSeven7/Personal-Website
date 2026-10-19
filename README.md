# WowPage

WowPage is a clean, responsive personal homepage built with Jekyll and adapted from the Academic Pages theme. It is designed for showcasing a personal profile, projects, experience, awards, talks, services, and CV.

Template is originated from [selen-suyue.github.io](https://selen-suyue.github.io/).
Example：[w1useven7.github.io](https://w1useven7.github.io/Personal-Website/).
## Features

- Academic-style homepage with author profile sidebar
- Single-page navigation for news, experience, projects, awards, services, and talks
- Custom homepage styling through `assets/css/home.css`
- CV link support through the navigation menu
- Chinese and English homepages with a section-preserving language switch
- Social profile fields managed from `_config.yml`
- GitHub Pages compatible Jekyll setup
- Sitemap and feed support through Jekyll plugins

## Project Structure

```text
.
├── _config.yml              # Main site configuration and author metadata
├── _data/
│   ├── navigation.yml       # Header navigation links
│   ├── home.yml             # Shared homepage dates, images, links, and ordering
│   ├── i18n/                # Chinese and English content
│   ├── authors.yml          # Optional author data
│   └── ui-text.yml          # Theme UI text
├── _includes/               # Reusable Liquid partials
├── _layouts/                # Page layout templates
├── _pages/                  # Main site pages, including the homepage
├── _sass/                   # Theme Sass source files
├── assets/                  # CSS, JavaScript, and theme assets
├── images/                  # Profile, logos, project images, and other media
├── Gemfile                  # Ruby/Jekyll dependencies
├── package.json             # JavaScript build dependencies and scripts
└── LICENSE
```

## Getting Started

### Prerequisites

Install the following tools before running the site locally:

- Ruby and Bundler
- Git

Node.js and npm are only needed if you want to rebuild the bundled JavaScript file.

### Installation

Clone the repository and install dependencies:

```bash
git clone <your-repository-url>
cd WowPage
bundle install
```

### Run Locally

Start the Jekyll development server:

```bash
bundle exec jekyll serve
```

Then open the local URL shown in the terminal, usually:
```text
http://127.0.0.1:4000/Personal-Website/
http://127.0.0.1:4000/Personal-Website/en/
```

### Build the Site

Generate the static site:

```bash
bundle exec jekyll build
```

The generated files will be written to `_site/`.

## Customization

### Basic Site Information

Edit `_config.yml` to update the site title, URL, email, avatar, and social links.
Localized author name, biography, affiliation, location, homepage title, and
description are maintained in `_data/i18n/zh.yml` and `_data/i18n/en.yml`.
Author text in `_config.yml` remains the theme's fallback configuration.

Important fields include:

```yaml
title: "WowPage"
name: "Your Name"
description: "A clean academic homepage template."
author:
  avatar: "1.png"
  name: "吴琦"
  bio: "男大学生倒计时版👩‍🎓"
  location: "中国重庆市"
  employer: "西南大学"
  email: "552394206@qq.com"
```

### Homepage Content

The homepage text is maintained in:

```text
_data/i18n/zh.yml
_data/i18n/en.yml
```

Update both files to edit sections such as news, experience, projects, awards,
services, skills, and the introductory text. Shared dates, images, links, and
ordering live in `_data/home.yml`. The two files in `_pages/` only configure
the routes and include the shared `_includes/home.html` layout.

### Navigation

Edit the navigation menu in:

```text
_data/navigation.yml
```

For example:

```yaml
main:
  - key: news
    title: "News"
    url: "/#news"
  - key: experience
    title: "Experience"
    url: "/#experience"
  - key: resume
    title: "Resume"
    url: "/files/wuqi_resume.pdf"
```

Each `key` maps to a label under `navigation` in both language files.

### Images and Media

Place profile photos, organization logos, project images, and other visual assets in:

```text
images/
```

Reference them from pages using paths such as:

```html
<img src="{{ '/images/example.png' | relative_url }}" alt="Example image">
```

### JavaScript and CSS

Custom homepage styles can be edited in:

```text
assets/css/home.css
```

JavaScript assets are built with npm:

```bash
npm run build:js
```

## Deployment

This site is compatible with GitHub Pages.

A typical deployment workflow is:

1. Push the repository to GitHub.
2. Open the repository settings on GitHub.
3. Enable GitHub Pages.
4. Select the branch and folder used for deployment.
5. Update `url`, `baseurl`, and `repository` in `_config.yml` if needed.

For a user or organization site, the repository is commonly named:

```text
<username>.github.io
```

For a project site, set `baseurl` to the repository name:

```yaml
url: "https://<username>.github.io"
baseurl: "/<repository-name>"
```

## Content Checklist

Before publishing, consider updating:

- Email, social links, and avatar in `_config.yml`; localized name and bio in `_data/i18n/`
- Avatar and profile images in `images/`
- Navigation links in `_data/navigation.yml`
- Homepage text in `_data/i18n/zh.yml` and `_data/i18n/en.yml`
- CV file and CV link
- Project descriptions and external links
- Analytics or site verification settings, if needed

## Bilingual Homepage

The Chinese homepage remains at `/`; the English homepage is at `/en/`.
Both paths include the configured `baseurl` when deployed. Language is chosen
by the URL, so English links can be shared directly and remain English after a
refresh. The language switch preserves the section currently being viewed.

- `_data/i18n/zh.yml`: Chinese copy, navigation, sidebar text, and UI messages.
- `_data/i18n/en.yml`: corresponding English copy using the same keys.
- `_data/home.yml`: shared dates, images, project links, and section ordering.
- `_includes/home.html`: shared homepage layout.
- `_pages/about.md` and `_pages/about-en.md`: route and language configuration.

To add a news item, add its ID, date, and icon to `_data/home.yml`, then add the
same ID under `news` in both language files. Keep the keys in both files aligned.
Screenshots and external sites are not automatically translated. Each homepage
links to its matching resume: `files/wuqi_resume.pdf` for Chinese and
`files/wuqi_resume_en.pdf` for English. Replace these files when updating resumes;
if a filename changes, also update `resume_path` in its language file.

Build and check both languages (UTF-8 also avoids macOS Sass encoding errors):

```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 bundle exec jekyll build
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 bundle exec ruby _tests/i18n.rb
```

After editing `_main.js` or a navigation plugin, regenerate the checked-in bundle:

```bash
npm install
npm run build:js
```

## License

This project is released under the MIT License. See `LICENSE` for details.

## Acknowledgements

We appreciate your use of this template and look forward to your contributions. Contributors are welcome to voluntarily submit homepages built with this template for inclusion in our showcase.
