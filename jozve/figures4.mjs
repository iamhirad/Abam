// شکل‌های صفحهٔ حل تمرین سری اول.
import { fa, r1, svg, T, TF, L, R, C, ARROW_DEFS } from './figures.mjs';

const LEVEL = ['sv-cell-big', 'sv-cell-a', 'sv-cell-b', 'sv-cell-med'];

// ---------------------------------------------------------------- مسئلهٔ ۱۴: پلهٔ مثلثی با n مربع
// پلهٔ S(n): سطر i (از بالا) خانه‌های ستون ۱ تا n-i+1 را دارد.
function stairPanel(n, u, ox, oy, { tiles = false, corners = false } = {}) {
  let b = '';
  for (let i = 1; i <= n; i++) for (let j = 1; j <= n - i + 1; j++) b += R(ox + (j - 1) * u, oy + (i - 1) * u, u, u, 'sv-cell', 0);
  if (tiles) {
    const rec = (r0, c0, m, lev) => {
      if (m <= 0) return;
      const k = (m + 1) / 2;
      b += R(ox + (c0 - 1) * u + 1.5, oy + (r0 - 1) * u + 1.5, k * u - 3, k * u - 3, LEVEL[lev % LEVEL.length], 3);
      b += T(ox + (c0 - 1 + k / 2) * u, oy + (r0 - 1 + k / 2) * u + 5, fa(k), 'sv-t sv-bold');
      rec(r0, c0 + k, k - 1, lev + 1);
      rec(r0 + k, c0, k - 1, lev + 1);
    };
    rec(1, 1, n, 0);
  }
  if (corners) for (let i = 1; i <= n; i++) b += C(ox + (n - i + 0.5) * u, oy + (i - 0.5) * u, 5, 'sv-dot');
  return b;
}
export function stairSquares() {
  const n = 7, u = 24, gap = 46, x0 = 14, y0 = 34;
  const w = n * u;
  let b = '';
  b += TF(x0 + w + gap + w / 2, 20, 'خانه‌های گوشه', 'sv-tm sv-small');
  b += stairPanel(n, u, x0 + w + gap, y0, { corners: true });
  b += TF(x0 + w / 2, 20, 'تنها کاشی‌کاری با ۷ مربع', 'sv-tm sv-small');
  b += stairPanel(n, u, x0, y0, { tiles: true });
  return svg(x0 * 2 + w * 2 + gap, y0 + n * u + 12, b, 'پلهٔ مثلثی S(7) و کاشی‌کاری آن با ۷ مربع');
}

// ---------------------------------------------------------------- مسئلهٔ ۱۶: پله و n مستطیل با مساحت‌های متفاوت
// پلهٔ پایینی: سطر i (از بالا) خانه‌های ستون ۱ تا i را دارد.
function lowStair(n, u, ox, oy, rects = []) {
  let b = '';
  for (let i = 1; i <= n; i++) for (let j = 1; j <= i; j++) b += R(ox + (j - 1) * u, oy + (i - 1) * u, u, u, 'sv-cell', 0);
  for (const [r0, c0, h, w, cls, lab] of rects) {
    b += R(ox + (c0 - 1) * u + 1.5, oy + (r0 - 1) * u + 1.5, w * u - 3, h * u - 3, cls, 3);
    if (lab) b += T(ox + (c0 - 1 + w / 2) * u, oy + (r0 - 1 + h / 2) * u + 5, lab, 'sv-t sv-bold');
  }
  return b;
}
export function stairRects() {
  const u = 22, gap = 34, y0 = 34, x0 = 12;
  const n = 5, w = n * u;
  const W = x0 * 2 + 3 * w + 2 * gap;
  let b = '';
  // ترتیب خواندن راست‌به‌چپ: پنل اول سمت راست
  let x = W - x0 - w;
  b += TF(x + w / 2, 20, 'انتخاب ۱: ستون اول', 'sv-tm sv-small');
  b += lowStair(n, u, x, y0, [[1, 1, 5, 1, 'sv-cell-big', fa(5)]]);
  b += T(x + 3.3 * u, y0 + 3.6 * u, 'S(4)', 'sv-math sv-small sv-tc');
  x -= w + gap;
  b += TF(x + w / 2, 20, 'انتخاب ۲: سطر آخر', 'sv-tm sv-small');
  b += lowStair(n, u, x, y0, [[5, 1, 1, 5, 'sv-cell-big', fa(5)]]);
  b += T(x + 2.0 * u, y0 + 3.0 * u, 'S(4)', 'sv-math sv-small sv-tc');
  x -= w + gap;
  b += TF(x + w / 2, 20, 'یک افراز کامل برای n = ۵', 'sv-tm sv-small');
  b += lowStair(n, u, x, y0, [
    [1, 1, 5, 1, 'sv-cell-big', fa(5)],
    [5, 2, 1, 4, 'sv-cell-a', fa(4)],
    [2, 2, 3, 1, 'sv-cell-b', fa(3)],
    [4, 3, 1, 2, 'sv-cell-med', fa(2)],
    [3, 3, 1, 1, 'sv-cell-hl', fa(1)],
  ]);
  return svg(W, y0 + n * u + 12, b, 'دو انتخاب برای مستطیل شامل گوشهٔ پایین چپ و یک افراز کامل');
}

// ---------------------------------------------------------------- مسئلهٔ ۱۵: مجموع پیشوندی بنزین
export function gasPrefix() {
  const d = [3, -4, 2, -3, 5, -3];
  const P = [0];
  d.forEach((v) => P.push(P[P.length - 1] + v));
  const W = 470, H = 230, x0 = 52, x1 = W - 26, yTop = 26, yBot = H - 44;
  const lo = -3, hi = 4;
  const X = (k) => x0 + ((x1 - x0) * k) / d.length;
  const Y = (v) => yTop + ((hi - v) * (yBot - yTop)) / (hi - lo);
  let b = ARROW_DEFS;
  for (let v = lo; v <= hi; v++) {
    b += L(x0, Y(v), x1, Y(v), v === 0 ? 'sv-axis' : 'sv-grid');
    b += T(x0 - 8, Y(v) + 4, fa(v).replace('-', '−'), 'sv-tm sv-xsmall', 'end');
  }
  for (let k = 0; k <= d.length; k++) b += T(X(k), yBot + 18, fa(k), 'sv-tm sv-xsmall');
  b += TF((x0 + x1) / 2, H - 6, 'شمارهٔ پمپ', 'sv-tm sv-xsmall');
  b += `<polyline points="${P.map((v, k) => `${r1(X(k))},${r1(Y(v))}`).join(' ')}" class="sv-curve sv-c1"/>`;
  P.forEach((v, k) => (b += C(X(k), Y(v), 4, k === 4 ? 'sv-dot' : 'sv-dot-ink')));
  const mx = X(4), my = Y(-2);
  b += `<line x1="${r1(mx + 30)}" y1="${r1(my + 14)}" x2="${r1(mx + 7)}" y2="${r1(my + 4)}" class="sv-arrow-c" marker-end="url(#ahc)"/>`;
  b += TF(mx + 34, my + 19, 'کمینه: از پمپ ۵ شروع کن', 'sv-t sv-small sv-tcw sv-halo', 'start');
  b += TF(x0 + 4, yTop - 8, 'مجموع پیشوندی بنزینِ گرفته‌شده منهای بنزینِ مصرف‌شده', 'sv-tm sv-xsmall', 'start');
  return svg(W, H, b, 'نمودار مجموع پیشوندی بنزین منهای مصرف');
}

// ---------------------------------------------------------------- مسئلهٔ ۱۹: مسیر همیلتونی در مکعب Q3
export function cubePath() {
  const S = 120, fx = 70, fy = 100, bx = 70 + 90, by = 100 - 64;
  const pos = (s) => {
    const a = +s[0], b = +s[1], c = +s[2];
    const ox = c ? bx : fx, oy = c ? by : fy;
    return [ox + b * S, oy + a * S];
  };
  const V = ['000', '001', '010', '011', '100', '101', '110', '111'];
  let b = ARROW_DEFS;
  // همهٔ یال‌های مکعب (کم‌رنگ)
  for (const u of V)
    for (let k = 0; k < 3; k++) {
      const v = u.slice(0, k) + (u[k] === '0' ? '1' : '0') + u.slice(k + 1);
      if (u < v) {
        const [x1, y1] = pos(u), [x2, y2] = pos(v);
        b += L(x1, y1, x2, y2, 'sv-grid');
      }
    }
  const path = ['000', '100', '110', '010', '011', '001', '101', '111'];
  for (let k = 0; k < path.length - 1; k++) {
    const [x1, y1] = pos(path[k]), [x2, y2] = pos(path[k + 1]);
    const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const cls = k < 3 ? 'sv-curve sv-c1' : k === 3 ? 'sv-curve sv-cw' : 'sv-curve sv-c2';
    b += `<line x1="${r1(x1 + ux * 9)}" y1="${r1(y1 + uy * 9)}" x2="${r1(x2 - ux * 12)}" y2="${r1(y2 - uy * 12)}" class="${cls}" marker-end="url(#ah)"/>`;
    b += T((x1 + x2) / 2 - uy * 12, (y1 + y2) / 2 + ux * 12 + 4, fa(k + 1), 'sv-tm sv-small sv-bold sv-halo');
  }
  const special = { '000': 's', '111': 't', '010': 'u', '011': "u'" };
  for (const v of V) {
    const [x, y] = pos(v);
    b += C(x, y, 7, special[v] ? 'sv-node-hl' : 'sv-node');
    const left = v[1] === '0';
    const up = v[0] === '0';
    const lx = x + (left ? -12 : 12), ly = y + (up ? -10 : 18);
    b += T(lx, ly, v, 'sv-trie-word sv-halo', left ? 'end' : 'start');
    if (special[v]) b += T(lx, ly + (up ? -14 : 14), special[v], 'sv-math sv-small sv-tcw sv-halo', left ? 'end' : 'start');
  }
  return svg(fx + S + 90 + 110, fy + S + 34, b, 'مسیر همیلتونی در مکعب سه‌بعدی از ۰۰۰ تا ۱۱۱');
}

// ---------------------------------------------------------------- مسئلهٔ ۳۳: دو رنگ کردن یال‌های گشت اویلری
export function eulerSplit() {
  const Lx = 90, Rx = 330, ys = [40, 110, 180];
  const Ln = ['a', 'b', 'c'], Rn = ['x', 'y', 'z'];
  const P = { a: [Lx, ys[0]], b: [Lx, ys[1]], c: [Lx, ys[2]], x: [Rx, ys[0]], y: [Rx, ys[1]], z: [Rx, ys[2]] };
  const tour = ['a', 'x', 'b', 'y', 'c', 'z', 'a'];
  let b = '';
  for (let k = 0; k < tour.length - 1; k++) {
    const [x1, y1] = P[tour[k]], [x2, y2] = P[tour[k + 1]];
    const cls = k % 2 === 0 ? 'sv-curve sv-c1' : 'sv-curve sv-c4';
    b += L(x1, y1, x2, y2, cls);
    const t = k === 5 ? 0.22 : 0.3;
    const mx = x1 + (x2 - x1) * t, my = y1 + (y2 - y1) * t;
    b += C(mx, my, 10, 'sv-cell') + T(mx, my + 4, fa(k + 1), `sv-small sv-bold ${k % 2 === 0 ? 'sv-tc1' : 'sv-tc4'}`);
  }
  Ln.forEach((n) => { const [x, y] = P[n]; b += C(x, y, 13, 'sv-node') + T(x, y + 5, n, 'sv-math'); });
  Rn.forEach((n) => { const [x, y] = P[n]; b += C(x, y, 13, 'sv-node') + T(x, y + 5, n, 'sv-math'); });
  b += TF(Lx, 222, 'بخش L', 'sv-tm sv-small');
  b += TF(Rx, 222, 'بخش R', 'sv-tm sv-small');
  return svg(420, 236, b, 'رنگ کردن یک‌درمیان یال‌های گشت اویلری در گراف دوبخشی ۲-منتظم');
}

export const FIGS4 = { stairSquares, stairRects, gasPrefix, cubePath, eulerSplit };
