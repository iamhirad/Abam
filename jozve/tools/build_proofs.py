# صفحهٔ «اثبات‌های جزوه» را از روی متن خود جزوه می‌سازد.
#   python3 tools/build_proofs.py   →  src/proofs/*.html
# هر اثبات = عنوان + حکم (کادر قضیه/لم جزوه، یا حکمی که این‌جا صریح نوشته شده) + کادر اثبات جزوه.
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from proofs_scan import scan, blocks, title, CHAPTERS, SRC

OUT = os.path.join(SRC, 'proofs')
BOOK = 'https://iamhirad.github.io/Abam/'
FA = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')
fa = lambda x: str(x).translate(FA)

DEF, IND, INV, TREE, CNT, PROB, AMORT, CASE, DIR = (
    'از تعریف', 'استقرا', 'ناوردا', 'درخت بازگشت و سری', 'شمارش', 'احتمال و نشانگر', 'سرشکنی', 'حالت‌بندی', 'استدلال مستقیم')
TECH_ORDER = [DEF, IND, INV, TREE, CNT, PROB, AMORT, CASE, DIR]
TECH_DESC = {
    DEF: 'باز کردن تعریف \\(O\\)، \\(\\Omega\\) یا امید و پیدا کردن ثابت‌ها',
    IND: 'پایه + گام؛ فرض استقرا را با ثابت صریح بنویس',
    INV: 'آغاز، نگهداری، پایان',
    TREE: 'هزینهٔ هر سطح و جمع یک سری',
    CNT: 'شمردن یک کمیت (گاهی از دو دید)',
    PROB: 'متغیر نشانگر، خطی بودن امید، تقارن',
    AMORT: 'انبوهه، حساب‌داری یا پتانسیل',
    CASE: 'همهٔ حالت‌های ممکن و کار مجاز در هر کدام',
    DIR: 'زنجیره‌ای از نتیجه‌گیری‌های مستقیم',
}

STACK = 'هر دنباله از \\(n\\) عمل PUSH، POP و MULTIPOP روی پشتهٔ ابتدا خالی، روی هم \\(O(n)\\) هزینه دارد؛ یعنی هزینهٔ سرشکن هر عمل \\(O(1)\\) است.'
COUNTER = '\\(n\\) بار افزایش شمارندهٔ دودویی که از صفر شروع می‌کند، کمتر از \\(2n\\) بار بیت عوض می‌کند؛ یعنی هزینهٔ سرشکن هر افزایش \\(O(1)\\) است.'
DYN = 'در آرایهٔ پویا با دو برابر کردن ظرفیت (شروع از ظرفیت ۱)، \\(n\\) درج کمتر از \\(3n\\) هزینه دارد؛ یعنی هزینهٔ سرشکن هر درج حداکثر ۳ است.'

# شمارهٔ اثبات در خروجی scan → (عنوان، روش‌ها، حکم صریح یا None)
META = {
    0: ('درستی مرتب‌سازی درجی', [INV], None),
    1: ('تعدی و جمع‌پذیری نمادهای مجانبی', [DEF], None),
    2: ('چندجمله‌ای‌ها: \\(\\Theta(n^d)\\)', [DEF], None),
    3: ('لگاریتم‌ها: پایه مهم نیست و \\(\\log n = O(n^x)\\)', [DEF], None),
    4: ('نمایی‌ها از هر چندجمله‌ای سریع‌ترند', [DEF], None),
    5: ('زمان خطی ادغام', [CNT], None),
    6: ('مرتب‌سازی ادغامی با درخت بازگشت', [TREE],
        'برای \\(n\\) توانی از ۲، رابطهٔ \\(T(n) = 2T(n/2) + n\\) با \\(T(1) = 0\\) جواب \\(T(n) = n\\log_2 n\\) دارد؛ پس زمان مرتب‌سازی ادغامی \\(O(n\\log n)\\) است.'),
    7: ('قضیهٔ اصلی (حالت \\(f(n) = O(n^d)\\))', [TREE], None),
    8: ('حل \\(T(n) = 2T(n/2) + n\\) با حدس و استقرا', [IND],
        'اگر \\(T(1) = 1\\) و برای \\(n\\) توانی از ۲، \\(T(n) = 2T(n/2) + n\\)، آنگاه \\(T(n) = n(\\log n + 1)\\).'),
    9: ('استقرا با ثابت نامعلوم: \\(T(n) = 2T(n/2) + 32n\\)', [IND],
        'اگر \\(T(2) = 2\\) و برای \\(n\\) توانی از ۲، \\(T(n) = 2T(n/2) + 32n\\)، آنگاه برای همهٔ \\(n \\ge 2\\): \\(T(n) \\le 32\\,n\\log n\\)؛ یعنی \\(T(n) = O(n\\log n)\\).'),
    11: ('دو زیرمسئلهٔ نابرابر: \\(T(n/5) + T(7n/10) + n\\)', [IND],
         'اگر برای \\(1 \\le n \\le 10\\)، \\(T(n) = 1\\) و برای \\(n &gt; 10\\)، \\(T(n) \\le T(n/5) + T(7n/10) + n\\)، آنگاه برای همهٔ \\(n \\ge 1\\): \\(T(n) \\le 10n\\).'),
    12: ('رابطه‌های دو شاخه‌ای', [TREE, IND], None),
    13: ('تقویت فرض استقرا: \\(T(n) \\le 2T(n/2) + 1\\)', [IND],
         'اگر \\(T(1) = 1\\) و برای \\(n \\ge 2\\) (توان ۲)، \\(T(n) \\le 2T(n/2) + 1\\)، آنگاه \\(T(n) \\le 2n - 1\\)؛ یعنی \\(T(n) = O(n)\\).'),
    14: ('خطی بودن امید ریاضی', [PROB], None),
    15: ('جایگشت تصادفی درجا یکنواخت است', [PROB],
         'الگوریتم «برای \\(i = 1..n\\)، \\(A[i]\\) را با \\(A[\\text{Random}(i, n)]\\) جابه‌جا کن» هر کدام از \\(n!\\) جایگشت را با احتمال \\(\\frac1{n!}\\) تولید می‌کند.'),
    16: ('مسئلهٔ استخدام: امید هزینه \\(f\\,H_n\\)', [PROB],
         'اگر متقاضی‌ها به ترتیب تصادفی یکنواخت مصاحبه شوند و هر کس از همهٔ قبلی‌ها بهتر بود با هزینهٔ \\(f\\) استخدام شود، امید هزینهٔ کل \\(f\\sum_{i=1}^{n}\\frac1i = f\\,H_n \\approx f\\ln n\\) است.'),
    17: ('انتخاب تصادفی در امید زمان خطی', [PROB],
         'امید زمان اجرای الگوریتم انتخاب تصادفی روی \\(n\\) عنصر \\(O(n)\\) است.'),
    18: ('کوئیک‌سورت: احتمال مقایسهٔ دو عنصر', [PROB], None),
    19: ('کوئیک‌سورت تصادفی: امید \\(O(n\\log n)\\) مقایسه', [PROB], None),
    20: ('پشتهٔ multipop: روش انبوهه', [AMORT], STACK),
    21: ('شمارندهٔ دودویی: روش انبوهه', [AMORT], COUNTER),
    22: ('پشتهٔ multipop: روش حساب‌داری', [AMORT], STACK),
    23: ('شمارندهٔ دودویی: روش حساب‌داری', [AMORT], COUNTER),
    24: ('پشتهٔ multipop: روش پتانسیل', [AMORT], STACK),
    25: ('شمارندهٔ دودویی: روش پتانسیل', [AMORT], COUNTER),
    26: ('آرایهٔ پویا: روش انبوهه', [AMORT], DYN),
    27: ('آرایهٔ پویا: روش حساب‌داری', [AMORT], DYN),
    28: ('آرایهٔ پویا: روش پتانسیل', [AMORT], DYN),
    29: ('درستی الگوریتم فلوید (لاک‌پشت و خرگوش)', [DIR],
         'در لیستی با پیشوندی به طول \\(\\mu\\) و دوری به طول \\(\\lambda\\)، اشاره‌گرهای slow (یک قدم) و fast (دو قدم) حتماً به هم می‌رسند؛ و اگر بعد از آن یک اشاره‌گر از سر لیست و دیگری از نقطهٔ ملاقات هم‌قدم حرکت کنند، دقیقاً در ورودی دور به هم می‌رسند.'),
    30: ('نزدیک‌ترین بزرگ‌تر بعدی در \\(\\Theta(n)\\)', [AMORT],
         'الگوریتم پشتهٔ یکنوا جواب «نزدیک‌ترین عنصر بزرگ‌تر بعدی» را برای همهٔ \\(n\\) خانه در زمان \\(\\Theta(n)\\) حساب می‌کند.'),
    31: ('قطار و پشته: شبیه‌سازی حریصانه لازم و کافی است', [CASE],
         'ترتیب خروجی \\(\\pi\\) از واگن‌های \\(1..n\\) با یک پشته ساختنی است اگر و تنها اگر شبیه‌سازی حریصانه (تا وقتی خروجی بعدی بالای پشته نیست واگن بعدی را push کن، بعد pop کن) بدون گیر کردن تمام شود.'),
    32: ('درخت با \\(n\\) رأس، \\(n - 1\\) یال دارد', [IND], None),
    33: ('پیش‌ترتیب درخت و درخت دودویی معادلش یکی است', [IND], None),
    34: ('در هرم بیشینه ریشه بزرگ‌ترین است', [DIR], None),
    35: ('درستی بالا بردن (افزایش کلید در هرم)', [INV],
         'اگر در هرم بیشینه مقدار یک گره را زیاد کنیم و آن را تا وقتی از پدرش بزرگ‌تر است با پدرش جابه‌جا کنیم، در پایان ویژگی هرم برقرار است.'),
    36: ('ساخت هرم خطی است: \\(\\sum h/2^h = 2\\)', [TREE],
         '\\(\\frac12 + \\frac24 + \\frac38 + \\dots = \\sum_{h \\ge 1}\\frac{h}{2^h} = 2\\)؛ در نتیجه ساخت هرم با روش فلوید \\(O(n)\\) است.'),
    37: ('درخت تصمیم مرتب‌سازی دست‌کم \\(N!\\) برگ دارد', [CNT], None),
    38: ('کران پایین \\(\\Omega(N\\log N)\\) برای مرتب‌سازی مقایسه‌ای', [CNT], None),
    39: ('پایداری مرتب‌سازی شمارشی', [DIR], None),
    40: ('درستی مرتب‌سازی مبنایی', [IND],
         'مرتب‌سازی مبنایی که با یک مرتب‌سازی پایدار از کم‌ارزش‌ترین رقم شروع می‌کند، پس از \\(d\\) گذر اعداد \\(d\\)رقمی را درست مرتب می‌کند.'),
    41: ('ترای: پیشوند مشترک یعنی جد مشترک', [DIR], None),
    42: ('ترای: کمتر از \\(1/\\sigma\\) اشاره‌گرها استفاده می‌شوند', [CNT], None),
}
MERGE_INTO = {10: 9}   # اثبات ۱۰ پاک‌نویس اثبات ۹ است؛ پشت سر آن می‌آید


def sec_of(html, pos):
    """شمارهٔ و عنوان بخش (h2) جزوه که موضع pos در آن است"""
    hs = [(m.start(), m.group(1)) for m in re.finditer(r'<h2>(.*?)</h2>', html, re.S)]
    k, t = 0, ''
    for i, (s, txt) in enumerate(hs):
        if s < pos:
            k, t = i + 1, txt
    return k, re.sub(r'<[^>]+>', '', t)


def extras():
    out = []
    # ۱) جمع دبستانی (فصل ۲): اثبات داخل خود کادر قضیه است
    f = CHAPTERS[1]; html = open(os.path.join(SRC, f)).read()
    m = re.search(r'<div class="box thm">\s*<div class="bh">بهینه بودن جمع دبستانی</div>\s*<p>(.*?)</p>\s*</div>', html, re.S)
    k, t = sec_of(html, m.start())
    out.append(dict(ch=2, sec=k, sec_title=t, pos=m.start(), title='جمع دبستانی بهینه است', tags=[DIR],
                    stmt='<div class="box claim"><div class="bh"></div><p>هر الگوریتمی که دو عدد صحیح \\(n\\)بیتی را جمع کند، در بدترین حالت \\(\\Omega(n)\\) زمان لازم دارد؛ بنابراین روش جمع دبستانی (\\(O(n)\\)) بهینه است.</p></div>',
                    proofs=[f'<div class="box proof"><div class="bh"></div><p>{m.group(1).strip()}</p></div>']))
    # ۲) میانهٔ میانه‌ها (فصل ۳): اثبات به‌صورت متن و شکل پیش از کادر لم آمده است
    f = CHAPTERS[2]; html = open(os.path.join(SRC, f)).read()
    a = html.index('<h3>اثبات با تصویر</h3>') + len('<h3>اثبات با تصویر</h3>')
    b = html.index('<div class="box lem">', a)
    e = html.index('</div>\n', html.index('</p>', b)) + len('</div>')
    k, t = sec_of(html, a)
    out.append(dict(ch=3, sec=k, sec_title=t, pos=a, title='میانهٔ میانه‌ها: هر طرف حداکثر \\(\\frac{7n}{10} + 5\\) عنصر', tags=[CNT],
                    stmt=html[b:e], proofs=[f'<div class="box proof"><div class="bh">اثبات با تصویر</div>\n{html[a:b].strip()}\n</div>']))
    return out


def absolutize(h):
    # پیوندهای داخلی جزوه به نشانی جزوه بروند
    return re.sub(r'href="#([^"]+)"', lambda m: f'href="{BOOK}#{m.group(1)}"', h)


def main():
    os.makedirs(OUT, exist_ok=True)
    R = scan()
    entries = []
    for i, r in enumerate(R):
        if i in MERGE_INTO:
            continue
        t, tags, claim = META[i]
        stmt = r['stmt'] if claim is None else f'<div class="box claim"><div class="bh"></div><p>{claim}</p></div>'
        assert stmt, i
        proofs = [r['proof']] + [R[j]['proof'] for j, into in MERGE_INTO.items() if into == i]
        entries.append(dict(ch=r['ch'], sec=r['sec'], sec_title=r['sec_title'], pos=r['pos'], title=t, tags=tags, stmt=stmt, proofs=proofs))
    entries += extras()
    entries.sort(key=lambda e: (e['ch'], e['pos']))

    ch_titles = {}
    for ci, f in enumerate(CHAPTERS, 1):
        ch_titles[ci] = re.search(r'data-title="([^"]+)"', open(os.path.join(SRC, f)).read()).group(1)

    by_ch = {c: [e for e in entries if e['ch'] == c] for c in range(1, 11)}
    for c, es in by_ch.items():
        for k, e in enumerate(es, 1):
            e['id'] = f's{c}-{k}'; e['num'] = f'{fa(c)}.{fa(k)}'

    # ---------- فایل هر فصل ----------
    for c in range(1, 11):
        es = by_ch[c]
        parts = [f'<section class="chapter" data-ch="{c}" data-color="c{c}" data-title="{ch_titles[c]}" id="ch{c}">',
                 '<header class="ch-head">',
                 f'  <div class="ch-kicker">فصل {fa(c)} · {fa(len(es))} اثبات</div>',
                 f'  <h1>{ch_titles[c]}</h1>',
                 f'  <p class="ch-lead"><a href="{BOOK}#ch{c}">این فصل در جزوه ↗</a></p>',
                 f'  <div class="ch-big" aria-hidden="true">{fa(c)}</div>',
                 '</header>']
        if not es:
            parts.append('<div class="box note"><div class="bh">این فصل اثبات صوری ندارد</div>'
                         '<p>درستی الگوریتم‌های درخت عبارت در جزوه با استدلال‌های کوتاه داخل کادرهای «چرا؟» آمده است '
                         '(مثلاً چرا نگارش پسوندی پرانتز لازم ندارد و چرا ساخت درخت از عبارت پسوندی خطی است). '
                         f'برای دیدنشان به <a href="{BOOK}#ch7">فصل ۷ جزوه</a> بروید.</p></div>')
        for e in es:
            tags = ''.join(f'<span class="pf-tag">{t}</span>' for t in e['tags'])
            where = f'<a href="{BOOK}#s{c}-{e["sec"]}">در جزوه: بخش {fa(c)}.{fa(e["sec"])}، {e["sec_title"]} ↗</a>'
            proofs = '\n'.join(absolutize(p) for p in e['proofs'])
            parts += [f'\n<h2>{e["title"]}</h2>',
                      f'<p class="pf-meta">{tags}<span class="pf-where">{where}</span></p>',
                      absolutize(e['stmt']),
                      '<details class="sol pf" open><summary>اثبات <span class="sub">در حالت تمرین، اول خودتان امتحان کنید</span></summary><div class="sol-body">',
                      proofs,
                      '</div></details>']
        parts.append('</section>\n')
        open(os.path.join(OUT, f'ch{c:02d}.html'), 'w').write('\n'.join(parts))

    # ---------- صفحهٔ اول ----------
    total = len(entries)
    tech_rows = []
    TECH_COLOR = dict(zip(TECH_ORDER, ['c1', 'c2', 'c4', 'c6', 'c5', 'c3', 'c8', 'c9', 'c10']))
    for t in TECH_ORDER:
        es = [e for e in entries if t in e['tags']]
        if not es:
            continue
        chips = ''.join(f'<a href="#{e["id"]}"><b>{e["num"]}</b>{e["title"]}</a>' for e in es)
        tech_rows.append(f'<div class="pgroup pf-tech" data-color="{TECH_COLOR[t]}"><h3>{t} <span class="dcount">({fa(len(es))} اثبات · {TECH_DESC[t]})</span></h3><div class="pchips">{chips}</div></div>')
    counts = '، '.join(f'فصل {fa(c)}: {fa(len(by_ch[c]))}' for c in range(1, 11) if by_ch[c])
    front = f'''<header class="cover" id="top">
  <div class="cover-kicker">جزوهٔ ساختمان داده‌ها و الگوریتم‌ها</div>
  <h1><span class="c-a">اثبات‌های</span> <span class="c-b">جزوه</span></h1>
  <p class="cover-lead">
    همهٔ {fa(total)} اثبات کامل جزوه، فصل به فصل. هر مورد سه بخش دارد: <strong>حکم</strong> (دقیقاً چه چیزی ثابت می‌شود)، <strong>اثبات کامل</strong> همان‌طور که در جزوه آمده،
    و <strong>پیوند</strong> به جای آن در جزوه برای دیدن زمینه. برای مرور شب امتحان و تمرین اثبات‌نویسی.
  </p>
  <div class="cover-meta"><span>{counts}</span></div>
  <div class="cover-links">
    <button class="btn primary" type="button" data-toggle-all="close">حالت تمرین: پنهان کردن اثبات‌ها</button>
    <button class="btn" type="button" data-toggle-all="open">نمایش همهٔ اثبات‌ها</button>
    <a class="btn" href="#toc">فهرست ↓</a>
    <a class="btn" href="#by-technique">بر اساس روش اثبات ↓</a>
    <a class="btn" href="{BOOK}">جزوهٔ درس ↗</a>
    <a class="btn" href="{BOOK}tamrin-1.html">حل تمرین ۱ ↗</a>
    <a class="btn" href="{BOOK}tamrin-2.html">حل تمرین ۲ ↗</a>
  </div>
</header>

<section class="intro">
  <h2 class="plain-h">این صفحه را چطور بخوانیم؟</h2>
  <ol class="steps-how">
    <li style="--k: var(--k-thm)"><b>حکم را بخوانید.</b> دقیقاً چه چیزی باید ثابت شود؟ فرض‌ها کدام‌اند؟</li>
    <li style="--k: var(--c8)"><b>خودتان امتحان کنید.</b> دکمهٔ «حالت تمرین» همهٔ اثبات‌ها را می‌بندد؛ برچسب روش اثبات (مثلاً «استقرا») راهنمای شماست.</li>
    <li style="--k: var(--k-sum)"><b>اثبات را باز کنید و مقایسه کنید.</b> اگر جایی گیر کردید، پیوند «در جزوه» زمینهٔ کامل را نشان می‌دهد.</li>
  </ol>
  <p>اثبات‌ها کلمه به کلمه از جزوه آمده‌اند. جایی که جزوه حکم را در متن گفته بود و نه در کادر قضیه، حکم این‌جا صریح در کادر «حکم» نوشته شده است.</p>

  <h2 class="plain-h" id="by-technique">اثبات‌ها بر اساس روش</h2>
  <p>یک روش را انتخاب کنید و همهٔ اثبات‌هایی را که با آن نوشته شده‌اند پشت سر هم تمرین کنید. بعضی اثبات‌ها دو روش را با هم به کار می‌برند.</p>
  <div class="pgroups">{''.join(tech_rows)}</div>
</section>

<nav class="toc" id="toc" aria-label="فهرست اثبات‌ها">
  <h2 class="toc-h">فهرست اثبات‌ها</h2>
  <!--TOC-->
</nav>
<a class="to-top" href="#toc">↑ فهرست</a>
'''
    open(os.path.join(OUT, '00-front.html'), 'w').write(front)
    print(f'{total} proofs written to {OUT}')
    for c in range(1, 11):
        print(f'  ch{c}: {len(by_ch[c])}')


if __name__ == '__main__':
    main()
