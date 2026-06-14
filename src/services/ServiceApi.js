// ─────────────────────────────────────────────
//  Service API — Requêtes REST vers le backend FastAPI
//  Tous les appels réseau passent par ici
// ─────────────────────────────────────────────

import { URL_BASE } from '../constantes/config';

// Requête générique avec gestion d'erreur
async function requete(chemin, options = {}) {
  const url = `${URL_BASE}${chemin}`;
  const reponse = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });

  if (!reponse.ok) {
    throw new Error(`Erreur HTTP ${reponse.status} — ${chemin}`);
  }
  return reponse.json();
}

const ServiceApi = {
  // GET /robots
  // Retourne : [{ id, type, label, statut_actuel }, ...]
  obtenirRobots: () => requete('/robots'),

  // GET /robots/{id}/kpis
  // Retourne : { temp_percage: { valeur, unite, statut }, ... }
  obtenirKpisRobot: (id) => requete(`/robots/${id}/kpis`),

  // GET /robots/{id}/history?kpi=...&from=...&to=...
  // Retourne : [{ time: ISO, value: number }, ...]
  obtenirHistorique: (id, kpi, depuis, jusqua) => {
    const params = new URLSearchParams({ kpi });
    if (depuis)  params.append('from', depuis.toISOString());
    if (jusqua)  params.append('to',   jusqua.toISOString());
    return requete(`/robots/${id}/history?${params}`);
  },

  // GET /alerts?limit=50
  // Retourne : [{ robot, kpi, level, value, timestamp }, ...]
  obtenirAlertes: (limite = 50) => requete(`/alerts?limit=${limite}`),

  // GET /line/status
  // Retourne : { statut: 'operationnel'|'bloque', cause: string|null }
  obtenirStatutLigne: () => requete('/line/status'),
};

export default ServiceApi;
