import { useEffect, useRef } from 'react';
import { famillePolice, POLICE_PAR_DEFAUT } from '../polices.js';
import { EPAISSEURS_BORD, styleParDefaut } from '../data.js';

const borne = (valeur) => Math.min(100, Math.max(0, valeur));

// Étoile à pointes pour la bulle "cri"
const POINTES = 28;
const POINTS_CRI = Array.from({ length: POINTES }, (_, i) => {
  const angle = (i / POINTES) * Math.PI * 2;
  const rayon = i % 2 === 0 ? 50 : 38;
  return `${50 + Math.cos(angle) * rayon},${50 + Math.sin(angle) * rayon}`;
}).join(' ');

const NOMS = {
  parole: 'Bulle',
  arrondie: 'Bulle arrondie',
  boite: 'Bulle rectangulaire',
  chuchotement: 'Bulle chuchotée',
  pensee: 'Bulle de pensée',
  cri: 'Bulle de cri',
  narration: 'Encadré',
  libre: 'Texte',
};
const RAYONS = { parole: '50%', pensee: '50%', chuchotement: '50%', arrondie: '0.9em', boite: '0.12em' };
const FLECHES = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

// Les anciennes valeurs "gauche" / "droite" désignent une queue en bas
const normaliserQueue = (queue) => (queue === 'gauche' ? 'bas-gauche' : queue === 'droite' ? 'bas-droite' : queue ?? 'bas-gauche');

// Répartit le texte en `n` lignes de longueurs proches (0 = laisser le texte tel quel)
export function repartirLignes(texte, n) {
  if (!n) return texte;
  const mots = texte.replace(/\s+/g, ' ').trim().split(' ');
  if (n <= 1 || mots.length <= 1) return mots.join(' ');
  const cible = mots.join(' ').length / n;
  const lignes = [[]];
  let longueur = 0;
  for (const mot of mots) {
    const nouvelleLigne = lignes.at(-1).length > 0 && longueur + mot.length / 2 > cible && lignes.length < n;
    if (nouvelleLigne) {
      lignes.push([mot]);
      longueur = mot.length + 1;
    } else {
      lignes.at(-1).push(mot);
      longueur += mot.length + 1;
    }
  }
  return lignes.map((l) => l.join(' ')).join('\n');
}

// Queue de bulle : triangle rempli de la couleur de la bulle, bordé sur ses deux côtés
function Queue({ position, fond, bord, epaisseur }) {
  const debut = 15 * epaisseur; // les traits commencent au bord extérieur de la bulle
  const gauche = (3 * debut) / 20;
  const droite = 14 - (11 * debut) / 20;
  return (
    <svg
      className={`queue ${position}`}
      viewBox="0 0 16 20"
      style={{ '--recouvrement': `${epaisseur * 0.5}em` }}
      aria-hidden="true"
    >
      <polygon points="0,0 14,0 3,20" fill={fond} />
      <polyline
        points={`${gauche},${debut} 3,20 ${droite},${debut}`}
        fill="none"
        stroke={bord}
        strokeWidth={epaisseur * 10}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PageElement({ element, selectionne, interactif, enEdition, pageRef, onSelect, onChange, onEditer, onFinEdition }) {
  const glisse = useRef(null);
  const texteRef = useRef(null);
  const editionTerminee = useRef(false);
  const { type, variante } = element;
  const style = { ...styleParDefaut(element), ...element };

  // Édition directe : on place le curseur dans le texte et on sélectionne tout
  useEffect(() => {
    if (!enEdition || !texteRef.current) return;
    editionTerminee.current = false;
    const noeud = texteRef.current;
    noeud.textContent = element.texte;
    noeud.focus();
    const selection = window.getSelection();
    const plage = document.createRange();
    plage.selectNodeContents(noeud);
    selection.removeAllRanges();
    selection.addRange(plage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enEdition]);

  // Une seule fin d'édition (Entrée ou Échap, puis la perte de focus qui suit)
  const terminerEdition = (garder) => {
    if (editionTerminee.current) return;
    editionTerminee.current = true;
    const texte = texteRef.current?.innerText.trim();
    if (garder && texte && texte !== element.texte) onChange(element.id, { texte, texteAuto: false });
    onFinEdition();
  };

  const debut = (e) => {
    e.stopPropagation();
    if (enEdition) return;
    onSelect(element.id);
    glisse.current = {
      px: e.clientX,
      py: e.clientY,
      x: element.x,
      y: element.y,
      rect: pageRef.current.getBoundingClientRect(),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const deplace = (e) => {
    const g = glisse.current;
    if (!g) return;
    onChange(element.id, {
      x: borne(g.x + ((e.clientX - g.px) / g.rect.width) * 100),
      y: borne(g.y + ((e.clientY - g.py) / g.rect.height) * 100),
    });
  };

  const fin = () => {
    glisse.current = null;
  };

  // Clavier : Entrée = sélectionner puis modifier le texte, flèches = déplacer (Maj = plus vite),
  // + / − = taille, [ / ] = rotation
  const clavier = (e) => {
    if (enEdition) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        terminerEdition(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        terminerEdition(false);
      }
      e.stopPropagation();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (selectionne) onEditer(element.id);
      else onSelect(element.id);
      return;
    }
    if (!selectionne) return;
    const fleche = FLECHES[e.key];
    if (fleche) {
      e.preventDefault();
      const pas = e.shiftKey ? 5 : 1;
      onChange(element.id, { x: borne(element.x + fleche[0] * pas), y: borne(element.y + fleche[1] * pas) });
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      onChange(element.id, { taille: Math.min(25, +(element.taille * 1.1).toFixed(2)) });
    } else if (e.key === '-') {
      e.preventDefault();
      onChange(element.id, { taille: Math.max(1, +(element.taille / 1.1).toFixed(2)) });
    } else if (e.key === '[' || e.key === ']') {
      e.preventDefault();
      onChange(element.id, { rotation: Math.max(-180, Math.min(180, element.rotation + (e.key === ']' ? 5 : -5))) });
    }
  };

  const epaisseur = EPAISSEURS_BORD[style.epaisseur] ?? EPAISSEURS_BORD.normal;
  const queue = normaliserQueue(element.queue);
  const estBulle = type === 'bulle';
  const avecCorps = estBulle && variante !== 'cri';
  const nom = type === 'onomato' ? 'Onomatopée' : NOMS[variante];

  const styleCorps = {
    left: `${element.x}%`,
    top: `${element.y}%`,
    fontSize: `${element.taille}cqw`,
    transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
    fontFamily: famillePolice(style.police ?? POLICE_PAR_DEFAUT[type]),
    fontWeight: style.graisse,
    fontStyle: style.italique ? 'italic' : 'normal',
    textAlign: style.alignement,
    letterSpacing: `${style.espacement ?? 0}em`,
    '--couleur': style.couleur,
  };
  if (avecCorps || variante === 'narration') {
    styleCorps.background = style.fond;
    styleCorps.border = `${epaisseur}em ${variante === 'chuchotement' ? 'dashed' : 'solid'} ${style.bord}`;
    if (avecCorps) styleCorps.borderRadius = RAYONS[variante] ?? '50%';
  }
  if (type === 'onomato') styleCorps['--contour'] = style.bord;

  const classes = ['el', `type-${type}`, variante, selectionne && 'selectionne', enEdition && 'en-edition'].filter(Boolean).join(' ');
  const texteAffiche = repartirLignes(element.texte, style.lignes);

  return (
    <div
      className={classes}
      style={styleCorps}
      data-element-id={element.id}
      {...(interactif && {
        tabIndex: 0,
        role: 'button',
        'aria-label': `${nom} : ${element.texte}. Double-clic ou Entrée pour modifier le texte.`,
        'aria-pressed': selectionne,
        onPointerDown: debut,
        onPointerMove: deplace,
        onPointerUp: fin,
        onPointerCancel: fin,
        onKeyDown: clavier,
        onDoubleClick: (e) => {
          e.stopPropagation();
          onEditer(element.id);
        },
      })}
    >
      {variante === 'cri' && (
        <svg className="fond-cri" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polygon
            points={POINTS_CRI}
            fill={style.fond}
            stroke={style.bord}
            strokeWidth={{ fin: 2, normal: 3, epais: 5 }[style.epaisseur] ?? 3}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {enEdition ? (
        <span
          ref={texteRef}
          className="el-texte"
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onBlur={() => terminerEdition(true)}
        />
      ) : (
        <span className="el-texte">{texteAffiche}</span>
      )}
      {estBulle && queue !== 'aucune' && ['parole', 'arrondie', 'boite', 'chuchotement'].includes(variante) && (
        <Queue position={queue} fond={style.fond} bord={style.bord} epaisseur={epaisseur} />
      )}
      {variante === 'pensee' && queue !== 'aucune' && (
        <span className={`ronds ${queue}`} aria-hidden="true">
          <span className="rond r1" style={{ background: style.fond, borderColor: style.bord, borderWidth: `${epaisseur}em` }} />
          <span className="rond r2" style={{ background: style.fond, borderColor: style.bord, borderWidth: `${epaisseur}em` }} />
        </span>
      )}
    </div>
  );
}

export default PageElement;
