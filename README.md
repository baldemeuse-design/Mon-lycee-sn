# Mon Lycée SN 🇸🇳

Plateforme éducative pour les lycéens du Sénégal (Seconde S, Première et Terminale L1, L2, S1, S2) :
cours, exercices corrigés, quiz, conseils de travail et orientation.

**Apprendre. Comprendre. Réussir.**

## Organisation du dépôt

| Dossier / fichier | Rôle |
|---|---|
| `src/` | Sources : mise en page (`head.html`), code (`*.js`), cours (`*.html`), exercices et quiz (`*.json`) |
| `public/` | Fichiers de l'appli installable : `sw.js` (hors connexion), `manifest.webmanifest`, icônes, `config.js` (Supabase, valeurs publiques) |
| `build.py` | Assemble le tout dans `docs/` et génère les PDF (noir et blanc) |
| `docs/` | Version publiée par GitHub Pages — **ne pas modifier à la main**, relancer `build.py` |

## Ajouter un cours

1. Écrire le cours dans `src/` (HTML, mêmes encadrés que les cours existants).
2. Ajouter ses exercices et son quiz dans un fichier JSON de `src/`.
3. Déclarer le cours dans `build.py` (liste `COURS`) et dans `src/part1.js` (objet `CONTENU`).
4. Lancer `python3 build.py`, puis publier.

## Ajouter une série ou une matière

Dans `src/part1.js` : ajouter la matière dans `MATIERES`, puis la classe dans `CLASSES` avec sa liste de matières.

## Construire

```bash
pip install playwright && playwright install chromium
python3 build.py
```

## État du projet

- ✅ Cours, exercices, quiz, minuteur, orientation, recherche
- ✅ Appli installable (PWA) et lecture des PDF téléchargés sans connexion
- ⏳ Comptes élèves / enseignants, administration, annales (base de données Supabase en préparation)

Les cours sont des contenus originaux rédigés pour Mon Lycée SN et doivent être relus par un enseignant avant diffusion.
