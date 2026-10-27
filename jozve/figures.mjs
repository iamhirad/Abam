// شکل‌های جزوه: هر تابع یک SVG (یا جدول HTML) برمی‌گرداند.
// در قطعه‌های src با <!--FIG:name--> صدا زده می‌شوند. رنگ‌ها از توکن‌های CSS می‌آیند
// تا در حالت روشن و تیره هر دو خوانا باشند.

const FA = '۰۱۲۳۴۵۶۷۸۹';
const fa = (s) => String(s).replace(/\d/g, (d) => FA[d]);
const r1 = (x) => Math.round(x * 10) / 10;

function svg(w, h, body, label) {
  return `<svg class="sv" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}
// برچسب ریاضی ساده: x^2 ، x^{ab} ، x_0 ، x_{ab} به tspan بالانویس/زیرنویس تبدیل می‌شوند.
function ml(s) {
  // پرانتز آکولاد تودرتو را هم می‌پذیرد: n^{log_b a}
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if ((ch === '^' || ch === '_') && i + 1 < s.length) {
      let t;
      if (s[i + 1] === '{') {
        let depth = 0, j = i + 1;
        for (; j < s.length; j++) {
          if (s[j] === '{') depth++;
          else if (s[j] === '}' && --depth === 0) break;
        }
        t = s.slice(i + 2, j);
        i = j;
      } else {
        const m = s.slice(i + 1).match(/^[A-Za-z0-9]+/);
        if (!m) { out += ch; continue; }
        t = m[0];
        i += t.length;
      }
      const dy = ch === '^' ? -6 : 4;
      out += `<tspan dy="${dy}" font-size="72%">${ml(t)}</tspan><tspan dy="${-dy}">​</tspan>`;
    } else out += ch;
  }
  return out;
}
const T = (x, y, s, cls = 'sv-t', anchor = 'middle', extra = '') =>
  `<text x="${r1(x)}" y="${r1(y)}" class="${cls}" text-anchor="${anchor}"${extra}>${ml(s)}</text>`;
// متن فارسی: جهت rtl می‌گیرد؛ معنای هندسی anchor را ثابت نگه می‌داریم
// (end یعنی لبهٔ راست متن روی x، start یعنی لبهٔ چپ متن روی x).
const TF = (x, y, s, cls = 'sv-t', anchor = 'middle') =>
  T(x, y, s, cls, anchor === 'start' ? 'end' : anchor === 'end' ? 'start' : anchor, ' direction="rtl"');
const L = (x1, y1, x2, y2, cls = 'sv-ln') => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" class="${cls}"/>`;
const R = (x, y, w, h, cls, rx = 4) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${rx}" class="${cls}"/>`;
const C = (x, y, r, cls) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" class="${cls}"/>`;
const P = (d, cls) => `<path d="${d}" class="${cls}"/>`;
const ARROW_DEFS = `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="sv-ah"/></marker><marker id="ahc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="sv-ahc"/></marker></defs>`;

function plotPath(f, x0, x1, sx, sy, yMax, steps = 200) {
  let d = '';
  let pen = false;
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const y = f(x);
    if (!isFinite(y) || y > yMax * 1.02 || y < -1e-9) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'}${r1(sx(x))},${r1(sy(Math.min(y, yMax)))} `;
    pen = true;
  }
  return d.trim();
}

// ---------------------------------------------------------------- رشد توابع
export function growth() {
  const W = 560, H = 330, ox = 50, oy = 290, xw = 470, yh = 260;
  const X = 12, Y = 60;
  const sx = (x) => ox + (x / X) * xw;
  const sy = (y) => oy - (y / Y) * yh;
  const fns = [
    { f: (n) => Math.log2(Math.max(n, 1)), lab: 'log n', cls: 'sv-c2', tx: 'sv-tc2' },
    { f: (n) => n, lab: 'n', cls: 'sv-c1', tx: 'sv-tc1' },
    { f: (n) => n * Math.log2(Math.max(n, 1)), lab: 'n log n', cls: 'sv-c3', tx: 'sv-tc3' },
    { f: (n) => n * n, lab: 'n^2', cls: 'sv-c4', tx: 'sv-tc4' },
    { f: (n) => 2 ** n, lab: '2^n', cls: 'sv-cw', tx: 'sv-tcw' },
  ];
  let b = '';
  for (let y = 0; y <= Y; y += 10) b += L(ox, sy(y), ox + xw, sy(y), 'sv-grid') + T(ox - 8, sy(y) + 4, fa(y), 'sv-tm sv-small', 'end');
  for (let x = 0; x <= X; x += 2) b += T(sx(x), oy + 18, fa(x), 'sv-tm sv-small');
  b += L(ox, oy, ox + xw, oy, 'sv-axis') + L(ox, oy, ox, oy - yh, 'sv-axis');
  b += T(ox + xw + 16, oy + 4, 'n', 'sv-math', 'start');
  for (const g of fns) {
    b += P(plotPath(g.f, 0.01, X, sx, sy, Y), `${g.cls} sv-curve`);
    // برچسب در انتهای منحنی
    let x = X;
    if (g.f(X) > Y) {
      let lo = 0, hi = X;
      for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (g.f(m) > Y) hi = m; else lo = m; }
      x = lo;
    }
    const y = Math.min(g.f(x), Y);
    const lx = g.f(X) > Y ? sx(x) + 8 : sx(x) - 4;
    const ly = g.f(X) > Y ? sy(y) + 6 : sy(y) - 8;
    b += T(lx, ly, g.lab, `sv-math ${g.tx}`, g.f(X) > Y ? 'start' : 'end');
  }
  return svg(W, H, b, 'نمودار رشد توابع log n، n، n log n، n² و 2^n');
}

// ---------------------------------------------------------------- تقاطع 30n+8 و n²+1
export function crossing() {
  const W = 560, H = 320, ox = 60, oy = 280, xw = 460, yh = 250;
  const X = 45, Y = 1800;
  const sx = (x) => ox + (x / X) * xw;
  const sy = (y) => oy - (y / Y) * yh;
  let b = '';
  for (let y = 0; y <= Y; y += 300) b += L(ox, sy(y), ox + xw, sy(y), 'sv-grid') + T(ox - 8, sy(y) + 4, fa(y), 'sv-tm sv-small', 'end');
  for (let x = 0; x <= X; x += 5) b += T(sx(x), oy + 18, fa(x), 'sv-tm sv-small');
  b += L(ox, oy, ox + xw, oy, 'sv-axis') + L(ox, oy, ox, oy - yh, 'sv-axis');
  b += P(plotPath((n) => 30 * n + 8, 0, X, sx, sy, Y), 'sv-c1 sv-curve');
  b += P(plotPath((n) => n * n + 1, 0, X, sx, sy, Y), 'sv-c4 sv-curve');
  const xc = (30 + Math.sqrt(900 + 28)) / 2; // ≈ 30.23
  b += L(sx(xc), oy, sx(xc), sy(30 * xc + 8), 'sv-dash');
  b += C(sx(xc), sy(30 * xc + 8), 4.5, 'sv-dot');
  b += T(sx(X) - 4, sy(30 * X + 8) + 20, 'f_A(n) = 30n + 8', 'sv-math sv-tc1', 'end');
  b += T(sx(41.5) - 6, sy(41.5 * 41.5 + 1) - 4, 'f_B(n) = n^2 + 1', 'sv-math sv-tc4', 'end');
  b += TF(sx(xc) + 8, oy - 12, 'نقطهٔ تقاطع: n ≈ ۳۰٫۲', 'sv-t sv-small', 'start');
  return svg(W, H, b, 'مقایسهٔ رشد 30n+8 و n^2+1');
}

// ---------------------------------------------------------------- O / Ω / Θ
export function bigOmegaTheta() {
  const pw = 290, ph = 250, gap = 14;
  const W = pw * 3 + gap * 2, H = ph + 40;
  const X = 10;
  const panel = (k, title, curves, n0, sub) => {
    const ox = k * (pw + gap) + 30, oy = 220, xw = pw - 50, yh = 190, Y = 12;
    const sx = (x) => ox + (x / X) * xw;
    const sy = (y) => oy - (y / Y) * yh;
    let b = R(k * (pw + gap), 0, pw, ph + 30, 'sv-panel', 12);
    b += TF(k * (pw + gap) + pw / 2, 24, title, 'sv-t sv-bold');
    b += L(ox, oy, ox + xw, oy, 'sv-axis') + L(ox, oy, ox, oy - yh, 'sv-axis');
    b += `<rect x="${r1(sx(n0))}" y="${oy - yh}" width="${r1(sx(X) - sx(n0))}" height="${yh}" class="sv-zone"/>`;
    b += L(sx(n0), oy, sx(n0), oy - yh, 'sv-dash');
    b += T(sx(n0), oy + 16, 'n_0', 'sv-math');
    b += T(ox + xw, oy + 16, 'n', 'sv-math', 'end');
    for (const c of curves) {
      b += P(plotPath(c.f, 0, X, sx, sy, Y), `${c.cls} sv-curve`);
      b += T(sx(X) - 2, sy(c.f(X)) - 9, c.lab, `sv-math ${c.tx}`, 'end');
    }
    b += TF(k * (pw + gap) + pw / 2, ph + 18, sub, 'sv-tm sv-small');
    return b;
  };
  const f = (x) => 2.2 + 0.62 * x + 1.7 * Math.sin(1.9 * x) * Math.exp(-0.28 * x);
  const lastCross = (a, bfn, want) => {
    let n0 = 0;
    for (let x = 0; x <= X; x += 0.01) if (!want(a(x), bfn(x))) n0 = x;
    return n0 + 0.05;
  };
  const cgO = (x) => 3 + 0.75 * x;
  const cgW = (x) => 1.2 + 0.45 * x;
  const c2 = (x) => 3.4 + 0.82 * x;
  const c1 = (x) => 1.0 + 0.42 * x;
  let b = '';
  b += panel(0, 'O بزرگ — کران بالا', [
    { f: cgO, lab: 'c·g(n)', cls: 'sv-c1', tx: 'sv-tc1', dy: -8 },
    { f, lab: 'f(n)', cls: 'sv-c4', tx: 'sv-tc4', dy: 16 },
  ], lastCross(f, cgO, (a, c) => a <= c), 'از n_0 به بعد: f(n) ≤ c·g(n)');
  b += panel(1, 'Ω بزرگ — کران پایین', [
    { f, lab: 'f(n)', cls: 'sv-c4', tx: 'sv-tc4', dy: -8 },
    { f: cgW, lab: 'c·g(n)', cls: 'sv-c1', tx: 'sv-tc1', dy: 16 },
  ], lastCross(f, cgW, (a, c) => a >= c), 'از n_0 به بعد: f(n) ≥ c·g(n)');
  b += panel(2, 'Θ بزرگ — کران محکم', [
    { f: c2, lab: 'c_2·g(n)', cls: 'sv-c1', tx: 'sv-tc1', dy: -8 },
    { f, lab: 'f(n)', cls: 'sv-c4', tx: 'sv-tc4', dy: 4 },
    { f: c1, lab: 'c_1·g(n)', cls: 'sv-c2', tx: 'sv-tc2', dy: 16 },
  ], Math.max(lastCross(f, c2, (a, c) => a <= c), lastCross(f, c1, (a, c) => a >= c)), 'از n_0 به بعد: c_1g(n) ≤ f(n) ≤ c_2g(n)');
  return svg(W, H, b, 'تعریف نمادهای O، Ω و Θ به شکل نمودار');
}

// ---------------------------------------------------------------- مجموعه‌های تودرتو
export function nestedSets() {
  const W = 640, H = 420;
  const cx = 320, cy = 205;
  const rings = [
    { rx: 305, ry: 195, lab: 'O(n^2)', cls: 'sv-ring4', tx: 'sv-tc4' },
    { rx: 243, ry: 155, lab: 'O(n log n)', cls: 'sv-ring3', tx: 'sv-tc3' },
    { rx: 181, ry: 115, lab: 'O(n)', cls: 'sv-ring1', tx: 'sv-tc1' },
    { rx: 119, ry: 76, lab: 'O(log n)', cls: 'sv-ring2', tx: 'sv-tc2' },
    { rx: 58, ry: 37, lab: 'O(1)', cls: 'sv-ring5', tx: 'sv-tm' },
  ];
  const yOn = (r, dx) => r.ry * Math.sqrt(Math.max(0, 1 - (dx / r.rx) ** 2));
  // برچسب در نوار بین حلقهٔ k و حلقهٔ داخلی‌تر، پایین مرکز با فاصلهٔ افقی dx
  const inBand = (k, dx, text) => {
    const y = (yOn(rings[k], dx) + (rings[k + 1] ? yOn(rings[k + 1], dx) : 0)) / 2;
    return T(cx + dx, cy + y + 5, text, 'sv-math sv-small');
  };
  let b = '';
  for (const r of rings) {
    b += `<ellipse cx="${cx}" cy="${cy}" rx="${r.rx}" ry="${r.ry}" class="${r.cls}"/>`;
    b += T(cx, cy - r.ry + 22, r.lab, `sv-math sv-bold ${r.tx}`);
  }
  b += T(cx - 20, cy + 16, '4', 'sv-math') + T(cx + 22, cy + 16, '100', 'sv-math');
  b += inBand(3, 0, '3 log n');
  b += inBand(2, -62, '3n + 10') + inBand(2, 0, '2n − 1') + inBand(2, 62, '100n');
  b += inBand(1, -70, 'n log n + 100n') + inBand(1, 75, '5n + 10');
  b += inBand(0, -88, '2n^2 − 10n + 100') + inBand(0, 50, '10n + 5') + inBand(0, 125, '30');
  return svg(W, H, b, 'O(1) زیرمجموعهٔ O(log n) زیرمجموعهٔ O(n) زیرمجموعهٔ O(n log n) زیرمجموعهٔ O(n^2)');
}

// ---------------------------------------------------------------- مرتب‌سازی درجی
export function insertionSteps() {
  let a = [8, 2, 4, 9, 3, 6];
  const cw = 46, ch = 40, x0 = 150, rowH = 70;
  const rows = [];
  for (let j = 1; j < a.length; j++) {
    const key = a[j];
    let i = j - 1;
    while (i >= 0 && a[i] > key) i--;
    rows.push({ arr: a.slice(), j, key, dest: i + 1 });
    const b2 = a.slice();
    b2.splice(j, 1);
    b2.splice(i + 1, 0, key);
    a = b2;
  }
  rows.push({ arr: a.slice(), done: true });
  const W = x0 + cw * 6 + 40, H = rows.length * rowH + 20;
  let b = ARROW_DEFS;
  rows.forEach((r, k) => {
    const y = 28 + k * rowH;
    r.arr.forEach((v, idx) => {
      let cls = 'sv-cell';
      if (r.done || idx < r.j) cls = 'sv-cell-sorted';
      if (!r.done && idx === r.j) cls = 'sv-cell-key';
      b += R(x0 + idx * cw, y, cw - 4, ch, cls, 6);
      b += T(x0 + idx * cw + (cw - 4) / 2, y + 26, fa(v), 'sv-t sv-cellnum');
    });
    if (r.done) {
      b += TF(x0 - 14, y + 26, 'پایان ✓', 'sv-t sv-bold sv-tc2', 'end');
    } else {
      b += T(x0 - 14, y + 18, `j = ${r.j + 1}`, 'sv-math', 'end');
      b += T(x0 - 14, y + 36, `key = ${r.key}`, 'sv-math sv-small sv-tc4', 'end');
      if (r.dest !== r.j) {
        const xs = x0 + r.j * cw + (cw - 4) / 2;
        const xd = x0 + r.dest * cw + 2;
        b += `<path d="M${xs},${y + ch + 2} C${xs},${y + ch + 26} ${xd},${y + ch + 26} ${xd},${y + ch + 4}" class="sv-arrow-c" marker-end="url(#ahc)"/>`;
      }
    }
  });
  return svg(W, H, b, 'گام‌های مرتب‌سازی درجی روی آرایهٔ 8 2 4 9 3 6');
}

// ---------------------------------------------------------------- ردیف آرایه
export function arrayRow({ values, hl = [], split = null, label = '', index = true, sub = [] }) {
  const cw = 48, ch = 40, x0 = 20;
  const W = x0 * 2 + cw * values.length, H = index ? 92 : 70;
  let b = '';
  values.forEach((v, i) => {
    const inHl = hl.some(([a, z]) => i >= a && i <= z);
    const inSub = sub.find((s) => i >= s.from && i <= s.to);
    const cls = inHl ? 'sv-cell-hl' : inSub ? inSub.cls : 'sv-cell';
    b += R(x0 + i * cw, 14, cw - 4, ch, cls, 6);
    b += T(x0 + i * cw + (cw - 4) / 2, 40, String(v).replace('-', '−'), 'sv-math sv-cellnum');
    if (index) b += T(x0 + i * cw + (cw - 4) / 2, 72, fa(i + 1), 'sv-tm sv-small');
  });
  if (split !== null) b += L(x0 + split * cw - 2, 4, x0 + split * cw - 2, 64, 'sv-split');
  return svg(W, H, b, label || 'آرایه');
}

// ---------------------------------------------------------------- درخت فیبوناچی
function layoutTree(node, depth = 0, acc = { x: 0 }) {
  node.depth = depth;
  if (!node.kids || node.kids.length === 0) {
    node.x = acc.x++;
  } else {
    node.kids.forEach((k) => layoutTree(k, depth + 1, acc));
    node.x = (node.kids[0].x + node.kids[node.kids.length - 1].x) / 2;
  }
  return node;
}
function drawTree(root, { dx = 56, dy = 64, r = 19, x0 = 30, y0 = 30, nodeCls, label }) {
  layoutTree(root);
  let edges = '', nodes = '';
  let maxX = 0, maxD = 0;
  const walk = (n) => {
    maxX = Math.max(maxX, n.x);
    maxD = Math.max(maxD, n.depth);
    const X = x0 + n.x * dx, Y = y0 + n.depth * dy;
    (n.kids || []).forEach((k) => {
      edges += L(X, Y, x0 + k.x * dx, y0 + k.depth * dy, 'sv-edge');
      walk(k);
    });
    nodes += C(X, Y, n.r || r, nodeCls(n)) + T(X, Y + 5, n.t, `sv-math sv-node-t ${n.tcls || ''}`);
  };
  walk(root);
  return { body: edges + nodes, w: x0 * 2 + maxX * dx, h: y0 * 2 + maxD * dy };
}

export function fibTree() {
  const mk = (n) => ({ t: `F_${n}`, n, kids: n <= 2 ? [] : [mk(n - 1), mk(n - 2)] });
  const root = mk(6);
  const { body, w, h } = drawTree(root, {
    dx: 44, dy: 62, r: 18,
    nodeCls: (n) => (n.n === 3 ? 'sv-node-hl' : n.n <= 2 ? 'sv-node-leaf' : 'sv-node'),
  });
  return svg(w, h, body, 'درخت فراخوانی بازگشتی F6');
}

// ---------------------------------------------------------------- مرتب‌سازی ادغامی (مثل اسلاید)
export function mergeSortRows() {
  const rows = [
    { cells: 'ALGORITHMS'.split(''), gap: false, lab: 'ورودی', cost: '' },
    { cells: 'ALGORITHMS'.split(''), gap: true, lab: 'تقسیم', cost: 'O(1)' },
    { cells: 'AGLORHIMST'.split(''), gap: true, lab: 'مرتب‌سازی بازگشتی', cost: '2T(n/2)' },
    { cells: 'AGHILMORST'.split(''), gap: false, lab: 'ادغام', cost: 'O(n)' },
  ];
  const cw = 38, ch = 34, x0 = 20, rowH = 58, g = 26;
  const W = x0 + cw * 10 + g + 210, H = rows.length * rowH + 10;
  let b = '';
  rows.forEach((r, k) => {
    const y = 12 + k * rowH;
    r.cells.forEach((c, i) => {
      const x = x0 + i * cw + (r.gap && i >= 5 ? g : !r.gap ? g / 2 : 0);
      const cls = k === 3 ? 'sv-cell-sorted' : k === 2 ? (i < 5 ? 'sv-cell-a' : 'sv-cell-b') : 'sv-cell';
      b += R(x, y, cw - 4, ch, cls, 5) + T(x + (cw - 4) / 2, y + 23, c, 'sv-math sv-cellnum');
    });
    const xl = x0 + cw * 10 + g + 16;
    b += TF(xl + 190, y + 15, r.lab, 'sv-t sv-bold', 'end');
    if (r.cost) b += T(xl + 190, y + 32, r.cost, 'sv-math sv-tc', 'end');
  });
  return svg(W, H, b, 'مراحل مرتب‌سازی ادغامی روی ALGORITHMS');
}

// ---------------------------------------------------------------- درخت بازگشت
export function recursionTree({ general = false } = {}) {
  const W = 700, H = 380;
  const treeW = 470, x0 = 20;
  const levels = general
    ? [
        { n: 1, t: 'f(n)', cost: 'f(n)' },
        { n: 3, t: 'f(n/b)', cost: 'a·f(n/b)' },
        { n: 9, t: 'f(n/b^2)', cost: 'a^2·f(n/b^2)' },
      ]
    : [
        { n: 1, t: 'n', cost: 'n' },
        { n: 2, t: 'n/2', cost: '2·(n/2) = n' },
        { n: 4, t: 'n/4', cost: '4·(n/4) = n' },
        { n: 8, t: 'n/8', cost: '8·(n/8) = n' },
      ];
  const dy = 66;
  let b = '';
  const pos = [];
  levels.forEach((lv, d) => {
    const y = 34 + d * dy;
    pos[d] = [];
    for (let i = 0; i < lv.n; i++) pos[d].push({ x: x0 + ((i + 0.5) * treeW) / lv.n, y });
  });
  levels.forEach((lv, d) => {
    if (d === 0) return;
    const per = lv.n / levels[d - 1].n;
    pos[d].forEach((p, i) => {
      const par = pos[d - 1][Math.floor(i / per)];
      b += L(par.x, par.y + 13, p.x, p.y - 13, 'sv-edge');
    });
    if (general) b += T((pos[d - 1][0].x + pos[d][0].x) / 2 - 10, (pos[d - 1][0].y + pos[d][0].y) / 2, 'a', 'sv-math sv-tc');
  });
  levels.forEach((lv, d) => {
    pos[d].forEach((p) => {
      const w = Math.min(64, treeW / lv.n - 6);
      b += R(p.x - w / 2, p.y - 14, w, 28, 'sv-tnode', 7) + T(p.x, p.y + 5, lv.t, `sv-math ${lv.n > 4 ? 'sv-xsmall' : 'sv-small'}`);
    });
    b += T(W - 12, pos[d][0].y + 5, lv.cost, 'sv-math sv-tc', 'end');
  });
  const yDots = 34 + levels.length * dy - 18;
  b += T(x0 + treeW / 2, yDots, '⋮', 'sv-t sv-big');
  b += T(W - 70, yDots, '⋮', 'sv-t sv-big');
  const yLeaf = yDots + 40;
  const nLeaf = 16;
  for (let i = 0; i < nLeaf; i++) {
    const x = x0 + ((i + 0.5) * treeW) / nLeaf;
    b += R(x - 12, yLeaf - 11, 24, 22, 'sv-tnode-leaf', 5) + T(x, yLeaf + 4, general ? 'T(1)' : '1', 'sv-math sv-xxsmall');
  }
  b += T(W - 12, yLeaf + 5, general ? 'n^{log_b a} · T(1)' : '(n/2)·2 = n', 'sv-math sv-tc', 'end');
  // براکت ارتفاع
  const yTop = 34, yBot = yLeaf;
  b += L(x0 + treeW + 22, yTop, x0 + treeW + 22, yBot, 'sv-bracket');
  b += L(x0 + treeW + 16, yTop, x0 + treeW + 28, yTop, 'sv-bracket') + L(x0 + treeW + 16, yBot, x0 + treeW + 28, yBot, 'sv-bracket');
  b += T(x0 + treeW + 30, (yTop + yBot) / 2 + 5, general ? 'log_b n' : 'log_2 n', 'sv-math sv-small', 'start');
  const yTot = yLeaf + 44;
  b += L(W - 230, yTot - 22, W - 8, yTot - 22, 'sv-ln');
  b += TF(W - 12, yTot, general ? 'جمع: Σ a^k f(n/b^k) + Θ(n^{log_b a})' : 'جمع: n · log_2 n', 'sv-t sv-bold', 'end');
  return svg(W, yTot + 14, b, general ? 'درخت بازگشت رابطهٔ T(n)=aT(n/b)+f(n)' : 'درخت بازگشت مرتب‌سازی ادغامی');
}

// ---------------------------------------------------------------- سه حالت قضیهٔ اصلی
export function masterCases() {
  const pw = 230, gap = 14, W = pw * 3 + gap * 2, H = 250;
  const cases = [
    { title: 'برگ‌ها برنده‌اند', sub: 'T(n) = Θ(n^{log_b a})', ws: [0.12, 0.2, 0.32, 0.5, 0.78, 1], cls: 'sv-bar1' },
    { title: 'مساوی', sub: 'T(n) = Θ(f(n) · log n)', ws: [0.62, 0.62, 0.62, 0.62, 0.62, 0.62], cls: 'sv-bar2' },
    { title: 'ریشه برنده است', sub: 'T(n) = Θ(f(n))', ws: [1, 0.62, 0.38, 0.24, 0.15, 0.09], cls: 'sv-bar3' },
  ];
  let b = '';
  cases.forEach((c, k) => {
    const x = k * (pw + gap);
    b += R(x, 0, pw, H, 'sv-panel', 12);
    b += TF(x + pw / 2, 26, c.title, 'sv-t sv-bold');
    c.ws.forEach((w, i) => {
      const bw = w * (pw - 40);
      b += R(x + pw / 2 - bw / 2, 42 + i * 26, bw, 18, c.cls, 4);
    });
    b += TF(x + pw - 10, 42 + 6 * 26 + 4, '', 'sv-tm');
    b += T(x + pw / 2, H - 38, c.sub, 'sv-math sv-small');
    b += TF(x + pw / 2, H - 14, k === 0 ? 'هزینهٔ سطرها رو به پایین زیاد می‌شود' : k === 1 ? 'همهٔ سطرها هم‌وزن‌اند' : 'هزینهٔ سطرها رو به پایین کم می‌شود', 'sv-tm sv-xsmall');
  });
  return svg(W, H, b, 'سه حالت قضیهٔ اصلی به شکل هزینهٔ سطرهای درخت بازگشت');
}

// ---------------------------------------------------------------- تقسیم بیت‌ها در ضرب
export function karatsubaSplit() {
  const W = 560, H = 150, x0 = 40, bw = 440;
  let b = '';
  const bar = (y, name, hi, lo) => {
    b += T(x0 - 10, y + 24, name, 'sv-math sv-bold', 'end');
    b += R(x0, y, bw / 2 - 2, 36, 'sv-cell-a', 6) + R(x0 + bw / 2 + 2, y, bw / 2 - 2, 36, 'sv-cell-b', 6);
    b += T(x0 + bw / 4, y + 24, hi, 'sv-math') + T(x0 + (3 * bw) / 4, y + 24, lo, 'sv-math');
  };
  bar(14, 'a', 'a_1', 'a_0');
  bar(70, 'b', 'b_1', 'b_0');
  b += T(x0 + bw / 4, H - 12, '← n/2 بیت →', 'sv-tm sv-small') + T(x0 + (3 * bw) / 4, H - 12, '← n/2 بیت →', 'sv-tm sv-small');
  return svg(W, H, b, 'تقسیم هر عدد n بیتی به دو نیمهٔ n/2 بیتی');
}

// ---------------------------------------------------------------- G(3, 1/3)
export function gnp() {
  const cw = 130, chh = 120, W = cw * 4 + 10, H = chh * 2 + 10;
  const graphs = [
    [[], '8/27'], [[[0, 1]], '4/27'], [[[1, 2]], '4/27'], [[[0, 2]], '4/27'],
    [[[0, 1], [1, 2], [0, 2]], '1/27'], [[[0, 1], [0, 2]], '2/27'], [[[0, 1], [1, 2]], '2/27'], [[[0, 2], [1, 2]], '2/27'],
  ];
  // رأس ۰: بالا، ۱: پایین چپ، ۲: پایین راست
  let b = '';
  graphs.forEach(([edges, p], k) => {
    const gx = (k % 4) * cw + 5, gy = Math.floor(k / 4) * chh + 5;
    b += R(gx + 3, gy + 3, cw - 6, chh - 6, 'sv-panel', 10);
    const V = [[gx + 52, gy + 30], [gx + 22, gy + 92], [gx + 82, gy + 92]];
    edges.forEach(([u, v]) => (b += L(V[u][0], V[u][1], V[v][0], V[v][1], 'sv-gedge')));
    V.forEach(([x, y]) => (b += C(x, y, 9, 'sv-gnode')));
    const [num, den] = p.split('/');
    b += T(gx + 110, gy + 52, num, 'sv-math sv-bold sv-tc') + L(gx + 98, gy + 59, gx + 122, gy + 59, 'sv-ln') + T(gx + 110, gy + 77, den, 'sv-math sv-bold sv-tc');
  });
  return svg(W, H, b, 'هشت گراف ممکن روی سه رأس در G(3,1/3) با احتمال هرکدام');
}

// ---------------------------------------------------------------- جدول دو تاس
export function diceGrid() {
  const c = 44, x0 = 60, y0 = 50, W = x0 + c * 6 + 20, H = y0 + c * 6 + 20;
  let b = '';
  b += T(x0 + c * 3, 20, 'j (تاس دوم)', 'sv-t sv-small', 'middle', ' direction="ltr"');
  b += T(16, y0 + c * 3, 'i', 'sv-math');
  for (let j = 1; j <= 6; j++) b += T(x0 + (j - 0.5) * c, y0 - 10, fa(j), 'sv-tm sv-bold');
  for (let i = 1; i <= 6; i++) {
    b += T(x0 - 14, y0 + (i - 0.5) * c + 5, fa(i), 'sv-tm sv-bold');
    for (let j = 1; j <= 6; j++) {
      const s = i + j;
      const lvl = 6 - Math.abs(s - 7); // 1..6
      b += R(x0 + (j - 1) * c + 2, y0 + (i - 1) * c + 2, c - 4, c - 4, `sv-heat sv-heat${lvl}`, 6);
      b += T(x0 + (j - 0.5) * c, y0 + (i - 0.5) * c + 6, fa(s), 'sv-t sv-cellnum');
    }
  }
  return svg(W, H, b, 'جدول ۳۶ حالت پرتاب دو تاس و مجموع آن‌ها');
}

// ---------------------------------------------------------------- میانهٔ تقریبی
export function approxBand() {
  const W = 620, H = 120, x0 = 30, x1 = 590;
  let b = '';
  const lo = 0.25, hi = 0.75;
  b += R(x0, 40, x1 - x0, 26, 'sv-cell', 6);
  b += R(x0 + lo * (x1 - x0), 40, (hi - lo) * (x1 - x0), 26, 'sv-cell-hl', 6);
  b += T(x0, 88, '1', 'sv-math') + T(x1, 88, 'n', 'sv-math');
  b += T(x0 + lo * (x1 - x0), 88, '(½ − δ)(n+1)', 'sv-math sv-small');
  b += T(x0 + hi * (x1 - x0), 88, '(½ + δ)(n+1)', 'sv-math sv-small');
  b += T(x0 + 0.5 * (x1 - x0), 112, 'median', 'sv-math sv-tm sv-small');
  b += L(x0 + 0.5 * (x1 - x0), 34, x0 + 0.5 * (x1 - x0), 72, 'sv-dash');
  b += TF(x0 + 0.5 * (x1 - x0), 26, 'رتبه‌های «خوب»: حدود ۲δn عنصر', 'sv-t sv-bold sv-tc');
  return svg(W, H, b, 'بازهٔ رتبه‌های قابل قبول برای میانهٔ تقریبی');
}

// ---------------------------------------------------------------- مسئلهٔ استخدام
export function hiring() {
  const q = [3, 1, 4, 7, 2, 9, 5, 8, 6, 10];
  const W = 600, H = 250, x0 = 40, base = 200, bw = 46, sc = 16;
  let b = '';
  let best = 0;
  q.forEach((v, i) => {
    const hire = v > best;
    if (hire) best = v;
    const x = x0 + i * (bw + 8);
    b += R(x, base - v * sc, bw, v * sc, hire ? 'sv-bar-hire' : 'sv-bar-skip', 5);
    b += T(x + bw / 2, base - v * sc - 8, fa(v), 'sv-t sv-small sv-bold');
    b += T(x + bw / 2, base + 18, fa(i + 1), 'sv-tm sv-small');
    if (hire) b += TF(x + bw / 2, base + 38, 'استخدام', 'sv-t sv-xsmall sv-tc');
  });
  b += L(x0 - 6, base, x0 + 10 * (bw + 8), base, 'sv-axis');
  return svg(W, H, b, 'کیفیت ۱۰ متقاضی به ترتیب ورود و لحظه‌های استخدام');
}

// ---------------------------------------------------------------- درخت جداکننده‌ها در کوئیک‌سورت
export function bstSplitters() {
  const n = (i, kids = []) => ({ t: `x_{${i}}`, i, kids });
  const root = n(10, [
    n(5, [n(3, [n(2, [n(1)]), n(4)]), n(9, [n(7, [n(6), n(8)])])]),
    n(13, [n(11, [n(12)]), n(16, [n(15, [n(14)]), n(17)])]),
  ]);
  // چیدمان بر اساس اندیس عنصر (ترتیب میان‌وندی = ترتیب مرتب)
  const dx = 40, dy = 64, x0 = 26, y0 = 28;
  let edges = '', nodes = '';
  const depthOf = new Map();
  const walk = (v, d) => {
    depthOf.set(v.i, d);
    v.kids.forEach((k) => {
      edges += L(x0 + (v.i - 1) * dx, y0 + d * dy, x0 + (k.i - 1) * dx, y0 + (d + 1) * dy, 'sv-edge');
      walk(k, d + 1);
    });
    const cls = v.i === 2 || v.i === 7 ? 'sv-node-hl' : v.i >= 3 && v.i <= 6 ? 'sv-node-mid' : 'sv-node';
    nodes += C(x0 + (v.i - 1) * dx, y0 + d * dy, 17, cls) + T(x0 + (v.i - 1) * dx, y0 + d * dy + 5, v.t, 'sv-math sv-node-t');
  };
  walk(root, 0);
  return svg(x0 * 2 + 16 * dx, y0 * 2 + 4 * dy, edges + nodes, 'درخت دودویی جداکننده‌های کوئیک‌سورت برای ۱۷ عنصر');
}

// ---------------------------------------------------------------- میانهٔ میانه‌ها
const MOM_GROUPS = [
  [12, 3, 21, 7, 18],
  [5, 24, 1, 16, 10],
  [22, 9, 14, 2, 19],
  [8, 25, 13, 20, 4],
  [17, 6, 23, 11, 15],
];
export function momGroups({ sorted = false } = {}) {
  let groups = MOM_GROUPS.map((g, i) => Object.assign(g.slice(), { id: i }));
  if (sorted) {
    groups = groups.map((g) => Object.assign(g.slice().sort((a, b) => a - b), { id: g.id }));
    groups.sort((a, b) => a[2] - b[2]);
  }
  const c = 46, x0 = 30, y0 = 34, gap = 16;
  const W = x0 * 2 + 5 * c + 4 * gap, H = y0 + 5 * c + 26;
  let b = '';
  const pivotCol = 2, pivotRow = 2;
  groups.forEach((g, col) => {
    const x = x0 + col * (c + gap);
    b += T(x + c / 2, 18, `G_${g.id + 1}`, 'sv-math sv-tm sv-small');
    g.forEach((v, row) => {
      let cls = 'sv-cell';
      if (sorted) {
        if (col === pivotCol && row === pivotRow) cls = 'sv-cell-key';
        else if (col <= pivotCol && row <= pivotRow) cls = 'sv-cell-small';
        else if (col >= pivotCol && row >= pivotRow) cls = 'sv-cell-big';
        else if (row === pivotRow) cls = 'sv-cell-med';
      }
      b += R(x, y0 + row * c, c - 4, c - 4, cls, 6) + T(x + (c - 4) / 2, y0 + row * c + 28, fa(v), 'sv-t sv-cellnum');
    });
  });
  if (sorted) b += TF(W / 2, H - 4, 'ردیف وسط = میانهٔ هر گروه', 'sv-tm sv-small');
  return svg(W, H, b, sorted ? 'گروه‌های پنج‌تایی پس از مرتب‌سازی و چیدن بر اساس میانه' : 'تقسیم ۲۵ عدد به پنج گروه پنج‌تایی');
}

// ---------------------------------------------------------------- پشته و multipop
export function stackMultipop() {
  const W = 520, H = 230;
  let b = ARROW_DEFS;
  const stack = (x, items, popped = 0, title) => {
    const w = 90, h = 30, base = 190;
    b += P(`M${x},${base - 6 * h - 6} L${x},${base} L${x + w},${base} L${x + w},${base - 6 * h - 6}`, 'sv-ln sv-thick');
    items.forEach((v, i) => {
      const cls = i >= items.length - popped ? 'sv-cell-gone' : 'sv-cell-sorted';
      b += R(x + 5, base - (i + 1) * h, w - 10, h - 4, cls, 5) + T(x + w / 2, base - (i + 1) * h + 18, fa(v), 'sv-t sv-cellnum');
    });
    b += TF(x + w / 2, base + 26, title, 'sv-t sv-small sv-bold');
  };
  stack(40, [8, 3, 5, 1, 7, 4], 0, 'پیش از عمل');
  b += `<path d="M175,110 L300,110" class="sv-arrow" marker-end="url(#ah)"/>`;
  b += T(238, 98, 'MULTIPOP(S, 4)', 'sv-math sv-small');
  stack(330, [8, 3, 5, 1, 7, 4], 4, 'پس از عمل');
  return svg(W, H, b, 'اثر MULTIPOP(S,4) روی یک پشتهٔ شش‌عنصری');
}

// ---------------------------------------------------------------- جدول شمارندهٔ دودویی (HTML)
export function counterTable() {
  const k = 8;
  let rows = '';
  let total = 0;
  let prev = 0;
  for (let v = 0; v <= 16; v++) {
    let cost = 0;
    if (v > 0) {
      const flipped = prev ^ v;
      cost = flipped.toString(2).split('').filter((x) => x === '1').length;
      total += cost;
    }
    const bits = v.toString(2).padStart(k, '0').split('');
    const flipped = v > 0 ? (prev ^ v) : 0;
    const cells = bits
      .map((bit, idx) => {
        const pos = k - 1 - idx;
        const fl = (flipped >> pos) & 1;
        return `<td class="bit ${bit === '1' ? 'one' : 'zero'}${fl ? ' flip' : ''}">${bit}</td>`;
      })
      .join('');
    rows += `<tr><td class="cv">${fa(v)}</td>${cells}<td class="cc">${v ? fa(cost) : '—'}</td><td class="ct">${fa(total)}</td><td class="c2n">${fa(2 * v)}</td></tr>`;
    prev = v;
  }
  const head = Array.from({ length: k }, (_, i) => `<th dir="ltr">A[${k - 1 - i}]</th>`).join('');
  return `<div class="tbl-wrap"><table class="counter-tbl" dir="ltr"><thead><tr><th>مقدار</th>${head}<th>هزینهٔ این افزایش</th><th>هزینهٔ کل</th><th>۲n</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export const FIGS = {
  growth, crossing, bigOmegaTheta, nestedSets, insertionSteps, fibTree, mergeSortRows,
  recursionTreeMerge: () => recursionTree(), recursionTreeGeneral: () => recursionTree({ general: true }),
  masterCases, karatsubaSplit, gnp, diceGrid, approxBand, hiring, bstSplitters,
  momGroups: () => momGroups(), momSorted: () => momGroups({ sorted: true }), stackMultipop, counterTable,
  maxSub: () => arrayRow({ values: [4, -7, 12, 5, -2, 3, -5, 1, 5, -8, 2, 5], label: 'آرایهٔ نمونه' }),
  maxSubAns: () => arrayRow({ values: [4, -7, 12, 5, -2, 3, -5, 1, 5, -8, 2, 5], hl: [[2, 8]], label: 'زیرآرایهٔ بهینه با مجموع ۱۹' }),
  maxSubDC: () =>
    arrayRow({
      values: [4, -7, 12, 5, -2, 3, -5, 1, 5, -8, 2, 5],
      split: 6,
      sub: [
        { from: 2, to: 5, cls: 'sv-cell-a' },
        { from: 6, to: 8, cls: 'sv-cell-b' },
      ],
      label: 'زیرآرایهٔ قطع‌کنندهٔ خط وسط',
    }),
};
