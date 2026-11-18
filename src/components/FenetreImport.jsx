import { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

// Fenêtre ouverte en cliquant au centre d'une case vide :
// importer une image de l'ordinateur ou en reprendre une de la galerie
function FenetreImport({ numeroCase, photos, onFichiers, onChoisir, onFermer }) {
  const champRef = useRef(null);
  const [survol, setSurvol] = useState(false);

  useEffect(() => {
    champRef.current?.focus();
  }, []);

  const recevoir = (fichiers) => {
    const images = [...fichiers].filter((f) => f.type.startsWith('image/') || /\.hei[cf]$/i.test(f.name));
    if (images.length) onFichiers(images);
  };

  return (
    <div className="modale" onClick={onFermer}>
      <div
        className="modale-contenu fenetre-import"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-import"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="carte-tete">
          <h2 id="titre-import">Image de la case n°{numeroCase}</h2>
          <button type="button" className="btn-icone" onClick={onFermer} aria-label="Fermer">
            <X />
          </button>
        </div>

        <label
          className={`zone-depot${survol ? ' survol' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setSurvol(true);
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSurvol(false);
            recevoir(e.dataTransfer.files);
          }}
        >
          <Upload />
          <strong>Choisir une image sur l'ordinateur</strong>
          <span>ou la déposer ici — l'effet BD s'applique automatiquement</span>
          <input
            ref={champRef}
            className="visuellement-cache"
            type="file"
            accept="image/*,.heic,.heif"
            onChange={(e) => recevoir(e.target.files)}
          />
        </label>

        {photos.length > 0 && (
          <>
            <p className="section-titre">Ou reprendre une image de la galerie</p>
            <div className="galerie">
              {photos.map((photo, i) => (
                <div key={photo.id} className="vignette">
                  <button type="button" onClick={() => onChoisir(photo.src)} aria-label={`Utiliser l'image ${i + 1} de la galerie`}>
                    <img src={photo.src} alt="" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FenetreImport;
