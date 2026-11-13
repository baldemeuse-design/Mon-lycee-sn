
/* ================= AFFICHAGE + ANIMATIONS ================= */
const COULEURS = ["bg-vert","bg-corail","bg-jaune"];
const NUM = {"Seconde":"2","Première":"1","Terminale":"T"};

let observateur = null;
function afficher(html){
  app.innerHTML = html;
  // Apparition progressive des éléments .rv au défilement
  if(observateur) observateur.disconnect();
  const els = app.querySelectorAll(".rv");
  if("IntersectionObserver" in window){
    observateur = new IntersectionObserver(es => es.forEach(e => {
      if(e.isIntersecting){ e.target.classList.add("vu"); observateur.unobserve(e.target); }
    }), {threshold:.12});
    els.forEach(el => observateur.observe(el));
  } else els.forEach(el => el.classList.add("vu"));
  // Compteurs animés
  app.querySelectorAll("[data-compte]").forEach(compter);
}

function compter(el){
  const fin = +el.dataset.compte, debut = performance.now(), duree = 1200;
  const pas = t => {
    const k = Math.min(1, (t - debut) / duree);
    el.textContent = Math.round(fin * (1 - Math.pow(1 - k, 3)));
    if(k < 1) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}

// En-tête sombre des pages internes
function entete(fil, titre, sous, extra = ""){
  return `<section class="entete"><div class="wrap">
    <div class="fil">${fil}</div>
    <div class="tribar"><i></i><i></i><i></i></div>
    <h1 class="display">${titre}</h1>
    ${sous ? `<p>${sous}</p>` : ""}${extra}
  </div></section>`;
}

/* ================= PAGES ================= */
function pageAccueil(){
  const dernier = memo.lire("dernier", null);
  let reprise = "";
  if(dernier){
    const c = trouverClasse(dernier.c), m = trouverMatiere(dernier.m);
    if(c && m) reprise = `<a class="reprendre rv" href="#${c.id}-${m.id}"><span class="rond">▶</span>
      <div><b>Reprendre là où tu t'es arrêté</b><br><small>${m.nom} · ${c.nom}</small></div></a>`;
  }
  afficher(`
    <section class="heros"><div class="wrap heros-grille">
      <div>
        <div class="badge"><i></i>Programme sénégalais · Série S</div>
        <h1 class="titre-heros display"><span class="l"><span>Réussis</span></span><span class="l"><span>ton bac</span></span></h1>
        <p class="sous-heros">Cours, exercices, quiz et orientation — au même endroit.</p>
        <div class="tribar"><i></i><i></i><i></i></div>
        <p class="lead">De la Seconde S à la Terminale, séries L1, L2, S1 et S2 : des cours clairs, des exercices corrigés avec indices, des quiz pour t'entraîner et tout pour réussir ton orientation sur Campusen.</p>
        <div class="ctas">
          <a class="btn jaune gros" href="#classes" data-defil="classes">Choisir ma classe →</a>
          <a class="btn clair gros" href="#orientation">Orientation</a>
          <button class="btn clair gros btn-installer" hidden onclick="installerAppli()">📲 Installer l'appli</button>
        </div>
      </div>
      <div class="scene" aria-hidden="true"><div class="logo-centre">${LOGO_GRAND}</div></div>
    </div>
    </section>
    <section class="section" id="classes"><div class="wrap">
      ${reprise}
      <input class="recherche rv" id="cherche" type="search" placeholder="🔍  Rechercher : « maths tle s2 », « philo l2 »…" autocomplete="off">
      <div id="res"></div>
      <div class="tete rv" style="margin-top:34px"><span class="eyebrow">Étape 1</span><h2>Choisis ta <span>classe</span></h2></div>
${NIVEAUX.map(n => `
      <h3 class="niveau rv">${n}</h3>
      <div class="grille">
        ${CLASSES.filter(c => c.niveau === n).map((c,i) => { const p = progressionClasse(c.id);
          return `<a class="carte carte-classe niv-${c.niveau} rv" style="--d:${i*.06}s" href="#${c.id}">
            <span class="fleche">→</span>
            <span class="display">${c.court}</span><small>${c.matieres.length} matières</small>${jauge(p)}</a>`; }).join("")}
      </div>`).join("")}
    </div></section>

    <section class="section" style="padding-top:0"><div class="wrap">
      <div class="tete rv"><span class="eyebrow">Tes outils</span><h2>Travaille <span>malin</span></h2></div>
      <div class="grille">
        <a class="carte rv" href="#conseils"><span class="fleche">→</span><span class="rond bg-jaune">⏱️</span><b>Minuteur de révision</b><small>25 min de travail, 5 min de pause</small></a>
        <a class="carte rv" style="--d:.08s" href="#conseils"><span class="fleche">→</span><span class="rond bg-vert">💡</span><b>Méthodes de travail</b><small>Apprendre, réviser, réussir le bac</small></a>
        <a class="carte rv" style="--d:.16s" href="#orientation"><span class="fleche">→</span><span class="rond bg-corail">🧭</span><b>Orientation</b><small>Checklist Campusen</small></a>
      </div>
    </div></section>`);
  const champ = document.getElementById("cherche"), res = document.getElementById("res");
  champ.addEventListener("input", () => {
    const mots = sansAccent(champ.value).split(/\s+/).filter(Boolean);
    if(!mots.length){ res.innerHTML = ""; return; }
    const trouves = [];
    CLASSES.forEach(c => matieresDe(c).forEach(m => {
      const texte = sansAccent(`${c.nom} ${c.court} ${c.niveau} ${c.id.replace("-"," ")} ${m.nom} ${m.alias}`);
      if(mots.every(w => texte.includes(w))) trouves.push({c, m});
    }));
    res.innerHTML = trouves.length
      ? `<div class="resultats">${trouves.slice(0,8).map(x => `<a href="#${x.c.id}-${x.m.id}">${x.m.ico} ${x.m.nom} — ${x.c.nom}</a>`).join("")}</div>`
      : `<p style="margin:10px 6px;color:var(--gris)">Aucun résultat.</p>`;
  });
  app.querySelectorAll("[data-defil]").forEach(a => a.addEventListener("click", ev => {
    ev.preventDefault();
    document.getElementById(a.dataset.defil).scrollIntoView({behavior:"smooth"});
  }));
}

function pageClasse(c){
  const p = progressionClasse(c.id);
  afficher(entete(`<a href="#accueil">Accueil</a> › ${c.nom}`, c.nom, "Choisis une matière.",
      p.total ? jauge(p) : "") + `
    <section class="section"><div class="wrap">
      <div class="grille">
        ${matieresDe(c).map((m,i) => {
          const d = donnees(c.id, m.id);
          const n = ["cours","exercices","quiz","conseils"].reduce((s,k) => s + liste(d,k).length, 0);
          const pm = progression(c.id, m.id);
          return `<a class="carte rv" style="--d:${i*.05}s" href="#${c.id}-${m.id}"><span class="fleche">→</span>
            <span class="rond ${COULEURS[i%3]}">${m.ico}</span><b>${m.nom}</b>
            ${n ? `<span class="statut ok">${pm.total ? `${pm.fait}/${pm.total} fait` : n + " ressource(s)"}</span>` : `<span class="statut bientot">Bientôt</span>`}
            ${jauge(pm)}</a>`;
        }).join("")}
      </div>
    </div></section>`);
}

const ONGLETS = {cours:"📘 Cours", exercices:"✏️ Exercices", quiz:"❓ Quiz", conseils:"💡 Conseils"};

function pageMatiere(c, m, onglet, garderDefil){
  memo.ecrire("dernier", {c:c.id, m:m.id});
  const d = donnees(c.id, m.id);
  const ong = onglet || memo.lire(`onglet:${c.id}-${m.id}`, "cours");
  memo.ecrire(`onglet:${c.id}-${m.id}`, ong);
  const p = progression(c.id, m.id);
  const y = window.scrollY;
  const idx = matieresDe(c).indexOf(m);
  afficher(entete(`<a href="#accueil">Accueil</a> › <a href="#${c.id}">${c.nom}</a> › ${m.nom}`,
      `<span class="rond ${COULEURS[idx%3]}">${m.ico}</span>${m.nom}`,
      `${c.nom}${p.total ? ` · progression : <b>${p.fait}/${p.total}</b>` : ""}`, jauge(p)) + `
    <section class="section" style="padding-top:26px"><div class="wrap">
      <div class="onglets">
        ${Object.keys(ONGLETS).map(k => `<button class="${k===ong?'actif':''}" data-o="${k}">${ONGLETS[k]}</button>`).join("")}
      </div>
      <div id="corps"></div>
    </div></section>`);
  if(garderDefil) window.scrollTo(0, y);
  app.querySelectorAll(".onglets button").forEach(b =>
    b.addEventListener("click", () => pageMatiere(c, m, b.dataset.o, true)));
  const corps = document.getElementById("corps");
  const items = liste(d, ong);
  if(!items.length){
    corps.innerHTML = `<div class="vide">📭 Pas encore de contenu ici.<br>Il arrive bientôt.</div>`; return;
  }
  if(ong === "exercices") return rendreExercices(corps, c, m, items);
  if(ong === "quiz") return rendreQuiz(corps, c, m, items);
  corps.innerHTML = items.map((x, i) => x.tpl ? `
    <div class="exo">
      <span class="tag">📘 Cours Mon Lycée SN</span>
      <h3 style="margin:.5em 0 .3em">${x.titre}</h3>
      <ul class="etapes">${x.plan.map((p,k) => `<li>${["I","II","III","IV","V"][k]}. ${p}</li>`).join("")}</ul>
      <div class="actions">
        <button class="btn plein" data-lire="${i}">📖 Lire le cours</button>
        ${x.pdf ? `<button class="btn" data-pdf="${x.pdf}" data-titre="${x.titre.replace(/"/g,"&quot;")} — ${c.court}">${estTelecharge(x.pdf) && horsLignePossible() ? "✅ Disponible hors connexion" : "📄 Télécharger le PDF"}</button>` : ""}
      </div>
      <div class="lecture" id="lecture${i}" hidden></div>
    </div>`
    : `<details><summary>${x.titre}</summary><div>${x.texte}</div></details>`).join("");
  corps.querySelectorAll("[data-pdf]").forEach(b => b.addEventListener("click", () => telechargerPdf(b)));
  corps.querySelectorAll("[data-lire]").forEach(b => b.addEventListener("click", () => {
    const x = items[+b.dataset.lire], zone = document.getElementById("lecture" + b.dataset.lire);
    if(zone.hidden){
      zone.innerHTML = document.getElementById(x.tpl).innerHTML;
      zone.hidden = false; b.textContent = "✖ Fermer le cours";
    } else { zone.hidden = true; b.textContent = "📖 Lire le cours"; }
  }));
}

/* ---------- Conseils + minuteur ---------- */
const minuteur = {duree:25*60, reste:25*60, mode:"travail", h:null};
function pageConseils(){
  const methodes = [
    ["Organiser sa semaine", ["Fixe des créneaux courts (30 à 45 min) plutôt qu'une longue séance.",
      "Revois le cours du jour le soir même, même 10 minutes.", "Garde un jour par semaine pour refaire des exercices."]],
    ["Bien apprendre un cours", ["Fais une fiche d'une page par chapitre : définitions, formules, un exemple.",
      "Ferme le cours et essaie de tout réécrire de mémoire.",
      "Explique le chapitre à un camarade : si tu bloques, c'est là qu'il faut retravailler."]],
    ["Réussir les exercices", ["Cherche seul au moins 15 minutes avant de regarder la correction.",
      "Utilise l'indice avant la correction.", "Refais l'exercice sans aide le lendemain.",
      "Note tes erreurs fréquentes dans un carnet."]],
    ["Préparer le bac", ["Entraîne-toi sur les sujets officiels des années passées (Office du Bac).",
      "Fais au moins un sujet complet en temps réel avant l'examen.",
      "Dors bien la semaine de l'examen : la fatigue fait perdre des points."]]
  ];
  afficher(entete(`<a href="#accueil">Accueil</a> › Conseils`, "Conseils", "Des méthodes simples pour mieux apprendre.") + `
    <section class="section"><div class="wrap">
      <div class="minuteur rv">
        <span class="eyebrow" style="color:var(--jaune)">Minuteur de révision</span>
        <p style="margin-top:4px">25 minutes de travail concentré, puis 5 minutes de pause.</p>
        <div class="cercle" id="cercle"><div><span><b id="temps">25:00</b><small id="mode">Travail</small></span></div></div>
        <div class="actions" style="justify-content:center">
          <button class="btn plein" id="go">▶ Démarrer</button>
          <button class="btn" id="raz">↺ Remettre à zéro</button>
        </div>
      </div>
      <h2 class="titre-bloc rv">Méthodes</h2>
      ${methodes.map((x,i) => `<details class="rv" style="--d:${i*.06}s"><summary>${x[0]}</summary>
        <ul class="etapes">${x[1].map(l => `<li>${l}</li>`).join("")}</ul></details>`).join("")}
    </div></section>`);
  majMinuteur();
  document.getElementById("go").addEventListener("click", basculer);
  document.getElementById("raz").addEventListener("click", () => {
    clearInterval(minuteur.h); minuteur.h = null;
    Object.assign(minuteur, {duree:25*60, reste:25*60, mode:"travail"}); majMinuteur();
  });
}

/* ---------- Orientation + checklist ---------- */
function pageOrientation(){
  const coches = memo.lire("campusen", []);
  afficher(entete(`<a href="#accueil">Accueil</a> › Orientation`, "Orientation",
      "Pour entrer dans une université publique ou un ISEP, tout passe par <b>Campusen</b>.") + `
    <section class="section"><div class="wrap">
      <div class="encadre rv"><b>Campusen, c'est quoi ?</b><br>
        La plateforme officielle d'orientation des nouveaux bacheliers vers les universités publiques et les ISEP
        (Instituts supérieurs d'enseignement professionnel) du Sénégal.<br>
        Site : <a href="https://orientation.campusen.sn">orientation.campusen.sn</a></div>
      <details class="rv"><summary>📅 Repères de l'année 2026</summary>
        <ul class="etapes"><li>Ouverture : 17 août 2026.</li><li>Date limite : 13 septembre 2026, 23h59.</li>
        <li>Jusqu'à 18 choix pour les universités publiques et 18 pour les ISEP.</li></ul></details>
      <div class="attention rv">⚠️ Les dates et règles changent chaque année. Vérifie toujours sur le site officiel de Campusen
        et les communiqués du ministère de l'Enseignement supérieur. Ne donne jamais ton mot de passe Campusen.</div>
      <h2 class="titre-bloc rv">Ma checklist Campusen <span id="compte" style="color:var(--corail)"></span></h2>
      <div class="jauge" style="margin-bottom:14px"><i id="jc"></i></div>
      <div id="liste">${ETAPES_CAMPUSEN.map((e,i) => `
        <label class="check rv ${coches.includes(i)?'coche':''}" style="--d:${i*.04}s"><input type="checkbox" data-i="${i}" ${coches.includes(i)?'checked':''}><span>${e}</span></label>`).join("")}
      </div>
      <h2 class="titre-bloc rv">Bien choisir ses vœux</h2>
      <ul class="etapes rv">
        <li>Classe tes choix par préférence réelle, pas par prestige.</li>
        <li>Les grandes écoles et écoles spécialisées recrutent souvent en dehors de Campusen (concours, dossiers) : renseigne-toi tôt.</li>
      </ul>
      <h2 class="titre-bloc rv">Fiches métiers</h2>
      <div class="vide rv">📭 Les fiches métiers arrivent bientôt.</div>
    </div></section>`);
  const maj = () => {
    const c = memo.lire("campusen", []);
    document.getElementById("compte").textContent = `${c.length}/${ETAPES_CAMPUSEN.length}`;
    document.getElementById("jc").style.width = `${100*c.length/ETAPES_CAMPUSEN.length}%`;
  };
  maj();
  app.querySelectorAll(".check input").forEach(cb => cb.addEventListener("change", () => {
    let c = memo.lire("campusen", []); const i = +cb.dataset.i;
    c = cb.checked ? [...new Set([...c, i])] : c.filter(x => x !== i);
    memo.ecrire("campusen", c);
    cb.parentElement.classList.toggle("coche", cb.checked);
    maj();
    if(c.length === ETAPES_CAMPUSEN.length) toast("Checklist complète, bravo ! 🎓");
  }));
}

/* ================= NAVIGATION, EN-TÊTE, INTRO ================= */
const nav = document.getElementById("nav"), burger = document.getElementById("burger");
burger.addEventListener("click", () => {
  const o = !nav.classList.contains("ouvert");
  nav.classList.toggle("ouvert", o); burger.classList.toggle("ouvert", o); document.body.classList.toggle("bloque", o);
});
nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  nav.classList.remove("ouvert"); burger.classList.remove("ouvert"); document.body.classList.remove("bloque");
}));

const enTete = document.getElementById("haut");
window.addEventListener("scroll", () => {
  enTete.classList.toggle("defile", scrollY > 30);
}, {passive:true});

function router(){
  const h = location.hash.replace("#","") || "accueil";
  if(h === "classes"){ pageAccueil(); document.getElementById("classes").scrollIntoView(); return; }
  window.scrollTo(0,0);
  document.querySelectorAll("nav.top a").forEach(a => a.classList.toggle("actif", a.dataset.n === h));
  if(h === "accueil") return pageAccueil();
  if(h === "conseils") return pageConseils();
  if(h === "orientation") return pageOrientation();
  if(h === "telechargements") return pageTelechargements();
  const c = trouverClasse(h);
  if(c) return pageClasse(c);
  for(const cl of CLASSES){
    if(h.startsWith(cl.id + "-")){
      const m = trouverMatiere(h.slice(cl.id.length + 1));
      if(m && cl.matieres.includes(m.id)) return pageMatiere(cl, m);
      if(m) return pageClasse(cl);
    }
  }
  pageAccueil();
}


