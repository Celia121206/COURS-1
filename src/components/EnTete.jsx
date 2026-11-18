import { useEffect, useRef, useState } from 'react';
import { Download, Eye, Files, Keyboard, Redo2, RotateCcw, Undo2, X } from 'lucide-react';

const RACCOURCIS = [
  ['Cmd/Ctrl + Z', 'Annuler la dernière action'],
  ['Cmd/Ctrl + Maj + Z', 'Rétablir (Ctrl + Y sous Windows)'],
  ['Double-clic / Entrée', 'Modifier le texte de l’élément'],
  ['Flèches', 'Déplacer l’élément ou la case (Maj : plus vite)'],
  ['Maj + flèches', 'Redimensionner la case sélectionnée'],
  ['+ / −', 'Agrandir / réduire l’élément'],
  ['[ / ]', 'Tourner l’élément'],
  ['Cmd/Ctrl + D', 'Dupliquer l’élément'],
  ['Suppr', 'Supprimer l’élément'],
  ['Échap', 'Tout désélectionner'],
  ['Tab', 'Passer d’une case ou d’un élément à l’autre'],
];

// Bandeau du haut : nom de l'application, page en cours, export et aide
// Petite fenêtre qui se ferme quand on clique ailleurs
function usePopover() {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e) => {
      if (!ref.current?.contains(e.target)) setOuvert(false);
    };
    document.addEventListener('pointerdown', fermer);
    return () => document.removeEventListener('pointerdown', fermer);
  }, [ouvert]);
  return [ouvert, setOuvert, ref];
}

const MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const CMD = MAC ? '⌘' : 'Ctrl + ';

function EnTete({
  nomPage,
  detailPage,
  onApercu,
  onTelecharger,
  onTelechargerTout,
  nombrePages,
  exportEnCours,
  peutAnnuler,
  peutRetablir,
  onAnnuler,
  onRetablir,
  onRecommencer,
}) {
  const [aideOuverte, setAideOuverte, aideRef] = usePopover();
  const [confirmation, setConfirmation, confirmationRef] = usePopover();

  return (
    <header className="entete">
      <div className="marque">
        <h1 className="titre">Crée ta BD</h1>
        <span className="marque-sous-titre">Atelier de bande dessinée</span>
      </div>

      <p className="page-courante" aria-live="polite">
        <strong>{nomPage}</strong>
        {detailPage && <span>{detailPage}</span>}
      </p>

      <div className="entete-actions">
        <div className="historique" role="group" aria-label="Historique">
          <button
            type="button"
            className="btn discret icone-seule"
            onClick={onAnnuler}
            disabled={!peutAnnuler}
            aria-label="Annuler"
            title={`Annuler (${CMD}Z)`}
          >
            <Undo2 />
          </button>
          <button
            type="button"
            className="btn discret icone-seule"
            onClick={onRetablir}
            disabled={!peutRetablir}
            aria-label="Rétablir"
            title={`Rétablir (${CMD}${MAC ? '⇧Z' : 'Y'})`}
          >
            <Redo2 />
          </button>
          <div className="aide-raccourcis" ref={confirmationRef}>
            <button
              type="button"
              className="btn discret icone-seule"
              onClick={() => setConfirmation((o) => !o)}
              aria-expanded={confirmation}
              aria-label="Recommencer une BD vide"
              title="Recommencer une BD vide"
            >
              <RotateCcw />
            </button>
            {confirmation && (
              <div className="raccourcis confirmation-recommencer" role="alertdialog" aria-label="Recommencer">
                <strong>Recommencer une BD vide ?</strong>
                <p>Toutes les pages repartent de zéro. Tu pourras revenir en arrière avec {CMD}Z.</p>
                <div className="duo">
                  <button
                    type="button"
                    className="btn petit danger-plein"
                    onClick={() => {
                      onRecommencer();
                      setConfirmation(false);
                    }}
                  >
                    <RotateCcw />
                    Recommencer
                  </button>
                  <button type="button" className="btn petit discret" onClick={() => setConfirmation(false)}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="aide-raccourcis" ref={aideRef}>
          <button
            type="button"
            className="btn discret"
            onClick={() => setAideOuverte((o) => !o)}
            aria-expanded={aideOuverte}
            aria-controls="liste-raccourcis"
          >
            <Keyboard />
            Raccourcis
          </button>
          {aideOuverte && (
            <div className="raccourcis" id="liste-raccourcis" role="dialog" aria-label="Raccourcis clavier">
              <div className="raccourcis-tete">
                <strong>Raccourcis clavier</strong>
                <button type="button" className="btn-icone" onClick={() => setAideOuverte(false)} aria-label="Fermer">
                  <X />
                </button>
              </div>
              <dl>
                {RACCOURCIS.map(([touche, action]) => (
                  <div key={touche}>
                    <dt>
                      <kbd>{touche}</kbd>
                    </dt>
                    <dd>{action}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
        <button type="button" className="btn discret" onClick={onApercu} disabled={exportEnCours}>
          <Eye />
          Aperçu
        </button>
        {nombrePages > 1 && (
          <button type="button" className="btn discret" onClick={onTelechargerTout} disabled={exportEnCours}>
            <Files />
            Toutes les pages
          </button>
        )}
        <button type="button" className="btn primaire" onClick={onTelecharger} disabled={exportEnCours}>
          <Download />
          Télécharger la page
        </button>
      </div>
    </header>
  );
}

export default EnTete;
