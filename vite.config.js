import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { routeGenererImage } from './serveur/route.js';

// Génération d'images par l'IA : le serveur de Vite crée l'image avec Draw Things (sur l'ordinateur, sans clé)
// ou, si une clé est rangée dans .env.local, avec Gemini (la clé n'est jamais visible dans le navigateur).
function generationImages(reglages) {
  return {
    name: 'generation-images',
    configureServer(serveur) {
      serveur.middlewares.use('/api/generer-image', routeGenererImage(reglages));
    },
    configurePreviewServer(serveur) {
      serveur.middlewares.use('/api/generer-image', routeGenererImage(reglages));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), generationImages({ cleGemini: env.GEMINI_API_KEY, urlLocale: env.DRAWTHINGS_URL || undefined })],
  };
});
