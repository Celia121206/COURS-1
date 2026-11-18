// Rapport largeur / hauteur d'une feuille A4
export const FORMATS = {
  portrait: 210 / 297,
  paysage: 297 / 210,
};

// Une mise en page = une liste de rangées.
// h = hauteur relative de la rangée, cols = largeurs relatives des cases,
// pente = inclinaison de la coupe sous la rangée, inclinaisons = inclinaison de chaque coupe entre les cases.
const rangee = (...cols) => ({ h: 1, cols });
const penchee = (h, cols, pente = 0, inclinaisons = []) => ({ h, cols, pente, inclinaisons });

export const MISES_EN_PAGE = [
  { id: '1', nom: '1 case', rangees: [rangee(1)] },
  { id: '2', nom: '2 cases', rangees: [rangee(1), rangee(1)] },
  { id: '3', nom: '3 cases', rangees: [rangee(1), rangee(1, 1)] },
  { id: '4', nom: '4 cases', rangees: [rangee(1, 1), rangee(1, 1)] },
  { id: '5', nom: '5 cases', rangees: [rangee(2, 1), rangee(1), rangee(1, 2)] },
  { id: '6', nom: '6 cases', rangees: [rangee(1, 1), rangee(1, 1), rangee(1, 1)] },
  // Modèles avec des coupes penchées, comme dans les albums
  { id: 'action', nom: 'Action', rangees: [penchee(1, [1.3, 1], 0.1, [0.2]), penchee(1.2, [1, 1.2], -0.08, [-0.25]), penchee(0.8, [1, 1, 1])] },
  { id: 'diagonales', nom: 'Diagonales', rangees: [penchee(1.4, [1, 1], 0.12, [0.3]), penchee(1, [1, 1, 1], 0, [0.1, -0.1])] },
  { id: 'eclate', nom: 'Éclaté', rangees: [penchee(0.8, [1, 2], -0.1, [-0.2]), penchee(1, [1.4, 1], 0.06, [0.25]), penchee(1.1, [1, 1.3], 0, [-0.3])] },
];

const alea = (min, max) => min + Math.random() * (max - min);
const signe = () => (Math.random() < 0.5 ? -1 : 1);

// Penche au hasard une partie des coupes (entre rangées et entre cases)
export const pencherCoupes = (rangees) =>
  rangees.map((r, k) => ({
    ...r,
    pente: k < rangees.length - 1 && Math.random() < 0.7 ? signe() * alea(0.05, 0.13) : 0,
    inclinaisons: r.cols.slice(1).map(() => (Math.random() < 0.65 ? signe() * alea(0.12, 0.3) : 0)),
  }));

export const redresserCoupes = (rangees) => rangees.map((r) => ({ ...r, pente: 0, inclinaisons: [] }));

export const estPenchee = (rangees) => rangees.some((r) => r.pente || r.inclinaisons?.some(Boolean));
const entier = (min, max) => Math.floor(alea(min, max + 1));

export const NOMBRE_CASES_MAX = 12;

// Disposition aléatoire avec n cases
export function miseEnPageAleatoire(n = entier(3, 6)) {
  const minRangees = Math.ceil(n / 3);
  const maxRangees = Math.max(minRangees, Math.min(n, 5, Math.ceil(n / 1.5)));
  const parRangee = Array(entier(minRangees, maxRangees)).fill(1);
  let reste = n - parRangee.length;
  while (reste > 0) {
    const i = entier(0, parRangee.length - 1);
    if (parRangee[i] < 3 || parRangee.every((c) => c >= 3)) {
      parRangee[i]++;
      reste--;
    }
  }
  return pencherCoupes(
    parRangee.map((nbCols) => ({
      h: alea(0.7, 1.3),
      cols: Array.from({ length: nbCols }, () => alea(0.6, 1.4)),
    }))
  );
}

// Grille régulière avec n cases, adaptée au format de la page
export function grilleReguliere(n, ratio) {
  const nbRangees = Math.min(n, Math.max(1, Math.round(Math.sqrt(n / ratio))));
  const base = Math.floor(n / nbRangees);
  const enPlus = n % nbRangees;
  // Les rangées les plus remplies vont en bas : la première case reste grande
  return Array.from({ length: nbRangees }, (_, i) => rangee(...Array(base + (i >= nbRangees - enPlus ? 1 : 0)).fill(1)));
}

export const compterCases = (rangees) => rangees.reduce((somme, r) => somme + r.cols.length, 0);

// Deux formes de case : angles droits ou angles arrondis (les deux suivent les coupes penchées)
export const FORMES = [
  { id: 'rectangle', nom: 'Angles droits' },
  { id: 'arrondi', nom: 'Angles arrondis' },
];

// Les anciennes formes (rond, ovale, carré) sont ramenées à des angles droits
export const formeDeCase = (page, i) => (page.formes?.[i] ?? page.formeDefaut) === 'arrondi' ? 'arrondi' : 'rectangle';

const RAYON_ARRONDI = 2.6; // en % de la largeur de page

// Contour d'une case (en % de la page) : ses 4 coins, ou des coins arrondis approchés par de petits arcs.
// Les arcs sont calculés dans le repère "largeur 100" pour rester de vrais quarts de cercle.
export function contourCase(c, forme, ratio) {
  if (forme !== 'arrondi') return c.points;
  const coins = c.points.map(([x, y]) => [x, y / ratio]);
  const resultat = [];
  coins.forEach((p, i) => {
    const a = coins[(i + 3) % 4];
    const b = coins[(i + 1) % 4];
    const u = [a[0] - p[0], a[1] - p[1]];
    const v = [b[0] - p[0], b[1] - p[1]];
    const lu = Math.hypot(...u);
    const lv = Math.hypot(...v);
    const ux = [u[0] / lu, u[1] / lu];
    const vx = [v[0] / lv, v[1] / lv];
    const angle = Math.acos(Math.max(-1, Math.min(1, ux[0] * vx[0] + ux[1] * vx[1])));
    const d = Math.min(RAYON_ARRONDI / Math.tan(angle / 2), 0.45 * Math.min(lu, lv));
    const depart = [p[0] + ux[0] * d, p[1] + ux[1] * d];
    const arrivee = [p[0] + vx[0] * d, p[1] + vx[1] * d];
    // Courbe de Bézier quadratique (coin = point de contrôle), échantillonnée
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      const x = (1 - t) ** 2 * depart[0] + 2 * (1 - t) * t * p[0] + t ** 2 * arrivee[0];
      const y = (1 - t) ** 2 * depart[1] + 2 * (1 - t) * t * p[1] + t ** 2 * arrivee[1];
      resultat.push([x, y * ratio]);
    }
  });
  return resultat;
}

// Transforme les rangées en rectangles (en % de la page), avec une gouttière régulière.
export const GOUTTIERE = 3; // marge entre les cases et autour de la page (en % de la largeur)

// ----- Géométrie des cases -----
// Les calculs se font dans un repère où la largeur de page vaut 100 (et la hauteur 100 / ratio),
// pour que la gouttière ait la même épaisseur partout, même le long d'une coupe penchée.
// Coupe "horizontale" : Y = b + s × (X − 50) ; coupe "verticale" : X = a + t × (Y − ym).
const intersection = (v, h) => {
  const X = (v.a + v.t * (h.b - 50 * h.s - v.ym)) / (1 - v.t * h.s);
  return [X, h.b + h.s * (X - 50)];
};
const decalerH = (ligne, d) => ({ ...ligne, b: ligne.b + d * Math.sqrt(1 + ligne.s * ligne.s) });
const decalerV = (ligne, d) => ({ ...ligne, a: ligne.a + d * Math.sqrt(1 + ligne.t * ligne.t) });

// Case = rectangle englobant (x, y, w, h en % de la page) + ses 4 coins (points)
function versCase(coins, ratio) {
  const points = coins.map(([X, Y]) => [X, Y * ratio]);
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y, points };
}

export const rectVersCase = ({ x, y, w, h }) => ({ x, y, w, h, points: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] });

export function calculerCases(rangees, ratio) {
  const g = GOUTTIERE;
  const H = 100 / ratio;
  const n = rangees.length;
  const totalH = rangees.reduce((somme, r) => somme + r.h, 0);
  const dispoH = H - g * (n + 1);

  // Bandes nominales de chaque rangée
  let y = g;
  const bandes = rangees.map((r) => {
    const hauteur = (dispoH * r.h) / totalH;
    const bande = { haut: y, bas: y + hauteur, hauteur };
    y += hauteur + g;
    return bande;
  });

  // Coupes entre rangées (au milieu de la gouttière), inclinaison limitée pour ne pas écraser une rangée
  const coupesH = rangees.slice(0, -1).map((r, k) => {
    const max = (0.3 * Math.min(bandes[k].hauteur, bandes[k + 1].hauteur)) / 50;
    return { b: bandes[k].bas + g / 2, s: limiter(r.pente ?? 0, -max, max) };
  });

  const cases = [];
  rangees.forEach((r, k) => {
    const haut = k === 0 ? { b: g, s: 0 } : decalerH(coupesH[k - 1], g / 2);
    const bas = k === n - 1 ? { b: H - g, s: 0 } : decalerH(coupesH[k], -g / 2);
    const { hauteur } = bandes[k];
    const ym = (bandes[k].haut + bandes[k].bas) / 2;
    const totalW = r.cols.reduce((somme, c) => somme + c, 0);
    const dispoW = 100 - g * (r.cols.length + 1);
    const largeurs = r.cols.map((c) => (dispoW * c) / totalW);

    // Coupes entre les cases de la rangée
    const coupesV = [];
    let x = g;
    largeurs.slice(0, -1).forEach((w, j) => {
      x += w;
      const max = (0.3 * Math.min(w, largeurs[j + 1])) / (hauteur / 2);
      coupesV.push({ a: x + g / 2, t: limiter(r.inclinaisons?.[j] ?? 0, -max, max), ym });
      x += g;
    });

    largeurs.forEach((_, j) => {
      const gauche = j === 0 ? { a: g, t: 0, ym } : decalerV(coupesV[j - 1], g / 2);
      const droite = j === largeurs.length - 1 ? { a: 100 - g, t: 0, ym } : decalerV(coupesV[j], -g / 2);
      const coins = [intersection(gauche, haut), intersection(droite, haut), intersection(droite, bas), intersection(gauche, bas)];
      cases.push(versCase(coins, ratio));
    });
  });

  return cases;
}

export const TEXTES = [
  { nom: 'Encadré narratif', element: { type: 'texte', variante: 'narration', texte: 'Pendant ce temps...', taille: 2.6 } },
  { nom: 'Texte libre', element: { type: 'texte', variante: 'libre', texte: 'Ton texte ici', taille: 3.2 } },
];

// Formes de bulles
export const FORMES_BULLE = [
  { id: 'parole', nom: 'Ovale' },
  { id: 'arrondie', nom: 'Arrondie' },
  { id: 'boite', nom: 'Rectangle' },
  { id: 'chuchotement', nom: 'Chuchotée' },
  { id: 'pensee', nom: 'Pensée' },
  { id: 'cri', nom: 'Cri' },
];

export const BULLES = FORMES_BULLE.map((f) => ({
  nom: f.nom,
  element: { type: 'bulle', variante: f.id, texte: 'Salut !', taille: f.id === 'cri' ? 3.4 : 3, queue: 'bas-gauche' },
}));

export const QUEUES = [
  { id: 'bas-gauche', nom: 'En bas à gauche' },
  { id: 'bas-droite', nom: 'En bas à droite' },
  { id: 'haut-gauche', nom: 'En haut à gauche' },
  { id: 'haut-droite', nom: 'En haut à droite' },
  { id: 'aucune', nom: 'Sans queue' },
];

// Épaisseur du trait des bulles et encadrés (en em : suit la taille du texte)
export const EPAISSEURS_BORD = { fin: 0.07, normal: 0.12, epais: 0.2 };

// Style de départ de chaque élément (les réglages de l'utilisateur s'ajoutent par-dessus)
export function styleParDefaut(element) {
  const commun = { graisse: 700, italique: false, alignement: 'center', couleur: '#1C1917', bord: '#1C1917', epaisseur: 'normal', lignes: 0, espacement: 0 };
  if (element.type === 'onomato') return { ...commun, police: 'bangers', graisse: 400, couleur: '#FFD23F', espacement: 0.03 };
  if (element.variante === 'narration') return { ...commun, police: 'comic-neue', alignement: 'left', fond: '#FFF3B0' };
  if (element.type === 'bulle') return { ...commun, police: 'comic-neue', fond: '#FFFFFF' };
  return { ...commun, police: 'comic-neue' };
}

export const COULEURS = ['#FFD23F', '#FF6B6B', '#FF9F1C', '#4ECDC4', '#5DADE2', '#B8A1FF', '#7BD389', '#FFFFFF'];

export const ONOMATOPEES = [
  { texte: 'BOUM !', couleur: '#FFD23F' },
  { texte: 'POW !', couleur: '#FF6B6B' },
  { texte: 'BAM !', couleur: '#4ECDC4' },
  { texte: 'CRAC !', couleur: '#FF9F1C' },
  { texte: 'SPLASH !', couleur: '#5DADE2' },
  { texte: 'VROUM !', couleur: '#FF6B6B' },
  { texte: 'PAF !', couleur: '#FFD23F' },
  { texte: 'ZZZ...', couleur: '#B8A1FF' },
  { texte: 'WOUAH !', couleur: '#7BD389' },
  { texte: 'AÏE !', couleur: '#FF9F1C' },
  { texte: 'DRING !', couleur: '#5DADE2' },
  { texte: 'SNIF...', couleur: '#B8A1FF' },
];

// Emplacement réel des cases d'une page : la grille, sauf pour les cases déplacées ou redimensionnées à la main
// Une position enregistrée garde sa forme penchée (points) si elle n'a pas été touchée ; sinon c'est un rectangle
export const casesDeLaPage = (page, format) =>
  calculerCases(page.rangees, FORMATS[format]).map((c, i) => {
    const position = page.positions?.[i];
    if (!position) return c;
    return position.points ? position : rectVersCase(position);
  });

// Index de la case qui contient le point (x, y), ou -1
export function caseSous(cases, x, y) {
  for (let i = cases.length - 1; i >= 0; i--) {
    const c = cases[i];
    if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return i;
  }
  return -1;
}

const TAILLE_MIN_CASE = 8;
const limiter = (valeur, min, max) => Math.min(max, Math.max(min, valeur));
// La gouttière verticale est corrigée par le format pour être visuellement égale à l'horizontale
const marges = (ratio) => ({ gx: GOUTTIERE, gy: GOUTTIERE * ratio });
// Plus grand rectangle droit contenu dans une case penchée : il ne déborde jamais sur une voisine
const rectangle = (c) => {
  if (!c.points) return { x: c.x, y: c.y, w: c.w, h: c.h };
  const [hg, hd, bd, bg] = c.points;
  const x = Math.max(hg[0], bg[0]);
  const y = Math.max(hg[1], hd[1]);
  return { x, y, w: Math.min(hd[0], bd[0]) - x, h: Math.min(bd[1], bg[1]) - y };
};

// Les cases restent à l'intérieur des marges de la page
export const deplacerCase = (c, dx, dy, ratio) => {
  const { gx, gy } = marges(ratio);
  return { ...rectangle(c), x: limiter(c.x + dx, gx, 100 - gx - c.w), y: limiter(c.y + dy, gy, 100 - gy - c.h) };
};

export const redimensionnerCase = (c, dw, dh, ratio) => {
  const { gx, gy } = marges(ratio);
  return {
    ...rectangle(c),
    w: limiter(c.w + dw, TAILLE_MIN_CASE, 100 - gx - c.x),
    h: limiter(c.h + dh, TAILLE_MIN_CASE, 100 - gy - c.y),
  };
};

const seChevauchent = (a, b, gx, gy) =>
  a.x < b.x + b.w + gx && b.x < a.x + a.w + gx && a.y < b.y + b.h + gy && b.y < a.y + a.h + gy;

// Rétrécit la case `c` pour qu'elle laisse une gouttière autour de `r`.
// On coupe le côté qui garde la plus grande case ; null si aucune découpe ne laisse une case assez grande.
function rogner(c, r, gx, gy) {
  if (!seChevauchent(c, r, gx, gy)) return c;
  c = rectangle(c);
  const droite = c.x + c.w;
  const bas = c.y + c.h;
  const options = [
    { ...c, x: r.x + r.w + gx, w: droite - (r.x + r.w + gx) }, // garde la partie droite
    { ...c, w: r.x - gx - c.x }, // garde la partie gauche
    { ...c, y: r.y + r.h + gy, h: bas - (r.y + r.h + gy) }, // garde le bas
    { ...c, h: r.y - gy - c.y }, // garde le haut
  ].filter((o) => o.w >= TAILLE_MIN_CASE && o.h >= TAILLE_MIN_CASE);
  if (options.length === 0) return null;
  return options.reduce((meilleure, o) => (o.w * o.h > meilleure.w * meilleure.h ? o : meilleure));
}

// Place la case `index` à `rect` et rétrécit les autres pour qu'aucune ne se superpose.
// Renvoie la nouvelle liste de cases, ou null si c'est impossible (plus assez de place).
export function placerCase(cases, index, rect, ratio) {
  const { gx, gy } = marges(ratio);
  const resultat = cases.map((c, i) => (i === index ? rect : rogner(c, rect, gx, gy)));
  return resultat.includes(null) ? null : resultat;
}

// Couleurs proposées selon le type d'élément
export const COULEURS_TEXTE = ['#1C1917', '#C0392B', '#1F5FA8', '#2E7D32', '#7B3FA0', '#E8793A', '#FFFFFF'];
export const COULEURS_ENCADRE = ['#FFF3B0', '#FFFFFF', '#FFD6E0', '#CDEBFF', '#D9F7C9', '#FFD8B1', '#E9D8FF'];

// Fonds de croquis proposés pour les pages intérieures
export const FONDS = [
  { id: 'aucun', nom: 'Aucun' },
  { id: 'doodles', nom: 'Doodles BD' },
  { id: 'planche', nom: 'Planche de dessinateur' },
  { id: 'trame', nom: 'Trame de points' },
  { id: 'quadrillage', nom: 'Quadrillage bleu' },
];

// Une forme au hasard pour chaque case
export const formesAleatoires = (nombre) =>
  Object.fromEntries(Array.from({ length: nombre }, (_, i) => [i, Math.random() < 0.35 ? 'arrondi' : 'rectangle']));

// Pages de couverture : la 1re et la 2e au début du livre, la 3e et la 4e à la fin
export const COUVERTURES = {
  couverture: '1re de couverture',
  deuxieme: '2e de couverture',
  troisieme: '3e de couverture',
  quatrieme: '4e de couverture',
};
const COUVERTURES_DEBUT = ['couverture', 'deuxieme'];
const COUVERTURES_FIN = ['troisieme', 'quatrieme'];

// Seules la 2e et la 3e de couverture reçoivent un fond de croquis
export const accepteUnFond = (page) => page.type === 'deuxieme' || page.type === 'troisieme';

// Les pages intérieures vont de `debut` (inclus) à `fin` (exclu)
export function bornesInterieures(pages) {
  let debut = 0;
  while (debut < pages.length && COUVERTURES_DEBUT.includes(pages[debut].type)) debut++;
  let fin = pages.length;
  while (fin > debut && COUVERTURES_FIN.includes(pages[fin - 1].type)) fin--;
  return { debut, fin };
}

// Où remettre une couverture qui a été supprimée
export function positionCouverture(pages, type) {
  if (type === 'couverture') return 0;
  if (type === 'deuxieme') return pages[0]?.type === 'couverture' ? 1 : 0;
  if (type === 'troisieme') return pages.at(-1)?.type === 'quatrieme' ? pages.length - 1 : pages.length;
  return pages.length;
}
