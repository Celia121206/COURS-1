import { useRef, useState } from 'react';
import { LoaderCircle, Square, WandSparkles } from 'lucide-react';
import { genererImage } from '../ia.js';

// Onglet "IA" : décrire ce qu'on voit autour de soi, puis générer l'image de la case
function PanneauIA({ ratio, numeroCase, onImage }) {
  const [description, setDescription] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState(null);
  const annulation = useRef(null);

  const generer = async () => {
    setMessage(null);
    setEnCours(true);
    annulation.current = new AbortController();
    try {
      const image = await genererImage({ description, ratio, signal: annulation.current.signal });
      await onImage(image);
      setMessage({ type: 'ok', texte: numeroCase ? `Image ajoutée dans la case n°${numeroCase}.` : 'Image ajoutée sur la page.' });
    } catch (erreur) {
      if (erreur.name !== 'AbortError') setMessage({ type: 'erreur', texte: erreur.message });
    } finally {
      setEnCours(false);
    }
  };

  return (
    <>
      <label className="visuellement-cache" htmlFor="description-scene">
        Décris ce que tu vois autour de toi
      </label>
      <textarea
        id="description-scene"
        className="description-scene"
        rows="6"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Ex. : Je suis dans la salle d'attente, un enfant à côté de moi a un bras dans le plâtre et joue avec le téléphone de son papa."
        maxLength="1000"
        disabled={enCours}
      />

      {enCours ? (
        <div className="generation-en-cours" role="status">
          <LoaderCircle className="tourne" aria-hidden="true" />
          <span>L'IA dessine ta scène… Compte de quelques secondes à une minute (la toute première image est plus longue).</span>
          <button type="button" className="btn petit" onClick={() => annulation.current?.abort()}>
            <Square aria-hidden="true" />
            Annuler
          </button>
        </div>
      ) : (
        <button type="button" className="btn primaire large" onClick={generer} disabled={description.trim().length < 10}>
          <WandSparkles aria-hidden="true" />
          Générer
        </button>
      )}

      {message && (
        <p className={message.type === 'ok' ? 'succes' : 'erreur'} role={message.type === 'ok' ? 'status' : 'alert'}>
          {message.texte}
        </p>
      )}
    </>
  );
}

export default PanneauIA;
