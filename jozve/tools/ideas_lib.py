# ابزار مشترک دادهٔ «ایده‌نامه»
# هر ایده: نام، یک جملهٔ اصلی، نشانه‌ها (کی سراغش برویم)، سازوکار گام‌به‌گام، نمونه، دام، و پیوندها.
#   book: بخش‌های جزوه به شکل '2-5'      t1/t2: شمارهٔ مسئله در سری ۱ و ۲
#   pf: اثبات‌ها به شکل '2-2'             rel: کلید ایده‌های هم‌خانواده
#   kinds: design, analysis, proof, lower, prob, ds, count


def I(key, name, core, when, how, ex=None, trap=None, book=(), t1=(), t2=(), pf=(), rel=(), kinds=()):
    return dict(key=key, name=name, core=core, when=list(when), how=list(how), ex=ex, trap=trap,
                book=list(book), t1=list(t1), t2=list(t2), pf=list(pf), rel=list(rel), kinds=list(kinds))


def C(ch, color, lead, ideas, title=None):
    return dict(ch=ch, color=color, lead=lead, ideas=ideas, title=title)
