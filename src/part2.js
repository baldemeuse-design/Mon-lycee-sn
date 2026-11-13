function progression(cid, mid){
  const d = donnees(cid, mid);
  const ex = liste(d,"exercices"), qz = liste(d,"quiz");
  const total = ex.length + (qz.length ? 1 : 0);
  let fait = ex.filter((_,i) => memo.lire(`fait:${cid}-${mid}-${i}`, false)).length;
  if(qz.length && memo.lire(`quiz:${cid}-${mid}`, null) !== null) fait++;
  return {fait, total};
}
function progressionClasse(cid){
  let f=0,t=0; matieresDe(trouverClasse(cid)).forEach(m => { const p = progression(cid, m.id); f+=p.fait; t+=p.total; });
  return {fait:f, total:t};
}
const jauge = p => p.total ? `<div class="jauge"><i style="width:${Math.round(100*p.fait/p.total)}%"></i></div>` : "";

