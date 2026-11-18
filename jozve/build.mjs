// ساخت جزوه: قطعه‌های src را کنار هم می‌گذارد، فرمول‌ها را با KaTeX رندر می‌کند،
// فونت‌ها را درون فایل جاسازی می‌کند و خروجی HTML (و در صورت نیاز PDF) می‌سازد.
//   node build.mjs              → همهٔ سندها (جزوه و حل تمرین‌ها)، فقط HTML
//   node build.mjs --pdf        → HTML و PDF همهٔ سندها
//   node build.mjs --doc=t1     → فقط یک سند (نام‌ها در DOCS)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import katex from 'katex';
import { FIGS as FIGS1 } from './figures.mjs';
import { FIGS2 } from './figures2.mjs';
import { FIGS3 } from './figures3.mjs';
import { FIGS4 } from './figures4.mjs';
import { FIGS5 } from './figures5.mjs';
const FIGS = { ...FIGS1, ...FIGS2, ...FIGS3, ...FIGS4, ...FIGS5 };

const require = createRequire(import.meta.url);
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const NM = path.join(ROOT, 'node_modules');

const DOCS = {
  jozve: {
    parts: [
      '00-front.html',
      '01-analysis.html',
      '02-divide-conquer.html',
      '03-randomized.html',
      '04-amortized.html',
      '05-lists.html',
      '06-trees.html',
      '07-expression-trees.html',
      '08-heaps.html',
      '09-sorting.html',
      '10-trie.html',
      '99-appendix.html',
    ],
    out: 'jozve-dsa',
    artifact: 'artifact.html',
    title: 'جزوهٔ ساختمان داده‌ها و الگوریتم‌ها',
    desc: 'جزوهٔ کامل فارسی درس ساختمان داده‌ها و الگوریتم‌ها: تحلیل الگوریتم، تقسیم و حل، الگوریتم‌های تصادفی، تحلیل سرشکنی، لیست، درخت، هرم، مرتب‌سازی و ترای',
    wrap: 'jozve',
  },
  t1: {
    parts: ['t1/00-front.html', 't1/01-p01-06.html', 't1/02-p07-11.html', 't1/03-p12-16.html', 't1/04-p17-20.html', 't1/05-p21-27.html', 't1/06-p28-33.html', 't1/99-cheatsheet.html'],
    out: 'tamrin-1',
    artifact: 'artifact-tamrin-1.html',
    title: 'حل تمرین سری اول ساختمان داده‌ها',
    desc: 'حل گام‌به‌گام تمرین سری اول درس ساختمان داده‌ها و طراحی الگوریتم‌ها: راهنمایی، راه‌حل با مرور مفاهیم، جمع‌بندی هر تیپ سؤال و برگهٔ تقلب ایده‌ها',
    wrap: 'jozve tamrin',
  },
  proofs: {
    parts: ['proofs/00-front.html', ...Array.from({ length: 10 }, (_, i) => `proofs/ch${String(i + 1).padStart(2, '0')}.html`)],
    out: 'proofs',
    artifact: 'artifact-proofs.html',
    title: 'اثبات‌های جزوهٔ ساختمان داده‌ها',
    desc: 'همهٔ اثبات‌های کامل جزوهٔ ساختمان داده‌ها و الگوریتم‌ها، فصل به فصل: حکم، اثبات و پیوند به جای آن در جزوه؛ با فهرست بر اساس روش اثبات و حالت تمرین',
    wrap: 'jozve tamrin proofs',
    figNumbers: false,
  },
  t2: {
    parts: ['t2/00-front.html', 't2/01-p01-07.html', 't2/02-p08-14.html', 't2/03-p15-20.html', 't2/04-p21-26.html', 't2/99-cheatsheet.html'],
    out: 'tamrin-2',
    artifact: 'artifact-tamrin-2.html',
    title: 'حل تمرین سری دوم ساختمان داده‌ها',
    desc: 'حل گام‌به‌گام تمرین سری دوم درس ساختمان داده‌ها و طراحی الگوریتم‌ها: احتمال، مرتب‌سازی، انتخاب و الگوریتم‌های تصادفی؛ با راهنمایی، مرور درس، جمع‌بندی، درجهٔ سختی و برگهٔ تقلب',
    wrap: 'jozve tamrin',
  },
};
const ONLY = (process.argv.find((a) => a.startsWith('--doc=')) || '').slice(6);

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const fa = (s) => String(s).replace(/\d/g, (d) => FA_DIGITS[d]);
const b64 = (p) => fs.readFileSync(p).toString('base64');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- فونت‌ها ----------
// فایل CSS یک بستهٔ fontsource را می‌خواند، فقط بلوک‌های لازم را نگه می‌دارد
// و آدرس فایل‌ها را با data URI جایگزین می‌کند.
function inlineFontsource(cssFile, keep, family) {
  const dir = path.dirname(cssFile);
  const css = fs.readFileSync(cssFile, 'utf8');
  const blocks = css.match(/@font-face\s*{[^}]*}/g) || [];
  return blocks
    .filter((b) => keep.some((k) => b.includes(k)))
    .map((b) =>
      b
        .replace(/font-family:\s*'[^']*'/, `font-family: '${family}'`)
        .replace(/src:[^;]*;/, (src) => {
          const m = src.match(/url\(\.\/files\/([^)]+?\.woff2)\)/);
          return `src: url(data:font/woff2;base64,${b64(path.join(dir, 'files', m[1]))}) format('woff2');`;
        }),
    )
    .join('\n');
}

function fontCss() {
  const vazir = inlineFontsource(
    path.join(NM, '@fontsource-variable/vazirmatn/index.css'),
    ['vazirmatn-arabic', 'vazirmatn-latin-wght', 'vazirmatn-latin-ext'],
    'Vazirmatn Jozve',
  );
  const lalezar = inlineFontsource(
    path.join(NM, '@fontsource/lalezar/400.css'),
    ['lalezar-arabic', 'lalezar-latin-400'],
    'Lalezar Jozve',
  );
  const mono = inlineFontsource(
    path.join(NM, '@fontsource-variable/jetbrains-mono/index.css'),
    ['jetbrains-mono-latin-wght-normal', 'jetbrains-mono-latin-ext-wght-normal'],
    'JetBrains Mono Jozve',
  );
  return [vazir, lalezar, mono].join('\n');
}

function katexCss() {
  const dir = path.join(NM, 'katex/dist');
  let css = fs.readFileSync(path.join(dir, 'katex.min.css'), 'utf8');
  css = css.replace(/src:url\(fonts\/([^)]+?)\.woff2\) format\("woff2"\)[^;}]*/g, (_, name) => {
    return `src:url(data:font/woff2;base64,${b64(path.join(dir, 'fonts', name + '.woff2'))}) format("woff2")`;
  });
  return css;
}

// ---------- فرمول‌ها ----------
const MACROS = {
  '\\floor': '\\left\\lfloor #1 \\right\\rfloor',
  '\\ceil': '\\left\\lceil #1 \\right\\rceil',
  '\\E': '\\mathbb{E}',
};

let mathErrors = 0;
function tex(src, displayMode, where) {
  src = src.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  try {
    return katex.renderToString(src, { displayMode, throwOnError: true, strict: false, macros: MACROS, output: 'html' });
  } catch (e) {
    mathErrors++;
    console.error(`✗ خطای فرمول در ${where}:\n  ${src}\n  ${e.message}`);
    return `<code class="tex-error">${esc(src)}</code>`;
  }
}

function renderMath(html, where) {
  html = html.replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => `<div class="math-display">${tex(t, true, where)}</div>`);
  // فرمول درون‌خطی همراه با پرانتز/نشانهٔ چسبیده به آن در یک واحد شکست‌ناپذیر
  html = html.replace(/([(«]?)\\\(([\s\S]+?)\\\)([.,،:؛)»؟!]*)/g, (_, a, t, z) =>
    (a || z) && t.length <= 40 ? `<span class="mnb">${a}${tex(t, false, where)}${z}</span>` : a + tex(t, false, where) + z);
  return html;
}

// ---------- شبه‌کد ----------
const KW = [
  'for', 'to', 'downto', 'do', 'while', 'if', 'then', 'else', 'return', 'repeat', 'until',
  'foreach', 'and', 'or', 'not', 'in', 'each', 'from', 'nil', 'NIL', 'true', 'false', 'error', 'step',
];
const KW_RE = new RegExp(
  String.raw`(//.*$|⊳.*$)|\b(${KW.join('|')})\b|\b([A-Za-z][A-Za-z0-9-]*)(?=\()|\b(\d+)\b`,
  'g',
);
function highlight(code) {
  const lines = code.replace(/^\n+/, '').replace(/\s+$/, '').split('\n');
  return lines
    .map((line) => {
      const out = esc(line).replace(KW_RE, (m, cm, kw, fn, num) => {
        if (cm) return `<span class="tc">${cm}</span>`;
        if (kw) return `<span class="tk">${kw}</span>`;
        if (fn) return `<span class="tf">${fn}</span>`;
        return `<span class="tn">${num}</span>`;
      });
      return `<span class="ln">${out || ' '}</span>`;
    })
    .join('');
}

function renderPre(block) {
  const m = block.match(/^<pre([^>]*)>([\s\S]*)<\/pre>$/);
  const attrs = m[1];
  const body = m[2];
  const title = (attrs.match(/data-title="([^"]*)"/) || [])[1];
  const plain = /class="[^"]*\bplain\b/.test(attrs);
  const inner = plain ? body.replace(/^\n+/, '').replace(/\s+$/, '') : highlight(body);
  return (
    `<div class="code-wrap${plain ? ' plain' : ''}" dir="ltr">` +
    (title ? `<div class="code-title">${esc(title)}</div>` : '') +
    `<pre class="code${plain ? ' plain' : ''}"><code>${inner}</code></pre></div>`
  );
}

// ---------- پردازش هر بخش ----------
function processPart(html, where) {
  html = html.replace(/<!--FIG:(\w+)-->/g, (_, name) => {
    if (!FIGS[name]) throw new Error(`شکل ناشناخته: ${name} در ${where}`);
    return FIGS[name]();
  });
  const stash = [];
  html = html.replace(/<(pre|svg)\b[\s\S]*?<\/\1>/g, (m) => {
    stash.push(m);
    return `\u0000${stash.length - 1}\u0000`;
  });
  html = renderMath(html, where);
  html = html.replace(/\{\{([\s\S]+?)\}\}/g, (_, t) => `<bdi class="en" dir="ltr">${t}</bdi>`);
  html = html.replace(/\u0000(\d+)\u0000/g, (_, i) => {
    const s = stash[+i];
    return s.startsWith('<pre') ? renderPre(s) : s;
  });
  return html;
}

// ---------- شماره‌گذاری و فهرست ----------
function numberAndToc(html, { figNumbers = true } = {}) {
  const toc = [];
  let ch = null;
  let sec = 0;
  let fig = 0;
  html = html.replace(
    /<section class="chapter([^"]*)"([^>]*)data-ch="([^"]+)"([^>]*)>|<h2>([\s\S]*?)<\/h2>|<figcaption>/g,
    (m, cls, a1, chNo, a2, h2) => {
      if (chNo !== undefined) {
        ch = { no: chNo, title: (m.match(/data-title="([^"]+)"/) || [])[1], color: (m.match(/data-color="([^"]+)"/) || [])[1], items: [] };
        toc.push(ch);
        sec = 0;
        fig = 0;
        return m;
      }
      if (h2 !== undefined) {
        if (!ch) return m;
        sec++;
        const label = `${fa(ch.no)}.${fa(sec)}`;
        const id = `s${ch.no === 'پ' ? 'A' : ch.no}-${sec}`;
        ch.items.push({ id, label, title: h2 });
        return `<h2 id="${id}"><span class="num">${label}</span><span class="h2t">${h2}</span></h2>`;
      }
      if (!ch || !figNumbers) return m;
      fig++;
      return `<figcaption><span class="fig-no">شکل ${fa(ch.no)}-${fa(fig)}</span>`;
    },
  );
  const tocHtml =
    '<ol class="toc-list">' +
    toc
      .filter((c) => c.title)
      .map(
        (c) =>
          `<li class="toc-ch" style="--chc: var(--${c.color})"><a class="toc-ch-a" href="#ch${c.no === 'پ' ? 'A' : c.no}"><span class="toc-badge">${c.no === 'پ' ? 'پیوست' : 'فصل ' + fa(c.no)}</span><span>${c.title}</span></a>` +
          `<ol class="toc-secs">${c.items
            .map((s) => `<li><a href="#${s.id}"><span class="toc-n">${s.label}</span><span class="toc-t">${s.title.replace(/<[^>]+>/g, '')}</span></a></li>`)
            .join('')}</ol></li>`,
      )
      .join('') +
    '</ol>';
  return html.replace('<!--TOC-->', tocHtml);
}

// ---------- ساخت ----------
// دکمهٔ تغییر تم (روشن/تیره)، دکمه‌های «باز کردن همهٔ راه‌حل‌ها» و باز شدن خودکار راه‌حل‌ها هنگام چاپ
const THEME_EARLY = `<script>try{var t=localStorage.getItem('jozve-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}</script>`;
const THEME_BUTTON = `<button class="theme-toggle" type="button" aria-label="تغییر تم روشن و تیره"><span class="tt-icon" aria-hidden="true"></span><span class="tt-label"></span></button>`;
const SCRIPT = `<script>
(function () {
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function current() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return mq && mq.matches ? 'dark' : 'light';
  }
  function paint() {
    var dark = current() === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(function (b) {
      b.querySelector('.tt-icon').textContent = dark ? '☀' : '☾';
      b.querySelector('.tt-label').textContent = dark ? 'حالت روشن' : 'حالت تیره';
      b.setAttribute('aria-pressed', String(dark));
    });
  }
  function setAll(open) { document.querySelectorAll('details.sol').forEach(function (d) { d.open = open; }); }
  document.addEventListener('click', function (e) {
    var tb = e.target.closest('.theme-toggle');
    if (tb) {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('jozve-theme', next); } catch (err) {}
      paint();
      return;
    }
    var fb = e.target.closest('[data-diff-filter]');
    if (fb) {
      var v = fb.getAttribute('data-diff-filter');
      var w = document.querySelector('.tamrin');
      if (w) { if (v === 'all') w.removeAttribute('data-show'); else w.setAttribute('data-show', v); }
      document.querySelectorAll('[data-diff-filter]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === fb)); });
      return;
    }
    var b = e.target.closest('[data-toggle-all]');
    if (!b) return;
    var open = b.getAttribute('data-toggle-all') === 'open';
    setAll(open);
    document.querySelectorAll('[data-toggle-all]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
  });
  if (mq && mq.addEventListener) mq.addEventListener('change', paint);
  window.addEventListener('beforeprint', function () { setAll(true); });
  paint();
})();
</script>`;

function build(key) {
  const doc = DOCS[key];
  fs.mkdirSync(DIST, { recursive: true });
  let body = doc.parts.map((p) => processPart(fs.readFileSync(path.join(SRC, p), 'utf8'), p)).join('\n');
  body = numberAndToc(body, { figNumbers: doc.figNumbers !== false });
  const style = fs.readFileSync(path.join(SRC, 'style.css'), 'utf8');
  const fonts = fontCss();
  const kx = katexCss();

  const headBits =
    `<title>${doc.title}</title>\n` +
    `<meta name="claude:viewport-fit-sides" content="cover">\n` +
    `<meta name="description" content="${doc.desc}">\n` +
    THEME_EARLY + '\n' +
    `<style>\n${fonts}\n</style>\n<style>\n${kx}\n</style>\n<style>\n${style}\n</style>\n`;
  const page = `<div class="${doc.wrap}" dir="rtl" lang="fa">\n${THEME_BUTTON}\n${body}\n</div>\n` + SCRIPT + '\n';

  const full =
    `<!doctype html>\n<html lang="fa" dir="rtl">\n<head>\n<meta charset="utf-8">\n` +
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n` +
    headBits +
    `</head>\n<body>\n${page}</body>\n</html>\n`;
  const artifact = headBits + page;

  fs.writeFileSync(path.join(DIST, doc.out + '.html'), full);
  fs.writeFileSync(path.join(DIST, doc.artifact), artifact);
  const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + 'KB';
  console.log(`✓ dist/${doc.out}.html (${kb(full)})  ✓ dist/${doc.artifact} (${kb(artifact)})`);
  if (mathErrors) {
    console.error(`✗ ${mathErrors} خطای فرمول`);
    process.exitCode = 1;
  }
}

async function pdf(key) {
  const doc = DOCS[key];
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.emulateMedia({ media: 'print', colorScheme: 'light' });
  await page.goto('file://' + path.join(DIST, doc.out + '.html'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  await page.pdf({
    path: path.join(DIST, doc.out + '.pdf'),
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="width:100%;font-size:8.5px;color:#7a8296;font-family:\'Vazirmatn\',\'DejaVu Sans\',sans-serif;display:flex;justify-content:space-between;padding:0 14mm;direction:rtl">' +
      `<span>${doc.title}</span><span class="pageNumber"></span></div>`,
  });
  await browser.close();
  console.log(`✓ dist/${doc.out}.pdf`);
}

for (const key of Object.keys(DOCS)) {
  if (ONLY && key !== ONLY) continue;
  build(key);
  if (process.argv.includes('--pdf')) await pdf(key);
}
