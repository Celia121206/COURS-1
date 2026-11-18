import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, X } from 'lucide-react';
import './style.css';
import Scene from './components/Page.jsx';
import Pellicule, { TYPE_PAGE } from './components/Pellicule.jsx';
import Controles, { TYPE_PHOTO } from './components/Controles.jsx';
import BarreFlottante from './components/BarreFlottante.jsx';
import FenetreImport from './components/FenetreImport.jsx';
import EnTete from './components/EnTete.jsx';
import {
  casesDeLaPage,
  caseSous,
  compterCases,
  estPenchee,
  pencherCoupes,
  redresserCoupes,
  accepteUnFond,
  bornesInterieures,
  COUVERTURES,
  FORMATS,
  formeDeCase,
  formesAleatoires,
  positionCouverture,
  grilleReguliere,
  MISES_EN_PAGE,
  miseEnPageAleatoire,
  NOMBRE_CASES_MAX,
} from './data.js';
import { appliquerEffetBD } from './effetBD.js';
import { choisirPhrase } from './phrases.js';
import { reconnaitreSujet } from './reconnaissance.js';
import { ratioProche } from './ia.js';
import { useHistorique } from './historique.js';

const TYPE_CASE = 'application/x-bd-case';

const lireFichier = (fichier) =>
  new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(lecteur.result);
    lecteur.onerror = reject;
    lecteur.readAsDataURL(fichier);
  });

// Les photos d'iPhone / Mac (HEIC) ne sont pas lisibles par Chrome : on les convertit en JPG
const estHeic = (fichier) => /hei[cf]/i.test(fichier.type) || /\.hei[cf]$/i.test(fichier.name);

async function convertirSiHeic(fichier) {
  if (!estHeic(fichier)) return fichier;
  const { default: heic2any } = await import('heic2any');
  const resultat = await heic2any({ blob: fichier, toType: 'image/jpeg', quality: 0.9 });
  return Array.isArray(resultat) ? resultat[0] : resultat;
}

const CADRAGE_DEFAUT = { x: 50, y: 50, zoom: 1, rotation: 0 };
const PAS_DEPLACEMENT = 10;
const borne = (valeur, min, max) => Math.min(max, Math.max(min, valeur));
const sans = (objet, cle) => {
  const { [cle]: _, ...reste } = objet;
  return reste;
};
const sansVides = (objet) => Object.fromEntries(Object.entries(objet).filter(([, v]) => v !== undefined));

// Disposition d'une page ajoutée : un modèle ou une disposition aléatoire, différente de la page voisine,
// avec des cases de toutes les formes
function dispositionVariee(eviter) {
  let disposition;
  if (Math.random() < 0.5) {
    const modeles = MISES_EN_PAGE.filter((m) => m.id !== '1' && m.id !== eviter);
    const m = modeles[Math.floor(Math.random() * modeles.length)];
    disposition = { rangees: estPenchee(m.rangees) ? m.rangees : pencherCoupes(m.rangees), miseEnPageId: m.id };
  } else {
    disposition = { rangees: miseEnPageAleatoire(), miseEnPageId: 'aleatoire' };
  }
  return { ...disposition, formes: formesAleatoires(compterCases(disposition.rangees)) };
}

const pageVide = () => ({
  id: crypto.randomUUID(),
  images: {},
  cadrages: {},
  formes: {},
  formeDefaut: 'rectangle',
  positions: {},
  elements: [],
  fond: 'aucun',
});

// Page intérieure (avec des cases)
const nouvellePage = ({ eviter } = {}) => ({ ...pageVide(), ...dispositionVariee(eviter) });

// Page de couverture (1re, 2e, 3e ou 4e) : sans case au départ ; la 2e et la 3e ont un fond de croquis
const couverture = (type) => ({
  ...pageVide(),
  type,
  rangees: [],
  miseEnPageId: 'aucune',
  fond: type === 'deuxieme' || type === 'troisieme' ? 'doodles' : 'aucun',
});

// Au lancement : les quatre pages de couverture ; les pages intérieures s'ajoutent entre la 2e et la 3e
const pagesDeDepart = () => Object.keys(COUVERTURES).map(couverture);

const attendreAffichage = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const telechargerUrl = (url, nom) => {
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  lien.click();
};

function App() {
  // La BD (pages + format) a un historique : Cmd + Z pour annuler, Cmd + Maj + Z pour rétablir
  const historique = useHistorique(() => ({ pages: pagesDeDepart(), format: 'portrait' }));
  const { pages, format } = historique.etat;
  const setPages = (maj) => historique.modifier((bd) => ({ ...bd, pages: typeof maj === 'function' ? maj(bd.pages) : maj }));
  const setFormat = (format) => historique.modifier((bd) => ({ ...bd, format }));
  const [indexChoisi, setIndexPage] = useState(0);
  // Après une annulation, la page affichée peut ne plus exister : on reste dans les limites
  const indexPage = Math.min(indexChoisi, pages.length - 1);
  // null = aucune case sélectionnée
  const [caseSelectionnee, setCaseSelectionnee] = useState(null);
  const [caseSurvolee, setCaseSurvolee] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photosEnCours, setPhotosEnCours] = useState(0);
  const [erreurImport, setErreurImport] = useState('');
  const [selectionId, setSelectionId] = useState(null);
  const [editionId, setEditionId] = useState(null); // élément dont on modifie le texte sur la page
  const [outil, setOutil] = useState('galerie');
  const [exportEnCours, setExportEnCours] = useState(false);
  const [apercu, setApercu] = useState(null);
  const [caseImport, setCaseImport] = useState(null);
  const [casesEnChargement, setCasesEnChargement] = useState([]);
  const pageRef = useRef(null);
  const conteneurRef = useRef(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const page = pages[indexPage];
  const elementSelectionne = page.elements.find((el) => el.id === selectionId);

  // Modifie une page (par défaut la page affichée)
  const majPage = (modifier, index = indexPage) =>
    setPages((liste) => liste.map((p, i) => (i === index ? { ...p, ...modifier(p) } : p)));

  const premiereCaseVide = (p) => casesDeLaPage(p, format).findIndex((_, i) => !p.images[i]);

  // Clic sur le fond : plus rien n'est sélectionné
  const toutDeselectionner = () => {
    setSelectionId(null);
    setEditionId(null);
    setCaseSelectionnee(null);
  };

  const clicSurLeFond = (e) => {
    const zoneActive = e.target.closest('.page, .barre-flottante, .controles, .pellicule, .modale, button, input, label');
    if (!zoneActive) toutDeselectionner();
  };

  // --- Phrases liées aux images ---
  // Sujet de l'image (chat, chien…) : null tant que la reconnaissance n'est pas finie
  // (lu via une référence : une reconnaissance peut se terminer pendant un import)
  const sujetDeImage = (src) => photosRef.current.find((ph) => ph.src === src)?.sujet ?? null;

  // Les textes jamais modifiés à la main suivent l'image de la case où ils se trouvent
  const actualiserTextes = (p, src, sujet) => {
    if (!sujet) return p.elements;
    const cases = casesDeLaPage(p, format);
    return p.elements.map((el) =>
      el.texteAuto && el.type !== 'onomato' && p.images[caseSous(cases, el.x, el.y)] === src
        ? { ...el, texte: choisirPhrase(el.variante, sujet) }
        : el
    );
  };

  // --- Pages ---
  const allerPage = (index) => {
    setIndexPage(index);
    setCaseSelectionnee(null);
    setSelectionId(null);
  };

  // Les pages intérieures restent entre la couverture et la 4e de couverture
  const { debut: premiereInterieure, fin: finInterieure } = bornesInterieures(pages);
  const couverturesManquantes = Object.keys(COUVERTURES).filter((type) => !pages.some((p) => p.type === type));

  const ajouterPage = (position) => {
    const voulu = position === 'avant' ? indexPage : position === 'fin' ? finInterieure : indexPage + 1;
    const index = borne(voulu, premiereInterieure, finInterieure);
    setPages((liste) => [...liste.slice(0, index), nouvellePage({ eviter: page.miseEnPageId }), ...liste.slice(index)]);
    allerPage(index);
  };

  const ajouterCouverture = (type) => {
    const index = positionCouverture(pages, type);
    setPages((liste) => [...liste.slice(0, index), couverture(type), ...liste.slice(index)]);
    allerPage(index);
  };

  const supprimerPage = (index) => {
    if (pages.length < 2) return;
    setPages((liste) => liste.filter((_, i) => i !== index));
    const derniere = indexPage === pages.length - 1;
    allerPage(Math.max(0, index < indexPage || (index === indexPage && derniere) ? indexPage - 1 : indexPage));
  };

  const deplacerPage = (depuis, vers) => {
    if (pages[depuis].type) return; // les couvertures ne bougent pas
    const cible = borne(vers, premiereInterieure, finInterieure - 1);
    if (depuis === cible) return;
    const liste = [...pages];
    const [deplacee] = liste.splice(depuis, 1);
    liste.splice(cible, 0, deplacee);
    setPages(liste);
    setIndexPage(liste.findIndex((p) => p.id === page.id));
  };

  // Repartir d'une BD vide (annulable avec Cmd + Z)
  const recommencer = () => {
    historique.modifier({ pages: pagesDeDepart(), format: 'portrait' });
    setIndexPage(0);
    toutDeselectionner();
  };

  // --- Fond de croquis des pages intérieures ---
  const changerFond = (fond) => majPage(() => ({ fond }));
  const fondPartout = (fond) => setPages((liste) => liste.map((p) => (accepteUnFond(p) ? { ...p, fond } : p)));

  // --- Éléments (textes, bulles, onomatopées) ---
  // Un nouvel élément se place dans la case sélectionnée, avec une phrase liée à son image
  const ajouterElement = (modele) => {
    const id = crypto.randomUUID();
    const estOnomato = modele.type === 'onomato';
    const rotation = estOnomato ? Math.round(Math.random() * 24 - 12) : 0;
    const c = casesDeLaPage(page, format)[caseSelectionnee];
    let x = 50;
    let y = 50;
    if (c) {
      x = c.x + c.w * (estOnomato ? 0.65 : 0.5);
      y = c.y + c.h * (estOnomato ? 0.7 : modele.variante === 'narration' ? 0.12 : 0.28);
    }
    const sujet = sujetDeImage(page.images[caseSelectionnee]) ?? 'defaut';
    const texte = estOnomato ? modele.texte : choisirPhrase(modele.variante, sujet);
    majPage((p) => ({ elements: [...p.elements, { rotation, ...modele, x, y, texte, texteAuto: !estOnomato, id }] }));
    setSelectionId(id);
  };

  const nouvellePhrase = (id) => {
    const el = page.elements.find((e) => e.id === id);
    const index = caseSous(casesDeLaPage(page, format), el.x, el.y);
    const sujet = sujetDeImage(page.images[index === -1 ? caseSelectionnee : index]) ?? 'defaut';
    modifierElement(id, { texte: choisirPhrase(el.variante, sujet, el.texte), texteAuto: true });
  };

  const dupliquerElement = (id) => {
    const copie = { ...page.elements.find((e) => e.id === id), id: crypto.randomUUID() };
    copie.x = Math.min(95, copie.x + 4);
    copie.y = Math.min(95, copie.y + 4);
    majPage((p) => ({ elements: [...p.elements, copie] }));
    setSelectionId(copie.id);
  };

  const modifierElement = (id, modif) =>
    majPage((p) => ({ elements: p.elements.map((el) => (el.id === id ? { ...el, ...modif } : el)) }));

  const supprimerElement = (id) => {
    majPage((p) => ({ elements: p.elements.filter((el) => el.id !== id) }));
    setSelectionId(null);
  };

  const premierPlan = (id) =>
    majPage((p) => ({ elements: [...p.elements.filter((el) => el.id !== id), p.elements.find((el) => el.id === id)] }));

  // --- Photos ---
  // Chaque photo importée passe par le filtre "dessin de BD". Renvoie les images créées.
  // Ajoute une image à la galerie (avec ou sans filtre BD) et lance la reconnaissance de son sujet
  const ajouterALaGalerie = async (original, { effetBD = true } = {}) => {
    const src = effetBD ? await appliquerEffetBD(original) : original;
    const photo = { id: crypto.randomUUID(), src, sujet: null };
    photosRef.current = [...photosRef.current, photo];
    setPhotos((liste) => [...liste, photo]);
    // La reconnaissance se fait en arrière-plan sur l'image d'origine
    reconnaitreSujet(original).then((sujet) => definirSujet(src, sujet));
    return src;
  };

  const ajouterPhotos = async (fichiers) => {
    const creees = [];
    setErreurImport('');
    setPhotosEnCours((n) => n + fichiers.length);
    for (const fichier of fichiers) {
      try {
        const image = await convertirSiHeic(fichier);
        creees.push(await ajouterALaGalerie(await lireFichier(image)));
      } catch (erreur) {
        console.error(erreur);
        setErreurImport(`Impossible de lire « ${fichier.name} ». Essaie avec une image JPG ou PNG.`);
      } finally {
        setPhotosEnCours((n) => n - 1);
      }
      await attendreAffichage();
    }
    return creees;
  };

  const definirSujet = (src, sujet) => {
    photosRef.current = photosRef.current.map((ph) => (ph.src === src ? { ...ph, sujet } : ph));
    setPhotos((liste) => liste.map((ph) => (ph.src === src ? { ...ph, sujet } : ph)));
    // Mise à jour automatique : elle ne compte pas comme une étape à annuler
    historique.modifierSansHistorique((bd) => ({
      ...bd,
      pages: bd.pages.map((p) => ({ ...p, elements: actualiserTextes(p, src, sujet) })),
    }));
  };

  // --- Cases ---
  const placerPhoto = (src, indexVoulu = caseSelectionnee, pageCible = indexPage) => {
    const index = indexVoulu ?? Math.max(0, premiereCaseVide(pages[pageCible]));
    majPage((p) => {
      // Couverture sans case : l'image crée une case qui occupe toute la page
      const sansCase = casesDeLaPage(p, format).length === 0;
      const disposition = sansCase ? { rangees: grilleReguliere(1, FORMATS[format]), miseEnPageId: 'grille', positions: {} } : {};
      const images = { ...p.images, [index]: src };
      const suite = { ...p, ...disposition, images };
      return { ...disposition, images, cadrages: sans(p.cadrages, index), elements: actualiserTextes(suite, src, sujetDeImage(src)) };
    }, pageCible);
    if (pageCible === indexPage) setCaseSelectionnee(index);
  };

  // Import depuis la fenêtre ouverte en cliquant au centre d'une case
  const importerDansCase = async (fichiers, index, pageCible = indexPage) => {
    setCaseImport(null);
    const cle = `${pages[pageCible].id}:${index}`;
    setCasesEnChargement((liste) => [...liste, cle]);
    try {
      const [premiere] = await ajouterPhotos(fichiers);
      if (premiere) placerPhoto(premiere, index, pageCible);
    } finally {
      setCasesEnChargement((liste) => liste.filter((c) => c !== cle));
    }
  };

  // --- Images créées par l'IA ---
  // Format de l'image : celui de la case sélectionnée (ou de la première case vide)
  const caseCibleIA = caseSelectionnee ?? (premiereCaseVide(page) === -1 ? null : premiereCaseVide(page));
  const caseIA = caseCibleIA === null ? null : casesDeLaPage(page, format)[caseCibleIA];
  const ratioIA = ratioProche(caseIA ? (caseIA.w * FORMATS[format]) / caseIA.h : FORMATS[format]);

  // L'image générée (déjà dessinée en style BD) va dans la galerie et directement dans la case
  const placerImageIA = async (image) => {
    const index = caseCibleIA;
    const pageCible = indexPage;
    const src = await ajouterALaGalerie(image, { effetBD: false });
    placerPhoto(src, index ?? undefined, pageCible);
  };

  // Nouvelle disposition de toutes les cases (après un déplacement ou un redimensionnement)
  const changerPositionsCases = (cases) => majPage(() => ({ positions: { ...cases } }));

  const reinitialiserPositions = () => majPage(() => ({ positions: {} }));

  const viderCase = () =>
    majPage((p) => ({ images: sans(p.images, caseSelectionnee), cadrages: sans(p.cadrages, caseSelectionnee) }));

  const echangerCases = (a, b) => {
    if (a === b) return;
    majPage((p) => {
      const images = { ...p.images, [a]: p.images[b], [b]: p.images[a] };
      const cadrages = { ...p.cadrages, [a]: p.cadrages[b], [b]: p.cadrages[a] };
      return { images: sansVides(images), cadrages: sansVides(cadrages) };
    });
    setCaseSelectionnee(b);
  };

  // Envoie la photo d'une case vers la première case libre d'une autre page
  const envoyerCaseVersPage = (pageSource, caseSource, pageCible) => {
    const src = pages[pageSource].images[caseSource];
    const libre = premiereCaseVide(pages[pageCible]);
    if (!src || libre === -1 || pageSource === pageCible) return;
    const cadrage = pages[pageSource].cadrages[caseSource];
    setPages((liste) =>
      liste.map((p, i) => {
        if (i === pageSource) return { ...p, images: sans(p.images, caseSource), cadrages: sans(p.cadrages, caseSource) };
        if (i === pageCible) return { ...p, images: { ...p.images, [libre]: src }, cadrages: sansVides({ ...p.cadrages, [libre]: cadrage }) };
        return p;
      })
    );
  };

  const choisirCase = (index) => {
    setCaseSelectionnee(index);
    // Dans l'outil "Cases", on reste dessus pour pouvoir changer la forme de la case
    if (outil !== 'cases') setOutil('galerie');
  };

  const changerMiseEnPage = (rangees, miseEnPageId) => {
    majPage(() => ({ rangees, miseEnPageId, positions: {} }));
    setCaseSelectionnee(null);
  };

  const nombreCases = compterCases(page.rangees);

  // Change le nombre de cases en gardant le mode actuel (grille ou aléatoire)
  const changerNombreCases = (n, mode = page.miseEnPageId === 'aleatoire' ? 'aleatoire' : 'grille') => {
    const total = borne(n, page.type ? 0 : 1, NOMBRE_CASES_MAX);
    if (total === 0) return changerMiseEnPage([], 'aucune');
    changerMiseEnPage(mode === 'aleatoire' ? miseEnPageAleatoire(total) : grilleReguliere(total, FORMATS[format]), mode);
  };

  // Coupes penchées (les cases déplacées à la main redeviennent celles de la grille)
  const pencher = () => majPage((p) => ({ rangees: pencherCoupes(p.rangees), positions: {} }));
  const redresser = () => majPage((p) => ({ rangees: redresserCoupes(p.rangees), positions: {} }));

  // --- Forme des cases ---
  const formeCase = formeDeCase(page, caseSelectionnee);

  const changerForme = (forme) =>
    majPage((p) =>
      caseSelectionnee === null
        ? { formeDefaut: forme, formes: {} }
        : { formes: { ...(p.formes ?? {}), [caseSelectionnee]: forme } }
    );

  const formePartout = () => majPage(() => ({ formeDefaut: formeCase, formes: {} }));

  // --- Glisser-déposer ---
  const glisserAccepte = (e) => [TYPE_PHOTO, TYPE_CASE, 'Files'].some((type) => e.dataTransfer.types.includes(type));

  const glisserCase = {
    debut: (e, index) => {
      e.dataTransfer.setData(TYPE_CASE, JSON.stringify({ page: indexPage, case: index }));
      e.dataTransfer.effectAllowed = 'move';
    },
    survol: (e, index) => {
      if (!glisserAccepte(e)) return;
      e.preventDefault();
      setCaseSurvolee(index);
    },
    sortie: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setCaseSurvolee(null);
    },
    depot: async (e, index) => {
      e.preventDefault();
      setCaseSurvolee(null);
      const photoId = e.dataTransfer.getData(TYPE_PHOTO);
      const caseSource = e.dataTransfer.getData(TYPE_CASE);
      const fichiers = [...e.dataTransfer.files];

      if (photoId) {
        const photo = photos.find((p) => p.id === photoId);
        if (photo) placerPhoto(photo.src, index);
      } else if (caseSource) {
        echangerCases(JSON.parse(caseSource).case, index);
      } else if (fichiers.length) {
        setCaseSelectionnee(index);
        importerDansCase(fichiers, index);
      }
    },
  };

  // Déposer sur une page voisine ou une miniature
  const glisserVersPage = (pageCible) => ({
    survol: (e) => {
      if (![TYPE_PHOTO, TYPE_CASE, TYPE_PAGE].some((type) => e.dataTransfer.types.includes(type))) return;
      e.preventDefault();
    },
    depot: (e) => {
      e.preventDefault();
      const photoId = e.dataTransfer.getData(TYPE_PHOTO);
      const caseSource = e.dataTransfer.getData(TYPE_CASE);
      const pageSource = e.dataTransfer.getData(TYPE_PAGE);

      if (pageSource !== '') {
        deplacerPage(Number(pageSource), pageCible);
      } else if (caseSource) {
        const source = JSON.parse(caseSource);
        envoyerCaseVersPage(source.page, source.case, pageCible);
      } else if (photoId) {
        const photo = photos.find((p) => p.id === photoId);
        const libre = premiereCaseVide(pages[pageCible]);
        if (photo && libre !== -1) placerPhoto(photo.src, libre, pageCible);
      }
    },
  });

  // --- Cadrage de l'image dans la case sélectionnée ---
  const cadrage = page.cadrages[caseSelectionnee] ?? CADRAGE_DEFAUT;

  const modifierCadrage = (modif) =>
    majPage((p) => ({
      cadrages: { ...p.cadrages, [caseSelectionnee]: { ...(p.cadrages[caseSelectionnee] ?? CADRAGE_DEFAUT), ...modif } },
    }));

  // Déplace l'image dans le sens de la flèche (en tenant compte de sa rotation)
  const deplacerImage = (dx, dy) => {
    const angle = (-cadrage.rotation * Math.PI) / 180;
    const lx = Math.round(dx * Math.cos(angle) - dy * Math.sin(angle));
    const ly = Math.round(dx * Math.sin(angle) + dy * Math.cos(angle));
    modifierCadrage({
      x: borne(cadrage.x - lx * PAS_DEPLACEMENT, 0, 100),
      y: borne(cadrage.y - ly * PAS_DEPLACEMENT, 0, 100),
    });
  };

  const tournerImage = (sens) => modifierCadrage({ rotation: (cadrage.rotation + sens * 90 + 360) % 360 });
  const zoomerImage = (pas) => modifierCadrage({ zoom: borne(cadrage.zoom + pas, 1, 3) });
  const recentrerImage = () => modifierCadrage({ x: 50, y: 50, zoom: 1 });

  // --- Export ---
  const capturer = async () => {
    setSelectionId(null);
    setExportEnCours(true);
    await attendreAffichage();
    try {
      return await toPng(pageRef.current, { pixelRatio: 3, backgroundColor: '#ffffff' });
    } finally {
      setExportEnCours(false);
    }
  };

  const ouvrirApercu = async () => {
    setApercu('chargement');
    try {
      setApercu(await capturer());
    } catch (erreur) {
      console.error(erreur);
      setApercu(null);
      alert("Impossible de créer l'image.");
    }
  };

  const telecharger = async () => {
    try {
      const url = apercu && apercu !== 'chargement' ? apercu : await capturer();
      telechargerUrl(url, pages.length > 1 ? `ma-bd-page-${indexPage + 1}.png` : 'ma-bd.png');
    } catch (erreur) {
      console.error(erreur);
      alert("Impossible de télécharger l'image.");
    }
  };

  const telechargerTout = async () => {
    const depart = indexPage;
    try {
      for (let i = 0; i < pages.length; i++) {
        allerPage(i);
        await attendreAffichage();
        await pause(200);
        telechargerUrl(await capturer(), `ma-bd-page-${i + 1}.png`);
        await pause(300);
      }
    } catch (erreur) {
      console.error(erreur);
      alert('Impossible de télécharger toutes les pages.');
    } finally {
      allerPage(depart);
    }
  };

  // --- Raccourcis clavier ---
  useEffect(() => {
    const touche = (e) => {
      if (e.target.isContentEditable) return; // l'élément gère lui-même Entrée / Échap pendant l'édition
      if (e.key === 'Escape') {
        setApercu(null);
        setCaseImport(null);
        toutDeselectionner();
      }
      const dansUnChamp = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      // Cmd/Ctrl + Z : annuler ; Cmd/Ctrl + Maj + Z (ou Ctrl + Y) : rétablir.
      // Dans un champ de texte, on laisse le navigateur annuler la frappe.
      const commande = e.metaKey || e.ctrlKey;
      const lettre = e.key.toLowerCase();
      if (commande && !dansUnChamp && (lettre === 'z' || lettre === 'y')) {
        e.preventDefault();
        if (lettre === 'y' || e.shiftKey) historique.retablir();
        else historique.annuler();
        return;
      }
      // Cmd/Ctrl + D : dupliquer l'élément sélectionné
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd' && selectionId && !dansUnChamp) {
        e.preventDefault();
        dupliquerElement(selectionId);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectionId && !dansUnChamp) {
        e.preventDefault();
        supprimerElement(selectionId);
      }
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  });

  return (
    <div className="app" onPointerDown={clicSurLeFond}>
      <EnTete
        peutAnnuler={historique.peutAnnuler}
        peutRetablir={historique.peutRetablir}
        onAnnuler={historique.annuler}
        onRetablir={historique.retablir}
        onRecommencer={recommencer}
        nomPage={page.type ? COUVERTURES[page.type] : `Page ${indexPage - premiereInterieure + 1}`}
        detailPage={nombreCases > 0 ? `${nombreCases} case${nombreCases > 1 ? 's' : ''}` : 'sans case'}
        onApercu={ouvrirApercu}
        onTelecharger={telecharger}
        onTelechargerTout={telechargerTout}
        nombrePages={pages.length}
        exportEnCours={exportEnCours}
      />
      <main className="espace-travail">
        <Scene
          pages={pages}
          indexPage={indexPage}
          format={format}
          onAllerPage={allerPage}
          onAjouterPage={ajouterPage}
          glisserVersPage={glisserVersPage}
          exportEnCours={exportEnCours}
          caseSelectionnee={caseSelectionnee}
          caseSurvolee={caseSurvolee}
          selectionId={selectionId}
          pageRef={pageRef}
          conteneurRef={conteneurRef}
          casesEnChargement={casesEnChargement
            .filter((cle) => cle.startsWith(`${page.id}:`))
            .map((cle) => Number(cle.split(':')[1]))}
          onSelectCase={choisirCase}
          onSelectElement={setSelectionId}
          onChangeElement={modifierElement}
          onChangeCases={changerPositionsCases}
          onDeselectionner={toutDeselectionner}
          editionId={editionId}
          onEditer={(id) => {
            setSelectionId(id);
            setEditionId(id);
          }}
          onFinEdition={() => setEditionId(null)}
          onDemanderImport={(index) => {
            setCaseSelectionnee(index);
            setCaseImport(index);
          }}
          glisser={glisserCase}
          barre={
            elementSelectionne &&
            !exportEnCours && (
              <BarreFlottante
                key={elementSelectionne.id}
                element={elementSelectionne}
                conteneurRef={conteneurRef}
                onChange={(modif) => modifierElement(elementSelectionne.id, modif)}
                onNouvellePhrase={() => nouvellePhrase(elementSelectionne.id)}
                onEditer={() => setEditionId(elementSelectionne.id)}
                onDupliquer={() => dupliquerElement(elementSelectionne.id)}
                onPremierPlan={() => premierPlan(elementSelectionne.id)}
                onSupprimer={() => supprimerElement(elementSelectionne.id)}
                onFermer={() => setSelectionId(null)}
              />
            )
          }
        />
        <Pellicule
          pages={pages}
          indexPage={indexPage}
          format={format}
          onAllerPage={allerPage}
          onAjouterPage={() => ajouterPage('fin')}
          onSupprimerPage={supprimerPage}
          couverturesManquantes={couverturesManquantes}
          onAjouterCouverture={ajouterCouverture}
          glisserVersPage={glisserVersPage}
        />
      </main>

      <Controles
        outil={outil}
        onOutil={setOutil}
        format={format}
        onFormat={(nouveau) => {
          // Les cases déplacées à la main sont recalculées pour le nouveau format
          historique.modifier((bd) => ({ format: nouveau, pages: bd.pages.map((p) => ({ ...p, positions: {} })) }));
        }}
        photos={photos}
        photosEnCours={photosEnCours}
        erreurImport={erreurImport}
        onAjouterPhotos={ajouterPhotos}
        onRetirerPhoto={(id) => setPhotos((liste) => liste.filter((p) => p.id !== id))}
        onPlacerPhoto={placerPhoto}
        imagesCases={page.images}
        indexPage={indexPage}
        caseSelectionnee={caseSelectionnee}
        onViderCase={viderCase}
        cadrage={cadrage}
        onDeplacerImage={deplacerImage}
        onTournerImage={tournerImage}
        onZoomerImage={zoomerImage}
        onRecentrerImage={recentrerImage}
        miseEnPageId={page.miseEnPageId}
        onChoisirMiseEnPage={(m) => changerMiseEnPage(m.rangees, m.id)}
        onMiseEnPageAleatoire={() => changerMiseEnPage(miseEnPageAleatoire(nombreCases || undefined), 'aleatoire')}
        nombreCases={nombreCases}
        penchee={estPenchee(page.rangees)}
        onPencher={pencher}
        onRedresser={redresser}
        typePage={page.type}
        fond={page.fond ?? 'aucun'}
        onFond={changerFond}
        onFondPartout={fondPartout}
        onNombreCases={changerNombreCases}
        formeCase={formeCase}
        onForme={changerForme}
        onFormePartout={formePartout}
        positionsModifiees={Object.values(page.positions ?? {}).some((p) => !p.points)}
        onReinitialiserPositions={reinitialiserPositions}
        onAjouterElement={ajouterElement}
        ratioIA={ratioIA}
        numeroCaseIA={caseCibleIA === null ? null : caseCibleIA + 1}
        onImageIA={placerImageIA}
      />

      {caseImport !== null && (
        <FenetreImport
          numeroCase={caseImport + 1}
          photos={photos}
          onFichiers={(fichiers) => importerDansCase(fichiers, caseImport)}
          onChoisir={(src) => {
            placerPhoto(src, caseImport);
            setCaseImport(null);
          }}
          onFermer={() => setCaseImport(null)}
          onIA={() => {
            setCaseImport(null);
            setOutil('ia');
          }}
        />
      )}

      {apercu && (
        <div className="modale" onClick={() => setApercu(null)}>
          <div className="modale-contenu" onClick={(e) => e.stopPropagation()}>
            {apercu === 'chargement' ? (
              <p className="chargement">Préparation de l'aperçu…</p>
            ) : (
              <img src={apercu} alt="Aperçu de ta BD" />
            )}
            <div className="modale-actions">
              <button type="button" className="btn" onClick={telecharger} disabled={apercu === 'chargement'}>
                <Download />
                Télécharger
              </button>
              <button type="button" className="btn" onClick={() => setApercu(null)}>
                <X />
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
