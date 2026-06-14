// ─────────────────────────────────────────────
//  Configuration réseau
//
//  Pour le serveur de démo (node serveur-demo.js) :
//    - Expo Web ou simulateur iOS  → 'localhost'
//    - Émulateur Android           → '10.0.2.2'
//    - Vrai téléphone (Wi-Fi)      → l'IP de ton PC (ex: '192.168.1.42')
//      → trouve ton IP avec : ipconfig (Windows) ou ifconfig (Mac/Linux)
// ─────────────────────────────────────────────

export const ADRESSE_BACKEND = 'localhost';
export const PORT_BACKEND    = 8000;

export const URL_BASE = `http://${ADRESSE_BACKEND}:${PORT_BACKEND}`;
export const URL_WS   = `ws://${ADRESSE_BACKEND}:${PORT_BACKEND}/ws/live`;

// ─────────────────────────────────────────────
//  Définition des 4 robots
// ─────────────────────────────────────────────

export const ROBOTS = {
  'R01': {
    type:  'percage',
    label: 'FlexTrack — Joint longitudinal gauche',
    court: 'FlexTrack G.',
  },
  'R02': {
    type:  'percage',
    label: 'FlexTrack — Joint longitudinal droit',
    court: 'FlexTrack D.',
  },
  'R03': {
    type:  'rivetage',
    label: 'Kuka 7 axes — Jonction avant / centre',
    court: 'Kuka Av./Ctr',
  },
  'R04': {
    type:  'rivetage',
    label: 'Kuka 7 axes — Jonction centre / arrière',
    court: 'Kuka Ctr./Arr.',
  },
};

// ─────────────────────────────────────────────
//  Définition des KPIs
// ─────────────────────────────────────────────

export const KPI_DEFINITIONS = {
  percage: {
    temp_percage: { // 🔄 Clé d'origine restaurée pour l'écran
      cle:              'temp_percage',
      label:            'Température perçage',
      unite:            '°C',
      description:      'Tête de perçage — capteur infrarouge',
      min:              40,
      max:              110,
      normalMin:        60,
      normalMax:        80,
      seuilWarning:     85,
      seuilCritique:    95,
      alerteSiDessous:  false,
    },
    cadence_percage: {
      cle:              'cadence_percage',
      label:            'Cadence de perçage',
      unite:            'trous/min',
      description:      'Fenêtre glissante 30 s',
      min:              0,
      max:              150,
      normalMin:        80,
      normalMax:        120,
      seuilWarning:     70,
      seuilCritique:    50,
      alerteSiDessous:  true,
    },
    defauts_percage: {
      cle:              'defauts_percage',
      label:            'Taux de défauts',
      unite:            '%',
      description:      'Fenêtre glissante 10 min',
      min:              0,
      max:              3,
      normalMin:        0,
      normalMax:        0.3,
      seuilWarning:     0.8,
      seuilCritique:    1.5,
      alerteSiDessous:  false,
    },
  },
  rivetage: {
    temp_hydraulique: { // 🔄 Clé d'origine restaurée pour l'écran
      cle:              'temp_hydraulique',
      label:            'Température hydraulique',
      unite:            '°C',
      description:      'Vérin hydraulique',
      min:              20,
      max:              100,
      normalMin:        40,
      normalMax:        60,
      seuilWarning:     70,
      seuilCritique:    80,
      alerteSiDessous:  false,
    },
    cadence_rivetage: {
      cle:              'cadence_rivetage',
      label:            'Cadence de rivetage',
      unite:            'rivets/min',
      description:      'Fenêtre glissante 30 s',
      min:              0,
      max:              180,
      normalMin:        100,
      normalMax:        140,
      seuilWarning:     90,
      seuilCritique:    70,
      alerteSiDessous:  true,
    },
    defauts_rivetage: {
      cle:              'defauts_rivetage',
      label:            'Taux de défauts',
      unite:            '%',
      description:      'Fenêtre glissante 10 min',
      min:              0,
      max:              4,
      normalMin:        0,
      normalMax:        0.5,
      seuilWarning:     1.0,
      seuilCritique:    2.0,
      alerteSiDessous:  false,
    },
  },
};

export function getKpisDuRobot(idRobot) {
  const type = ROBOTS[idRobot]?.type;
  return type ? Object.values(KPI_DEFINITIONS[type]) : [];
}