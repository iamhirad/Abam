# اسکن اثبات‌های جزوه: هر کادر «اثبات» را با گزارهٔ قبلی‌اش جفت می‌کند.
import re, sys, json, os
SRC = os.path.join(os.path.dirname(__file__), '..', 'src')
CHAPTERS = ['01-analysis.html', '02-divide-conquer.html', '03-randomized.html', '04-amortized.html', '05-lists.html',
            '06-trees.html', '07-expression-trees.html', '08-heaps.html', '09-sorting.html', '10-trie.html']

def blocks(html):
    """top-level elements in document order: ('h2'|'h3'|'box'|'other', kind, text, start, end)"""
    out = []
    i = 0
    tok = re.compile(r'<h2>(.*?)</h2>|<h3>(.*?)</h3>|<div class="box ([a-z]+)">|<figure>|<pre\b', re.S)
    while True:
        m = tok.search(html, i)
        if not m: break
        if m.group(1) is not None:
            out.append(('h2', None, m.group(1), m.start(), m.end())); i = m.end(); continue
        if m.group(2) is not None:
            out.append(('h3', None, m.group(2), m.start(), m.end())); i = m.end(); continue
        if m.group(0).startswith('<figure'):
            e = html.index('</figure>', m.end()) + len('</figure>')
            out.append(('fig', None, html[m.start():e], m.start(), e)); i = e; continue
        if m.group(0).startswith('<pre'):
            e = html.index('</pre>', m.end()) + len('</pre>')
            out.append(('pre', None, html[m.start():e], m.start(), e)); i = e; continue
        # balanced div
        depth, j = 0, m.start()
        for t in re.finditer(r'<div\b|</div>', html[m.start():]):
            depth += 1 if t.group(0) == '<div' else -1
            if depth == 0:
                e = m.start() + t.end(); break
        out.append(('box', m.group(3), html[m.start():e], m.start(), e)); i = e
    return out

def title(box):
    m = re.search(r'<div class="bh">(.*?)</div>', box, re.S)
    return (m.group(1).strip() if m else '')

def scan():
    res = []
    for ci, f in enumerate(CHAPTERS, 1):
        html = open(os.path.join(SRC, f)).read()
        ch_title = re.search(r'data-title="([^"]+)"', html).group(1)
        bl = blocks(html)
        sec, sec_title, sub = 0, '', ''
        last_stmt = None   # index of last thm/lem box
        for k, (typ, kind, text, s, e) in enumerate(bl):
            if typ == 'h2':
                sec += 1; sec_title = re.sub('<[^>]+>', '', text); sub = ''
            elif typ == 'h3':
                sub = re.sub('<[^>]+>', '', text)
            elif typ == 'box' and kind in ('thm', 'lem'):
                last_stmt = k
            elif typ == 'box' and kind == 'proof':
                stmt = None
                # the statement is the nearest preceding thm/lem if nothing but figures/pre/why-free text sits between
                if last_stmt is not None:
                    between = bl[last_stmt + 1:k]
                    if all(b[0] in ('fig', 'pre') or (b[0] == 'box' and b[1] == 'proof') for b in between):
                        stmt = last_stmt
                res.append(dict(ch=ci, file=f, ch_title=ch_title, sec=sec, sec_title=sec_title, sub=sub,
                                stmt=bl[stmt][2] if stmt is not None else None,
                                stmt_title=title(bl[stmt][2]) if stmt is not None else None,
                                proof=text, proof_title=title(text), pos=s))
    return res

if __name__ == '__main__':
    for r in scan():
        print(f"ch{r['ch']} s{r['sec']} [{r['sec_title'][:28]}] / {r['sub'][:24]} | stmt: {(r['stmt_title'] or '-')[:40]} | proof: {r['proof_title'][:40]} | len {len(r['proof'])}")
