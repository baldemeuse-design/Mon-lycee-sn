
/* Service worker : rend l'appli utilisable hors connexion (ignoré dans l'aperçu Claude) */
if("serviceWorker" in navigator && !window.claude && location.protocol !== "file:"){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(err => console.warn("SW:", err)));
}
window.addEventListener("offline", () => toast("Tu es hors connexion : tes cours téléchargés restent disponibles."));
capaciteTelechargement();
window.addEventListener("hashchange", router);
router();
