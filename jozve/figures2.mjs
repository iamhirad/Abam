// شکل‌های فصل‌های ۵ تا ۹: لیست، پشته، صف، درخت، درخت عبارت، هرم و مرتب‌سازی.
import { fa, r1, svg, T, TF, L, R, C, P, ARROW_DEFS } from './figures.mjs';

// ---------------------------------------------------------------- ابزار درخت عمومی
// spec: [برچسب, فرزند۱, فرزند۲, ...] ؛ null یعنی جای خالی (برای درخت دودویی)
function parse(spec) {
  if (spec == null) return null;
  const [t, ...kids] = spec;
  return { t: String(t), kids: kids.map(parse) };
}
function layoutLeaves(n, d, acc) {
  n.depth = d;
  const real = n.kids.filter(Boolean);
  if (!real.length) {
    n.x = acc.x++;
    return;
  }
  real.forEach((k) => layoutLeaves(k, d + 1, acc));
  n.x = (real[0].x + real[real.length - 1].x) / 2;
}
function layoutInorder(n, d, acc) {
  n.depth = d;
  const [l, r] = [n.kids[0] || null, n.kids[1] || null];
  if (l) layoutInorder(l, d + 1, acc);
  n.x = acc.x++;
  if (r) layoutInorder(r, d + 1, acc);
}
function walk(n, f) {
  if (!n) return;
  f(n);
  n.kids.forEach((k) => walk(k, f));
}

// بدنهٔ یک درخت را می‌سازد و {body, w, h} برمی‌گرداند
function treeBody(spec, o = {}) {
  const {
    dx = 52, dy = 62, r = 18, rw = 0, rh = 30, x0 = 28, y0 = 26, layout = 'leaves', arrows = false,
    hl = {}, note = {}, labelCls = 'sv-math', edgeLabel = null, nodeCls = 'sv-node', ox = 0, oy = 0,
  } = o;
  const root = parse(spec);
  if (layout === 'inorder') layoutInorder(root, 0, { x: 0 });
  else layoutLeaves(root, 0, { x: 0 });
  let maxX = 0, maxD = 0;
  walk(root, (n) => { maxX = Math.max(maxX, n.x); maxD = Math.max(maxD, n.depth); });
  const X = (n) => ox + x0 + n.x * dx + (rw ? rw / 2 - r : 0);
  const Y = (n) => oy + y0 + n.depth * dy;
  const half = rw ? { w: rw / 2, h: rh / 2 } : { w: r, h: r };
  let edges = '', nodes = '', labels = '';
  walk(root, (n) => {
    n.kids.forEach((k, i) => {
      if (!k) return;
      const x1 = X(n), y1 = Y(n), x2 = X(k), y2 = Y(k);
      const len = Math.hypot(x2 - x1, y2 - y1);
      const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      // فاصله از مرز گره (دایره یا مستطیل)
      const cut = (hw, hh) => (rw ? Math.min(hw / Math.max(Math.abs(ux), 1e-6), hh / Math.max(Math.abs(uy), 1e-6)) : hw);
      const s = cut(half.w, half.h) + 1;
      const e = cut(half.w, half.h) + (arrows ? 4 : 1);
      edges += `<line x1="${r1(x1 + ux * s)}" y1="${r1(y1 + uy * s)}" x2="${r1(x2 - ux * e)}" y2="${r1(y2 - uy * e)}" class="sv-edge"${arrows ? ' marker-end="url(#ah)"' : ''}/>`;
      if (edgeLabel) {
        const lab = edgeLabel(n, i, k);
        if (lab) labels += T((x1 + x2) / 2 + (x2 < x1 ? -10 : 10), (y1 + y2) / 2 + 2, lab, 'sv-math sv-small sv-tc sv-halo');
      }
    });
    const cls = hl[n.t] || nodeCls;
    if (rw) nodes += R(X(n) - rw / 2, Y(n) - rh / 2, rw, rh, cls === 'sv-node' ? 'sv-tnode' : cls, 8);
    else nodes += C(X(n), Y(n), r, cls);
    nodes += T(X(n), Y(n) + 5, n.t, `${labelCls} sv-node-t`);
    if (note[n.t]) {
      const ny = Y(n) + (rw ? rh / 2 : r) + 15, nw = note[n.t].length * 6.4 + 8;
      nodes += `<rect x="${r1(X(n) - nw / 2)}" y="${r1(ny - 12)}" width="${r1(nw)}" height="16" rx="4" class="sv-halo-bg"/>`;
      nodes += T(X(n), ny, note[n.t], 'sv-math sv-small sv-tc');
    }
  });
  const w = ox + x0 * 2 + maxX * dx + (rw ? rw - 2 * r : 0);
  const h = oy + y0 * 2 + maxD * dy + (Object.keys(note).length ? 16 : 0);
  return { body: edges + labels + nodes, w, h };
}
function treeFig(spec, o = {}, label = 'درخت') {
  const { body, w, h } = treeBody(spec, o);
  return svg(w, h, (o.arrows ? ARROW_DEFS : '') + body, label);
}
// چند پنل کنار هم با عنوان
function panels(list, label, { gap = 16, titleH = 30, arrows = false } = {}) {
  let x = 0, body = arrows ? ARROW_DEFS : '';
  let H = 0;
  const parts = list.map((p) => {
    const t = treeBody(p.spec, { ...p.o, ox: 0, oy: titleH });
    H = Math.max(H, t.h);
    return { ...p, ...t };
  });
  for (const p of parts) {
    body += R(x, 0, p.w, H + 6, 'sv-panel', 12);
    body += `<g transform="translate(${r1(x)},0)">${p.body}</g>`;
    if (p.title) body += TF(x + p.w / 2, 22, p.title, 'sv-t sv-bold');
    x += p.w + gap;
  }
  return svg(x - gap, H + 8, body, label);
}

// ---------------------------------------------------------------- آرایه در حافظه
export function arrayMemory() {
  const vals = [17, 24, 31, 46, 52, 68];
  const cw = 70, x0 = 30, W = x0 * 2 + cw * vals.length, H = 150;
  let b = '';
  vals.forEach((v, i) => {
    const x = x0 + i * cw;
    b += R(x, 40, cw - 6, 46, 'sv-cell-sorted', 6) + T(x + (cw - 6) / 2, 70, fa(v), 'sv-t sv-cellnum');
    b += T(x + (cw - 6) / 2, 28, `index ${i}`, 'sv-math sv-small sv-tc');
    b += T(x + (cw - 6) / 2, 106, `${1000 + 4 * i}`, 'sv-math sv-small');
  });
  b += TF(W / 2, 136, 'نشانی هر خانه = ۱۰۰۰ + i × ۴  (اندازهٔ هر عنصر ۴ بایت)', 'sv-tm sv-small');
  return svg(W, H, b, 'آرایه در خانه‌های پشت سر هم حافظه');
}

export function arrayInsert() {
  const before = [10, 20, 30, 40, 50, null];
  const after = [10, 20, 25, 30, 40, 50];
  const cw = 58, x0 = 110, W = x0 + cw * 6 + 30, H = 200;
  let b = ARROW_DEFS;
  const row = (arr, y, hlIdx, label) => {
    b += TF(x0 - 16, y + 26, label, 'sv-t sv-bold', 'end');
    arr.forEach((v, i) => {
      const cls = v == null ? 'sv-cell-gone' : i === hlIdx ? 'sv-cell-key' : i > hlIdx && hlIdx >= 0 ? 'sv-cell-a' : 'sv-cell';
      b += R(x0 + i * cw, y, cw - 6, 40, cls, 6);
      if (v != null) b += T(x0 + i * cw + (cw - 6) / 2, y + 26, fa(v), 'sv-t sv-cellnum');
      b += T(x0 + i * cw + (cw - 6) / 2, y - 6, fa(i), 'sv-tm sv-xsmall');
    });
  };
  row(before, 30, -1, 'پیش از درج');
  row(after, 140, 2, 'پس از درج');
  for (let i = 4; i >= 2; i--) {
    const xs = x0 + i * cw + (cw - 6) / 2, xd = x0 + (i + 1) * cw + (cw - 6) / 2;
    b += `<path d="M${xs},74 C${xs},102 ${xd},102 ${xd},134" class="sv-arrow-c" marker-end="url(#ahc)"/>`;
  }
  return svg(W, H, b, 'درج ۲۵ در اندیس ۲ با جابه‌جایی عناصر بعدی');
}

// ---------------------------------------------------------------- لیست پیوندی
// rows: [{label, items:[{v, cls}], head:true, nul:true, doubly:false, gapAfter: index}]
function listRow(b, y, row, x0, { nw = 52, pw = 26, gap = 34 } = {}) {
  const { items, head = true, nul = true, doubly = false, label } = row;
  let x = x0;
  if (label) b.s += TF(x0 - 14, y + 24, label, 'sv-t sv-bold sv-small', 'end');
  if (head) {
    b.s += T(x, y + 24, 'head', 'sv-math sv-small sv-tc', 'start');
    b.s += `<line x1="${x + 38}" y1="${y + 19}" x2="${x + 58}" y2="${y + 19}" class="sv-arrow" marker-end="url(#ah)"/>`;
    x += 62;
  }
  const boxW = doubly ? pw + nw + pw : nw + pw;
  items.forEach((it, i) => {
    const cls = it.cls || 'sv-cell-sorted';
    if (doubly) {
      b.s += R(x, y, pw, 38, 'sv-cell', 4) + R(x + pw, y, nw, 38, cls, 4) + R(x + pw + nw, y, pw, 38, 'sv-cell', 4);
      b.s += C(x + pw / 2, y + 19, 3, 'sv-dot-ink') + C(x + pw + nw + pw / 2, y + 19, 3, 'sv-dot-ink');
      b.s += T(x + pw + nw / 2, y + 25, fa(it.v), 'sv-t sv-cellnum');
    } else {
      b.s += R(x, y, nw, 38, cls, 4) + R(x + nw, y, pw, 38, 'sv-cell', 4);
      b.s += T(x + nw / 2, y + 25, String(it.v).match(/^\d+$/) ? fa(it.v) : it.v, 'sv-t sv-cellnum');
      b.s += C(x + nw + pw / 2, y + 19, 3, 'sv-dot-ink');
    }
    const last = i === items.length - 1;
    if (!last) {
      const ax = doubly ? x + pw + nw + pw / 2 : x + nw + pw / 2;
      b.s += `<line x1="${ax}" y1="${y + (doubly ? 12 : 19)}" x2="${x + boxW + gap - 2}" y2="${y + (doubly ? 12 : 19)}" class="sv-arrow" marker-end="url(#ah)"/>`;
      if (doubly) b.s += `<line x1="${x + boxW + gap + pw / 2}" y1="${y + 27}" x2="${x + boxW + 2}" y2="${y + 27}" class="sv-arrow" marker-end="url(#ah)"/>`;
    } else if (nul) {
      const ax = doubly ? x + pw + nw + pw / 2 : x + nw + pw / 2;
      b.s += `<line x1="${ax}" y1="${y + 19}" x2="${x + boxW + 26}" y2="${y + 19}" class="sv-arrow" marker-end="url(#ah)"/>`;
      b.s += T(x + boxW + 30, y + 24, 'NULL', 'sv-math sv-small sv-tm', 'start');
    }
    x += boxW + gap;
  });
  return x;
}
function listFig(rows, label, { x0 = 20, rowH = 70, extraW = 70 } = {}) {
  const b = { s: ARROW_DEFS };
  let maxX = 0;
  rows.forEach((row, k) => (maxX = Math.max(maxX, listRow(b, 12 + k * rowH, row, x0))));
  return svg(maxX + extraW, rows.length * rowH + 4, b.s, label);
}
export const listBasic = () => listFig([{ items: [12, 27, 19, 44].map((v) => ({ v })) }], 'لیست پیوندی یک‌طرفه با چهار گره');
export const listInsertFront = () =>
  listFig(
    [
      { label: 'پیش', items: [{ v: 12 }, { v: 27 }] },
      { label: 'پس', items: [{ v: 5, cls: 'sv-cell-key' }, { v: 12 }, { v: 27 }] },
    ],
    'درج ۵ در ابتدای لیست',
    { x0: 70 },
  );
export const listInsertAfter = () =>
  listFig(
    [
      { label: 'پیش', items: [{ v: 12 }, { v: 27, cls: 'sv-cell-b' }, { v: 44 }] },
      { label: 'پس', items: [{ v: 12 }, { v: 27, cls: 'sv-cell-b' }, { v: 99, cls: 'sv-cell-key' }, { v: 44 }] },
    ],
    'درج ۹۹ بعد از گرهٔ ۲۷',
    { x0: 70 },
  );
export const listDeleteAfter = () =>
  listFig(
    [
      { label: 'پیش', items: [{ v: 12, cls: 'sv-cell-b' }, { v: 27, cls: 'sv-cell-hl' }, { v: 44 }] },
      { label: 'پس', items: [{ v: 12, cls: 'sv-cell-b' }, { v: 44 }] },
    ],
    'حذف گرهٔ بعد از p',
    { x0: 70 },
  );
export const listDoubly = () =>
  listFig([{ items: [12, 27, 44].map((v) => ({ v })), doubly: true }], 'لیست دوپیوندی با اشاره‌گرهای prev و next');
export const listReverse = () =>
  listFig(
    [
      { label: 'پیش', items: [10, 20, 30, 40].map((v) => ({ v })) },
      { label: 'پس', items: [40, 30, 20, 10].map((v) => ({ v })) },
    ],
    'معکوس کردن لیست پیوندی',
    { x0: 70 },
  );

export function pointerPic() {
  const W = 420, H = 130;
  let b = ARROW_DEFS;
  b += T(30, 40, 'head', 'sv-math sv-tc', 'start') + T(30, 100, 'p', 'sv-math sv-tc', 'start');
  b += R(220, 38, 110, 58, 'sv-cell-sorted', 8);
  b += L(220, 67, 330, 67, 'sv-ln');
  b += T(275, 59, 'data = ۷', 'sv-t sv-small') + T(275, 87, 'next = NULL', 'sv-math sv-xsmall');
  b += `<path d="M76,36 C140,30 180,40 216,52" class="sv-arrow" marker-end="url(#ah)"/>`;
  b += `<path d="M56,96 C130,104 180,92 216,82" class="sv-arrow" marker-end="url(#ah)"/>`;
  return svg(W, H, b, 'دو اشاره‌گر head و p به یک گره');
}

export function arrayListTable() {
  return `<div class="tbl-wrap"><table dir="ltr"><thead><tr><th>Index</th><th>0</th><th>1</th><th>2</th><th>3</th></tr></thead><tbody>
<tr><th>Data</th><td>10</td><td>30</td><td>20</td><td>—</td></tr>
<tr><th>Next</th><td>2</td><td>null</td><td>1</td><td>—</td></tr></tbody></table></div>`;
}

// ---------------------------------------------------------------- لیست با دور (شکل ρ)
export function cycleList() {
  const W = 520, H = 230;
  let b = ARROW_DEFS;
  const pts = { A: [50, 60], B: [150, 60], C: [260, 60], D: [400, 60], E: [330, 180] };
  const node = (k, cls) => (b += C(pts[k][0], pts[k][1], 22, cls) + T(pts[k][0], pts[k][1] + 6, k, 'sv-math sv-node-t'));
  const arr = (a, c, curve = 0) => {
    const [x1, y1] = pts[a], [x2, y2] = pts[c];
    const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    b += `<line x1="${r1(x1 + ux * 24)}" y1="${r1(y1 + uy * 24)}" x2="${r1(x2 - ux * 27)}" y2="${r1(y2 - uy * 27)}" class="sv-arrow" marker-end="url(#ah)"/>`;
  };
  arr('A', 'B'); arr('B', 'C'); arr('C', 'D'); arr('D', 'E'); arr('E', 'C');
  node('A', 'sv-node'); node('B', 'sv-node'); node('C', 'sv-node-hl'); node('D', 'sv-node-mid'); node('E', 'sv-node-mid');
  b += T(30, 20, 'head', 'sv-math sv-small sv-tc', 'start');
  b += TF(100, 112, 'پیشوند: ۲ گره', 'sv-t sv-small sv-bold');
  b += TF(400, 140, 'دور: ۳ گره', 'sv-t sv-small sv-bold');
  b += TF(260, 24, 'ورودی دور', 'sv-tm sv-xsmall');
  return svg(W, H, b, 'لیست پیوندی با یک پیشوند دوگرهی و یک دور سه‌گرهی');
}

// ---------------------------------------------------------------- مسئلهٔ ژوزفوس
export function josephus() {
  const W = 360, H = 320, cx = 180, cy = 160, R0 = 115;
  let b = ARROW_DEFS;
  const order = { 3: 1, 6: 2, 2: 3, 7: 4, 5: 5, 1: 6 };
  const pos = (k) => {
    const a = -Math.PI / 2 + ((k - 1) * 2 * Math.PI) / 7;
    return [cx + R0 * Math.cos(a), cy + R0 * Math.sin(a)];
  };
  for (let k = 1; k <= 7; k++) {
    const [x1, y1] = pos(k), [x2, y2] = pos((k % 7) + 1);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const ox = (mx - cx) * 0.18, oy = (my - cy) * 0.18;
    b += `<path d="M${r1(x1 + (x2 - x1) * 0.22)},${r1(y1 + (y2 - y1) * 0.22)} Q${r1(mx + ox)},${r1(my + oy)} ${r1(x2 - (x2 - x1) * 0.24)},${r1(y2 - (y2 - y1) * 0.24)}" class="sv-edge" fill="none" marker-end="url(#ah)"/>`;
  }
  for (let k = 1; k <= 7; k++) {
    const [x, y] = pos(k);
    b += C(x, y, 21, k === 4 ? 'sv-node-hl' : 'sv-node') + T(x, y + 6, fa(k), 'sv-t sv-cellnum');
    if (order[k]) {
      const lx = cx + (x - cx) * 1.32, ly = cy + (y - cy) * 1.32;
      b += TF(lx, ly + 5, `حذف ${fa(order[k])}`, 'sv-t sv-xsmall sv-tc');
    }
  }
  b += TF(cx, cy + 6, 'بازمانده: ۴', 'sv-t sv-bold');
  return svg(W, H, b, 'مسئلهٔ ژوزفوس برای n=7 و k=3');
}

// ---------------------------------------------------------------- پشته
export function stackPic() {
  const W = 300, H = 210, x = 100, w = 100;
  let b = '';
  b += P(`M${x},20 L${x},180 L${x + w},180 L${x + w},20`, 'sv-ln sv-thick');
  [10, 20, 30].forEach((v, i) => {
    b += R(x + 6, 140 - i * 40, w - 12, 34, i === 2 ? 'sv-cell-key' : 'sv-cell-sorted', 6) + T(x + w / 2, 162 - i * 40, fa(v), 'sv-t sv-cellnum');
  });
  b += T(x + w + 10, 82, 'TOP', 'sv-math sv-small sv-tc', 'start');
  b += TF(x - 12, 160, 'اولین ورودی', 'sv-tm sv-xsmall', 'end');
  b += TF(x - 12, 82, 'آخرین ورودی', 'sv-tm sv-xsmall', 'end');
  return svg(W, H, b, 'پشته با سه عنصر ۱۰، ۲۰ و ۳۰');
}

export function callStack() {
  const W = 520, H = 200, x = 270, w = 220;
  let b = '';
  const frames = [
    ['factorial(3)', 'n = 3 · منتظر factorial(2)'],
    ['factorial(2)', 'n = 2 · منتظر factorial(1)'],
    ['factorial(1)', 'n = 1 · جواب = ۱'],
  ];
  frames.forEach(([t, s], i) => {
    const y = 140 - i * 54;
    b += R(x, y, w, 46, i === 2 ? 'sv-cell-key' : 'sv-cell-sorted', 8);
    b += T(x + w / 2, y + 19, t, 'sv-math sv-small sv-bold');
    b += TF(x + w / 2, y + 37, s, 'sv-t sv-xsmall');
  });
  b += T(x + w + 6, 54, 'TOP', 'sv-math sv-small sv-tc', 'start');
  b += T(x + w + 6, 170, 'BOTTOM', 'sv-math sv-small sv-tm', 'start');
  // بازگشت جواب‌ها
  b += TF(130, 60, 'ترتیب بازگشت جواب‌ها:', 'sv-t sv-small sv-bold');
  b += T(130, 90, 'fact(1)=1 → fact(2)=2 → fact(3)=6', 'sv-math sv-small sv-tc');
  b += TF(130, 120, 'ترتیب صدا زدن برعکس است', 'sv-tm sv-xsmall');
  return svg(W, H, b, 'پشتهٔ فراخوانی در عمیق‌ترین لحظهٔ محاسبهٔ factorial(3)');
}

// ---------------------------------------------------------------- قیمت سهام و بزرگ‌تر بعدی
export function stockNGE() {
  const P_ = [100, 80, 60, 70, 60, 75, 85];
  const nge = [-1, 6, 3, 5, 5, 6, -1];
  const W = 650, H = 290, x0 = 40, bw = 50, gap = 22, base = 220, sc = 1.6;
  let b = ARROW_DEFS;
  const cx = (i) => x0 + i * (bw + gap) + bw / 2;
  P_.forEach((p, i) => {
    const h = p * sc;
    b += R(x0 + i * (bw + gap), base - h, bw, h, 'sv-bar-skip', 5);
    b += T(cx(i), base - h - 8, fa(p), 'sv-t sv-small sv-bold');
    b += TF(cx(i), base + 18, `روز ${fa(i)}`, 'sv-tm sv-xsmall');
    b += T(cx(i), base + 40, nge[i] < 0 ? '—' : fa(P_[nge[i]]), 'sv-t sv-small sv-tc sv-bold');
  });
  P_.forEach((p, i) => {
    if (nge[i] < 0) return;
    const j = nge[i];
    const y1 = base - p * sc - 22, y2 = base - P_[j] * sc - 22;
    const top = Math.min(y1, y2) - 18 - (j - i) * 4;
    b += `<path d="M${cx(i) + 6},${y1} C${cx(i) + 6},${top} ${cx(j) - 6},${top} ${cx(j) - 6},${y2 + 2}" class="sv-arrow-c" fill="none" marker-end="url(#ahc)"/>`;
  });
  b += TF(W - 6, base + 40, 'بزرگ‌تر بعدی:', 'sv-t sv-xsmall sv-bold', 'end');
  return svg(W, H, b, 'قیمت سهام در هفت روز و نزدیک‌ترین قیمت بزرگ‌تر بعدی');
}

// ---------------------------------------------------------------- قطار و پشته
export function trainSiding() {
  const W = 560, H = 210;
  let b = ARROW_DEFS;
  b += L(20, 60, 540, 60, 'sv-ln sv-thick');
  b += P('M250,60 L250,190 L310,190 L310,60', 'sv-ln sv-thick');
  [1, 2, 3, 4].forEach((v, i) => (b += R(370 + i * 42, 40, 36, 36, 'sv-cell-sorted', 6) + T(388 + i * 42, 64, fa(v), 'sv-t sv-cellnum')));
  b += TF(450, 106, 'ورودی (به ترتیب ۱، ۲، ...)', 'sv-tm sv-xsmall');
  b += TF(110, 106, 'خروجی (ترتیب هدف)', 'sv-tm sv-xsmall');
  b += TF(280, 206, 'خط فرعی = پشته', 'sv-t sv-xsmall sv-bold');
  b += `<path d="M360,48 L320,48" class="sv-arrow" marker-end="url(#ah)"/>`;
  b += `<path d="M240,48 L200,48" class="sv-arrow" marker-end="url(#ah)"/>`;
  b += `<path d="M268,76 L268,110" class="sv-arrow-c" marker-end="url(#ahc)"/>`;
  b += `<path d="M292,110 L292,76" class="sv-arrow-c" marker-end="url(#ahc)"/>`;
  b += T(244, 100, 'push', 'sv-math sv-xsmall sv-tc', 'end') + T(316, 100, 'pop', 'sv-math sv-xsmall sv-tc', 'start');
  return svg(W, H, b, 'خط آهن با یک خط فرعی که مثل پشته رفتار می‌کند');
}

// ---------------------------------------------------------------- صف
export function queuePic() {
  const W = 520, H = 140, x0 = 130, cw = 64;
  let b = ARROW_DEFS;
  'ABCD'.split('').forEach((c, i) => (b += R(x0 + i * cw, 46, cw - 8, 44, i === 0 ? 'sv-cell-key' : 'sv-cell-sorted', 6) + T(x0 + i * cw + (cw - 8) / 2, 74, c, 'sv-math sv-cellnum')));
  b += T(x0 + (cw - 8) / 2, 34, 'FRONT', 'sv-math sv-xsmall sv-tc');
  b += T(x0 + 3 * cw + (cw - 8) / 2, 34, 'REAR', 'sv-math sv-xsmall sv-tc');
  b += `<path d="M${x0 - 8},68 L${x0 - 60},68" class="sv-arrow" marker-end="url(#ah)"/>`;
  b += T(x0 - 66, 72, 'dequeue', 'sv-math sv-small', 'end');
  b += `<path d="M${x0 + 4 * cw + 60},68 L${x0 + 4 * cw + 4},68" class="sv-arrow" marker-end="url(#ah)"/>`;
  b += T(x0 + 4 * cw + 66, 72, 'enqueue', 'sv-math sv-small', 'start');
  b += TF(W / 2, 124, 'ورود از عقب، خروج از جلو: اولین ورودی، اولین خروجی', 'sv-tm sv-xsmall');
  return svg(W, H, b, 'صف با چهار عنصر');
}

export function circularQueue() {
  const W = 560, H = 300, cx = 150, cy = 150, R1 = 110, R2 = 62, n = 6;
  const vals = ['C', 'D', '', '', 'A', 'B'];
  let b = ARROW_DEFS;
  const pt = (rad, a) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  for (let i = 0; i < n; i++) {
    const a1 = -Math.PI / 2 + (i * 2 * Math.PI) / n + 0.03, a2 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / n - 0.03;
    const [x1, y1] = pt(R1, a1), [x2, y2] = pt(R1, a2), [x3, y3] = pt(R2, a2), [x4, y4] = pt(R2, a1);
    const cls = vals[i] ? (i === 4 ? 'sv-cell-key' : 'sv-cell-sorted') : 'sv-cell';
    b += `<path d="M${r1(x1)},${r1(y1)} A${R1},${R1} 0 0 1 ${r1(x2)},${r1(y2)} L${r1(x3)},${r1(y3)} A${R2},${R2} 0 0 0 ${r1(x4)},${r1(y4)} Z" class="${cls}"/>`;
    const am = (a1 + a2) / 2;
    const [tx, ty] = pt((R1 + R2) / 2, am);
    if (vals[i]) b += T(tx, ty + 6, vals[i], 'sv-math sv-cellnum');
    const [ix, iy] = pt(R1 + 16, am);
    b += T(ix, iy + 4, fa(i), 'sv-tm sv-small');
  }
  b += `<path d="M${cx + 30},${cy - 20} A36,36 0 1 1 ${cx - 30},${cy - 20}" class="sv-arrow-c" fill="none" marker-end="url(#ahc)"/>`;
  // نمای خطی
  const x0 = 330, cw = 36;
  vals.forEach((v, i) => {
    const cls = v ? (i === 4 ? 'sv-cell-key' : 'sv-cell-sorted') : 'sv-cell';
    b += R(x0 + i * cw, 120, cw - 4, 36, cls, 5) + (v ? T(x0 + i * cw + (cw - 4) / 2, 144, v, 'sv-math sv-cellnum') : '');
    b += T(x0 + i * cw + (cw - 4) / 2, 112, fa(i), 'sv-tm sv-xsmall');
  });
  b += `<path d="M${x0 + 4 * cw + 16},196 L${x0 + 4 * cw + 16},162" class="sv-arrow" marker-end="url(#ah)"/>`;
  b += T(x0 + 4 * cw + 16, 212, 'front = 4', 'sv-math sv-xsmall');
  b += `<path d="M${x0 + 2 * cw + 16},70 L${x0 + 2 * cw + 16},112" class="sv-arrow" marker-end="url(#ah)"/>`;
  b += T(x0 + 2 * cw + 16, 62, 'rear = 2', 'sv-math sv-xsmall');
  b += TF(x0 + 3 * cw, 250, 'ترتیب صف: A ، B ، C ، D', 'sv-t sv-small sv-bold');
  return svg(W, H, b, 'صف حلقوی با ظرفیت ۶');
}

// ---------------------------------------------------------------- درخت‌های فصل ۶
const TREE_ABC = ['A', ['B', ['C', ['D']], ['E', ['F'], ['G']]], ['H', ['I', ['J'], ['K'], ['L']], ['M']]];
const hlSet = (labels, cls) => Object.fromEntries(labels.map((l) => [l, cls]));
export const treeABC = () => treeFig(TREE_ABC, { dx: 46 }, 'درخت نمونه با ریشهٔ A');
export const treeDirected = () =>
  treeFig(['H', ['I', ['J'], ['K'], ['L']]], { arrows: true, dx: 56, hl: { H: 'sv-node-hl', J: 'sv-node-leaf', K: 'sv-node-leaf', L: 'sv-node-leaf' } }, 'درخت جهت‌دار با ریشهٔ H');
export const treePath = () => treeFig(TREE_ABC, { dx: 46, hl: hlSet(['B', 'E', 'G'], 'sv-node-hl') }, 'مسیر B, E, G');
export const treeDesc = () => treeFig(TREE_ABC, { dx: 46, hl: { ...hlSet(['C', 'D', 'E', 'F', 'G'], 'sv-node-mid'), B: 'sv-node-hl' } }, 'اولاد گرهٔ B');
export const treeAnc = () => treeFig(TREE_ABC, { dx: 46, hl: { ...hlSet(['A', 'H', 'I'], 'sv-node-mid'), K: 'sv-node-hl' } }, 'اجداد گرهٔ K');
export const treeLeaves = () =>
  treeFig(TREE_ABC, { dx: 46, hl: { ...hlSet(['D', 'F', 'G', 'J', 'K', 'L', 'M'], 'sv-node-leaf'), ...hlSet(['A', 'B', 'C', 'E', 'H', 'I'], 'sv-node-mid') } }, 'برگ‌ها و گره‌های داخلی');
export const treeOrdered = () =>
  panels(
    [
      { title: 'درخت ۱', spec: ['A', ['B', ['C'], ['D']], ['E', ['F']]], o: { dx: 46 } },
      { title: 'درخت ۲', spec: ['A', ['E', ['F']], ['B', ['C'], ['D']]], o: { dx: 46 } },
    ],
    'دو درخت که فقط در ترتیب فرزندان فرق دارند',
  );
export function treeHeightDepth() {
  const spec = ['a', ['b', ['d', ['h'], ['i']], ['e', ['j']]], ['c', ['f'], ['g']]];
  const hd = { a: [3, 0], b: [2, 1], c: [1, 1], d: [1, 2], e: [1, 2], f: [0, 2], g: [0, 2], h: [0, 3], i: [0, 3], j: [0, 3] };
  const note = Object.fromEntries(Object.entries(hd).map(([k, [h, d]]) => [k, `h=${h} · d=${d}`]));
  return treeFig(spec, { dx: 70, dy: 74, note }, 'ارتفاع و عمق هر گره');
}
export const treeComplete = () =>
  treeFig(['A', ['B', ['D', ['H'], ['I']], ['E', ['J'], ['K']]], ['C', ['F', ['L']], ['G']]], { dx: 44 }, 'درخت دودویی کامل');
export const treeKinds = () =>
  panels(
    [
      { title: 'پر', spec: ['', ['', ['', [''], ['']], ['']], ['', [''], ['', [''], ['']]]], o: { dx: 26, dy: 44, r: 9 } },
      { title: 'کاملاً متوازن', spec: ['', ['', [''], ['']], ['', [''], ['']]], o: { dx: 30, dy: 44, r: 9 } },
      { title: 'متوازن', spec: ['', ['', ['', ['']], ['']], ['', ['']]], o: { dx: 30, dy: 44, r: 9 } },
    ],
    'سه نوع درخت: پر، کاملاً متوازن، متوازن',
  );
export function kAryNode() {
  const W = 560, H = 176;
  let b = ARROW_DEFS;
  const box = (x, y, t, n = 5, nulls = []) => {
    b += R(x, y, n * 22, 24, 'sv-cell-sorted', 4) + T(x + (n * 22) / 2, y + 17, t, 'sv-math sv-bold');
    for (let i = 0; i < n; i++) {
      b += R(x + i * 22, y + 24, 22, 22, 'sv-cell', 2);
      if (nulls.includes(i)) b += L(x + i * 22 + 4, y + 42, x + i * 22 + 18, y + 28, 'sv-ln');
      else b += C(x + i * 22 + 11, y + 35, 2.5, 'sv-dot-ink');
    }
  };
  box(225, 14, 'A', 5, [3, 4]);
  box(40, 122, 'B', 5, [0, 1, 2, 3, 4]); box(225, 122, 'C', 5, [0, 1, 2, 3, 4]); box(410, 122, 'D', 5, [0, 1, 2, 3, 4]);
  const from = (i) => [225 + i * 22 + 11, 49];
  [[0, 95], [1, 280], [2, 465]].forEach(([i, tx]) => {
    const [x, y] = from(i);
    b += `<line x1="${x}" y1="${y}" x2="${tx}" y2="118" class="sv-arrow" marker-end="url(#ah)"/>`;
  });
  b += L(345, 49, 362, 49, 'sv-ln');
  b += TF(368, 53, 'خانهٔ خط‌خورده = NULL', 'sv-tm sv-xsmall', 'start');
  return svg(W, H, b, 'پیاده‌سازی گرهٔ درخت kتایی با k اشاره‌گر');
}
const TREE_AM = ['a', ['b'], ['c', ['f'], ['g'], ['h', ['j'], ['k']]], ['d'], ['e', ['i', ['l'], ['m']]]];
export const treeAM = () => treeFig(TREE_AM, { dx: 44 }, 'درخت نمونه با ریشهٔ a');
export function treeRecursive() {
  const W = 420, H = 210;
  let b = '';
  const rx = 210, ry = 30;
  const kids = [[80, 'r_1', 'T_1'], [200, 'r_2', 'T_2'], [340, 'r_k', 'T_k']];
  b += C(rx, ry, 14, 'sv-node-hl') + T(rx, ry + 5, 'r', 'sv-math sv-node-t');
  kids.forEach(([x, rl, tl]) => {
    b += L(rx, ry + 14, x, 86, 'sv-edge');
    b += P(`M${x},86 L${x - 50},190 L${x + 50},190 Z`, 'sv-tri');
    b += C(x, 86, 5, 'sv-dot-ink') + T(x + 10, 84, rl, 'sv-math sv-small', 'start');
    b += T(x, 168, tl, 'sv-math sv-bold');
  });
  b += T(270, 140, '…', 'sv-t sv-big');
  return svg(W, H, b, 'تعریف بازگشتی درخت: ریشه و زیردرخت‌ها');
}
export const treeProblem1 = () =>
  treeFig(
    ['M', ['N', ['H', ['C'], ['R', ['S', ['K', ['W'], ['T']]], ['G']]], ['D']], ['X', ['I', ['Y', ['A'], ['J', ['P', ['O'], ['E']]]], ['Z']], ['V', ['B'], ['U', ['L', ['Q']], ['F']]]]],
    { dx: 40, dy: 56, r: 15, hl: { M: 'sv-node-hl', N: 'sv-node-mid', X: 'sv-node-mid' } },
    'درخت بازسازی‌شده از پیمایش‌های پیش‌ترتیب و پس‌ترتیب',
  );
// درخت دودویی معادل (فرزند چپ - برادر راست)
export function lcrs() {
  const spec = TREE_AM;
  const root = parse(spec);
  const width = (n) => (n.kids.length ? Math.max(1, n.kids.reduce((s, k) => s + width(k), 0)) : 1);
  const place = (n, x, d) => {
    n.x = x; n.depth = d;
    let cx = x;
    n.kids.forEach((k) => { place(k, cx, d + 1); cx += width(k); });
  };
  place(root, 0, 0);
  const dx = 58, dy = 66, x0 = 40, y0 = 30, r = 17;
  let b = ARROW_DEFS, maxX = 0, maxD = 0;
  const X = (n) => x0 + n.x * dx + (n.depth === 0 ? 0 : 0), Y = (n) => y0 + n.depth * dy;
  const arrow = (a, c) => {
    const x1 = X(a), y1 = Y(a), x2 = X(c), y2 = Y(c);
    const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    b += `<line x1="${r1(x1 + ux * r)}" y1="${r1(y1 + uy * r)}" x2="${r1(x2 - ux * (r + 4))}" y2="${r1(y2 - uy * (r + 4))}" class="sv-arrow" marker-end="url(#ah)"/>`;
  };
  // ریشه کمی بالا و راستِ اولین فرزندش
  root.x = 0.6;
  walk(root, (n) => {
    maxX = Math.max(maxX, n.x); maxD = Math.max(maxD, n.depth);
    if (n.kids.length) arrow(n, n.kids[0]);
    n.kids.forEach((k, i) => { if (i + 1 < n.kids.length) arrow(k, n.kids[i + 1]); });
  });
  walk(root, (n) => (b += C(X(n), Y(n), r, 'sv-node') + T(X(n), Y(n) + 5, n.t, 'sv-math sv-node-t')));
  b += TF(x0 + maxX * dx, Y(root) + 4, '↓ فرزند چپ = اولین فرزند   → فرزند راست = برادر بعدی', 'sv-tm sv-xsmall', 'end');
  return svg(x0 * 2 + maxX * dx, y0 * 2 + maxD * dy, b, 'درخت دودویی معادل به روش فرزند چپ برادر راست');
}
export function lcrsGeneral() {
  const W = 520, H = 230;
  let b = ARROW_DEFS;
  b += C(110, 30, 16, 'sv-node-hl') + T(110, 35, 'r', 'sv-math sv-node-t');
  const xs = [70, 230, 420];
  ['r_1', 'r_2', 'r_k'].forEach((t, i) => {
    b += C(xs[i], 100, 18, 'sv-node') + T(xs[i], 105, t, 'sv-math sv-node-t');
    b += `<line x1="${xs[i]}" y1="118" x2="${xs[i]}" y2="140" class="sv-arrow" marker-end="url(#ah)"/>`;
    b += P(`M${xs[i]},144 L${xs[i] - 48},222 L${xs[i] + 48},222 Z`, 'sv-tri');
    b += T(xs[i], 206, `T_${['1', '2', 'k'][i]} − r_${['1', '2', 'k'][i]}`, 'sv-math sv-xsmall');
  });
  b += `<line x1="98" y1="42" x2="82" y2="84" class="sv-arrow" marker-end="url(#ah)"/>`;
  b += `<line x1="88" y1="100" x2="208" y2="100" class="sv-arrow" marker-end="url(#ah)"/>`;
  b += `<line x1="248" y1="100" x2="300" y2="100" class="sv-arrow" marker-end="url(#ah)"/>`;
  b += T(330, 104, '…', 'sv-t sv-big') + `<line x1="350" y1="100" x2="398" y2="100" class="sv-arrow" marker-end="url(#ah)"/>`;
  return svg(W, H, b, 'شکل کلی درخت دودویی معادل');
}

// ---------------------------------------------------------------- درخت عبارت
const exprOpts = { rw: 40, rh: 30, dx: 54, dy: 64, labelCls: 'sv-math', layout: 'inorder' };
export const exprSimple = () => treeFig(['×', ['+', ['4'], ['2']], ['3']], { ...exprOpts, note: { '+': '= ۶', '×': '= ۱۸' } }, 'درخت عبارت (4+2)×3');
export const exprMain = () =>
  treeFig(
    ['×', ['−', ['8'], ['5']], ['/', ['+', ['4'], ['2']], ['3']]],
    { ...exprOpts, note: { '−': '= ۳', '+': '= ۶', '/': '= ۲', '×': '= ۶' } },
    'درخت عبارت ((8−5)×((4+2)/3))',
  );
export const exprKinds = () =>
  panels(
    [
      { title: 'عملوند: برگ', spec: ['operand'], o: { rw: 80, rh: 32, dx: 50, x0: 30, layout: 'inorder', labelCls: 'sv-math' } },
      { title: 'یگانی: فقط فرزند راست', spec: ['α', null, ['E']], o: { ...exprOpts, rw: 36, x0: 30 } },
      { title: 'دودویی: دو فرزند', spec: ['β', ['E'], ['E']], o: { ...exprOpts, rw: 36, x0: 30 } },
    ],
    'سه نوع گره در درخت عبارت',
  );
export const exprABCD = () => treeFig(['/', ['×', ['A'], ['+', ['B'], ['C']]], ['D']], exprOpts, 'درخت عبارت ((A×(B+C))/D)');
export const exprChain = () =>
  treeFig(['+', ['+', ['+', ['+', ['+', ['a'], ['b']], ['c']], ['d']], ['e']], ['f']], { ...exprOpts, dx: 40, dy: 46, rw: 34, rh: 26 }, 'درخت عبارت چپ‌سنگین');
export const exprFinal = () => treeFig(['−', ['+', ['a'], ['÷', ['×', ['b'], ['c']], ['d']]], ['e']], exprOpts, 'درخت عبارت a+b×c÷d−e');

// ---------------------------------------------------------------- هرم
// a: آرایهٔ ۱-مبنا (a[0] نادیده)
export function heapFig(a, { hl = [], hl2 = [], gone = [], arrows = [], showArray = true, label = 'هرم', w = 520 } = {}) {
  const n = a.length - 1;
  const levels = Math.floor(Math.log2(n)) + 1;
  const dy = 62, top = 30;
  let b = ARROW_DEFS;
  const pos = (i) => {
    const L_ = Math.floor(Math.log2(i)), p = i - 2 ** L_;
    return [20 + ((p + 0.5) * (w - 40)) / 2 ** L_, top + L_ * dy];
  };
  for (let i = 2; i <= n; i++) {
    const [x1, y1] = pos(Math.floor(i / 2)), [x2, y2] = pos(i);
    b += L(x1, y1, x2, y2, 'sv-edge');
  }
  for (let i = 1; i <= n; i++) {
    const [x, y] = pos(i);
    const cls = gone.includes(i) ? 'sv-node-gone' : hl.includes(i) ? 'sv-node-hl' : hl2.includes(i) ? 'sv-node-mid' : 'sv-node';
    b += C(x, y, 18, cls) + T(x, y + 6, fa(a[i]), 'sv-t sv-cellnum');
    b += T(x - 20, y - 16, fa(i), 'sv-tm sv-xxsmall', 'end');
  }
  let H = top + (levels - 1) * dy + 34;
  if (showArray) {
    const cw = Math.min(42, (w - 20) / n), x0 = (w - cw * n) / 2, y = H + 12;
    for (let i = 1; i <= n; i++) {
      const cls = gone.includes(i) ? 'sv-cell-gone' : hl.includes(i) ? 'sv-cell-key' : hl2.includes(i) ? 'sv-cell-a' : 'sv-cell';
      b += R(x0 + (i - 1) * cw, y, cw - 3, 32, cls, 4) + T(x0 + (i - 1) * cw + (cw - 3) / 2, y + 22, fa(a[i]), 'sv-t sv-small sv-bold');
      b += T(x0 + (i - 1) * cw + (cw - 3) / 2, y - 6, fa(i), 'sv-tm sv-xxsmall');
    }
    arrows.forEach(([i, j]) => {
      const xi = x0 + (i - 1) * cw + (cw - 3) / 2, xj = x0 + (j - 1) * cw + (cw - 3) / 2;
      b += `<path d="M${r1(xi)},${y + 36} C${r1(xi)},${y + 60} ${r1(xj)},${y + 60} ${r1(xj)},${y + 38}" class="sv-arrow-c" fill="none" marker-end="url(#ahc)" marker-start="url(#ahc)"/>`;
    });
    H = y + (arrows.length ? 66 : 42);
  }
  return svg(w, H, b, label);
}
const HEAP0 = [null, 16, 14, 10, 8, 7, 9, 2, 2, 4, 1];
export const heapBase = () => heapFig(HEAP0, { label: 'هرم بیشینه با ۱۰ عنصر و نمایش آرایه‌ای آن' });
export const heapIncrease = () =>
  heapFig([null, 16, 15, 10, 14, 7, 9, 2, 2, 8, 1], { hl: [2], hl2: [4, 9], arrows: [[9, 4], [4, 2]], label: 'افزایش کلید خانهٔ ۹ از ۴ به ۱۵' });
export const heapInsert1 = () => heapFig([null, 16, 14, 10, 8, 7, 9, 2, 2, 4, 1, 15], { hl: [11], showArray: false, label: 'گرهٔ ۱۵ در ته درخت' });
export const heapInsert2 = () =>
  heapFig([null, 16, 15, 10, 8, 14, 9, 2, 2, 4, 1, 7], { hl: [2], hl2: [5, 11], arrows: [[11, 5], [5, 2]], label: 'پس از بالا بردن ۱۵' });
export const heapExtract1 = () => heapFig([null, 1, 14, 10, 8, 7, 9, 2, 2, 4], { hl: [1], showArray: false, label: 'آخرین عنصر به ریشه آمده است' });
export const heapExtract2 = () =>
  heapFig([null, 14, 8, 10, 4, 7, 9, 2, 2, 1], { hl: [9], hl2: [1, 2, 4], arrows: [[1, 2], [2, 4], [4, 9]], label: 'پس از پایین بردن ۱' });
export const heapBuild0 = () => heapFig([null, 12, 5, 11, 3, 10, 2, 9, 4, 8, 15, 7, 6], { label: 'آرایهٔ ورودی به شکل درخت کامل' });
export const heapBuild1 = () => heapFig([null, 12, 5, 11, 3, 7, 2, 9, 4, 8, 15, 10, 6], { hl: [5, 11], hl2: [6, 4], showArray: false, label: 'پس از پردازش سطح یکی مانده به آخر' });
export const heapBuild2 = () => heapFig([null, 12, 3, 2, 4, 7, 6, 9, 5, 8, 15, 10, 11], { hl: [2, 3, 4, 6, 8, 12], showArray: false, label: 'پس از پردازش سطح دوم' });
export const heapBuild3 = () => heapFig([null, 2, 3, 6, 4, 7, 11, 9, 5, 8, 15, 10, 12], { hl: [1, 3, 6, 12], label: 'هرم کمینهٔ نهایی' });
export const heapQuery = () =>
  heapFig(HEAP0, { hl: [1, 2], hl2: [3, 4, 5], showArray: false, label: 'شمارش اعداد بزرگ‌تر از ۱۱ در هرم' });

// ---------------------------------------------------------------- درخت تصمیم
export const decisionInsertion = () => {
  const lf = (p) => '(' + p.map((i) => 'a_' + i).join(', ') + ')';
  const cmp = (i, j) => `a_${i} : a_${j}`;
  const leaves = {};
  [[1, 2, 3], [1, 3, 2], [3, 1, 2], [2, 1, 3], [2, 3, 1], [3, 2, 1]].forEach((p) => (leaves[lf(p)] = 'sv-tnode-leaf'));
  return treeFig(
    [cmp(1, 2), [cmp(2, 3), [lf([1, 2, 3])], [cmp(1, 3), [lf([1, 3, 2])], [lf([3, 1, 2])]]], [cmp(1, 3), [lf([2, 1, 3])], [cmp(2, 3), [lf([2, 3, 1])], [lf([3, 2, 1])]]]],
    {
      rw: 92, rh: 30, dx: 98, dy: 70, x0: 20, labelCls: 'sv-math sv-small', edgeLabel: (n, i) => (n.t.includes(':') ? (i === 0 ? '<' : '>') : ''),
      hl: leaves,
    },
    'درخت تصمیم مرتب‌سازی درجی روی سه عنصر',
  );
};

export const FIGS2 = {
  arrayMemory, arrayInsert, listBasic, listInsertFront, listInsertAfter, listDeleteAfter, listDoubly, listReverse, pointerPic,
  arrayListTable, cycleList, josephus, stackPic, callStack, stockNGE, trainSiding, queuePic, circularQueue,
  treeABC, treeOrdered, treeDirected, treePath, treeDesc, treeAnc, treeLeaves, treeHeightDepth, treeComplete, treeKinds, kAryNode, treeAM,
  treeRecursive, treeProblem1, lcrs, lcrsGeneral,
  exprSimple, exprMain, exprKinds, exprABCD, exprChain, exprFinal,
  heapBase, heapIncrease, heapInsert1, heapInsert2, heapExtract1, heapExtract2, heapBuild0, heapBuild1, heapBuild2, heapBuild3, heapQuery,
  decisionInsertion,
};
