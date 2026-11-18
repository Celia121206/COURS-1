// Limite du nombre d'images créées par jour, pour protéger la facture de la clé Gemini sur le site en ligne.
// Avec une base Upstash Redis (gratuite, à ajouter depuis Vercel), le compteur est partagé et fiable.
// Sans elle, il est gardé en mémoire : moins précis (il repart à zéro quand le serveur redémarre).

const memoire = new Map();

async function incrementer(cle, dureeSecondes) {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const jeton = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && jeton) {
    const reponse = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jeton}` },
      body: JSON.stringify([
        ['INCR', cle],
        ['EXPIRE', cle, String(dureeSecondes), 'NX'],
      ]),
    });
    const [compte] = await reponse.json();
    return Number(compte.result);
  }
  const valeur = (memoire.get(cle) ?? 0) + 1;
  memoire.set(cle, valeur);
  return valeur;
}

// Renvoie un message d'explication si la limite est atteinte, sinon null
export async function verifierLimite(ip, { parJour, parPersonne }) {
  const jour = new Date().toISOString().slice(0, 10);
  const deuxJours = 2 * 24 * 3600;
  const total = await incrementer(`creetabd:${jour}:total`, deuxJours);
  if (total > parJour) return "La limite d'images du jour pour ce site est atteinte. Reviens demain !";
  const personne = await incrementer(`creetabd:${jour}:${ip}`, deuxJours);
  if (personne > parPersonne) return `Tu as atteint ta limite de ${parPersonne} images pour aujourd'hui. Reviens demain !`;
  return null;
}
