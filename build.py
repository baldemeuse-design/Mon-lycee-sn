"""Construit l'appli dans docs/ (publiée par GitHub Pages) : page, PDF, fichiers PWA.

Usage : python3 build.py   (nécessite Python 3 et Playwright pour les PDF)
"""
import json, pathlib, html, shutil
from playwright.sync_api import sync_playwright

ici = pathlib.Path(__file__).parent
src, dist = ici / "src", ici / "docs"
dist.mkdir(exist_ok=True)

# ---------- Cours à publier ----------
# Chaque cours : fichier HTML, identifiant du modèle dans la page, PDF, titre, sous-titre, exercices.
proba = json.loads((src / "proba-tle-s2.json").read_text())
svt = json.loads((src / "svt-tle-s2.json").read_text())
COURS = [
    {"fichier": "cours-proba-tle-s2.html", "tpl": "tpl-proba-tle-s2", "pdf": "probabilites-tle-s2.pdf",
     "titre": "Probabilités", "sous": "Mathématiques · Terminale S2", "exercices": proba["exercices"]},
]
for ch in svt["chapitres"]:
    COURS.append({"fichier": f"svt-{ch['id']}.html", "tpl": f"tpl-svt-{ch['id']}", "pdf": f"svt-{ch['id']}-tle.pdf",
                  "titre": ch["titre"], "sous": "SVT · Terminale S", "exercices": ch["exercices"]})

# ---------- Site ----------
LOGO = ('<svg viewBox="0 0 100 100" aria-hidden="true">'
        '<path class="page-g" d="M50 46C38 38 22 38 10 42V86C22 82 38 82 50 90Z" fill="#2563eb"/>'
        '<path class="page-d" d="M50 46C62 38 78 38 90 42V86C78 82 62 82 50 90Z" fill="#60a5fa"/>'
        '<g class="toque"><path d="M50 8L88 23L50 38L12 23Z" fill="#fbbf24"/>'
        '<path d="M80 26V42" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>'
        '<circle cx="80" cy="45" r="4" fill="#fbbf24"/></g></svg>')
js = "".join((src / f).read_text() for f in ["part1.js", "part2.js", "pages.js", "part3.js", "part4.js", "demarrage.js"])
js = "const LOGO_GRAND = " + json.dumps(LOGO) + ";\n" + js
modeles = "".join(f'<template id="{c["tpl"]}">{(src / c["fichier"]).read_text()}</template>\n' for c in COURS)
site = (src / "head.html").read_text().replace("__LOGO__", LOGO)
site = site.replace('<template id="tpl-proba-tle-s2">__COURS_PROBA__</template>', modeles)
site += "<script>\n" + js + "\n</script>\n</body>\n</html>\n"
site = site.replace("__PROBA_EX__", json.dumps(proba["exercices"], ensure_ascii=False))
site = site.replace("__PROBA_QUIZ__", json.dumps(proba["quiz"], ensure_ascii=False))
svt_cours = [{"titre": ch["titre"], "tpl": f"tpl-svt-{ch['id']}", "pdf": f"svt-{ch['id']}-tle.pdf", "plan": ch["plan"]}
             for ch in svt["chapitres"]]
svt_ex = [dict(e, titre=f'{e["titre"]} <small style="color:var(--gris);font-weight:600">· {ch["titre"]}</small>')
          for ch in svt["chapitres"] for e in ch["exercices"]]
svt_quiz = [q for ch in svt["chapitres"] for q in ch["quiz"]]
site = site.replace("__SVT_COURS__", json.dumps(svt_cours, ensure_ascii=False))
site = site.replace("__SVT_EX__", json.dumps(svt_ex, ensure_ascii=False))
site = site.replace("__SVT_QUIZ__", json.dumps(svt_quiz, ensure_ascii=False))
assert "__" not in site.replace("__proto__", ""), "un marqueur n'a pas été remplacé"
(dist / "index.html").write_text(site)

# ---------- PDF ----------
CSS = """
@page { size: A4; margin: 16mm 15mm 18mm; }
body { font-family: "DejaVu Sans", Arial, sans-serif; font-size: 10.5pt; color:#1d2521; line-height:1.45; }
.couv { background:#2563eb; color:#fff; padding:18px 20px; border-radius:10px; margin-bottom:14px; }
.couv h1 { margin:0; font-size:20pt; } .couv p { margin:4px 0 0; }
h2 { color:#2563eb; font-size:14pt; border-bottom:2px solid #e8efff; padding-bottom:3px; margin-top:18px; page-break-after:avoid; }
h3 { font-size:11.5pt; margin:12px 0 4px; page-break-after:avoid; }
.intro { font-style:italic; color:#5f6b65; }
.retenir { background:#e8efff; border-left:4px solid #2563eb; padding:8px 10px; border-radius:6px; margin:8px 0; page-break-inside:avoid; }
.exemple { background:#fff7e0; border-left:4px solid #f5b700; padding:8px 10px; border-radius:6px; margin:8px 0; page-break-inside:avoid; }
.encart { border:1px dashed #bbb; padding:8px 10px; border-radius:6px; margin:8px 0; page-break-inside:avoid; }
.attention { background:#fdecea; border-left:4px solid #c0392b; padding:8px 10px; border-radius:6px; margin:8px 0; page-break-inside:avoid; }
.formule { font-weight:bold; } .bar { text-decoration:overline; }
table { border-collapse:collapse; margin:6px 0; page-break-inside:avoid; } th,td { border:1px solid #ccc; padding:4px 8px; text-align:center; }
th { background:#e8efff; }
.fig { text-align:center; margin:10px 0; page-break-inside:avoid; } .fig svg { border:1px solid #ddd; border-radius:8px; }
.legende { font-size:9pt; color:#5f6b65; margin:3px 0 0; }
.exo { border:1px solid #dde3df; border-radius:8px; padding:6px 12px; margin:8px 0; page-break-inside:avoid; }
.saut { page-break-before:always; }
.pied { font-size:8.5pt; color:#777; margin-top:16px; }
"""

import re
def en_gris(texte):
    """Remplace chaque couleur #rgb / #rrggbb par le gris de même luminosité (impression noir et blanc)."""
    def conv(m):
        h = m.group(1)
        if len(h) == 3: h = "".join(x*2 for x in h)
        r, g, b = (int(h[i:i+2], 16) for i in (0, 2, 4))
        y = round(0.299*r + 0.587*g + 0.114*b)
        return "#%02x%02x%02x" % (y, y, y)
    return re.sub(r"#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b", conv, texte)

def page_pdf(c):
    contenu = (src / c["fichier"]).read_text()
    exos = "".join(f'<div class="exo"><h3>Exercice {i+1} — {e["titre"]}</h3><p>{e["enonce"]}</p></div>'
                   for i, e in enumerate(c["exercices"]))
    corr = "".join(f'<div class="exo"><h3>Exercice {i+1}</h3><p>{e["correction"]}</p></div>'
                   for i, e in enumerate(c["exercices"]))
    page = f"""<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>{CSS}
.couv.nb {{ background:#fff; color:#000; border:2.5px solid #000; }}
h2 {{ color:#000; border-bottom-color:#000; }}
.retenir {{ border-left-color:#000; }}
</style></head><body>
<div class="couv"><h1>{c["titre"]}</h1><p>{c["sous"]} · Mon Lycée SN</p></div>
{contenu}
<h2 class="saut">Exercices</h2>{exos}
<h2>Corrigés</h2>{corr}
<p class="pied">Cours original rédigé pour Mon Lycée SN. Document à faire relire par un enseignant avant diffusion.</p>
</body></html>"""
    return en_gris(page).replace('class="couv"', 'class="couv nb"')

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    for c in COURS:
        h = dist / c["pdf"].replace(".pdf", ".html")
        h.write_text(page_pdf(c))
        pg.goto(h.as_uri())
        pied = html.escape(f'{c["titre"]} – {c["sous"]}')
        pg.pdf(path=str(dist / c["pdf"]), format="A4", print_background=True,
               display_header_footer=True, header_template="<span></span>",
               footer_template=f'<div style="font-size:8px;width:100%;text-align:center;color:#888">{pied} · page <span class="pageNumber"></span>/<span class="totalPages"></span></div>',
               margin={"top": "16mm", "bottom": "18mm", "left": "15mm", "right": "15mm"})
    b.close()
# Fichiers de l'appli installable (service worker, manifeste, icônes, config)
shutil.copytree(ici / "public", dist, dirs_exist_ok=True)
(dist / ".nojekyll").write_text("")
for h in dist.glob("*.html"):
    if h.name != "index.html": h.unlink()   # pages intermédiaires des PDF
print("OK", [c["pdf"] for c in COURS])
