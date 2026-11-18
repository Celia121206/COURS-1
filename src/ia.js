// Génération d'images par l'IA à partir de la description d'une scène.
// C'est le serveur de l'application qui crée l'image (voir serveur/route.js) : rien à configurer côté navigateur.

// Formats acceptés par le modèle : on prend le plus proche de la forme de la case
const RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
export function ratioProche(largeurSurHauteur) {
  const valeur = (r) => {
    const [l, h] = r.split(':').map(Number);
    return l / h;
  };
  const ecart = (r) => Math.abs(Math.log(valeur(r) / largeurSurHauteur));
  return RATIOS.reduce((meilleur, r) => (ecart(r) < ecart(meilleur) ? r : meilleur));
}

// Renvoie l'image générée sous forme d'URL "data:"
export async function genererImage({ description, ratio, signal }) {
  const reponse = await fetch('/api/generer-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, ratio }),
    signal,
  });
  // Sur un hébergement sans serveur (GitHub Pages), l'adresse de génération n'existe pas
  if (reponse.status === 404 || reponse.status === 405) {
    throw new Error("La génération d'images par l'IA n'est pas disponible sur cette version en ligne du site.");
  }
  const json = await reponse.json().catch(() => ({}));
  if (!reponse.ok || !json.image) throw new Error(json.erreur || "La génération de l'image a échoué.");
  return json.image;
}
