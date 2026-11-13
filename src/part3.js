/* ================= TÉLÉCHARGEMENTS ET HORS CONNEXION =================
   Deux cas :
   1) Dans l'appli installée (PWA) : le PDF est mis dans le cache du téléphone
      (Cache Storage) et reste lisible sans Internet. On garde la liste dans
      « Mes téléchargements ».
   2) Dans l'aperçu Claude : on passe par la capacité « downloads » de la page. */
const CACHE_PDF = "mlsn-pdf-v1";
let dlPromesse = null;
function capaciteTelechargement(){
  if(!dlPromesse){
    dlPromesse = (window.claude && typeof window.claude.use === "function")
      ? window.claude.use("downloads").catch(() => null) : Promise.resolve(null);
  }
  return dlPromesse;
}
const horsLignePossible = () => "caches" in window && "serviceWorker" in navigator && !window.claude;
const listeTelechargements = () => memo.lire("telechargements", []);
const estTelecharge = pdf => listeTelechargements().some(t => t.pdf === pdf);

async function telechargerPdf(btn){
  const texte = btn.textContent, pdf = btn.dataset.pdf, titre = btn.dataset.titre || pdf;
  btn.disabled = true; btn.textContent = "⏳ Téléchargement…";
  try{
    if(horsLignePossible()){
      const cache = await caches.open(CACHE_PDF);
      const rep = await fetch(pdf, {cache:"no-cache"});
      if(!rep.ok) throw new Error("http " + rep.status);
      const taille = +(rep.headers.get("content-length") || 0);
      await cache.put(pdf, rep.clone());
      const l = listeTelechargements().filter(t => t.pdf !== pdf);
      l.unshift({pdf, titre, taille, date: new Date().toISOString()});
      memo.ecrire("telechargements", l);
      toast("PDF enregistré : lisible même sans Internet ✅");
      btn.textContent = "✅ Disponible hors connexion";
      return;
    }
    const dl = await capaciteTelechargement();
    if(!dl){ toast("Téléchargement indisponible ici. Utilise « Lire le cours »."); btn.textContent = texte; return; }
    const rep = await fetch(pdf);
    if(!rep.ok) throw new Error("fetch");
    await dl.save({filename: pdf, data: await rep.blob()});
    toast("PDF enregistré 📄"); btn.textContent = texte;
  }catch(e){
    btn.textContent = texte;
    if(e && e.code === "declined") toast("Téléchargement annulé.");
    else if(e && e.code === "rate_limited") toast("Patiente un instant puis réessaie.");
    else if(!navigator.onLine) toast("Pas de connexion Internet : réessaie quand tu seras connecté.");
    else toast("Le PDF n'a pas pu être téléchargé.");
  }finally{ btn.disabled = false; }
}

async function supprimerTelechargement(pdf){
  try{ const cache = await caches.open(CACHE_PDF); await cache.delete(pdf); }catch(e){}
  memo.ecrire("telechargements", listeTelechargements().filter(t => t.pdf !== pdf));
}

async function pageTelechargements(){
  const l = listeTelechargements();
  let espace = "";
  try{
    if(navigator.storage && navigator.storage.estimate){
      const e = await navigator.storage.estimate();
      espace = `Espace utilisé par l'appli : ${(e.usage/1048576).toFixed(1)} Mo`;
    }
  }catch(e){}
  const mo = o => o ? ` · ${(o/1048576).toFixed(1)} Mo` : "";
  afficher(entete(`<a href="#accueil">Accueil</a> › Téléchargements`, "Mes téléchargements",
      "Les cours enregistrés ici s'ouvrent même sans Internet.") + `
    <section class="section"><div class="wrap">
      ${!horsLignePossible() ? `<div class="attention">Le mode hors connexion ne fonctionne que dans l'appli installée (ou le site ouvert dans Chrome), pas dans cet aperçu.</div>` : ""}
      ${l.length ? l.map(t => `
        <div class="exo">
          <b>📄 ${t.titre}</b><br><small style="color:var(--gris)">Enregistré le ${new Date(t.date).toLocaleDateString("fr-FR")}${mo(t.taille)}</small>
          <div class="actions">
            <a class="btn plein" href="${t.pdf}" target="_blank" rel="noopener">Ouvrir</a>
            <button class="btn" data-suppr="${t.pdf}">🗑️ Supprimer</button>
          </div>
        </div>`).join("") : `<div class="vide">📭 Aucun cours téléchargé pour l'instant.<br>Dans un cours, appuie sur « Télécharger le PDF ».</div>`}
      ${espace ? `<p style="color:var(--gris);font-size:.85rem;margin-top:14px">${espace}</p>` : ""}
    </div></section>`);
  app.querySelectorAll("[data-suppr]").forEach(b => b.addEventListener("click", async () => {
    await supprimerTelechargement(b.dataset.suppr); toast("Supprimé du téléphone."); pageTelechargements();
  }));
}

/* ---------- Installation de l'appli (Android / Chrome) ---------- */
let invitationInstall = null;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault(); invitationInstall = e;
  document.querySelectorAll(".btn-installer").forEach(b => b.hidden = false);
});
async function installerAppli(){
  if(!invitationInstall){ toast("Ouvre le menu ⋮ de Chrome puis « Installer l'application »."); return; }
  invitationInstall.prompt();
  const r = await invitationInstall.userChoice;
  if(r.outcome === "accepted") toast("Appli installée 🎉");
  invitationInstall = null;
  document.querySelectorAll(".btn-installer").forEach(b => b.hidden = true);
}

function rendreExercices(corps, c, m, items){
  corps.innerHTML = items.map((e,i) => {
    const fait = memo.lire(`fait:${c.id}-${m.id}-${i}`, false);
    return `<div class="exo ${fait?'fait':''}" id="exo${i}">
      ${e.demo ? '<span class="tag">Exemple de démonstration</span>' : ''}
      <h3 style="margin:.4em 0">${i+1}. ${e.titre}</h3>
      <p>${e.enonce}</p>
      <div class="actions">
        ${e.indice ? `<button class="btn" data-a="indice" data-i="${i}">💡 Indice</button>` : ""}
        <button class="btn" data-a="corr" data-i="${i}">👀 Correction</button>
        <button class="btn ${fait?'plein':''}" data-a="fait" data-i="${i}">${fait ? "✅ Réussi" : "☐ J'ai réussi"}</button>
      </div>
      <div class="zone"></div>
    </div>`; }).join("");
  corps.querySelectorAll(".btn").forEach(b => b.addEventListener("click", () => {
    const i = +b.dataset.i, e = items[i], bloc = document.getElementById("exo"+i), zone = bloc.querySelector(".zone");
    if(b.dataset.a === "indice") zone.innerHTML = `<div class="bulle indice">💡 ${e.indice}</div>`;
    if(b.dataset.a === "corr") zone.innerHTML = `<div class="bulle corr"><b>Correction</b><br>${e.correction}</div>`;
    if(b.dataset.a === "fait"){
      const k = `fait:${c.id}-${m.id}-${i}`, v = !memo.lire(k, false);
      memo.ecrire(k, v);
      if(v) toast("Bravo ! Exercice marqué comme réussi 🎉");
      pageMatiere(c, m, "exercices", true);
    }
  }));
}

function rendreQuiz(corps, c, m, items){
  let rep = 0, bons = 0;
  const meilleur = memo.lire(`quiz:${c.id}-${m.id}`, null);
  corps.innerHTML = (meilleur !== null ? `<p class="sous">Ton meilleur score : <b>${meilleur}/${items.length}</b></p>` : "") +
    items.map((q,i) => `<div class="qcm" data-q="${i}">
      <b>${i+1}. ${q.q}</b>
      <div class="choix">${q.choix.map((ch,j) => `<button data-j="${j}">${ch}</button>`).join("")}</div>
      <div class="zone"></div></div>`).join("") +
    `<div id="fin"></div>`;
  corps.querySelectorAll(".qcm").forEach(bloc => {
    const q = items[+bloc.dataset.q];
    bloc.querySelectorAll(".choix button").forEach(btn => btn.addEventListener("click", () => {
      if(bloc.dataset.fini) return;
      bloc.dataset.fini = 1; rep++;
      const j = +btn.dataset.j, ok = j === q.bonne;
      if(ok) bons++;
      btn.classList.add(ok ? "bon" : "faux");
      bloc.querySelectorAll(".choix button")[q.bonne].classList.add("bon");
      bloc.querySelector(".zone").innerHTML = `<div class="bulle ${ok?'corr':'indice'}">${ok ? "✅ Bonne réponse !" : "❌ Pas tout à fait."} ${q.explication}</div>`;
      if(rep === items.length){
        const ancien = memo.lire(`quiz:${c.id}-${m.id}`, -1);
        if(bons > ancien) memo.ecrire(`quiz:${c.id}-${m.id}`, bons);
        document.getElementById("fin").innerHTML = `<div class="encadre"><span class="score">Score : ${bons}/${items.length}</span>
          ${bons === items.length ? " — Parfait ! 🏆" : " — Continue, tu progresses 💪"}
          <div class="actions"><button class="btn plein" id="rejouer">🔁 Recommencer</button></div></div>`;
        document.getElementById("rejouer").addEventListener("click", () => pageMatiere(c, m, "quiz", true));
        toast(`Quiz terminé : ${bons}/${items.length}`);
      }
    }));
  });
}

