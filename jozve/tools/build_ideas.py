# صفحهٔ «ایده‌نامه» را از دادهٔ ideas_a/b/c می‌سازد.
#   python3 tools/build_ideas.py   →  src/ideas/*.html  (و پیوند «ایده‌های این مسئله» در src/t1 و src/t2)
import os, re, sys, glob, html as H
sys.path.insert(0, os.path.dirname(__file__))
from proofs_scan import CHAPTERS, SRC
from ideas_a import CH0, CH1, CH2
from ideas_b import CH3, CH4, CH5
from ideas_c import CH6, CH7, CH8, CH9, CH10

OUT = os.path.join(SRC, 'ideas')
BOOK = 'https://iamhirad.github.io/Abam/'
IDEAS_URL = BOOK + 'ideas.html'
FA = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')
fa = lambda x: str(x).translate(FA)

ALL = [CH0, CH1, CH2, CH3, CH4, CH5, CH6, CH7, CH8, CH9, CH10]

KINDS = [  # کلید، نام، رنگ
    ('design', 'طراحی الگوریتم', 'c2'),
    ('analysis', 'تحلیل زمان', 'c1'),
    ('proof', 'اثبات درستی', 'c10'),
    ('lower', 'کران پایین', 'c4'),
    ('prob', 'احتمال', 'c3'),
    ('ds', 'ساختمان داده', 'c6'),
    ('count', 'شمارش و ساختن', 'c8'),
]
KIND_NAME = {k: n for k, n, _ in KINDS}


def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s).strip()


# ---------- عنوان بخش‌های جزوه، مسئله‌ها و اثبات‌ها (برای برچسب پیوندها) ----------
def load_titles():
    book, ch_title = {}, {}
    for ci, f in enumerate(CHAPTERS, 1):
        s = open(os.path.join(SRC, f)).read()
        ch_title[ci] = re.search(r'data-title="([^"]+)"', s).group(1)
        for k, m in enumerate(re.finditer(r'<h2>(.*?)</h2>', s, re.S), 1):
            book[f'{ci}-{k}'] = strip_tags(m.group(1))
    probs = {}
    for d in ('t1', 't2'):
        for f in sorted(glob.glob(os.path.join(SRC, d, '0[1-9]*.html'))):
            s = open(f).read()
            for m in re.finditer(r'<article class="prob" id="p(\d+)".*?class="p-h">(.*?)</h2>', s, re.S):
                probs[(d, int(m.group(1)))] = strip_tags(m.group(2)).rstrip('*').strip()
    pf = {}
    for c in range(1, 11):
        p = os.path.join(SRC, 'proofs', f'ch{c:02d}.html')
        if os.path.exists(p):
            for k, m in enumerate(re.finditer(r'<h2>(.*?)</h2>', open(p).read(), re.S), 1):
                pf[f'{c}-{k}'] = strip_tags(m.group(1))
    return book, ch_title, probs, pf


BOOK_T, CH_T, PROB_T, PF_T = load_titles()
CH_T[0] = 'ایده‌های همه‌جایی'

# ---------- شماره‌گذاری و بررسی داده ----------
IDX = {}
for chd in ALL:
    c = chd['ch']
    chd['title'] = chd['title'] or CH_T[c]
    for k, it in enumerate(chd['ideas'], 1):
        assert it['key'] not in IDX, it['key']
        it['id'] = f's{c}-{k}'
        it['num'] = f'{fa(c)}.{fa(k)}'
        it['ch'] = c
        it['color'] = chd['color']
        IDX[it['key']] = it

errors = []
for it in IDX.values():
    for r in it['rel']:
        if r not in IDX:
            errors.append(f'{it["key"]}: rel ناشناخته {r}')
    for k in it['kinds']:
        if k not in KIND_NAME:
            errors.append(f'{it["key"]}: نوع ناشناخته {k}')
    for b in it['book']:
        if b not in BOOK_T:
            errors.append(f'{it["key"]}: بخش جزوهٔ ناموجود {b}')
    for p in it['pf']:
        if p not in PF_T:
            errors.append(f'{it["key"]}: اثبات ناموجود {p}')
    for d in ('t1', 't2'):
        for n in it[d]:
            if (d, n) not in PROB_T:
                errors.append(f'{it["key"]}: مسئلهٔ ناموجود {d}#{n}')
if errors:
    print('\n'.join(errors))
    sys.exit(1)


def L(key, num=True):
    it = IDX[key]
    return f'<a href="#{it["id"]}">{"<b>" + it["num"] + "</b>" if num else ""}{it["name"]}</a>'


def kind_pills(it):
    return ''.join(f'<span class="ik" data-k="{k}">{KIND_NAME[k]}</span>' for k in it['kinds'])


def refs_html(it):
    chips = []
    for b in it['book']:
        c, k = b.split('-')
        chips.append(f'<a class="ir book" href="{BOOK}#s{b}"><b>جزوه {fa(c)}.{fa(k)}</b>{BOOK_T[b]}</a>')
    for d, label, page in (('t1', 'سری ۱', 'tamrin-1.html'), ('t2', 'سری ۲', 'tamrin-2.html')):
        for n in it[d]:
            chips.append(f'<a class="ir {d}" href="{BOOK}{page}#p{n}"><b>{label}، مسئلهٔ {fa(n)}</b>{PROB_T[(d, n)]}</a>')
    for p in it['pf']:
        c, k = p.split('-')
        chips.append(f'<a class="ir pf" href="{BOOK}proofs.html#s{p}"><b>اثبات {fa(c)}.{fa(k)}</b>{PF_T[p]}</a>')
    out = ''
    if chips:
        out += f'<div class="idea-refs"><span class="ir-h">کجا به کار رفت؟</span>{"".join(chips)}</div>\n'
    if it['rel']:
        out += f'<div class="idea-rel"><span class="ir-h">هم‌خانواده‌ها</span>{"".join(L(r) for r in it["rel"])}</div>\n'
    return out


def card(it):
    sub = 'گام‌به‌گام' + ('، نمونه' if it['ex'] else '') + (' و دام' if it['trap'] else '')
    parts = [f'<article class="idea" data-kinds="{" ".join(it["kinds"])}" data-key="{it["key"]}">',
             f'<h2>{it["name"]}</h2>',
             f'<div class="idea-meta">{kind_pills(it)}</div>',
             f'<p class="idea-core">{it["core"]}</p>',
             '<button class="reveal" type="button">نام ایده را نشان بده</button>',
             '<div class="idea-when"><div class="iw-h">کِی سراغش برویم؟</div><ul>' + ''.join(f'<li>{w}</li>' for w in it['when']) + '</ul></div>',
             f'<details class="sol idea-how" open><summary>چطور کار می‌کند؟ <span class="sub">{sub}</span></summary><div class="sol-body">',
             '<ol class="how-steps">' + ''.join(f'<li>{h}</li>' for h in it['how']) + '</ol>']
    if it['ex']:
        parts.append(f'<div class="box ex"><div class="bh"></div><p>{it["ex"].strip()}</p></div>')
    if it['trap']:
        parts.append(f'<div class="box trap"><div class="bh"></div><p>{it["trap"].strip()}</p></div>')
    parts.append('</div></details>')
    parts.append(refs_html(it) + '</article>')
    return '\n'.join(parts)


def chapter_file(chd):
    c = chd['ch']
    n = len(chd['ideas'])
    kicker = 'پایهٔ همهٔ فصل‌ها' if c == 0 else f'فصل {fa(c)}'
    link = '' if c == 0 else f'\n  <p class="ch-lead ch-link"><a href="{BOOK}#ch{c}">این فصل در جزوه ↗</a></p>'
    head = [f'<section class="chapter" data-ch="{c}" data-color="{chd["color"]}" data-title="{chd["title"]}" id="ch{c}">',
            '<header class="ch-head">',
            f'  <div class="ch-kicker">{kicker} — {fa(n)} ایده</div>',
            f'  <h1>{chd["title"]}</h1>',
            f'  <p class="ch-lead">{chd["lead"].strip()}</p>{link}',
            f'  <div class="ch-big" aria-hidden="true">{fa(c)}</div>',
            '</header>']
    body = '\n\n'.join(card(it) for it in chd['ideas'])
    return '\n'.join(head) + '\n\n' + body + '\n</section>\n'


# ---------- نقشهٔ «از نشانه به ایده» ----------
SIGNALS = [
    (r'«الگوریتم خطی \(O(n)\) بدهید»', 'یک پیمایش، و ساختاری که هر عنصر را تعداد ثابتی بار لمس کند',
     ['prefix-sums', 'kadane', 'two-pointers', 'monotone-stack', 'charge-objects', 'prune-search', 'mom', 'bottom-up-build', 'staircase', 'direct-index', 'single-pass-parse', 'floyd']),
    (r'«بهتر از \(O(n^2)\)»، معمولاً \(O(n\log n)\)', 'تقسیم و حل با ترکیب خطی، یا مرتب‌سازی و بعد یک پیمایش',
     ['dc-template', 'cross-boundary', 'two-pointers', 'strengthen-recursion', 'packing', 'sweep', 'heapsort', 'fewer-subproblems', 'monge']),
    (r'«مرتب‌سازی سریع‌تر از \(n\log n\)»', 'از خود مقدار کلیدها استفاده کن',
     ['break-bound', 'direct-index', 'radix-base-n', 'bucket-cdf', 'stability', 'trie-sort']),
    ('«میانه»، «رتبه»، «صدک»، «جمع تا نصف»', 'مرتب نکن؛ افراز کن و فقط یک طرف را ادامه بده',
     ['prune-search', 'mom', 'weighted-median', 'multi-select', 'freq-candidates', 'two-heaps', 'amplify']),
    ('«امید ریاضیِ تعداد …»', 'نشانگر، خطی بودن امید و تقارن',
     ['sample-space', 'indicator', 'symmetry', 'harmonic', 'quicksort-pairs', 'condition-root', 'exp-jensen', 'cycles']),
    ('«ثابت کنید یکنواخت است»، «نمونهٔ تصادفی بسازید»', 'احتمال هر خروجی را حساب کن',
     ['uniform-proof', 'reservoir', 'sample-space', 'amplify', 'randomize']),
    ('«ثابت کنید وجود دارد»، «دست‌کم … هست»', 'شمارش دوگانه، روش احتمالاتی یا شیء حدی',
     ['prob-method', 'double-count', 'extremal', 'special-cells', 'indicator']),
    ('«ثابت کنید الگوریتم درست است»', 'ناوردا، استقرا روی ساختار، یا باز کردن تعریف',
     ['invariant', 'unfold', 'tree-recursion', 'greedy-simulation', 'sift', 'stability', 'zero-one']),
    ('«ثابت کنید تمام می‌شود»، «حداکثر چند گام؟»', 'کمیتی که فقط یک طرف می‌رود',
     ['monovariant', 'potential-catalog', 'cycles', 'inversions']),
    ('«حداقل چند مقایسه یا عمل لازم است؟»', 'کران پایین: شمردن جواب‌ها یا معیار پیشرفت',
     ['decision-tree', 'info-bound', 'read-all', 'monovariant', 'inversions', 'special-cells', 'worst-input']),
    ('«هزینهٔ سرشکن را پیدا کنید»', 'کل دنباله را ببین، نه بدترین تک‌عمل را',
     ['whole-sequence', 'aggregate', 'accounting', 'potential', 'charge-objects', 'multiplicative-growth', 'potential-catalog']),
    ('«رابطهٔ بازگشتی را حل کنید»', 'اول ببین کدام بخش درخت بازگشت غالب است',
     ['master', 'recursion-tree', 'uneven-split', 'guess-induct', 'strengthen-hyp', 'change-var', 'divide-product']),
    ('«زمان این کد؟»، «توابع را به ترتیب رشد مرتب کنید»', 'جمع بنویس و جملهٔ غالب را نگه دار',
     ['loops-to-sums', 'series', 'ladder', 'limit', 'take-log', 'o-omega', 'compose', 'incomparable', 'real-values']),
    ('«به چند طریق …؟»', 'مثال کوچک، گام آخر، تبدیل کوچک‌کننده',
     ['small', 'last-step', 'shrink', 'double-count', 'cycles', 'special-cells']),
    (r'«برای هر \(n\) بسازید»', 'از دو نمونهٔ کوچک‌تر بساز و فقط مرز را بررسی کن',
     ['doubling-construction', 'cut-coordinate', 'euler-split', 'shrink', 'extremal', 'small']),
    ('«کدام ساختمان داده؟»', 'اول عمل‌ها و تعدادشان را بشمار',
     ['adt', 'array-vs-list', 'pq-ops', 'preprocess', 'two-heaps', 'char-by-char', 'lcrs', 'sweep', 'circular']),
    ('درخت، پیمایش و عبارت', 'تعریف بازگشتی و پیمایش مناسب',
     ['tree-recursion', 'traversals', 'rebuild', 'grammar-tree', 'eval-postorder', 'postfix-stack', 'two-stacks', 'paren-depth']),
    ('«پرس‌وجوهای زیاد»، «همهٔ جواب‌ها را گزارش کنید»', 'پیش‌پردازش، و هزینه‌ای متناسب با اندازهٔ خروجی',
     ['preprocess', 'pruned-traversal', 'range-report', 'prefix-ancestor', 'prefix-sums', 'end-flag']),
    ('ساختارهای تودرتو، «تکلیف بعداً معلوم می‌شود»', 'کارهای نیمه‌تمام را روی پشته نگه دار',
     ['stack-pending', 'monotone-stack', 'greedy-simulation', 'postfix-stack', 'two-stacks']),
    ('اشاره‌گرها و لیست‌ها', 'ترتیب انتساب‌ها و حالت‌های مرزی',
     ['pointer-order', 'floyd', 'index-as-pointer', 'circular', 'array-vs-list']),
]
SIG_COLORS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10']


def front():
    total = len(IDX)
    nbook = len({b for it in IDX.values() for b in it['book']})
    nprob = len({(d, n) for it in IDX.values() for d in ('t1', 't2') for n in it[d]})
    npf = len({p for it in IDX.values() for p in it['pf']})
    kind_btns = ''.join(f'<button class="btn" type="button" data-kind="{k}" aria-pressed="false"><i class="kd" data-k="{k}"></i>{n}</button>' for k, n, _ in KINDS)
    groups = []
    for i, (title, hint, keys) in enumerate(SIGNALS):
        for k in keys:
            assert k in IDX, k
        chips = ''.join(f'<a href="#{IDX[k]["id"]}"><b>{IDX[k]["num"]}</b>{IDX[k]["name"]}</a>' for k in keys)
        groups.append(f'<div class="pgroup sig" data-color="{SIG_COLORS[i % 10]}"><h3>{title} <span class="dcount">{hint}</span></h3><div class="pchips">{chips}</div></div>')
    return f'''<header class="cover" id="top">
  <div class="cover-kicker">جزوهٔ ساختمان داده‌ها و الگوریتم‌ها</div>
  <h1><span class="c-a">ایده‌</span><span class="c-b">نامه</span></h1>
  <p class="cover-lead">
    مهم‌ترین چیزی که از یک درس می‌ماند ایده‌هاست: ابزارهایی که با آن‌ها مسئله‌ای را حل می‌کنی که هرگز ندیده‌ای.
    این صفحه همهٔ ایده‌های جزوه، دو سری تمرین و اثبات‌ها را فصل به فصل جمع کرده است. هر ایده یک کارت است:
    <strong>جملهٔ اصلی</strong>، <strong>نشانه‌هایی</strong> که در صورت مسئله می‌گویند «این را امتحان کن»، <strong>سازوکار گام‌به‌گام</strong>،
    نمونه‌ای از درس، دامی که باید از آن دوری کرد، و پیوند به جاهایی که به کار رفته است.
  </p>
  <div class="cover-meta"><span><b>{fa(total)}</b> ایده در ۱۱ فصل</span><span>پیوند به <b>{fa(nbook)}</b> بخش جزوه، <b>{fa(nprob)}</b> مسئلهٔ تمرین و <b>{fa(npf)}</b> اثبات</span></div>
  <div class="cover-links">
    <a class="btn primary" href="#signals">از نشانه به ایده ↓</a>
    <a class="btn" href="#toc">فهرست ایده‌ها ↓</a>
    <a class="btn" href="#glance">همه در یک نگاه ↓</a>
    <a class="btn" href="{BOOK}">جزوهٔ درس ↗</a>
    <a class="btn" href="{BOOK}tamrin-1.html">حل تمرین ۱ ↗</a>
    <a class="btn" href="{BOOK}tamrin-2.html">حل تمرین ۲ ↗</a>
    <a class="btn" href="{BOOK}proofs.html">اثبات‌ها ↗</a>
  </div>
</header>

<section class="idea-tools" id="find" aria-label="جست‌وجو و پالایش ایده‌ها">
  <div class="it-row">
    <input class="it-search" type="search" data-idea-search placeholder="جست‌وجو در ایده‌ها: میانه، پشته، امید، کران پایین، …" aria-label="جست‌وجو در ایده‌ها">
    <span class="it-count" data-idea-count>{fa(total)} ایده</span>
  </div>
  <div class="it-row kind-filter" role="group" aria-label="نوع ایده">
    <button class="btn" type="button" data-kind="all" aria-pressed="true">همهٔ انواع</button>{kind_btns}
  </div>
  <div class="it-row">
    <button class="btn primary" type="button" data-quiz-toggle aria-pressed="false">حالت آزمون: نام ایده‌ها را بپوشان</button>
    <button class="btn" type="button" data-toggle-all="close">بستن سازوکارها</button>
    <button class="btn" type="button" data-toggle-all="open">باز کردن همه</button>
  </div>
  <p class="it-empty" data-idea-empty hidden>هیچ ایده‌ای پیدا نشد. واژهٔ کوتاه‌تری امتحان کنید یا نوع را روی «همهٔ انواع» بگذارید.</p>
</section>

<section class="intro front-only">
  <h2 class="plain-h">هر کارت چه دارد؟</h2>
  <ol class="steps-how">
    <li style="--k: var(--c10)"><b>نام و جملهٔ اصلی.</b> ایده در یک یا دو جمله؛ همان چیزی که باید در ذهن بماند.</li>
    <li style="--k: var(--c8)"><b>کِی سراغش برویم؟</b> عبارت‌هایی در صورت مسئله که این ایده را صدا می‌زنند. مهم‌ترین بخش برای حل مسئلهٔ تازه.</li>
    <li style="--k: var(--k-sum)"><b>چطور کار می‌کند؟</b> سازوکار گام‌به‌گام، نمونه‌ای از درس و دامی که دانشجوها زیاد در آن می‌افتند.</li>
    <li style="--k: var(--c1)"><b>کجا به کار رفت؟</b> پیوند به بخش جزوه، مسئله‌های تمرین و اثبات‌هایی که همین ایده را دارند.</li>
  </ol>

  <h2 class="plain-h">با یک مسئلهٔ تازه چه کنیم؟</h2>
  <ol class="steps-how">
    <li style="--k: var(--c2)"><b>بفهم.</b> {L('small')} و {L('unfold')}. تا مثال کوچک را با دست حل نکرده‌ای، سراغ ایدهٔ بزرگ نرو.</li>
    <li style="--k: var(--c3)"><b>تشخیص بده.</b> جملهٔ صورت مسئله را در <a href="#signals">از نشانه به ایده</a> پیدا کن و دو سه ایدهٔ نامزد بردار.</li>
    <li style="--k: var(--c4)"><b>امتحان کن.</b> ایده را روی مثال کوچک اجرا کن. اگر کار نکرد، {L('worst-input')} تا ببینی کجا می‌شکند؛ همین معمولاً ایدهٔ بعدی را نشان می‌دهد.</li>
    <li style="--k: var(--c6)"><b>ثابت کن و تحلیل کن.</b> درستی با {L('invariant')} یا استقرا؛ زمان با {L('loops-to-sums')} یا {L('recursion-tree')}.</li>
    <li style="--k: var(--c10)"><b>ببند.</b> جواب را روی مثال کوچک چک کن و بپرس: کران پایین هم دارم؟ ({L('decision-tree')}، {L('monovariant')})</li>
  </ol>
  <p>
    <strong>حالت آزمون</strong> برای تمرین است: نام و جملهٔ اصلی هر ایده پوشیده می‌شود و فقط نشانه‌ها می‌مانند. از روی نشانه‌ها حدس بزن کدام ایده است،
    بعد روی کارت بزن تا جواب پیدا شود. این دقیقاً همان مهارتی است که سر جلسهٔ امتحان لازم داری.
  </p>
</section>

<section class="signals front-only" id="signals">
  <h2 class="plain-h">از نشانه به ایده</h2>
  <p>صورت مسئله چه می‌خواهد؟ گروه مناسب را پیدا کن و ایده‌هایش را به ترتیب امتحان کن. یک ایده ممکن است در چند گروه بیاید.</p>
  <div class="pgroups">{''.join(groups)}</div>
</section>

<nav class="toc front-only" id="toc" aria-label="فهرست ایده‌ها">
  <h2 class="toc-h">فهرست ایده‌ها</h2>
  <!--TOC-->
</nav>
<a class="to-top" href="#find">↑ جست‌وجو</a>
'''


def glance():
    out = ['<section class="glance front-only" id="glance">',
           '<h2 class="plain-h">همهٔ ایده‌ها در یک نگاه</h2>',
           '<p>برای مرور شب امتحان: هر ایده در یک خط. روی نام بزن تا به کارت کاملش بروی.</p>']
    for chd in ALL:
        c = chd['ch']
        lab = 'پایه' if c == 0 else f'فصل {fa(c)}'
        items = ''.join(f'<li><a href="#{it["id"]}"><b>{it["num"]}</b>{it["name"]}</a><span>{it["core"]}</span></li>' for it in chd['ideas'])
        out.append(f'<div class="glance-ch" style="--chc: var(--{chd["color"]})"><h3>{lab} — {chd["title"]}</h3><ol class="glance-list">{items}</ol></div>')
    out.append('</section>\n')
    return '\n'.join(out)


# ---------- پیوند «ایده‌های این مسئله» در صفحه‌های حل تمرین ----------
def inject_problem_links():
    rev = {}
    for it in IDX.values():
        for d in ('t1', 't2'):
            for n in it[d]:
                rev.setdefault((d, n), []).append(it)
    changed = 0
    for d in ('t1', 't2'):
        for f in sorted(glob.glob(os.path.join(SRC, d, '0[1-9]*.html'))):
            s = open(f).read()
            s2 = re.sub(r'\n<p class="p-ideas">.*?</p>', '', s)

            def add(m):
                n = int(m.group(1))
                its = sorted(rev.get((d, n), []), key=lambda x: (x['ch'], int(x['id'].split('-')[1])))
                if not its:
                    return m.group(0)
                links = '، '.join(f'<a href="{IDEAS_URL}#{x["id"]}"><b>{x["num"]}</b> {x["name"]}</a>' for x in its)
                return m.group(0) + f'\n<p class="p-ideas"><b>ایده‌های این مسئله در ایده‌نامه:</b> {links}</p>'
            s2 = re.sub(r'<article class="prob" id="p(\d+)"[^>]*>.*?<p class="p-why">.*?</p>', add, s2, flags=re.S)
            if s2 != s:
                open(f, 'w').write(s2)
                changed += 1
    return changed


def coverage():
    used_t = {(d, n) for it in IDX.values() for d in ('t1', 't2') for n in it[d]}
    miss_t = sorted(k for k in PROB_T if k not in used_t)
    used_pf = {p for it in IDX.values() for p in it['pf']}
    miss_pf = sorted(k for k in PF_T if k not in used_pf)
    used_b = {b for it in IDX.values() for b in it['book']}
    miss_b = sorted(k for k in BOOK_T if k not in used_b)
    print('مسئله‌های بی‌ایده:', ' '.join(f'{d}#{n}' for d, n in miss_t) or '—')
    print('اثبات‌های بی‌ایده:', ' '.join(miss_pf) or '—')
    print('بخش‌های جزوهٔ بی‌ایده:', ' '.join(f'{b}({BOOK_T[b][:25]})' for b in miss_b) or '—')


def main():
    os.makedirs(OUT, exist_ok=True)
    open(os.path.join(OUT, '00-front.html'), 'w').write(front())
    for chd in ALL:
        open(os.path.join(OUT, f'ch{chd["ch"]:02d}.html'), 'w').write(chapter_file(chd))
    open(os.path.join(OUT, '99-glance.html'), 'w').write(glance())
    n = inject_problem_links()
    print(f'{len(IDX)} ideas written to {OUT}; {n} exercise files updated')
    for chd in ALL:
        print(f'  ch{chd["ch"]}: {len(chd["ideas"])}')
    coverage()


if __name__ == '__main__':
    main()
