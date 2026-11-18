// Côté serveur (Vite) : création d'une image avec un modèle installé sur l'ordinateur,
// grâce à l'application gratuite Draw Things (aucune clé, aucun compte, rien ne quitte l'ordinateur).
// Draw Things expose un serveur compatible avec l'API d'AUTOMATIC1111 : POST /sdapi/v1/txt2img.

export const URL_LOCALE_PAR_DEFAUT = 'http://127.0.0.1:7860';
const DUREE_MAX = 4 * 60 * 1000; // la première image peut être longue (chargement du modèle)

// Les modèles d'images locaux comprennent mieux les consignes de style en anglais
export const promptLocal = (description) =>
  `comic book panel illustration, clean bold black ink outlines, flat vibrant colors, simple cel shading, expressive characters, detailed background. Scene: ${description}`;

const NEGATIF = 'text, letters, words, speech bubble, watermark, signature, logo, blurry, deformed hands, extra fingers, photo';

// Taille de l'image d'après le format de la case : grand côté de 1024 px, multiples de 64
function dimensions(ratio) {
  const [l, h] = ratio.split(':').map(Number);
  const arrondir = (v) => Math.max(256, Math.round(v / 64) * 64);
  return l >= h ? { width: 1024, height: arrondir((1024 * h) / l) } : { width: arrondir((1024 * l) / h), height: 1024 };
}

class ErreurLocale extends Error {
  constructor(message, statut) {
    super(message);
    this.statut = statut;
  }
}

export async function genererImageLocale({ description, ratio, url = URL_LOCALE_PAR_DEFAUT }) {
  let reponse;
  try {
    reponse = await fetch(`${url}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Le nombre d'étapes et le guidage viennent des réglages du modèle choisi dans Draw Things
      body: JSON.stringify({ prompt: promptLocal(description), negative_prompt: NEGATIF, seed: -1, batch_size: 1, ...dimensions(ratio) }),
      signal: AbortSignal.timeout(DUREE_MAX),
    });
  } catch (erreur) {
    if (erreur.name === 'TimeoutError') throw new ErreurLocale("L'image prend trop de temps à se créer. Choisis un modèle plus rapide dans Draw Things.", 504);
    throw new ErreurLocale(
      "Le générateur d'images n'est pas lancé : ouvre l'application Draw Things et active son serveur API (Réglages → Avancé → API Server, port 7860).",
      503
    );
  }
  const json = await reponse.json().catch(() => null);
  if (!reponse.ok) {
    console.warn(`[IA locale] ${reponse.status} — ${JSON.stringify(json)?.slice(0, 300)}`);
    throw new ErreurLocale(`Draw Things n'a pas pu créer l'image (erreur ${reponse.status}). Vérifie qu'un modèle est bien chargé dans l'application.`, 502);
  }
  const image = json?.images?.[0];
  if (!image) throw new ErreurLocale("Draw Things n'a renvoyé aucune image. Vérifie qu'un modèle est bien chargé dans l'application.", 502);
  return image.startsWith('data:') ? image : `data:image/png;base64,${image}`;
}
