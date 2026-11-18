import { useLayoutEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BringToFront,
  ChevronDown,
  Copy,
  Italic,
  Bold,
  MessageCircle,
  Minus,
  Pencil,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { COULEURS, COULEURS_ENCADRE, COULEURS_TEXTE, EPAISSEURS_BORD, FORMES_BULLE, QUEUES, styleParDefaut } from '../data.js';
import { famillePolice, GRAISSES, POLICE_PAR_DEFAUT, POLICES } from '../polices.js';

const NOMS = {
  parole: 'la bulle',
  arrondie: 'la bulle',
  boite: 'la bulle',
  chuchotement: 'la bulle',
  pensee: 'la bulle de pensée',
  cri: 'la bulle de cri',
  narration: "l'encadré",
  libre: 'le texte',
};
const COULEURS_BORD = ['#1C1917', '#FFFFFF', '#C0392B', '#1F5FA8', '#2E7D32', '#7B3FA0', '#E8793A'];
const ALIGNEMENTS = [
  { id: 'left', nom: 'À gauche', Icone: AlignLeft },
  { id: 'center', nom: 'Centré', Icone: AlignCenter },
  { id: 'right', nom: 'À droite', Icone: AlignRight },
];
const NOMS_EPAISSEUR = { fin: 'Fin', normal: 'Normal', epais: 'Épais' };

// Pastilles de couleur + roue chromatique (sélecteur de couleur libre)
function ChoixCouleur({ titre, valeur, palette, onChoisir }) {
  return (
    <div className="choix">
      <span className="choix-titre">{titre}</span>
      <div className="nuancier" role="group" aria-label={titre}>
        {palette.map((c) => (
          <button
            key={c}
            type="button"
            className={`pastille${valeur?.toLowerCase() === c.toLowerCase() ? ' actif' : ''}`}
            style={{ background: c }}
            onClick={() => onChoisir(c)}
            aria-label={`${titre} : ${c}`}
            aria-pressed={valeur?.toLowerCase() === c.toLowerCase()}
          />
        ))}
        <label className="roue" title="Couleur personnalisée">
          <span className="visuellement-cache">{titre} : couleur personnalisée</span>
          <input type="color" value={valeur} onChange={(e) => onChoisir(e.target.value)} />
        </label>
      </div>
    </div>
  );
}

// Choix parmi quelques options (boutons côte à côte)
function Segments({ titre, options, valeur, onChoisir }) {
  return (
    <div className="choix">
      <span className="choix-titre">{titre}</span>
      <div className="segments" role="radiogroup" aria-label={titre}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={valeur === o.id}
            className={`segment${valeur === o.id ? ' actif' : ''}`}
            onClick={() => onChoisir(o.id)}
            title={o.nom}
          >
            {o.Icone ? <o.Icone aria-hidden="true" /> : o.contenu ?? o.nom}
            {o.Icone && <span className="visuellement-cache">{o.nom}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// Barre d'outils qui flotte au-dessus de l'élément sélectionné sur la page
function BarreFlottante({ element, conteneurRef, onChange, onNouvellePhrase, onEditer, onDupliquer, onPremierPlan, onSupprimer, onFermer }) {
  const barreRef = useRef(null);
  const [panneau, setPanneau] = useState(null);
  const style = { ...styleParDefaut(element), ...element };
  const { type, variante } = element;
  const estOnomato = type === 'onomato';
  const estBulle = type === 'bulle';
  const aUnFond = estBulle || variante === 'narration';
  const nom = estOnomato ? "l'onomatopée" : NOMS[variante];
  const police = style.police ?? POLICE_PAR_DEFAUT[type];
  const taille = Math.round(element.taille * 10);

  // Place la barre au-dessus de l'élément (ou en dessous), sans sortir de la zone de travail
  useLayoutEffect(() => {
    const conteneur = conteneurRef.current;
    const barre = barreRef.current;
    const noeud = conteneur?.querySelector(`[data-element-id="${element.id}"]`);
    if (!conteneur || !barre || !noeud) return;
    const zone = conteneur.getBoundingClientRect();
    const scene = conteneur.closest('.scene')?.getBoundingClientRect() ?? zone;
    const cible = noeud.getBoundingClientRect();
    const largeur = barre.offsetWidth;
    const centre = cible.left + cible.width / 2;
    const gauche = Math.min(Math.max(centre, scene.left + largeur / 2 + 8), scene.right - largeur / 2 - 8) - zone.left;
    const enDessous = cible.top - scene.top < barre.offsetHeight + 20;
    barre.style.left = `${gauche}px`;
    barre.style.top = `${(enDessous ? cible.bottom + 14 : cible.top - 14) - zone.top}px`;
    barre.dataset.cote = enDessous ? 'dessous' : 'dessus';
  });

  const basculer = (nom) => setPanneau((ouvert) => (ouvert === nom ? null : nom));
  const changerTaille = (valeur) => onChange({ taille: Math.min(25, Math.max(1, valeur / 10)) });

  const fermerPanneau = (e) => {
    if (e.key === 'Escape' && panneau) {
      e.preventDefault();
      e.stopPropagation();
      setPanneau(null);
    }
  };

  return (
    <div
      ref={barreRef}
      className="barre-flottante"
      role="toolbar"
      aria-label={`Modifier ${nom}`}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={fermerPanneau}
    >
      <div className="barre-ligne">
        <button type="button" className="barre-btn" onClick={onEditer} title="Modifier le texte (double-clic)" aria-label="Modifier le texte">
          <Pencil />
        </button>
        {!estOnomato && (
          <button type="button" className="barre-btn" onClick={onNouvellePhrase} title="Nouvelle phrase liée à l'image" aria-label="Nouvelle phrase liée à l'image">
            <Sparkles />
          </button>
        )}

        <span className="barre-separateur" aria-hidden="true" />

        <button
          type="button"
          className={`barre-btn barre-police${panneau === 'police' ? ' ouvert' : ''}`}
          onClick={() => basculer('police')}
          aria-expanded={panneau === 'police'}
          aria-label="Police"
          title="Police"
          style={{ fontFamily: famillePolice(police) }}
        >
          {POLICES.find((p) => p.id === police)?.nom ?? 'Police'}
          <ChevronDown aria-hidden="true" />
        </button>

        <div className="barre-taille" role="group" aria-label="Taille du texte">
          <button type="button" className="barre-btn" onClick={() => changerTaille(taille - 2)} aria-label="Plus petit" title="Plus petit">
            <Minus />
          </button>
          <label>
            <span className="visuellement-cache">Taille</span>
            <input
              type="number"
              min="10"
              max="250"
              value={taille}
              onChange={(e) => e.target.value && changerTaille(Number(e.target.value))}
            />
          </label>
          <button type="button" className="barre-btn" onClick={() => changerTaille(taille + 2)} aria-label="Plus grand" title="Plus grand">
            <Plus />
          </button>
        </div>

        <button
          type="button"
          className={`barre-btn${style.graisse >= 700 ? ' actif' : ''}`}
          onClick={() => onChange({ graisse: style.graisse >= 700 ? 400 : 700 })}
          aria-pressed={style.graisse >= 700}
          aria-label="Gras"
          title="Gras"
        >
          <Bold />
        </button>
        <button
          type="button"
          className={`barre-btn${style.italique ? ' actif' : ''}`}
          onClick={() => onChange({ italique: !style.italique })}
          aria-pressed={style.italique}
          aria-label="Italique"
          title="Italique"
        >
          <Italic />
        </button>

        <button
          type="button"
          className={`barre-btn${panneau === 'forme' ? ' ouvert' : ''}`}
          onClick={() => basculer('forme')}
          aria-expanded={panneau === 'forme'}
          aria-label="Mise en forme : lignes, alignement, espacement, rotation"
          title="Mise en forme"
        >
          <SlidersHorizontal />
        </button>

        <button
          type="button"
          className={`barre-btn${panneau === 'couleur' ? ' ouvert' : ''}`}
          onClick={() => basculer('couleur')}
          aria-expanded={panneau === 'couleur'}
          aria-label="Couleurs"
          title="Couleurs"
        >
          <span className="pastille-actuelle" style={{ background: style.couleur }} />
        </button>

        {estBulle && (
          <button
            type="button"
            className={`barre-btn${panneau === 'bulle' ? ' ouvert' : ''}`}
            onClick={() => basculer('bulle')}
            aria-expanded={panneau === 'bulle'}
            aria-label="Forme de la bulle"
            title="Forme de la bulle"
          >
            <MessageCircle />
          </button>
        )}

        <span className="barre-separateur" aria-hidden="true" />

        <button type="button" className="barre-btn" onClick={onPremierPlan} aria-label="Mettre au premier plan" title="Premier plan">
          <BringToFront />
        </button>
        <button type="button" className="barre-btn" onClick={onDupliquer} aria-label="Dupliquer" title="Dupliquer">
          <Copy />
        </button>
        <button type="button" className="barre-btn danger" onClick={onSupprimer} aria-label={`Supprimer ${nom}`} title="Supprimer (Suppr)">
          <Trash2 />
        </button>
        <button type="button" className="barre-btn" onClick={onFermer} aria-label="Fermer la barre" title="Fermer (Échap)">
          <X />
        </button>
      </div>

      {panneau === 'police' && (
        <div className="barre-panneau polices" role="listbox" aria-label="Polices">
          {POLICES.map((p) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={police === p.id}
              className={`police-choix${police === p.id ? ' actif' : ''}`}
              onClick={() => onChange({ police: p.id })}
            >
              <span style={{ fontFamily: p.famille }}>{p.nom}</span>
              <small>{p.style}</small>
            </button>
          ))}
        </div>
      )}

      {panneau === 'forme' && (
        <div className="barre-panneau">
          <Segments
            titre="Nombre de lignes"
            options={[{ id: 0, nom: 'Auto' }, 1, 2, 3, 4, 5].map((o) => (typeof o === 'number' ? { id: o, nom: String(o) } : o))}
            valeur={style.lignes}
            onChoisir={(lignes) => onChange({ lignes })}
          />
          <Segments titre="Alignement" options={ALIGNEMENTS} valeur={style.alignement} onChoisir={(alignement) => onChange({ alignement })} />
          <Segments
            titre="Graisse"
            options={GRAISSES.map((g) => ({ id: g.valeur, nom: g.nom }))}
            valeur={style.graisse}
            onChoisir={(graisse) => onChange({ graisse })}
          />
          <label className="choix">
            <span className="choix-titre">
              Espacement des lettres <output>{Math.round(style.espacement * 100)}</output>
            </span>
            <input
              type="range"
              min="-0.05"
              max="0.3"
              step="0.01"
              value={style.espacement}
              onChange={(e) => onChange({ espacement: Number(e.target.value) })}
            />
          </label>
          <label className="choix">
            <span className="choix-titre">
              Rotation <output>{element.rotation}°</output>
              <button type="button" className="lien" onClick={() => onChange({ rotation: 0 })}>
                Remettre droit
              </button>
            </span>
            <input type="range" min="-45" max="45" value={element.rotation} onChange={(e) => onChange({ rotation: Number(e.target.value) })} />
          </label>
        </div>
      )}

      {panneau === 'couleur' && (
        <div className="barre-panneau">
          <ChoixCouleur
            titre={estOnomato ? 'Remplissage' : 'Texte'}
            valeur={style.couleur}
            palette={estOnomato ? COULEURS : COULEURS_TEXTE}
            onChoisir={(couleur) => onChange({ couleur })}
          />
          {aUnFond && <ChoixCouleur titre="Fond" valeur={style.fond} palette={COULEURS_ENCADRE} onChoisir={(fond) => onChange({ fond })} />}
          {(aUnFond || estOnomato) && (
            <ChoixCouleur titre={estOnomato ? 'Contour' : 'Bordure'} valeur={style.bord} palette={COULEURS_BORD} onChoisir={(bord) => onChange({ bord })} />
          )}
        </div>
      )}

      {panneau === 'bulle' && (
        <div className="barre-panneau">
          <Segments
            titre="Forme"
            options={FORMES_BULLE.map((f) => ({ ...f, contenu: <span className={`mini-bulle ${f.id}`} aria-hidden="true" /> }))}
            valeur={variante}
            onChoisir={(v) => onChange({ variante: v })}
          />
          <Segments
            titre="Queue"
            options={QUEUES.map((q) => ({ ...q, contenu: <span className={`mini-queue ${q.id}`} aria-hidden="true" /> }))}
            valeur={element.queue === 'gauche' ? 'bas-gauche' : element.queue === 'droite' ? 'bas-droite' : element.queue ?? 'bas-gauche'}
            onChoisir={(queue) => onChange({ queue })}
          />
          <Segments
            titre="Épaisseur du trait"
            options={Object.keys(EPAISSEURS_BORD).map((id) => ({ id, nom: NOMS_EPAISSEUR[id] }))}
            valeur={style.epaisseur}
            onChoisir={(epaisseur) => onChange({ epaisseur })}
          />
        </div>
      )}
    </div>
  );
}

export default BarreFlottante;
