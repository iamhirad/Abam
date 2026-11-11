// شکل‌های فصل ۱۰: درخت ترای (trie).
import { r1, svg, T, TF, L, R, C, ARROW_DEFS } from './figures.mjs';

// ---------------------------------------------------------------- ساخت trie از روی کلمات
// هر گره: { key: پیشوندِ متناظر، lab: برچسب یال ورودی، end: آیا پایان کلمه است، kids: [...] }
function fromWords(words) {
  const root = { key: '', lab: '', end: false, kids: [] };
  for (const w of words) {
    let v = root;
    for (const ch of w) {
      let k = v.kids.find((x) => x.lab === ch);
      if (!k) {
        k = { key: v.key + ch, lab: ch, end: false, kids: [] };
        v.kids.push(k);
        v.kids.sort((a, b) => (a.lab < b.lab ? -1 : 1));
      }
      v = k;
    }
    v.end = true;
  }
  return root;
}
// فشرده‌سازی: گره غیرکلمه‌ای که فقط یک فرزند دارد با فرزندش ادغام می‌شود.
function compress(v, isRoot = true) {
  v.kids = v.kids.map((k) => {
    let c = k;
    while (!c.end && c.kids.length === 1) {
      const g = c.kids[0];
      c = { ...g, lab: c.lab + g.lab };
    }
    return compress(c, false);
  });
  return v;
}
function layout(root) {
  let x = 0, maxD = 0;
  const go = (v, d) => {
    v.d = d;
    maxD = Math.max(maxD, d);
    if (!v.kids.length) v.x = x++;
    else {
      v.kids.forEach((k) => go(k, d + 1));
      v.x = (v.kids[0].x + v.kids[v.kids.length - 1].x) / 2;
    }
  };
  go(root, 0);
  return { leaves: x, maxD };
}
function all(v, out = []) {
  out.push(v);
  v.kids.forEach((k) => all(k, out));
  return out;
}

// رسم trie
// o.path: کلیدهای گره‌های مسیر (برای برجسته کردن)، o.pathCls: رنگ مسیر
// o.add: کلیدهای گره‌های تازه، o.gone: گره‌های حذف‌شده، o.cleared: گره‌هایی که پرچمشان برداشته شد
// o.ghost: { at: کلید گره، lab } یال ناموجودی که جست‌وجو دنبالش گشت
function trieSvg(root, o = {}) {
  const { dx = 54, dy = 54, r = 9, x0 = 34, y0 = 22, path = [], pathCls = 'hl', add = [], gone = [], cleared = [], ghost = null, words = true, mark = {}, label = 'درخت ترای' } = o;
  const { leaves, maxD } = layout(root);
  const X = (v) => x0 + v.x * dx, Y = (v) => y0 + v.d * dy;
  const nodes = all(root);
  const inPath = new Set(path);
  let edges = '', labs = '', circ = '', txt = '';
  for (const v of nodes) {
    for (const k of v.kids) {
      const x1 = X(v), y1 = Y(v), x2 = X(k), y2 = Y(k);
      const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      let cls = 'sv-edge';
      if (gone.includes(k.key)) cls = 'sv-edge-gone';
      else if (add.includes(k.key)) cls = 'sv-edge-new';
      else if (inPath.has(k.key) && inPath.has(v.key)) cls = `sv-edge-${pathCls}`;
      edges += `<line x1="${r1(x1 + ux * (r + 1))}" y1="${r1(y1 + uy * (r + 1))}" x2="${r1(x2 - ux * (r + 1))}" y2="${r1(y2 - uy * (r + 1))}" class="${cls}"/>`;
      // برچسب یال: وسط یال، کمی بیرون‌تر از آن
      const side = x2 < x1 ? -1 : x2 > x1 ? 1 : -1;
      const mx = (x1 + x2) / 2 + side * (Math.abs(uy) * 9 + 2), my = (y1 + y2) / 2 + 4 - (x2 === x1 ? 0 : Math.abs(ux) * 3);
      const lc = gone.includes(k.key) ? 'sv-trie-lab sv-faded' : 'sv-trie-lab';
      labs += T(mx, my, k.lab, `${lc} sv-halo`, x2 === x1 ? 'end' : side < 0 ? 'end' : 'start');
    }
  }
  for (const v of nodes) {
    let cls = v === root ? 'sv-trie-root' : v.end ? 'sv-trie-end' : 'sv-trie';
    if (gone.includes(v.key)) cls = 'sv-node-gone';
    else if (cleared.includes(v.key)) cls = 'sv-trie-cleared';
    else if (add.includes(v.key)) cls = v.end ? 'sv-trie-new-end' : 'sv-trie-new';
    else if (inPath.has(v.key) && v !== root) cls += ` sv-trie-${pathCls}`;
    circ += C(X(v), Y(v), r, cls);
    if (mark[v.key]) txt += T(X(v) - r - 6, Y(v) + 5, mark[v.key], 'sv-trie-mark sv-halo', 'end');
    if (words && (v.end || cleared.includes(v.key))) {
      const struck = cleared.includes(v.key) || gone.includes(v.key);
      const wc = struck ? 'sv-trie-word sv-faded' : add.includes(v.key) ? 'sv-trie-word sv-trie-word-new' : 'sv-trie-word';
      const tw = v.key.length * 6.6;
      let lx, ly;
      if (v.kids.length) { lx = X(v) + r + 4; ly = Y(v) + 4; txt += T(lx, ly, v.key, `${wc} sv-halo`, 'start'); }
      else { lx = X(v) - tw / 2; ly = Y(v) + r + 14; txt += T(X(v), ly, v.key, `${wc} sv-halo`, 'middle'); }
      if (struck) txt += L(lx - 2, ly - 3.5, lx + tw + 2, ly - 3.5, 'sv-strike-ln');
    }
  }
  if (ghost) {
    const v = nodes.find((n) => n.key === ghost.at);
    const gx = X(v) + dx * 0.5, gy = Y(v) + dy;
    edges += `<line x1="${r1(X(v) + 5)}" y1="${r1(Y(v) + r)}" x2="${r1(gx - 4)}" y2="${r1(gy - r)}" class="sv-edge-fail"/>`;
    labs += T((X(v) + gx) / 2 + 7, (Y(v) + gy) / 2 + 2, ghost.lab, 'sv-trie-lab sv-trie-lab-fail sv-halo', 'start');
    txt += T(gx, gy + 5, '✗', 'sv-trie-x', 'middle');
  }
  const w = x0 * 2 + (leaves - 1) * dx + 16, h = y0 * 2 + maxD * dy + (words ? 12 : 0);
  return svg(w, h, edges + labs + circ + txt, label);
}

const BASE = ['the', 'then', 'thin', 'this', 'tip', 'see', 'so', 'some', 'win', 'wing'];
const pre = (w) => [''].concat([...w].map((_, i) => w.slice(0, i + 1)));

export const trieExample = () => trieSvg(fromWords(BASE), { label: 'درخت ترای برای ده کلمه' });
export const trieShared = () =>
  trieSvg(fromWords(BASE), { path: ['', 't', 'th', 'the', 'then', 'thi', 'thin', 'this'], pathCls: 'hl', mark: { th: 'th' }, label: 'کلمات با پیشوند مشترک th' });
export const trieSearchWin = () => trieSvg(fromWords(BASE), { path: pre('win'), pathCls: 'ok', label: 'جست‌وجوی win' });
export const trieSearchTie = () => trieSvg(fromWords(BASE), { path: pre('ti'), pathCls: 'hl', ghost: { at: 'ti', lab: 'e' }, label: 'جست‌وجوی tie' });
export const trieSearchTh = () => trieSvg(fromWords(BASE), { path: pre('th'), pathCls: 'hl', mark: { th: '−' }, label: 'جست‌وجوی th' });
export const trieInsertBag = () => trieSvg(fromWords([...BASE, 'bag']), { add: ['b', 'ba', 'bag'], label: 'درج bag' });
export const trieInsertWill = () => trieSvg(fromWords([...BASE, 'will']), { path: pre('wi'), pathCls: 'hl', add: ['wil', 'will'], label: 'درج will' });
export const trieDeleteWin = () => trieSvg(fromWords(BASE.filter((w) => w !== 'win')), { cleared: ['win'], label: 'حذف win' });
export const trieDeleteTip = () => trieSvg(fromWords(BASE), { gone: ['ti', 'tip'], path: ['', 't'], pathCls: 'hl', label: 'حذف tip' });

const SIMPLE = ['bear', 'bell', 'bid', 'busy', 'buy', 'sell', 'stock', 'stop'];
export const trieSimple = () => trieSvg(fromWords(SIMPLE), { dx: 50, label: 'ترای ساده برای هشت کلمه' });
export const trieCompressed = () => trieSvg(compress(fromWords(SIMPLE)), { dx: 56, dy: 60, label: 'ترای فشرده برای همان هشت کلمه' });

// ---------------------------------------------------------------- ساختار یک گره
export function trieNode() {
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', '…', 'y', 'z'];
  const cw = 28, x0 = 20, y0 = 34, W = x0 * 2 + (letters.length + 2) * cw + 10, H = 236;
  const flagX = x0 + letters.length * cw + 10;
  let b = ARROW_DEFS;
  b += T(x0 + (letters.length * cw) / 2, 22, 'child[0] … child[25]', 'sv-trie-word');
  b += T(flagX + cw, 22, 'isEnd', 'sv-trie-word');
  letters.forEach((ch, i) => {
    const x = x0 + i * cw;
    b += R(x, y0, cw, 24, 'sv-cell-sorted', 0) + T(x + cw / 2, y0 + 17, ch, 'sv-trie-lab');
    b += R(x, y0 + 24, cw, 26, 'sv-cell', 0);
    if (ch === '…') b += T(x + cw / 2, y0 + 42, '…', 'sv-tm');
    else if (ch === 'e' || ch === 'i') b += C(x + cw / 2, y0 + 37, 3, 'sv-dot-ink');
    else b += L(x + 6, y0 + 45, x + cw - 6, y0 + 29, 'sv-ln-faint');
  });
  b += R(flagX, y0, cw * 2, 50, 'sv-cell-key', 4) + T(flagX + cw, y0 + 32, '−', 'sv-big sv-t');
  // پیکان‌ها به فرزندان e و i
  const ex = x0 + 4 * cw + cw / 2, ix = x0 + 8 * cw + cw / 2, cy = y0 + 130;
  b += `<line x1="${ex}" y1="${y0 + 40}" x2="${ex - 40}" y2="${cy - 14}" class="sv-arrow" marker-end="url(#ah)"/>`;
  b += `<line x1="${ix}" y1="${y0 + 40}" x2="${ix + 30}" y2="${cy - 14}" class="sv-arrow" marker-end="url(#ah)"/>`;
  b += C(ex - 40, cy, 11, 'sv-trie-end') + T(ex - 40, cy + 28, 'the', 'sv-trie-word');
  b += C(ix + 30, cy, 11, 'sv-trie') + T(ix + 30, cy + 28, 'thi', 'sv-trie-word');
  b += L(W / 2 + 50, H - 10, W / 2 + 64, H - 22, 'sv-ln-faint');
  b += TF(W / 2 + 44, H - 12, 'خانهٔ خط‌خورده = NIL (فرزندی نیست)', 'sv-tm sv-xsmall', 'end');
  return svg(W, H, b, 'ساختار یک گرهٔ ترای');
}

export const FIGS3 = {
  trieExample, trieShared, trieSearchWin, trieSearchTie, trieSearchTh, trieInsertBag, trieInsertWill,
  trieDeleteWin, trieDeleteTip, trieSimple, trieCompressed, trieNode,
};
