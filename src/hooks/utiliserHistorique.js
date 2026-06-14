// ─────────────────────────────────────────────
//  Hook : utiliserHistorique
//  Charge l'historique d'un KPI depuis InfluxDB
//  via l'endpoint REST /robots/{id}/history
//  et se rafraîchit toutes les 30 secondes
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import ServiceApi from '../services/ServiceApi';

export function utiliserHistorique(idRobot, cleKpi, fenetreHeures = 1) {
  const [donnees,   setDonnees]   = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur,    setErreur]    = useState(null);

  const charger = useCallback(async () => {
    if (!idRobot || !cleKpi) return;

    setChargement(true);
    setErreur(null);

    try {
      const maintenant = new Date();
      const depuis     = new Date(maintenant.getTime() - fenetreHeures * 3_600_000);

      const resultat = await ServiceApi.obtenirHistorique(idRobot, cleKpi, depuis, maintenant);

      // Le backend retourne soit un tableau direct, soit { data: [...] }
      const points = Array.isArray(resultat) ? resultat : (resultat.data ?? []);
      setDonnees(points);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, [idRobot, cleKpi, fenetreHeures]);

  useEffect(() => {
    charger();
    const intervalle = setInterval(charger, 30_000);
    return () => clearInterval(intervalle);
  }, [charger]);

  return { donnees, chargement, erreur, recharger: charger };
}
