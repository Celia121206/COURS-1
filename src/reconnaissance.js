// Reconnaît le sujet principal d'une image (chat, chien, personne, voiture…)
// avec un petit modèle de détection d'objets qui tourne dans le navigateur.
// Le modèle (~5 Mo) est téléchargé une seule fois, à la première image importée.
import { SUJETS_COCO } from './phrases.js';

let chargement = null;

const chargerModele = () => {
  chargement ??= (async () => {
    const tf = await import('@tensorflow/tfjs');
    await tf.ready();
    const cocoSsd = await import('@tensorflow-models/coco-ssd');
    return cocoSsd.load({ base: 'lite_mobilenet_v2' });
  })();
  return chargement;
};

const chargerImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export async function reconnaitreSujet(src) {
  try {
    const [modele, image] = await Promise.all([chargerModele(), chargerImage(src)]);
    const detections = await modele.detect(image, 10, 0.4);
    if (detections.length === 0) return 'defaut';
    // L'objet le plus important = le plus sûr et le plus grand
    const principal = detections
      .map((d) => ({ ...d, poids: d.score * d.bbox[2] * d.bbox[3] }))
      .sort((a, b) => b.poids - a.poids)[0];
    return SUJETS_COCO[principal.class] ?? 'defaut';
  } catch (erreur) {
    // Pas de connexion ou navigateur trop ancien : on garde des phrases générales
    console.warn('Reconnaissance de l’image impossible', erreur);
    chargement = null;
    return 'defaut';
  }
}
