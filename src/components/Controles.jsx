import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Crosshair,
  RotateCcw,
  Undo2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  CopyCheck,
  Grid2x2,
  Images,
  LayoutGrid,
  MessageCircle,
  PaintBucket,
  Minus,
  Plus,
  RectangleHorizontal,
  RectangleVertical,
  Shuffle,
  Slash,
  Sparkles,
  Type,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import {
  BULLES,
  calculerCases,
  FONDS,
  FORMATS,
  FORMES,
  MISES_EN_PAGE,
  NOMBRE_CASES_MAX,
  ONOMATOPEES,
  TEXTES,
} from '../data.js';

export const TYPE_PHOTO = 'application/x-bd-photo';

const OUTILS = [
  { id: 'galerie', nom: 'Galerie photos', court: 'Photos', Icone: Images },
  { id: 'textes', nom: 'Textes', court: 'Textes', Icone: Type },
  { id: 'bulles', nom: 'Bulles de texte', court: 'Bulles', Icone: MessageCircle },
  { id: 'cases', nom: 'Cases', court: 'Cases', Icone: LayoutGrid },
  { id: 'onomatopees', nom: 'Onomatopées', court: 'Sons', Icone: Zap },
  { id: 'fond', nom: 'Fond de page', court: 'Fond', Icone: PaintBucket },
  { id: 'format', nom: 'Format', court: 'Format', Icone: RectangleVertical },
];

const MESSAGE_FOND = 'Le fond de croquis se choisit pour la 2e et la 3e de couverture. Va sur l’une de ces pages pour le changer.';

function MiniPage({ rangees, format }) {
  const ratio = FORMATS[format];
  const cases = calculerCases(rangees, ratio);
  return (
    <svg className={`mini-page ${format}`} viewBox={`0 0 100 ${100 / ratio}`} aria-hidden="true">
      {cases.map((c, i) => (
        <polygon key={i} points={c.points.map(([x, y]) => `${x},${y / ratio}`).join(' ')} />
      ))}
    </svg>
  );
}

function Cadrage({ cadrage, onDeplacer, onTourner, onZoomer, onRecentrer }) {
  return (
    <div className="cadrage">
      <span className="cadrage-titre">Orientation de l'image</span>
      <div className="cadrage-outils">
        <div className="pave">
          <button type="button" className="btn fleche haut" onClick={() => onDeplacer(0, -1)} aria-label="Déplacer vers le haut">
            <ArrowUp />
          </button>
          <button type="button" className="btn fleche gauche" onClick={() => onDeplacer(-1, 0)} aria-label="Déplacer vers la gauche">
            <ArrowLeft />
          </button>
          <button type="button" className="btn fleche centre" onClick={onRecentrer} aria-label="Recentrer l'image" title="Recentrer">
            <Crosshair />
          </button>
          <button type="button" className="btn fleche droite" onClick={() => onDeplacer(1, 0)} aria-label="Déplacer vers la droite">
            <ArrowRight />
          </button>
          <button type="button" className="btn fleche bas" onClick={() => onDeplacer(0, 1)} aria-label="Déplacer vers le bas">
            <ArrowDown />
          </button>
        </div>
        <div className="cadrage-reglages">
          <div className="duo">
            <button type="button" className="btn fleche" onClick={() => onTourner(-1)} aria-label="Pivoter à gauche" title="Pivoter à gauche">
              <RotateCcw />
            </button>
            <button type="button" className="btn fleche" onClick={() => onTourner(1)} aria-label="Pivoter à droite" title="Pivoter à droite">
              <RotateCw />
            </button>
          </div>
          <div className="duo">
            <button type="button" className="btn fleche" onClick={() => onZoomer(-0.25)} disabled={cadrage.zoom <= 1} aria-label="Dézoomer" title="Dézoomer">
              <ZoomOut />
            </button>
            <button type="button" className="btn fleche" onClick={() => onZoomer(0.25)} disabled={cadrage.zoom >= 3} aria-label="Zoomer" title="Zoomer">
              <ZoomIn />
            </button>
          </div>
          <span className="zoom-valeur">Zoom ×{cadrage.zoom}</span>
        </div>
      </div>
    </div>
  );
}

function Galerie({ photos, photosEnCours, erreurImport, onAjouterPhotos, onRetirerPhoto, onPlacerPhoto, indexPage, caseSelectionnee, caseAUneImage, onViderCase, cadrage, onDeplacer, onTourner, onZoomer, onRecentrer }) {
  const importer = (e) => {
    onAjouterPhotos([...e.target.files]);
    e.target.value = '';
  };

  return (
    <>
      <label className="btn large">
        <Upload />
        Importer des photos
        <input className="visuellement-cache" type="file" accept="image/*,.heic,.heif" multiple onChange={importer} />
      </label>

      {photosEnCours > 0 && (
        <p className="traitement" role="status">
          <Sparkles />
          Effet BD en cours… ({photosEnCours})
        </p>
      )}

      {erreurImport && (
        <p className="erreur" role="alert">
          {erreurImport}
        </p>
      )}

      {photos.length === 0 ? (
        <p className="aide">
          Importe des images : elles sont automatiquement transformées en dessin de BD. Glisse-les ensuite sur une case,
          ou clique au centre d'une case vide pour lui choisir une image.
        </p>
      ) : (
        <div className="galerie">
          {photos.map((photo) => (
            <div key={photo.id} className="vignette">
              <button
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(TYPE_PHOTO, photo.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => onPlacerPhoto(photo.src)}
                aria-label="Placer dans la case sélectionnée"
                title="Glisse-moi sur une case, ou clique pour remplir la case sélectionnée"
              >
                <img src={photo.src} alt="" />
              </button>
              <button type="button" className="retirer" onClick={() => onRetirerPhoto(photo.id)} aria-label="Supprimer la photo">
                <X />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="info-case">
        <span>
          Page {indexPage + 1} · {caseSelectionnee === null ? 'aucune case sélectionnée' : `case n°${caseSelectionnee + 1}`}
        </span>
        {caseAUneImage && (
          <button type="button" className="lien" onClick={onViderCase}>
            Vider la case
          </button>
        )}
      </div>

      {caseAUneImage ? (
        <Cadrage cadrage={cadrage} onDeplacer={onDeplacer} onTourner={onTourner} onZoomer={onZoomer} onRecentrer={onRecentrer} />
      ) : (
        photos.length > 0 && <p className="aide">Place une photo dans la case pour régler son orientation.</p>
      )}
    </>
  );
}

function ListeAjout({ modeles, onAjouter, apercu }) {
  return (
    <div className="grille-2">
      {modeles.map((m) => (
        <button key={m.nom} type="button" className="btn modele" onClick={() => onAjouter(m.element)}>
          {apercu(m)}
          <span>{m.nom}</span>
        </button>
      ))}
    </div>
  );
}

function Cases({ minimum, format, penchee, onPencher, onRedresser, miseEnPageId, nombreCases, onNombreCases, onChoisir, onAleatoire, caseSelectionnee, forme, onForme, onFormePartout, positionsModifiees, onReinitialiserPositions }) {
  return (
    <>
      <div className="section">
        <span className="section-titre">Nombre de cases</span>
        <div className="compteur">
          <button
            type="button"
            className="btn fleche"
            onClick={() => onNombreCases(nombreCases - 1)}
            disabled={nombreCases <= minimum}
            aria-label="Une case de moins"
          >
            <Minus />
          </button>
          <output className="compteur-valeur" aria-live="polite">
            {nombreCases}
          </output>
          <button
            type="button"
            className="btn fleche"
            onClick={() => onNombreCases(nombreCases + 1)}
            disabled={nombreCases >= NOMBRE_CASES_MAX}
            aria-label="Une case de plus"
          >
            <Plus />
          </button>
        </div>
        <div className="grille-2">
          <button
            type="button"
            className={`btn petit${miseEnPageId === 'grille' ? ' actif' : ''}`}
            onClick={() => onNombreCases(nombreCases, 'grille')}
          >
            <Grid2x2 />
            Grille régulière
          </button>
          <button
            type="button"
            className={`btn petit${miseEnPageId === 'aleatoire' ? ' actif' : ''}`}
            onClick={onAleatoire}
          >
            <Shuffle />
            Aléatoire
          </button>
        </div>
        {nombreCases > 1 && (
          <div className="grille-2">
            <button type="button" className="btn petit" onClick={onPencher}>
              <Slash />
              {penchee ? 'Autres coupes' : 'Pencher les coupes'}
            </button>
            <button type="button" className="btn petit" onClick={onRedresser} disabled={!penchee}>
              <Grid2x2 />
              Redresser
            </button>
          </div>
        )}
        <p className="aide">
          Sur la page, la case sélectionnée a deux poignées : en haut à gauche pour la déplacer, en bas à droite pour
          changer sa taille. Au clavier : flèches pour déplacer, Maj + flèches pour la taille.
        </p>
        {positionsModifiees && (
          <button type="button" className="btn petit" onClick={onReinitialiserPositions}>
            <Undo2 />
            Remettre les cases en grille
          </button>
        )}
      </div>

      <div className="section">
        <span className="section-titre">
          {caseSelectionnee === null ? 'Forme de toutes les cases' : `Forme de la case n°${caseSelectionnee + 1}`}
        </span>
        <div className="formes">
          {FORMES.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`btn modele${forme === f.id ? ' actif' : ''}`}
              onClick={() => onForme(f.id)}
            >
              <span className={`forme-apercu ${f.id}`} />
              <span>{f.nom}</span>
            </button>
          ))}
        </div>
        {caseSelectionnee !== null && (
          <button type="button" className="btn petit" onClick={onFormePartout}>
          <CopyCheck />
            Appliquer à toutes les cases
          </button>
        )}
        <p className="aide">Clique sur une case de la page pour changer seulement sa forme.</p>
      </div>
      <div className="section">
        <span className="section-titre">Modèles</span>
        <div className="grille-3">
          {MISES_EN_PAGE.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`btn modele${miseEnPageId === m.id ? ' actif' : ''}`}
              onClick={() => onChoisir(m)}
            >
              <MiniPage rangees={m.rangees} format={format} />
              <span>{m.nom}</span>
            </button>
          ))}
        </div>
      </div>

    </>
  );
}

// Fond de croquis derrière les cases des pages intérieures
function Fonds({ typePage, fond, onFond, onFondPartout }) {
  if (typePage !== 'deuxieme' && typePage !== 'troisieme') return <p className="aide">{MESSAGE_FOND}</p>;
  return (
    <>
      <div className="grille-3">
        {FONDS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`btn modele${fond === f.id ? ' actif' : ''}`}
            onClick={() => onFond(f.id)}
            aria-pressed={fond === f.id}
          >
            <span className="apercu-fond">
              {f.id !== 'aucun' && <span className={`fond-page fond-${f.id}`} />}
            </span>
            <span>{f.nom}</span>
          </button>
        ))}
      </div>
      <button type="button" className="btn petit" onClick={() => onFondPartout(fond)}>
        <CopyCheck />
        Appliquer à la 2e et à la 3e de couverture
      </button>
      <p className="aide">Le fond couvre la page ; s'il y a des cases, il apparaît autour d'elles.</p>
    </>
  );
}

function Onomatopees({ onAjouter }) {
  return (
    <div className="grille-3">
      {ONOMATOPEES.map((o) => (
        <button
          key={o.texte}
          type="button"
          className="btn onomato-choix"
          style={{ '--couleur': o.couleur }}
          onClick={() => onAjouter({ type: 'onomato', texte: o.texte, couleur: o.couleur, taille: 9 })}
        >
          {o.texte}
        </button>
      ))}
    </div>
  );
}

function Format({ format, onChoisir }) {
  return (
    <div className="grille-2">
      <button type="button" className={`btn modele${format === 'portrait' ? ' actif' : ''}`} onClick={() => onChoisir('portrait')}>
        <RectangleVertical className="grande-icone" />
        <span>Portrait</span>
      </button>
      <button type="button" className={`btn modele${format === 'paysage' ? ' actif' : ''}`} onClick={() => onChoisir('paysage')}>
        <RectangleHorizontal className="grande-icone" />
        <span>Paysage</span>
      </button>
    </div>
  );
}

const DESCRIPTIONS = {
  galerie: 'Importe tes photos : elles deviennent des dessins de BD. Glisse-les sur une case.',
  textes: 'Le texte se place dans la case sélectionnée, avec une phrase liée à son image.',
  bulles: 'Choisis une forme ; tu pourras tout régler ensuite dans la barre au-dessus de la bulle.',
  cases: 'Nombre, disposition et forme des cases de la page.',
  onomatopees: 'Clique pour ajouter un effet sonore sur la page.',
  fond: 'Motif de croquis de la 2e et de la 3e de couverture.',
  format: 'Orientation de toutes les pages.',
};

// Panneau de droite : onglets d'outils et réglages de l'outil choisi
function Controles(props) {
  const { outil, onOutil, format, onAjouterElement } = props;
  const outilActif = OUTILS.find((o) => o.id === outil);

  // Flèches gauche / droite pour passer d'un onglet à l'autre
  const clavierOnglets = (e) => {
    const sens = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!sens) return;
    e.preventDefault();
    const index = (OUTILS.findIndex((o) => o.id === outil) + sens + OUTILS.length) % OUTILS.length;
    onOutil(OUTILS[index].id);
    document.getElementById(`onglet-${OUTILS[index].id}`)?.focus();
  };

  return (
    <aside className="inspecteur" aria-label="Outils">
      <div className="onglets" role="tablist" aria-label="Outils" onKeyDown={clavierOnglets}>
        {OUTILS.map(({ id, nom, court, Icone }) => (
          <button
            key={id}
            id={`onglet-${id}`}
            type="button"
            role="tab"
            aria-selected={outil === id}
            aria-controls="panneau-outil"
            tabIndex={outil === id ? 0 : -1}
            className={`onglet${outil === id ? ' actif' : ''}`}
            onClick={() => onOutil(id)}
            title={nom}
          >
            {id === 'format' && format === 'paysage' ? <RectangleHorizontal /> : <Icone />}
            <span>{court}</span>
          </button>
        ))}
      </div>

      <section className="panneau-outil" id="panneau-outil" role="tabpanel" aria-labelledby={`onglet-${outil}`}>
        <header className="panneau-tete">
          <h2>{outilActif?.nom}</h2>
          <p>{DESCRIPTIONS[outil]}</p>
        </header>

        {outil === 'galerie' && (
          <Galerie
            photos={props.photos}
            photosEnCours={props.photosEnCours}
            erreurImport={props.erreurImport}
            onAjouterPhotos={props.onAjouterPhotos}
            onRetirerPhoto={props.onRetirerPhoto}
            onPlacerPhoto={props.onPlacerPhoto}
            indexPage={props.indexPage}
            caseSelectionnee={props.caseSelectionnee}
            caseAUneImage={Boolean(props.imagesCases[props.caseSelectionnee])}
            onViderCase={props.onViderCase}
            cadrage={props.cadrage}
            onDeplacer={props.onDeplacerImage}
            onTourner={props.onTournerImage}
            onZoomer={props.onZoomerImage}
            onRecentrer={props.onRecentrerImage}
          />
        )}
        {outil === 'textes' && (
          <ListeAjout
            modeles={TEXTES}
            onAjouter={onAjouterElement}
            apercu={(m) => <span className={`apercu-texte ${m.element.variante}`}>Aa</span>}
          />
        )}
        {outil === 'bulles' && (
          <ListeAjout
            modeles={BULLES}
            onAjouter={onAjouterElement}
            apercu={(m) => <span className={`mini-bulle grande ${m.element.variante}`} />}
          />
        )}
        {outil === 'cases' && props.typePage && props.nombreCases === 0 && (
          <p className="aide">Pas de case sur cette couverture : ajoute-en avec + ou mets une image depuis la page.</p>
        )}
        {outil === 'cases' && (
          <Cases
            minimum={props.typePage ? 0 : 1}
            penchee={props.penchee}
            onPencher={props.onPencher}
            onRedresser={props.onRedresser}
            format={format}
            miseEnPageId={props.miseEnPageId}
            nombreCases={props.nombreCases}
            onNombreCases={props.onNombreCases}
            onChoisir={props.onChoisirMiseEnPage}
            onAleatoire={props.onMiseEnPageAleatoire}
            caseSelectionnee={props.caseSelectionnee}
            forme={props.formeCase}
            onForme={props.onForme}
            onFormePartout={props.onFormePartout}
            positionsModifiees={props.positionsModifiees}
            onReinitialiserPositions={props.onReinitialiserPositions}
          />
        )}
        {outil === 'onomatopees' && <Onomatopees onAjouter={onAjouterElement} />}
        {outil === 'fond' && (
          <Fonds typePage={props.typePage} fond={props.fond} onFond={props.onFond} onFondPartout={props.onFondPartout} />
        )}
        {outil === 'format' && <Format format={format} onChoisir={props.onFormat} />}
      </section>
    </aside>
  );
}

export default Controles;
