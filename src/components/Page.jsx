import { useMemo, useRef } from 'react';
import { ImagePlus, LoaderCircle, Move, MoveDiagonal2, Plus } from 'lucide-react';
import PageElement from './PageElement.jsx';
import {
  accepteUnFond,
  casesDeLaPage,
  contourCase,
  COUVERTURES,
  deplacerCase,
  formeDeCase,
  FORMATS,
  placerCase,
  redimensionnerCase,
} from '../data.js';

const CADRAGE_DEFAUT = { x: 50, y: 50, zoom: 1, rotation: 0 };
const FLECHES = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

// L'image tourne dans un cadre ; en rotation de 90°, le cadre échange largeur et hauteur
function ImageCadree({ src, cadrage = CADRAGE_DEFAUT }) {
  const { x, y, zoom, rotation } = cadrage;
  return (
    <div
      className={`cadre${rotation % 180 ? ' couche' : ''}`}
      style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
    >
      <img
        src={src}
        alt=""
        draggable="false"
        style={{ objectPosition: `${x}% ${y}%`, transformOrigin: `${x}% ${y}%`, transform: `scale(${zoom})` }}
      />
    </div>
  );
}

// Découpe d'une case (penchée et/ou à angles arrondis) : son contour, en % de son rectangle englobant
const decoupe = (c, contour) => `polygon(${contour.map(([x, y]) => `${((x - c.x) / c.w) * 100}% ${((y - c.y) / c.h) * 100}%`).join(', ')})`;

// Styles des contours écrits en attributs SVG (l'export en image ne lit pas le CSS des formes SVG)
const STYLES_CONTOUR = {
  bordure: { fill: 'none', stroke: '#1C1917', strokeWidth: 0.5, strokeLinejoin: 'miter' },
  repere: { fill: 'none', stroke: '#E8793A', strokeWidth: 2 },
  'repere survol': { fill: 'none', stroke: '#E8793A', strokeWidth: 2, strokeDasharray: '2 1.5' },
};

// Contour d'une case, dans le repère de la page (largeur 100, hauteur 100 / ratio)
function Contour({ points, ratio, className }) {
  return <polygon className={className} {...STYLES_CONTOUR[className]} points={points.map(([x, y]) => `${x},${y / ratio}`).join(' ')} />;
}

// Petites icônes dans les coins de la case sélectionnée : déplacer (haut gauche) et redimensionner (bas droite)
function Poignees({ boite, index, cases, ratio, pageRef, onChange }) {
  const glisse = useRef(null);

  const debut = (mode) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    // On repart toujours des cases du début du geste : revenir en arrière rend leur taille aux voisines
    glisse.current = { mode, px: e.clientX, py: e.clientY, depart: cases, page: pageRef.current.getBoundingClientRect() };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const deplace = (e) => {
    const g = glisse.current;
    if (!g) return;
    const dx = ((e.clientX - g.px) / g.page.width) * 100;
    const dy = ((e.clientY - g.py) / g.page.height) * 100;
    const avant = g.depart[index];
    const rect = g.mode === 'deplacer' ? deplacerCase(avant, dx, dy, ratio) : redimensionnerCase(avant, dx, dy, ratio);
    const nouvelles = placerCase(g.depart, index, rect, ratio);
    if (nouvelles) onChange(nouvelles);
  };

  const fin = () => {
    glisse.current = null;
  };

  const evenements = { onPointerMove: deplace, onPointerUp: fin, onPointerCancel: fin };

  return (
    <>
      <span
        className="poignee deplacer"
        style={{ left: `${boite.x}%`, top: `${boite.y}%` }}
        onPointerDown={debut('deplacer')}
        {...evenements}
        title="Déplacer la case (ou flèches du clavier)"
        aria-hidden="true"
      >
        <Move />
      </span>
      <span
        className="poignee redimensionner"
        style={{ left: `${boite.x + boite.w}%`, top: `${boite.y + boite.h}%` }}
        onPointerDown={debut('redimensionner')}
        {...evenements}
        title="Redimensionner la case (ou Maj + flèches)"
        aria-hidden="true"
      >
        <MoveDiagonal2 />
      </span>
    </>
  );
}

// Affiche une page. Sans `interactif`, c'est une simple vignette (pages voisines, pellicule).
export function PageVue({
  page,
  format,
  interactif = false,
  exportEnCours = false,
  caseSelectionnee,
  caseSurvolee,
  casesEnChargement = [],
  selectionId,
  pageRef,
  onSelectCase,
  onSelectElement,
  onChangeElement,
  onChangeCases,
  onDemanderImport,
  onDeselectionner,
  editionId,
  onEditer,
  onFinEdition,
  glisser,
}) {
  const ratio = FORMATS[format];
  const cases = useMemo(() => casesDeLaPage(page, format), [page, format]);
  const contours = cases.map((c, i) => contourCase(c, formeDeCase(page, i), ratio));
  const edition = interactif && !exportEnCours;

  // Au clavier : Entrée ouvre l'import (case vide), flèches déplacent la case, Maj + flèches la redimensionnent
  const clavierCase = (e, i) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectCase(i);
      if (!page.images[i]) onDemanderImport(i);
      return;
    }
    const fleche = FLECHES[e.key];
    if (!fleche || i !== caseSelectionnee) return;
    e.preventDefault();
    const [dx, dy] = fleche;
    const rect = e.shiftKey ? redimensionnerCase(cases[i], dx, dy, ratio) : deplacerCase(cases[i], dx, dy, ratio);
    const nouvelles = placerCase(cases, i, rect, ratio);
    if (nouvelles) onChangeCases(nouvelles);
  };

  return (
    <div
      ref={pageRef}
      className={`page ${format}${exportEnCours ? ' export' : ''}${interactif ? '' : ' lecture-seule'}`}
      onPointerDown={interactif ? onDeselectionner : undefined}
    >
      {accepteUnFond(page) && page.fond !== 'aucun' && <div className={`fond-page fond-${page.fond}`} aria-hidden="true" />}

      {/* Couverture sans case : repère + bouton (ou dépôt) pour y mettre une image */}
      {edition && page.type && cases.length === 0 && (
        <div
          className="repere-couverture"
          onDragOver={(e) => glisser.survol(e, 0)}
          onDrop={(e) => glisser.depot(e, 0)}
        >
          {page.elements.length === 0 && <p>{COUVERTURES[page.type]}</p>}
          <button
            type="button"
            className="case-ajout couverture-ajout"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDemanderImport(0)}
          >
            <ImagePlus />
            <span>Ajouter une image</span>
          </button>
        </div>
      )}

      {cases.map((boite, i) => {
        const image = page.images[i];
        const forme = formeDeCase(page, i);
        const enChargement = casesEnChargement.includes(i);
        const classes = ['case', `forme-${forme}`, interactif && i === caseSelectionnee && 'active', interactif && i === caseSurvolee && 'survol']
          .filter(Boolean)
          .join(' ');
        return (
          <div
            key={i}
            className={classes}
            style={{
              left: `${boite.x}%`,
              top: `${boite.y}%`,
              width: `${boite.w}%`,
              height: `${boite.h}%`,
              clipPath: decoupe(boite, contours[i]),
            }}
            {...(interactif && {
              tabIndex: 0,
              role: 'button',
              'aria-label': `Case ${i + 1}, ${image ? 'avec une image' : 'vide'}${i === caseSelectionnee ? ', sélectionnée' : ''}`,
              'aria-pressed': i === caseSelectionnee,
              draggable: Boolean(image),
              onPointerDown: (e) => {
                // La case reste sélectionnée : on ne laisse pas le clic remonter jusqu'au fond de la page
                e.stopPropagation();
                onSelectElement(null);
                onSelectCase(i);
              },
              onKeyDown: (e) => clavierCase(e, i),
              onDragStart: (e) => glisser.debut(e, i),
              onDragOver: (e) => glisser.survol(e, i),
              onDragLeave: (e) => glisser.sortie(e, i),
              onDrop: (e) => glisser.depot(e, i),
            })}
          >
            {image && <ImageCadree src={image} cadrage={page.cadrages[i]} />}
            {edition && enChargement && (
              <span className="case-vide" role="status">
                <LoaderCircle className="tourne" />
                Effet BD…
              </span>
            )}
            {edition && !image && !enChargement && (
              <button
                type="button"
                className="case-ajout"
                tabIndex={-1}
                aria-label="Ajouter une image"
                title="Ajouter une image"
                onClick={(e) => {
                  e.stopPropagation();
                  onDemanderImport(i);
                }}
              >
                <ImagePlus />
                <span className="case-ajout-texte">Ajouter une image</span>
              </button>
            )}
          </div>
        );
      })}

      {/* Bordures des cases (elles suivent les coupes penchées) et repères de sélection */}
      <svg className="traits-cases" viewBox={`0 0 100 ${100 / ratio}`} preserveAspectRatio="none" aria-hidden="true">
        {edition &&
          contours.map((points, i) =>
            i === caseSelectionnee || i === caseSurvolee ? (
              <Contour key={`repere-${i}`} points={points} ratio={ratio} className={i === caseSurvolee ? 'repere survol' : 'repere'} />
            ) : null
          )}
        {contours.map((points, i) => (
          <Contour key={i} points={points} ratio={ratio} className="bordure" />
        ))}
      </svg>

      {edition && cases[caseSelectionnee] && (
        <Poignees
          boite={cases[caseSelectionnee]}
          index={caseSelectionnee}
          cases={cases}
          ratio={ratio}
          pageRef={pageRef}
          onChange={onChangeCases}
        />
      )}

      {page.elements.map((el) => (
        <PageElement
          key={el.id}
          element={el}
          interactif={interactif}
          selectionne={interactif && el.id === selectionId}
          enEdition={interactif && el.id === editionId}
          pageRef={pageRef}
          onSelect={onSelectElement}
          onChange={onChangeElement}
          onEditer={onEditer}
          onFinEdition={onFinEdition}
        />
      ))}

      {/* Signature de l'autrice : sur toutes les pages, non modifiable */}
      <span className="signature" aria-hidden="true">
        Celia BD
      </span>
    </div>
  );
}

// Page voisine : on n'en voit qu'un tiers ; un clic permet d'y aller
function Voisine({ cote, page, format, onAller, glisserVersPage }) {
  if (!page) return <div className={`voisine ${cote} vide`} />;
  return (
    <button
      type="button"
      className={`voisine ${cote}`}
      onClick={onAller}
      onDragOver={glisserVersPage.survol}
      onDrop={glisserVersPage.depot}
      aria-label={cote === 'precedente' ? 'Aller à la page précédente' : 'Aller à la page suivante'}
    >
      <PageVue page={page} format={format} />
    </button>
  );
}

function Scene({ pages, indexPage, format, onAllerPage, onAjouterPage, glisserVersPage, barre, conteneurRef, ...propsPage }) {
  const page = pages[indexPage];

  return (
    <section className="scene" aria-label="Pages de la BD">
      <div className="scene-interieur">
        <div className={`carrousel ${format}`}>
          <Voisine
            cote="precedente"
            page={pages[indexPage - 1]}
            format={format}
            onAller={() => onAllerPage(indexPage - 1)}
            glisserVersPage={glisserVersPage(indexPage - 1)}
          />
          <div className="zone-plus">
            <button type="button" className="btn-plus" onClick={() => onAjouterPage('avant')} aria-label="Ajouter une page avant" title="Ajouter une page avant">
              <Plus />
            </button>
          </div>

          <div className="page-principale" key={page.id} ref={conteneurRef}>
            <PageVue page={page} format={format} interactif {...propsPage} />
            {barre}
          </div>

          <div className="zone-plus">
            <button type="button" className="btn-plus" onClick={() => onAjouterPage('apres')} aria-label="Ajouter une page après" title="Ajouter une page après">
              <Plus />
            </button>
          </div>
          <Voisine
            cote="suivante"
            page={pages[indexPage + 1]}
            format={format}
            onAller={() => onAllerPage(indexPage + 1)}
            glisserVersPage={glisserVersPage(indexPage + 1)}
          />
        </div>
      </div>
    </section>
  );
}

export default Scene;
