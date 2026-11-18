// Côté serveur (Vite) : création d'une image avec l'IA de Google (Gemini), si une clé est fournie dans .env.local.
// La clé reste sur le serveur : elle n'est jamais envoyée au navigateur.

const API = 'https://generativelanguage.googleapis.com/v1beta';

// Modèles d'images essayés dans l'ordre : si l'un est saturé ou indisponible, on passe au suivant
const MODELES = [
  { nom: 'gemini-3.1-flash-lite-image', api: 'interactions' }, // le plus rapide et le moins cher
  { nom: 'gemini-2.5-flash-image', api: 'generateContent' },
  { nom: 'gemini-3.1-flash-image', api: 'interactions' },
];
const PAUSES = [2000, 5000]; // nouveaux essais sur un même modèle quand Google est surchargé
const ATTENTE_MAX = 10000; // au-delà, on n'attend pas : on passe au modèle suivant
const attendre = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Cherche l'image (en base64) n'importe où dans la réponse : les deux API ne la rangent pas au même endroit
function trouverImage(objet) {
  if (!objet || typeof objet !== 'object') return null;
  const enLigne = objet.inlineData ?? objet.inline_data;
  if (enLigne?.data) return { data: enLigne.data, mime: enLigne.mimeType ?? enLigne.mime_type ?? 'image/png' };
  const mime = objet.mime_type ?? objet.mimeType ?? '';
  if (typeof objet.data === 'string' && objet.data.length > 200 && (objet.type === 'image' || mime.startsWith('image/'))) {
    return { data: objet.data, mime: mime || 'image/jpeg' };
  }
  for (const valeur of Object.values(objet)) {
    const trouve = trouverImage(valeur);
    if (trouve) return trouve;
  }
  return null;
}

// Texte éventuel renvoyé à la place d'une image (souvent l'explication d'un refus)
function trouverTexte(objet) {
  if (!objet || typeof objet !== 'object') return '';
  if (typeof objet.text === 'string') return objet.text;
  for (const valeur of Object.values(objet)) {
    const texte = trouverTexte(valeur);
    if (texte) return texte;
  }
  return '';
}

const MESSAGES = {
  cle: 'La clé API du fichier .env.local est invalide.',
  facturation:
    "Ta clé n'a pas de quota pour créer des images. Active la facturation de ton projet dans Google AI Studio (bouton « Set up billing » à côté de ta clé), puis réessaie.",
  quota: 'Trop de demandes envoyées à Google en peu de temps. Attends une minute avant de réessayer.',
  surcharge: "Les serveurs d'images de Google sont saturés en ce moment. Réessaie dans quelques minutes.",
  modele: "Aucun modèle d'images de Google n'est disponible pour cette clé.",
};

class ErreurIA extends Error {
  constructor(type, statut, detail = '', attente = null) {
    super(MESSAGES[type] ?? detail ?? `Erreur ${statut}`);
    this.type = type;
    this.statut = statut;
    this.detail = detail;
    this.attente = attente;
  }
}

// Classe l'erreur renvoyée par Google pour savoir s'il faut réessayer, changer de modèle ou s'arrêter
function analyserErreur(statut, json) {
  const erreur = (Array.isArray(json) ? json[0] : json)?.error ?? {};
  const detail = erreur.message ?? '';
  // Délai conseillé par Google avant de réessayer (ex. "retryDelay": "12s")
  const delai = JSON.stringify(erreur.details ?? '').match(/"retryDelay":"(\d+(?:\.\d+)?)s"/);
  const attente = delai ? Number(delai[1]) * 1000 : null;

  if (/api key/i.test(detail) || statut === 401) return new ErreurIA('cle', statut, detail);
  if ((statut === 429 || statut === 403) && /limit: ?0\b|free.?tier|billing|facturation/i.test(detail)) {
    return new ErreurIA('facturation', statut, detail);
  }
  if (statut === 429) return new ErreurIA('quota', statut, detail, attente);
  if (statut === 503 || statut === 500 || statut === 504 || /overload|unavailable|try again later/i.test(detail)) {
    return new ErreurIA('surcharge', statut, detail, attente);
  }
  if (statut === 404 || statut === 400) return new ErreurIA('modele', statut, detail);
  return new ErreurIA('autre', statut, detail);
}

const requete = (modele, prompt, ratio) =>
  modele.api === 'interactions'
    ? {
        url: `${API}/interactions`,
        corps: { model: modele.nom, input: prompt, response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: ratio } },
      }
    : {
        url: `${API}/models/${modele.nom}:generateContent`,
        corps: {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: ratio } },
        },
      };

async function appeler(modele, prompt, ratio, cle) {
  const { url, corps } = requete(modele, prompt, ratio);
  const reponse = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle },
    body: JSON.stringify(corps),
  });
  const json = await reponse.json().catch(() => null);
  if (!reponse.ok) throw analyserErreur(reponse.status, json);
  const image = trouverImage(json);
  if (!image) {
    const texte = trouverTexte(json);
    throw new ErreurIA(
      'refus',
      422,
      texte ? `L'IA n'a pas créé d'image : « ${texte.slice(0, 200)} »` : "L'IA a refusé cette demande. Reformule la description."
    );
  }
  return `data:${image.mime};base64,${image.data}`;
}

// Consignes de style, en français : Gemini comprend très bien les descriptions en français
export const promptGemini = (description) =>
  [
    "Illustration de bande dessinée : contours à l'encre noire nets, aplats de couleurs, ombres simples, décor lisible.",
    `Scène : ${description}`,
    "Cadrage soigné comme une case de BD, personnages expressifs. Aucun texte, aucune bulle, aucune signature dans l'image.",
  ].join('\n');

export async function genererImage({ prompt, ratio, cle }) {
  const erreurs = [];
  for (const modele of MODELES) {
    for (let tentative = 0; tentative <= PAUSES.length; tentative++) {
      try {
        return await appeler(modele, prompt, ratio, cle);
      } catch (erreur) {
        erreurs.push(erreur);
        // La raison exacte donnée par Google s'affiche dans le terminal de "npm run dev"
        console.warn(`[IA] ${modele.nom} (essai ${tentative + 1}) : ${erreur.statut} ${erreur.type} — ${erreur.detail}`);
        if (erreur.type === 'cle' || erreur.type === 'refus') throw erreur;
        const passager = erreur.type === 'surcharge' || erreur.type === 'quota';
        const pause = erreur.attente ?? PAUSES[tentative];
        if (!passager || tentative === PAUSES.length || pause > ATTENTE_MAX) break; // modèle suivant
        await attendre(pause);
      }
    }
  }
  // Tous les modèles ont échoué : on garde l'explication la plus utile
  const ordre = ['facturation', 'quota', 'surcharge', 'modele', 'autre'];
  erreurs.sort((a, b) => ordre.indexOf(a.type) - ordre.indexOf(b.type));
  throw erreurs[0];
}
