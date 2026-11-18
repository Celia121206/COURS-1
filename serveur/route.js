// Point d'entrée /api/generer-image, branché sur le serveur de Vite (npm run dev et npm run preview).
// Sans clé Gemini dans .env.local, l'image est créée sur l'ordinateur avec Draw Things (gratuit, sans compte).
import { genererImage, promptGemini } from './gemini.js';
import { genererImageLocale } from './drawthings.js';

const lireCorps = (req) =>
  new Promise((resolve, reject) => {
    let corps = '';
    req.on('data', (morceau) => {
      corps += morceau;
      if (corps.length > 20000) reject(new Error('Requête trop longue'));
    });
    req.on('end', () => resolve(corps));
    req.on('error', reject);
  });

export function routeGenererImage({ cleGemini, urlLocale }) {
  return async (req, res) => {
    const repondre = (statut, json) => {
      res.statusCode = statut;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(json));
    };
    if (req.method !== 'POST') return repondre(405, { erreur: 'Méthode non autorisée' });
    try {
      const { description, ratio = '1:1' } = JSON.parse(await lireCorps(req));
      if (typeof description !== 'string' || description.trim().length < 10) {
        return repondre(400, { erreur: 'Décris la scène en quelques mots de plus.' });
      }
      const texte = description.trim().slice(0, 1000);
      const image = cleGemini
        ? await genererImage({ prompt: promptGemini(texte), ratio, cle: cleGemini })
        : await genererImageLocale({ description: texte, ratio, url: urlLocale });
      repondre(200, { image });
    } catch (erreur) {
      repondre(erreur.statut && erreur.statut < 600 ? erreur.statut : 500, { erreur: erreur.message || 'La génération a échoué.' });
    }
  };
}
