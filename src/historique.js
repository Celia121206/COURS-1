import { useCallback, useRef, useState } from 'react';

// Historique d'un état, pour annuler (Cmd + Z) et rétablir (Cmd + Maj + Z).
// Les changements rapprochés (glisser un élément, taper un texte) comptent pour une seule étape.
export function useHistorique(initial, { regroupement = 500, limite = 100 } = {}) {
  const [etat, setEtat] = useState(() => ({
    present: typeof initial === 'function' ? initial() : initial,
    passe: [],
    futur: [],
  }));
  const dernierChangement = useRef(0);

  // Modification enregistrée dans l'historique
  const modifier = useCallback(
    (maj) => {
      const maintenant = Date.now();
      const nouvelleEtape = maintenant - dernierChangement.current > regroupement;
      dernierChangement.current = maintenant;
      setEtat((e) => {
        const suivant = typeof maj === 'function' ? maj(e.present) : maj;
        if (suivant === e.present) return e;
        return {
          present: suivant,
          passe: nouvelleEtape ? [...e.passe, e.present].slice(-limite) : e.passe,
          futur: [],
        };
      });
    },
    [regroupement, limite]
  );

  // Modification automatique (ex. texte mis à jour par la reconnaissance d'image) : pas une étape à annuler
  const modifierSansHistorique = useCallback((maj) => {
    setEtat((e) => ({ ...e, present: typeof maj === 'function' ? maj(e.present) : maj }));
  }, []);

  const annuler = useCallback(() => {
    dernierChangement.current = 0;
    setEtat((e) =>
      e.passe.length === 0 ? e : { present: e.passe.at(-1), passe: e.passe.slice(0, -1), futur: [e.present, ...e.futur] }
    );
  }, []);

  const retablir = useCallback(() => {
    dernierChangement.current = 0;
    setEtat((e) => (e.futur.length === 0 ? e : { present: e.futur[0], passe: [...e.passe, e.present], futur: e.futur.slice(1) }));
  }, []);

  return {
    etat: etat.present,
    modifier,
    modifierSansHistorique,
    annuler,
    retablir,
    peutAnnuler: etat.passe.length > 0,
    peutRetablir: etat.futur.length > 0,
  };
}
