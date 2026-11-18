// Polices proposées pour les textes : uniquement des styles manuscrits, dessinés ou "enfantins".
// On charge seulement l'alphabet latin pour garder l'export en image rapide.
import '@fontsource/comic-neue/latin-300.css';
import '@fontsource/comic-neue/latin-400.css';
import '@fontsource/comic-neue/latin-700.css';
import '@fontsource/comic-neue/latin-400-italic.css';
import '@fontsource/comic-neue/latin-700-italic.css';
import '@fontsource/bangers/latin-400.css';
import '@fontsource/patrick-hand/latin-400.css';
import '@fontsource/caveat/latin-400.css';
import '@fontsource/caveat/latin-700.css';
import '@fontsource/kalam/latin-300.css';
import '@fontsource/kalam/latin-400.css';
import '@fontsource/kalam/latin-700.css';
import '@fontsource/permanent-marker/latin-400.css';
import '@fontsource/indie-flower/latin-400.css';
import '@fontsource/gochi-hand/latin-400.css';
import '@fontsource/schoolbell/latin-400.css';
import '@fontsource/luckiest-guy/latin-400.css';
import '@fontsource/amatic-sc/latin-400.css';
import '@fontsource/amatic-sc/latin-700.css';
import '@fontsource/dancing-script/latin-400.css';
import '@fontsource/dancing-script/latin-700.css';
import '@fontsource/pacifico/latin-400.css';
// Signature de l'autrice, présente sur toutes les pages
import '@fontsource/mrs-saint-delafield/latin-400.css';
// Police de l'interface
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';

export const POLICES = [
  { id: 'comic-neue', nom: 'Comic Neue', famille: "'Comic Neue', cursive", style: 'BD' },
  { id: 'bangers', nom: 'Bangers', famille: "'Bangers', cursive", style: 'BD' },
  { id: 'luckiest-guy', nom: 'Luckiest Guy', famille: "'Luckiest Guy', cursive", style: 'Enfantin' },
  { id: 'patrick-hand', nom: 'Patrick Hand', famille: "'Patrick Hand', cursive", style: 'Manuscrit' },
  { id: 'kalam', nom: 'Kalam', famille: "'Kalam', cursive", style: 'Manuscrit' },
  { id: 'caveat', nom: 'Caveat', famille: "'Caveat', cursive", style: 'Manuscrit' },
  { id: 'indie-flower', nom: 'Indie Flower', famille: "'Indie Flower', cursive", style: 'Enfantin' },
  { id: 'schoolbell', nom: 'Schoolbell', famille: "'Schoolbell', cursive", style: 'Enfantin' },
  { id: 'gochi-hand', nom: 'Gochi Hand', famille: "'Gochi Hand', cursive", style: 'Dessiné' },
  { id: 'permanent-marker', nom: 'Permanent Marker', famille: "'Permanent Marker', cursive", style: 'Feutre' },
  { id: 'amatic-sc', nom: 'Amatic SC', famille: "'Amatic SC', cursive", style: 'Dessiné' },
  { id: 'dancing-script', nom: 'Dancing Script', famille: "'Dancing Script', cursive", style: 'Script' },
  { id: 'pacifico', nom: 'Pacifico', famille: "'Pacifico', cursive", style: 'Script' },
];

export const POLICE_PAR_DEFAUT = { texte: 'comic-neue', bulle: 'comic-neue', onomato: 'bangers' };

export const famillePolice = (id) => (POLICES.find((p) => p.id === id) ?? POLICES[0]).famille;

export const GRAISSES = [
  { valeur: 300, nom: 'Léger' },
  { valeur: 400, nom: 'Normal' },
  { valeur: 700, nom: 'Gras' },
];
