// ─────────────────────────────────────────────
//  Hook : utiliserHistorique
//  Charge l'historique d'un KPI depuis InfluxDB
//  via l'endpoint REST /robots/{id}/history
//  et se rafraîchit toutes les 30 secondes
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import ServiceApi from '../services/ServiceApi';

// Docker utilise des noms courts (temperature, cadence, defauts)
// L'app utilise des noms précis (temp_percage, cadence_rivetage, ...)
// Ce mapping fait la conversion dans le sens app → Docker
const KPI_VERS_DOCKER = {
  temp_percage:     'temperature',
  cadence_percage:  'cadence',
  defauts_percage:  'defauts',
  temp_hydraulique: 'temperature',
  cadence_rivetage: 'cadence',
  defauts_rivetage: 'defauts',
};

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

      const cleDocker = KPI_VERS_DOCKER[cleKpi] ?? cleKpi;
      const resultat = await ServiceApi.obtenirHistorique(idRobot, cleDocker, depuis, maintenant);

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
