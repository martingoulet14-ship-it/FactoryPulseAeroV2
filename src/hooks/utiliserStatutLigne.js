// ─────────────────────────────────────────────
//  Hook : utiliserStatutLigne
//  Interroge GET /line/status toutes les 5 s
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import ServiceApi from '../services/ServiceApi';

export function utiliserStatutLigne() {
  const [statut,      setStatut]      = useState(null);
  const [chargement,  setChargement]  = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const resultat = await ServiceApi.obtenirStatutLigne();
      setStatut(resultat);
    } catch (e) {
      console.warn('[StatutLigne]', e.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
    const intervalle = setInterval(charger, 5_000);
    return () => clearInterval(intervalle);
  }, [charger]);

  return { statut, chargement, recharger: charger };
}
