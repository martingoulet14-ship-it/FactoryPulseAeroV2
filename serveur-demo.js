// ─────────────────────────────────────────────────────────────
//  serveur-demo.js
//
//  Serveur de démonstration — simule le backend FastAPI
//  Lance ce fichier avec : node serveur-demo.js
//
//  Ce serveur envoie de fausses données réalistes pour que
//  l'application mobile fonctionne sans Docker.
// ─────────────────────────────────────────────────────────────

const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = 8000;

// ─────────────────────────────────────────────────────────────
//  État simulé des 4 robots
//  Chaque KPI commence à une valeur normale et varie légèrement
// ─────────────────────────────────────────────────────────────

const etatRobots = {
  R01: {
    type: 'percage',
    temp_percage:     { valeur: 72, unite: '°C',        statut: 'normal' },
    cadence_percage:  { valeur: 95, unite: 'trous/min', statut: 'normal' },
    defauts_percage:  { valeur: 0.2, unite: '%',        statut: 'normal' },
  },
  R02: {
    type: 'percage',
    temp_percage:     { valeur: 68, unite: '°C',        statut: 'normal' },
    cadence_percage:  { valeur: 102, unite: 'trous/min', statut: 'normal' },
    defauts_percage:  { valeur: 0.1, unite: '%',        statut: 'normal' },
  },
  R03: {
    type: 'rivetage',
    temp_hydraulique: { valeur: 48, unite: '°C',          statut: 'normal' },
    cadence_rivetage: { valeur: 118, unite: 'rivets/min', statut: 'normal' },
    defauts_rivetage: { valeur: 0.3, unite: '%',          statut: 'normal' },
  },
  R04: {
    type: 'rivetage',
    temp_hydraulique: { valeur: 52, unite: '°C',          statut: 'normal' },
    cadence_rivetage: { valeur: 125, unite: 'rivets/min', statut: 'normal' },
    defauts_rivetage: { valeur: 0.4, unite: '%',          statut: 'normal' },
  },
};

// Alertes générées automatiquement
const historiqueAlertes = [];

// ─────────────────────────────────────────────────────────────
//  Seuils pour calculer le statut de chaque KPI
// ─────────────────────────────────────────────────────────────

const SEUILS = {
  temp_percage:     { warning: 85, critique: 95, alerteSiDessous: false },
  cadence_percage:  { warning: 70, critique: 50, alerteSiDessous: true  },
  defauts_percage:  { warning: 0.8, critique: 1.5, alerteSiDessous: false },
  temp_hydraulique: { warning: 70, critique: 80, alerteSiDessous: false },
  cadence_rivetage: { warning: 90, critique: 70, alerteSiDessous: true  },
  defauts_rivetage: { warning: 1.0, critique: 2.0, alerteSiDessous: false },
};

function calculerStatut(kpi, valeur) {
  const s = SEUILS[kpi];
  if (!s) return 'normal';

  if (s.alerteSiDessous) {
    if (valeur <= s.critique) return 'critical';
    if (valeur <= s.warning)  return 'warning';
  } else {
    if (valeur >= s.critique) return 'critical';
    if (valeur >= s.warning)  return 'warning';
  }
  return 'normal';
}

// ─────────────────────────────────────────────────────────────
//  Simulation : fait varier les valeurs légèrement à chaque tick
// ─────────────────────────────────────────────────────────────

// Plages de variation naturelle pour chaque KPI
const VARIATIONS = {
  temp_percage:     { min: 60, max: 100, pas: 1.5 },
  cadence_percage:  { min: 45, max: 130, pas: 3   },
  defauts_percage:  { min: 0,  max: 2,   pas: 0.05 },
  temp_hydraulique: { min: 35, max: 85,  pas: 1   },
  cadence_rivetage: { min: 60, max: 145, pas: 4   },
  defauts_rivetage: { min: 0,  max: 3,   pas: 0.08 },
};

function varierValeur(kpi, valeurActuelle) {
  const v = VARIATIONS[kpi];
  if (!v) return valeurActuelle;

  // Variation aléatoire entre -pas et +pas
  const delta = (Math.random() - 0.5) * 2 * v.pas;
  let nouvelleValeur = valeurActuelle + delta;

  // On garde dans les bornes
  nouvelleValeur = Math.max(v.min, Math.min(v.max, nouvelleValeur));

  // Arrondi à 1 décimale
  return Math.round(nouvelleValeur * 10) / 10;
}

// ─────────────────────────────────────────────────────────────
//  Serveur HTTP — répond aux appels REST de l'appli
// ─────────────────────────────────────────────────────────────

function repondreJSON(res, donnees, code = 200) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Autorise les requêtes depuis Expo
  });
  res.end(JSON.stringify(donnees));
}

function genererHistorique(idRobot, kpi, depuisMs, jusquaMs) {
  const points = [];
  const intervalleMs = 60 * 1000; // 1 point par minute
  const kpiActuel = etatRobots[idRobot]?.[kpi];
  const valeurBase = kpiActuel?.valeur ?? 70;

  let ts = depuisMs;
  while (ts <= jusquaMs) {
    const bruit = (Math.random() - 0.5) * 10;
    points.push({
      timestamp: new Date(ts).toISOString(),
      value: Math.round((valeurBase + bruit) * 10) / 10,
    });
    ts += intervalleMs;
  }
  return points;
}

const serveurHTTP = http.createServer((req, res) => {
  // Autoriser les requêtes OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const chemin = url.pathname;

  console.log(`[HTTP] ${req.method} ${chemin}`);

  // GET /robots — liste des robots
  if (chemin === '/robots') {
    const liste = Object.entries(etatRobots).map(([id, robot]) => ({
      id,
      type:  robot.type,
      label: id,
    }));
    return repondreJSON(res, liste);
  }

  // GET /robots/:id/kpis — valeurs actuelles d'un robot
  const matchKpis = chemin.match(/^\/robots\/(R0[1-4])\/kpis$/);
  if (matchKpis) {
    const id = matchKpis[1];
    const robot = etatRobots[id];
    if (!robot) return repondreJSON(res, { erreur: 'Robot introuvable' }, 404);

    const kpis = {};
    for (const [cle, data] of Object.entries(robot)) {
      if (cle === 'type') continue;
      kpis[cle] = { value: data.valeur, unit: data.unite, status: data.statut };
    }
    return repondreJSON(res, kpis);
  }

  // GET /robots/:id/history — historique d'un KPI
  const matchHistorique = chemin.match(/^\/robots\/(R0[1-4])\/history$/);
  if (matchHistorique) {
    const id  = matchHistorique[1];
    const kpi = url.searchParams.get('kpi') ?? '';

    // Fenêtre temporelle : défaut = dernière heure
    const maintenant = Date.now();
    const depuis  = parseInt(url.searchParams.get('from')  ?? maintenant - 3600000);
    const jusqua  = parseInt(url.searchParams.get('to')    ?? maintenant);

    const donnees = genererHistorique(id, kpi, depuis, jusqua);
    return repondreJSON(res, { data: donnees });
  }

  // GET /alerts — journal des alertes
  if (chemin === '/alerts') {
    const limite = parseInt(url.searchParams.get('limit') ?? '50');
    return repondreJSON(res, historiqueAlertes.slice(0, limite));
  }

  // GET /line/status — statut opérationnel de la ligne
  if (chemin === '/line/status') {
    // Bloquée si R01 ou R02 est en critique (les perceuses bloquent les riveteuses)
    const r01Critique = Object.values(etatRobots.R01)
      .some(k => typeof k === 'object' && k.statut === 'critical');
    const r02Critique = Object.values(etatRobots.R02)
      .some(k => typeof k === 'object' && k.statut === 'critical');

    if (r01Critique || r02Critique) {
      return repondreJSON(res, {
        statut: 'bloque',
        cause:  `Robot ${r01Critique ? 'R01' : 'R02'} en état critique — rivetage suspendu`,
      });
    }
    return repondreJSON(res, { statut: 'operationnel' });
  }

  // Route inconnue
  repondreJSON(res, { erreur: 'Route inconnue' }, 404);
});

// ─────────────────────────────────────────────────────────────
//  Serveur WebSocket — envoie les données en temps réel
// ─────────────────────────────────────────────────────────────

const wsServeur = new WebSocketServer({ server: serveurHTTP });

// Liste des clients connectés
const clients = new Set();

wsServeur.on('connection', (socket, req) => {
  clients.add(socket);
  console.log(`[WS] Client connecté (total : ${clients.size})`);

  socket.on('close', () => {
    clients.delete(socket);
    console.log(`[WS] Client déconnecté (total : ${clients.size})`);
  });
});

// Envoie un message à tous les clients connectés
function diffuser(message) {
  const texte = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(texte);
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  Boucle principale : met à jour les données toutes les 2 s
// ─────────────────────────────────────────────────────────────

setInterval(() => {
  // On fait varier chaque KPI de chaque robot
  for (const [idRobot, robot] of Object.entries(etatRobots)) {
    for (const [cle, kpiData] of Object.entries(robot)) {
      if (cle === 'type') continue;

      const ancienneValeur = kpiData.valeur;
      const nouvelleValeur = varierValeur(cle, ancienneValeur);
      const nouveauStatut  = calculerStatut(cle, nouvelleValeur);

      kpiData.valeur = nouvelleValeur;
      kpiData.statut = nouveauStatut;

      // Message KPI envoyé en temps réel
      const message = {
        type:   nouveauStatut === 'normal' ? 'kpi' : 'alert',
        robot:  idRobot,
        kpi:    cle,
        value:  nouvelleValeur,
        unit:   kpiData.unite,
        status: nouveauStatut,
        level:  nouveauStatut === 'critical' ? 'critical' : 'warning',
      };

      diffuser(message);

      // Si alerte, on l'enregistre dans l'historique
      if (nouveauStatut !== 'normal') {
        const alerte = {
          id:          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          robot:       idRobot,
          kpi:         cle,
          value:       nouvelleValeur,
          level:       nouveauStatut === 'critical' ? 'critical' : 'warning',
          horodatage:  new Date().toISOString(),
        };
        historiqueAlertes.unshift(alerte);
        if (historiqueAlertes.length > 200) historiqueAlertes.pop();
      }
    }
  }
}, 2000);

// ─────────────────────────────────────────────────────────────
//  Démarrage
// ─────────────────────────────────────────────────────────────

serveurHTTP.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║      FACTORYPULSE — Serveur de démo      ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  HTTP  → http://localhost:${PORT}           ║`);
  console.log(`║  WS    → ws://localhost:${PORT}/ws/live     ║`);
  console.log('╠══════════════════════════════════════════╣');
  console.log('║  Données envoyées toutes les 2 secondes  ║');
  console.log('║  Ctrl+C pour arrêter                     ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
