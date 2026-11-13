function basculer(){
  if(minuteur.h){ clearInterval(minuteur.h); minuteur.h = null; majMinuteur(); return; }
  minuteur.h = setInterval(() => {
    minuteur.reste--;
    if(minuteur.reste <= 0){
      const travail = minuteur.mode === "travail";
      minuteur.mode = travail ? "pause" : "travail";
      minuteur.duree = minuteur.reste = travail ? 5*60 : 25*60;
      toast(travail ? "Pause ! Lève-toi et bois de l'eau 💧" : "C'est reparti, concentre-toi 💪");
    }
    majMinuteur();
  }, 1000);
  majMinuteur();
}
function majMinuteur(){
  const t = document.getElementById("temps"); if(!t) return;
  const mm = String(Math.floor(minuteur.reste/60)).padStart(2,"0"), ss = String(minuteur.reste%60).padStart(2,"0");
  t.textContent = `${mm}:${ss}`;
  document.getElementById("mode").textContent = minuteur.mode === "travail" ? "Travail" : "Pause";
  document.getElementById("cercle").style.setProperty("--p", `${100*(1 - minuteur.reste/minuteur.duree)}%`);
  document.getElementById("go").textContent = minuteur.h ? "⏸️ Pause" : "▶️ Démarrer";
}

/* ---------- Orientation + checklist ---------- */
const ETAPES_CAMPUSEN = [
  "Je connais la date d'ouverture et la date limite de Campusen pour cette année (site officiel).",
  "J'ai créé mon compte sur orientation.campusen.sn après les résultats du bac.",
  "J'ai noté mon identifiant et mon mot de passe en lieu sûr (sans les partager).",
  "J'ai classé mes choix de filières par préférence réelle.",
  "J'ai ajouté des filières où j'ai de bonnes chances d'être accepté(e).",
  "J'ai validé mes choix avant la date limite.",
  "J'ai consulté mon affectation et fait mon inscription administrative."
];
