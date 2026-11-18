// Fonction serveur Vercel : /api/generer-image sur le site en ligne.
// La clé Gemini est rangée dans les réglages du projet Vercel (variable GEMINI_API_KEY) : elle reste secrète.
import { genererImage, promptGemini } from '../serveur/gemini.js';
import { verifierLimite } from '../serveur/limite.js';

const IMAGES_PAR_JOUR = Number(process.env.LIMITE_IMAGES_PAR_JOUR ?? 50);
const IMAGES_PAR_PERSONNE = Number(process.env.LIMITE_IMAGES_PAR_PERSONNE ?? 5);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erreur: 'Méthode non autorisée' });

  const cle = process.env.GEMINI_API_KEY;
  if (!cle) return res.status(503).json({ erreur: "La génération d'images n'est pas disponible sur cette version en ligne." });

  const { description, ratio = '1:1' } = req.body ?? {};
  if (typeof description !== 'string' || description.trim().length < 10) {
    return res.status(400).json({ erreur: 'Décris la scène en quelques mots de plus.' });
  }

  const ip = String(req.headers['x-forwarded-for'] ?? 'inconnu').split(',')[0].trim();
  const depassement = await verifierLimite(ip, { parJour: IMAGES_PAR_JOUR, parPersonne: IMAGES_PAR_PERSONNE });
  if (depassement) return res.status(429).json({ erreur: depassement });

  try {
    const image = await genererImage({ prompt: promptGemini(description.trim().slice(0, 1000)), ratio, cle });
    res.status(200).json({ image });
  } catch (erreur) {
    res.status(erreur.statut && erreur.statut < 600 ? erreur.statut : 500).json({ erreur: erreur.message || 'La génération a échoué.' });
  }
}
