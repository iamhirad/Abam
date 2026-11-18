// شکل‌های صفحهٔ حل تمرین سری دوم.
import { fa, r1, svg, T, TF, L, R, C, ARROW_DEFS } from './figures.mjs';

// ---------------------------------------------------------------- مسئلهٔ ۸: جست‌وجوی پله‌ای در جدول صعودی
const YT = [
  [1, 4, 7, 11, 15],
  [2, 5, 8, 12, 19],
  [3, 6, 9, 16, 22],
  [10, 13, 14, 17, 24],
  [18, 21, 23, 26, 30],
];
export function youngSearch() {
  const x = 14, u = 46, x0 = 30, y0 = 30, n = YT.length;
  const path = [[0, 4], [0, 3], [1, 3], [2, 3], [2, 2], [3, 2]];
  const cx = (j) => x0 + j * u + u / 2, cy = (i) => y0 + i * u + u / 2;
  let b = ARROW_DEFS;
  YT.forEach((row, i) =>
    row.forEach((v, j) => {
      const found = i === 3 && j === 2;
      b += R(x0 + j * u, y0 + i * u, u, u, found ? 'sv-cell-key' : v <= x ? 'sv-cell-sorted' : 'sv-cell', 0);
      b += T(cx(j), cy(i) + 6, fa(v), 'sv-t sv-cellnum');
    }),
  );
  for (let t = 0; t + 1 < path.length; t++) {
    const [i1, j1] = path[t], [i2, j2] = path[t + 1];
    const dx = Math.sign(j2 - j1), dy = Math.sign(i2 - i1);
    b += `<line x1="${r1(cx(j1) + dx * 12)}" y1="${r1(cy(i1) + dy * 12)}" x2="${r1(cx(j2) - dx * 14)}" y2="${r1(cy(i2) - dy * 14)}" class="sv-arrow-c" marker-end="url(#ahc)"/>`;
  }
  b += C(cx(4), cy(0), 17, 'sv-ring-start');
  b += TF(x0 + n * u + 10, y0 + 18, 'شروع', 'sv-tm sv-small', 'start');
  b += TF(x0 + (n * u) / 2, y0 + n * u + 24, 'خانه‌های رنگی: مقدار ≤ ۱۴ (۱۴ خانه)', 'sv-tm sv-small');
  return svg(x0 * 2 + n * u + 40, y0 + n * u + 36, b, 'جست‌وجوی پله‌ای عدد ۱۴ در جدول صعودی');
}

// ---------------------------------------------------------------- مسئلهٔ ۱۰: سطل‌های هم‌مساحت در دایره
export function diskBuckets() {
  const n = 5, R0 = 110, cx = 140, cy = 130;
  let b = '';
  const cls = ['sv-ring1', 'sv-ring2', 'sv-ring3', 'sv-ring4', 'sv-ring5'];
  for (let k = n; k >= 1; k--) b += C(cx, cy, r1(R0 * Math.sqrt(k / n)), cls[(k - 1) % cls.length]);
  // نقطه‌های نمونه (ثابت، برای تکرارپذیری)
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let t = 0; t < 26; t++) {
    const r = Math.sqrt(rnd()) * R0 * 0.97, a = rnd() * 2 * Math.PI;
    b += C(cx + r * Math.cos(a), cy + r * Math.sin(a), 2.6, 'sv-dot-ink');
  }
  // شمارهٔ هر حلقه، وسط پهنای آن، روی یک شعاع مورب
  const ang = -Math.PI / 5;
  b += L(cx, cy, cx + R0 * Math.cos(ang), cy + R0 * Math.sin(ang), 'sv-grid');
  for (let k = 1; k <= n; k++) {
    const rm = R0 * (Math.sqrt((k - 1) / n) + Math.sqrt(k / n)) / 2;
    b += T(cx + rm * Math.cos(ang), cy + rm * Math.sin(ang) + 4, fa(k), 'sv-t sv-xsmall sv-bold sv-halo');
  }
  b += C(cx, cy, 3, 'sv-dot');
  return svg(280, 262, b, 'پنج حلقهٔ هم‌مساحت در دایرهٔ واحد');
}

export const FIGS5 = { youngSearch, diskBuckets };
