// ─────────────────────────────────────────────
//  Utilitaires partagés dans toute l'appli
// ─────────────────────────────────────────────

import { STATUT_COULEURS } from './theme';
import { ROBOTS, KPI_DEFINITIONS } from './config';

// Calcule le statut d'une valeur KPI selon ses seuils
export function calculerStatut(valeur, definition) {
  if (valeur === null || valeur === undefined || !definition) return 'inconnu';

  const { seuilWarning, seuilCritique, alerteSiDessous } = definition;

  if (alerteSiDessous) {
    if (valeur < seuilCritique) return 'critique';
    if (valeur < seuilWarning)  return 'warning';
  } else {
    if (valeur > seuilCritique) return 'critique';
    if (valeur > seuilWarning)  return 'warning';
  }
  return 'normal';
}

// Retourne la couleur associée à un statut
export function couleurStatut(statut) {
  return STATUT_COULEURS[statut] ?? STATUT_COULEURS.inconnu;
}

// Retourne le pire statut d'un robot (parmi tous ses KPIs)
export function pireStatutRobot(donneesKpi, idRobot) {
  const kpisRobot = donneesKpi[idRobot] ?? {};
  const ordre     = { critique: 3, warning: 2, normal: 1, inconnu: 0 };
  let pire        = 'inconnu';

  for (const kpi of Object.values(kpisRobot)) {
    if ((ordre[kpi.statut] ?? 0) > (ordre[pire] ?? 0)) {
      pire = kpi.statut;
    }
  }
  return pire;
}

// Formate une valeur avec son unité
export function formaterValeur(valeur, unite) {
  if (valeur === null || valeur === undefined) return '—';
  const arrondi = typeof valeur === 'number' ? valeur.toFixed(1) : valeur;
  return unite ? `${arrondi} ${unite}` : `${arrondi}`;
}

// Temps écoulé depuis une date ISO (ex : "il y a 3 min")
export function tempsEcoule(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const s    = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h`;
}

// Formate une date ISO en heure locale française
export function formaterHeure(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('fr-FR', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Libellé humain d'un statut
export const LIBELLE_STATUT = {
  normal:   'Normal',
  warning:  'Avertissement',
  critique: 'Critique',
  bloque:   'Bloqué',
  inconnu:  'Inconnu',
};
