const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.SITE_URL || 'http://127.0.0.1:4000/Personal-Website/';
const screenshots = fs.mkdtempSync(path.join(os.tmpdir(), 'homepage-i18n-'));
console.log(`Screenshots: ${screenshots}`);

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || undefined });
  const failures = [];
  try {
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    page.on('pageerror', error => failures.push(error.message));

    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const language of ['zh', 'en']) {
        await page.goto(base + (language === 'en' ? 'en/' : ''), { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        const layout = await page.evaluate(() => {
          const language = document.querySelector('.language-switch').getBoundingClientRect();
          const title = document.querySelector('.masthead__menu-item--lg a').getBoundingClientRect();
          return {
            width: innerWidth,
            contentWidth: document.documentElement.scrollWidth,
            languageLeft: language.left,
            languageRight: language.right,
            languageTop: language.top,
            languageBottom: language.bottom,
            titleRight: title.right,
            brokenImages: [...document.images].filter(img => img.loading !== 'lazy' && (!img.complete || !img.naturalWidth)).map(img => img.src)
          };
        });
        assert.ok(layout.contentWidth <= width + 1, `${language}/${width}: horizontal overflow ${JSON.stringify(layout)}`);
        assert.ok(layout.languageLeft > layout.titleRight, `${language}/${width}: language switch overlaps the title`);
        assert.ok(layout.languageRight <= width, `${language}/${width}: switch is outside the viewport`);
        assert.ok(layout.languageTop >= 0 && layout.languageBottom <= 70, `${language}/${width}: switch escapes the masthead`);
        assert.deepEqual(layout.brokenImages, [], `${language}/${width}: broken images`);
        assert.equal(await page.locator('.language-switch [aria-current="true"]').innerText(), language === 'en' ? 'EN' : '中文');

        const resumeFilename = language === 'en' ? 'wuqi_resume_en.pdf' : 'wuqi_resume.pdf';
        const resumeURL = new URL(`files/${resumeFilename}`, base);
        const resumeLink = page.locator('#site-nav a[href$=".pdf"]');
        assert.equal(await resumeLink.count(), 1, `${language}/${width}: expected one resume link`);
        assert.equal(await resumeLink.getAttribute('href'), resumeURL.pathname);
        assert.equal(await resumeLink.innerText(), language === 'en' ? 'Resume' : '个人简历');
        if (width === 390) {
          const response = await context.request.get(resumeURL.href);
          assert.equal(response.status(), 200, `${language}: resume is unavailable`);
          assert.match(response.headers()['content-type'], /application\/pdf/);
          const source = fs.readFileSync(path.join(__dirname, '..', 'files', resumeFilename));
          assert.ok((await response.body()).equals(source), `${language}: served resume differs from source`);
          console.log(`PASS ${language}: localized resume link and PDF response`);
        }

        if (width === 1440 || width === 390) {
          await page.screenshot({ path: path.join(screenshots, `${language}-${width}.png`) });
        }

        const menu = page.locator('.nav-toggle');
        if (await menu.isVisible()) {
          await menu.click();
          assert.equal(await menu.getAttribute('aria-expanded'), 'true');
          assert.equal(await page.locator('#overflow-nav').isVisible(), true);
          const bounds = await page.locator('#overflow-nav').boundingBox();
          assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1, `${language}/${width}: menu is clipped`);
          await page.keyboard.press('Escape');
          assert.equal(await menu.getAttribute('aria-expanded'), 'false');
          assert.equal(await page.locator('#overflow-nav').isVisible(), false);
        }
        console.log(`PASS layout/menu: ${language}, ${width}px`);
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '#projects', { waitUntil: 'networkidle' });
    await page.locator('.language-switch a[lang="en"]').click();
    await page.waitForURL(base + 'en/#projects');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    const projectAnchor = await page.locator('#projects').evaluate(el => el.getBoundingClientRect().top);
    assert.ok(projectAnchor >= -2 && projectAnchor < 110, 'Language switch lost the projects section');
    await page.screenshot({ path: path.join(screenshots, 'en-projects-390.png') });
    await page.locator('.language-switch a[lang="zh-CN"]').click();
    await page.waitForURL(base + '#projects');
    console.log('PASS switching: Chinese -> English -> refresh -> Chinese, retaining #projects');

    for (const language of ['zh', 'en']) {
      await page.goto(base + (language === 'en' ? 'en/' : ''), { waitUntil: 'networkidle' });
      const contact = page.locator('.author__urls-wrapper button');
      await contact.click();
      assert.equal(await contact.getAttribute('aria-expanded'), 'true');
      assert.equal(await page.locator('.author__urls').isVisible(), true);
      await page.locator('.js-copy-email').click();
      await page.waitForFunction(expected => document.querySelector('.email-label').textContent === expected, language === 'en' ? 'Copied' : '已复制');
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), '552394206@qq.com');
      await page.keyboard.press('Escape');
      assert.equal(await contact.getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('.author__urls').isVisible(), false);

      await contact.click();
      await page.locator('.author__wechat a').click();
      await page.locator('.mfp-img').waitFor({ state: 'visible' });
      assert.equal(await page.locator('.mfp-close').getAttribute('title'), language === 'en' ? 'Close (Esc)' : '关闭（Esc）');
      await page.keyboard.press('Escape');
      console.log(`PASS ${language}: mobile contact menu, copied feedback, clipboard, WeChat image`);
    }

    const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const staticPage = await noJS.newPage();
    await staticPage.goto(base);
    await staticPage.locator('.language-switch a[lang="en"]').click();
    assert.equal(await staticPage.locator('html').getAttribute('lang'), 'en');
    assert.ok((await staticPage.locator('.main-heading').innerText()).includes('Welcome'));
    console.log('PASS language switch without JavaScript');
    assert.deepEqual(failures, [], 'Browser JavaScript errors');
    console.log(`Screenshots: ${screenshots}`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
