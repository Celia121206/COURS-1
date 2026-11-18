import { useState } from 'react';
import { BookOpen, Plus, Trash2, X } from 'lucide-react';
import { PageVue } from './Page.jsx';
import { bornesInterieures, COUVERTURES } from '../data.js';

export const TYPE_PAGE = 'application/x-bd-page';

const estVide = (page) => Object.keys(page.images).length === 0 && page.elements.length === 0;

// Nom affiché sous chaque miniature : les pages intérieures sont numérotées après la couverture
const NOMS_COURTS = { couverture: '1re de couv.', deuxieme: '2e de couv.', troisieme: '3e de couv.', quatrieme: '4e de couv.' };

const nomPage = (page, i, pages) => (page.type ? NOMS_COURTS[page.type] : `p. ${i - bornesInterieures(pages).debut + 1}`);

// Bande en bas de l'écran : toutes les pages en miniature
function Pellicule({
  pages,
  indexPage,
  format,
  onAllerPage,
  onAjouterPage,
  onSupprimerPage,
  glisserVersPage,
  couverturesManquantes,
  onAjouterCouverture,
}) {
  const [survol, setSurvol] = useState(null);
  const [aSupprimer, setASupprimer] = useState(null);
  const peutSupprimer = pages.length > 1;

  // Une page vide part directement ; sinon on demande confirmation
  const demanderSuppression = (index) => {
    if (estVide(pages[index])) onSupprimerPage(index);
    else setASupprimer(index);
  };

  const confirmer = () => {
    onSupprimerPage(aSupprimer);
    setASupprimer(null);
  };

  return (
    <nav className="pellicule" aria-label="Toutes les pages">
      <ol>
        {pages.map((page, i) => {
          const cible = glisserVersPage(i);
          const classes = ['miniature', i === indexPage && 'active', i === survol && 'survol', i === aSupprimer && 'a-supprimer']
            .filter(Boolean)
            .join(' ');
          return (
            <li
              key={page.id}
              className={classes}
              draggable={!page.type}
              onDragStart={(e) => {
                e.dataTransfer.setData(TYPE_PAGE, String(i));
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                cible.survol(e);
                setSurvol(i);
              }}
              onDragLeave={() => setSurvol(null)}
              onDrop={(e) => {
                setSurvol(null);
                cible.depot(e);
              }}
            >
              <button type="button" className="miniature-page" onClick={() => onAllerPage(i)} aria-label={`Aller à : ${nomPage(page, i, pages)}`}>
                <PageVue page={page} format={format} />
              </button>
              <span className="miniature-numero">{nomPage(page, i, pages)}</span>
              {peutSupprimer && (
                <button
                  type="button"
                  className="retirer"
                  onClick={() => demanderSuppression(i)}
                  aria-label={`Supprimer : ${nomPage(page, i, pages)}`}
                  title={`Supprimer : ${nomPage(page, i, pages)}`}
                >
                  <X />
                </button>
              )}
            </li>
          );
        })}
        <li>
          <button type="button" className="miniature-ajout" onClick={onAjouterPage} aria-label="Ajouter une page intérieure" title="Ajouter une page intérieure">
            <Plus />
          </button>
        </li>
      </ol>

      <div className="pellicule-actions">
        {couverturesManquantes.map((type) => (
          <button key={type} type="button" className="btn petit" onClick={() => onAjouterCouverture(type)}>
            <BookOpen />
            Ajouter la {COUVERTURES[type]}
          </button>
        ))}
        {aSupprimer !== null ? (
          <div className="confirmation" role="alertdialog" aria-label="Confirmer la suppression">
            <span>Supprimer « {nomPage(pages[aSupprimer], aSupprimer, pages)} » et tout son contenu ?</span>
            <div className="duo">
              <button type="button" className="btn petit danger-plein" onClick={confirmer}>
                <Trash2 />
                Supprimer
              </button>
              <button type="button" className="btn petit" onClick={() => setASupprimer(null)}>
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn petit"
            onClick={() => demanderSuppression(indexPage)}
            disabled={!peutSupprimer}
            title={peutSupprimer ? '' : 'Il faut garder au moins une page'}
          >
            <Trash2 />
            Supprimer « {nomPage(pages[indexPage], indexPage, pages)} »
          </button>
        )}
      </div>
    </nav>
  );
}

export default Pellicule;
