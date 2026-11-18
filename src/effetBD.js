// Transforme une photo en illustration de comics (style "pop art") en gardant ses couleurs d'origine :
// 1. lissage qui préserve les bords (filtre de Kuwahara) : les zones deviennent des aplats nets
// 2. ombrage en quelques paliers francs + contraste et couleurs plus vives, sans changer les teintes
// 3. ombres les plus profondes en aplat noir
// 4. trame de points dans les demi-teintes, dans la couleur de la zone
// 5. traits d'encre épais et propres, débarrassés des petites taches

const TAILLE_MAX = 1400;

// Réglages du rendu
const PALIERS = 4; // nombre de niveaux de lumière (moins = plus "dessin animé")
const DOUCEUR = 0.12; // 0 = paliers très francs, 0.5 = presque pas de paliers
const CONTRASTE = 1.15;
const SATURATION = 1.25; // 1 = couleurs d'origine
const QUANTITE_TRAITS = 0.09; // part de l'image couverte par les traits (~9 %)
const PART_NOIRS = 0.07; // part de l'image (les zones les plus sombres) passée en noir
const TRAME = 0.6; // intensité des points de trame (0 = pas de trame)
const ENCRE = [18, 16, 20];

const chargerImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const lissage = (a, b, t) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

// Table de sommes cumulées : permet de calculer la moyenne d'un rectangle en 4 lectures
function integrale(canal, w, h) {
  const I = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let ligne = 0;
    for (let x = 0; x < w; x++) {
      ligne += canal[y * w + x];
      I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + ligne;
    }
  }
  return I;
}

function sommeRect(I, w, x0, y0, x1, y1) {
  const W = w + 1;
  return I[(y1 + 1) * W + x1 + 1] - I[y0 * W + x1 + 1] - I[(y1 + 1) * W + x0] + I[y0 * W + x0];
}

// Filtre de Kuwahara : chaque pixel prend la couleur moyenne du quart de voisinage le plus uniforme.
// Résultat : des aplats de couleur, mais les contours restent nets.
function kuwahara(r, g, b, lum, w, h, rayon) {
  const Ir = integrale(r, w, h);
  const Ig = integrale(g, w, h);
  const Ib = integrale(b, w, h);
  const Il = integrale(lum, w, h);
  const Il2 = integrale(lum.map((v) => v * v), w, h);
  const sortie = [new Float32Array(w * h), new Float32Array(w * h), new Float32Array(w * h)];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let meilleure = Infinity;
      let choix = null;
      const quarts = [
        [x - rayon, y - rayon, x, y],
        [x, y - rayon, x + rayon, y],
        [x - rayon, y, x, y + rayon],
        [x, y, x + rayon, y + rayon],
      ];
      for (const [qx0, qy0, qx1, qy1] of quarts) {
        const x0 = Math.max(0, qx0), y0 = Math.max(0, qy0);
        const x1 = Math.min(w - 1, qx1), y1 = Math.min(h - 1, qy1);
        const n = (x1 - x0 + 1) * (y1 - y0 + 1);
        const moyenne = sommeRect(Il, w, x0, y0, x1, y1) / n;
        const variance = sommeRect(Il2, w, x0, y0, x1, y1) / n - moyenne * moyenne;
        if (variance < meilleure) {
          meilleure = variance;
          choix = [x0, y0, x1, y1, n];
        }
      }
      const [x0, y0, x1, y1, n] = choix;
      const i = y * w + x;
      sortie[0][i] = sommeRect(Ir, w, x0, y0, x1, y1) / n;
      sortie[1][i] = sommeRect(Ig, w, x0, y0, x1, y1) / n;
      sortie[2][i] = sommeRect(Ib, w, x0, y0, x1, y1) / n;
    }
  }
  return sortie;
}

// Flou proche d'un flou gaussien : trois flous "boîte" successifs
function flouGaussien(canal, w, h, sigma) {
  const rayon = Math.max(1, Math.round(sigma));
  const a = Float32Array.from(canal);
  const b = new Float32Array(w * h);
  const n = 2 * rayon + 1;
  for (let passe = 0; passe < 3; passe++) {
    for (let y = 0; y < h; y++) {
      let s = 0;
      for (let k = -rayon; k <= rayon; k++) s += a[y * w + Math.min(w - 1, Math.max(0, k))];
      for (let x = 0; x < w; x++) {
        b[y * w + x] = s / n;
        s += a[y * w + Math.min(w - 1, x + rayon + 1)] - a[y * w + Math.max(0, x - rayon)];
      }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -rayon; k <= rayon; k++) s += b[Math.min(h - 1, Math.max(0, k)) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = s / n;
        s += b[Math.min(h - 1, y + rayon + 1) * w + x] - b[Math.max(0, y - rayon) * w + x];
      }
    }
  }
  return a;
}

// Supprime les petits groupes de pixels d'encre isolés (effet "brouillon")
function retirerTaches(encre, w, h, tailleMin) {
  const vu = new Uint8Array(w * h);
  const pile = new Int32Array(w * h);
  const groupe = [];

  for (let depart = 0; depart < encre.length; depart++) {
    if (vu[depart] || encre[depart] < 0.3) continue;
    let haut = 0;
    pile[haut++] = depart;
    vu[depart] = 1;
    groupe.length = 0;

    while (haut > 0) {
      const i = pile[--haut];
      groupe.push(i);
      const x = i % w;
      const voisins = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w];
      for (const v of voisins) {
        if (v >= 0 && v < encre.length && !vu[v] && encre[v] >= 0.3) {
          vu[v] = 1;
          pile[haut++] = v;
        }
      }
    }

    if (groupe.length < tailleMin) for (const i of groupe) encre[i] = 0;
  }
}

// Épaissit les traits d'un pixel (chaque pixel prend la valeur la plus encrée de ses voisins)
function epaissir(encre, w, h) {
  const sortie = new Float32Array(encre.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let max = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx));
          const yy = Math.min(h - 1, Math.max(0, y + dy));
          max = Math.max(max, encre[yy * w + xx]);
        }
      }
      sortie[y * w + x] = max;
    }
  }
  return sortie;
}

// Traits d'encre : on compare un flou léger et un flou plus fort ;
// là où l'image est plus sombre que son entourage, on trace un trait.
function tracerTraits(lum, w, h, echelle) {
  const fin = flouGaussien(lum, w, h, echelle);
  const large = flouGaussien(lum, w, h, echelle * 1.6);
  const ecart = new Float32Array(w * h);
  for (let i = 0; i < ecart.length; i++) ecart[i] = large[i] - fin[i];

  // Seuil automatique pour obtenir environ la même quantité de traits sur toutes les photos
  const echantillon = [];
  for (let i = 0; i < ecart.length; i += 5) echantillon.push(ecart[i]);
  echantillon.sort((a, b) => a - b);
  const seuil = Math.max(2.5, echantillon[Math.floor(echantillon.length * (1 - QUANTITE_TRAITS))]);

  const encre = new Float32Array(w * h);
  for (let i = 0; i < encre.length; i++) encre[i] = lissage(seuil, seuil * 1.8, ecart[i]);

  retirerTaches(encre, w, h, Math.round((w * h) / 12000));
  return encre;
}

export function effetBDPixels(data, w, h) {
  const taille = w * h;
  const r = new Float32Array(taille);
  const g = new Float32Array(taille);
  const b = new Float32Array(taille);
  const lum = new Float32Array(taille);
  for (let i = 0; i < taille; i++) {
    r[i] = data[i * 4];
    g[i] = data[i * 4 + 1];
    b[i] = data[i * 4 + 2];
    lum[i] = 0.299 * r[i] + 0.587 * g[i] + 0.114 * b[i];
  }

  const dimension = Math.max(w, h);
  // Aplats nets, puis un léger flou pour effacer l'effet "escalier" du filtre
  const aplats = kuwahara(r, g, b, lum, w, h, Math.max(2, Math.round(dimension / 320)));
  const [lr, lg, lb] = aplats.map((canal) => flouGaussien(canal, w, h, Math.max(1, dimension / 1400)));

  const lumLisse = new Float32Array(taille);
  for (let i = 0; i < taille; i++) lumLisse[i] = 0.299 * lr[i] + 0.587 * lg[i] + 0.114 * lb[i];

  // Les traits sont calculés sur la photo d'origine : contours plus réguliers
  let encre = tracerTraits(lum, w, h, Math.max(1, dimension / 1100));
  if (dimension > 900) encre = epaissir(encre, w, h);

  // Seuil des noirs : les zones les plus sombres de l'image (sans noircir une photo très claire)
  const echantillon = [];
  for (let i = 0; i < taille; i += 7) echantillon.push(lumLisse[i]);
  echantillon.sort((a, b) => a - b);
  const seuilNoir = Math.min(55, echantillon[Math.floor(echantillon.length * PART_NOIRS)]);

  const cellule = Math.max(4, Math.round(dimension / 170));

  for (let i = 0; i < taille; i++) {
    const x = i % w;
    const y = (i - x) / w;

    // Contraste, puis paliers de lumière : la teinte reste celle de la photo
    const l = Math.min(1, Math.max(0, (lumLisse[i] / 255 - 0.5) * CONTRASTE + 0.5));
    const t = l * PALIERS;
    const palier = Math.floor(t);
    const lPalier = Math.min(1, (palier + lissage(0.5 - DOUCEUR, 0.5 + DOUCEUR, t - palier)) / PALIERS);
    const ratio = (lPalier * 255 + 4) / (lumLisse[i] + 4);

    const couleur = [lr[i] * ratio, lg[i] * ratio, lb[i] * ratio];
    const gris = 0.299 * couleur[0] + 0.587 * couleur[1] + 0.114 * couleur[2];

    // Trame de points inclinée à 45° dans les demi-teintes : points plus gros dans le sombre
    let trame = 1;
    const densite = 1 - lissage(0.25, 0.7, l);
    if (TRAME > 0 && densite > 0) {
      const u = ((((x + y) / Math.SQRT2) % cellule) + cellule) % cellule - cellule / 2;
      const v = ((((x - y) / Math.SQRT2) % cellule) + cellule) % cellule - cellule / 2;
      const rayon = cellule * 0.42 * Math.sqrt(densite);
      const distance = Math.sqrt(u * u + v * v);
      trame = 1 - TRAME * lissage(rayon + 0.6, rayon - 0.6, distance) * 0.6;
    }

    // Ombres profondes en aplat noir, avec un bord adouci
    const noir = 1 - lissage(seuilNoir * 0.7, seuilNoir, lumLisse[i]);
    const ombre = Math.max(encre[i], noir);

    for (let c = 0; c < 3; c++) {
      const vive = (gris + (couleur[c] - gris) * SATURATION) * trame;
      const avecEncre = vive * (1 - ombre) + ENCRE[c] * ombre;
      data[i * 4 + c] = Math.min(255, Math.max(0, avecEncre));
    }
  }
}

export async function appliquerEffetBD(src) {
  const img = await chargerImage(src);
  const echelle = Math.min(1, TAILLE_MAX / Math.max(img.width, img.height));
  const w = Math.round(img.width * echelle);
  const h = Math.round(img.height * echelle);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const image = ctx.getImageData(0, 0, w, h);
  effetBDPixels(image.data, w, h);
  ctx.putImageData(image, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.92);
}
