// ─────────────────────────────────────────────
//  Contexte WebSocket
//  Maintient une connexion unique vers FastAPI
//  et distribue les données live à tous les écrans
// ─────────────────────────────────────────────

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';

import { URL_WS } from '../constantes/config';
import ServiceApi from './ServiceApi';
import ServiceNotifications from './ServiceNotifications';

// ── Contexte ─────────────────────────────────
const ContexteWebSocket = createContext(null);

// Docker envoie des noms génériques (temperature, cadence, defauts)
// L'application utilise des noms précis (temp_percage, cadence_rivetage, ...)
const MAPPING_KPI = {
  R01: { temperature: 'temp_percage',     cadence: 'cadence_percage',  defauts: 'defauts_percage'  },
  R02: { temperature: 'temp_percage',     cadence: 'cadence_percage',  defauts: 'defauts_percage'  },
  R03: { temperature: 'temp_hydraulique', cadence: 'cadence_rivetage', defauts: 'defauts_rivetage' },
  R04: { temperature: 'temp_hydraulique', cadence: 'cadence_rivetage', defauts: 'defauts_rivetage' },
};

// Docker envoie les statuts en anglais majuscule (CRITICAL, WARNING, NORMAL)
// L'application utilise des statuts en français minuscule (critique, warning, normal)
function normaliserStatut(statut) {
  if (!statut) return 'normal';
  switch (statut.toUpperCase()) {
    case 'CRITICAL': return 'critique';
    case 'WARNING':  return 'warning';
    case 'NORMAL':   return 'normal';
    default:         return statut.toLowerCase();
  }
}

// ── Provider ─────────────────────────────────
export function FournisseurWebSocket({ children }) {
  const [donneesKpi, setDonneesKpi]   = useState({});
  const [alertes,    setAlertes]      = useState([]);
  const [connecte,   setConnecte]     = useState(false);
  const [derniereMaj, setDerniereMaj] = useState(null);

  const wsRef            = useRef(null);
  const timerReconnexion = useRef(null);
  const monte            = useRef(true);

  // ── Gestion d'un message KPI ────────────────
  const traiterKpi = useCallback((msg) => {
    let { robot, kpi, value, unit, status } = msg;
    if (!robot || !kpi) return;

    // Traduit le nom du KPI Docker vers le nom utilisé dans l'application
    kpi = MAPPING_KPI[robot]?.[kpi] ?? kpi;

    setDonneesKpi((prev) => ({
      ...prev,
      [robot]: {
        ...(prev[robot] ?? {}),
        [kpi]: {
          valeur:      value,
          unite:       unit,
          statut:      normaliserStatut(status),
          horodatage:  new Date().toISOString(),
        },
      },
    }));
  }, []);

  // ── Gestion d'une alerte ────────────────────
  const traiterAlerte = useCallback((msg) => {
    let { robot, kpi } = msg;

    // Même traduction pour les alertes
    kpi = MAPPING_KPI[robot]?.[kpi] ?? kpi;

    const alerte = {
      ...msg,
      kpi,
      level:       normaliserStatut(msg.level),
      id:          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      horodatage:  msg.timestamp ?? new Date().toISOString(),
    };

    setAlertes((prev) => [alerte, ...prev].slice(0, 100));

    // Notif push locale
    ServiceNotifications.envoyerNotificationAlerte(alerte);
  }, []);

  // ── Routage des messages entrants ───────────
  // ── Routage des messages entrants ───────────
  const traiterMessage = useCallback((msg) => {
    // Si le backend envoie un objet brut sans champ "type" (comme Docker)
    if (msg.robot && msg.kpi && msg.type === undefined) {
      // Si le statut est critique ou warning, on force le type 'alert'
      if (msg.status === 'CRITICAL' || msg.status === 'WARNING') {
        msg.type = 'alert';
        msg.level = msg.status.toLowerCase(); // 'critical' ou 'warning'
      } else {
        msg.type = 'kpi';
      }
    }

    switch (msg.type) {
      case 'kpi':
        traiterKpi(msg);
        break;
      case 'kpi_batch':
        if (Array.isArray(msg.data)) msg.data.forEach(traiterKpi);
        break;
      case 'alert':
        // On traite d'abord la valeur pour mettre à jour la jauge
        traiterKpi(msg);
        // Puis on traite l'alerte pour allumer le voyant
        traiterAlerte(msg);
        break;
      default:
        if (msg.robot && msg.kpi && msg.value !== undefined) {
          traiterKpi(msg);
        }
    }
  }, [traiterKpi, traiterAlerte]);
  // ── Connexion WebSocket ─────────────────────
  const connecter = useCallback(() => {
    if (!monte.current) return;

    try {
      const ws = new WebSocket(URL_WS);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!monte.current) return;
        setConnecte(true);
        console.log('[WS] Connecté à', URL_WS);
      };

      ws.onmessage = ({ data }) => {
        if (!monte.current) return;
        try {
          traiterMessage(JSON.parse(data));
          setDerniereMaj(new Date());
        } catch {
          console.warn('[WS] Message non-JSON ignoré');
        }
      };

      ws.onerror = () => {
        console.warn('[WS] Erreur de connexion');
      };

      ws.onclose = () => {
        if (!monte.current) return;
        setConnecte(false);
        console.log('[WS] Déconnecté — tentative dans 3 s');
        timerReconnexion.current = setTimeout(connecter, 3000);
      };
    } catch (erreur) {
      console.error('[WS] Connexion impossible :', erreur.message);
      timerReconnexion.current = setTimeout(connecter, 5000);
    }
  }, [traiterMessage]);

  useEffect(() => {
    monte.current = true;
    connecter();
    return () => {
      monte.current = false;
      clearTimeout(timerReconnexion.current);
      wsRef.current?.close();
    };
  }, [connecter]);

  // ── Fallback REST ─────────────────────────────
  // Quand un robot est bloqué, le simulateur arrête d'envoyer des messages
  // WebSocket. On interroge l'API REST toutes les 5 s pour récupérer
  // les dernières valeurs connues et afficher l'état réel du robot.
  useEffect(() => {
    const ROBOTS_IDS = ['R01', 'R02', 'R03', 'R04'];

    const pollRest = async () => {
      for (const idRobot of ROBOTS_IDS) {
        try {
          const data = await ServiceApi.obtenirKpisRobot(idRobot);
          // Le backend retourne { kpis: { temperature: {value, unit}, ... } }
          const kpisDocker = data?.kpis ?? {};

          setDonneesKpi((prev) => {
            const kpisActuels = prev[idRobot] ?? {};
            const maj = { ...kpisActuels };

            for (const [cleDocker, kpiData] of Object.entries(kpisDocker)) {
              // Traduit le nom Docker → nom application
              const cleApp = MAPPING_KPI[idRobot]?.[cleDocker] ?? cleDocker;

              // Met à jour seulement si plus récent ou absent
              const horodatageRest = kpiData.updated_at ?? new Date().toISOString();
              const horodatageActuel = kpisActuels[cleApp]?.horodatage;

              if (!horodatageActuel || new Date(horodatageRest) >= new Date(horodatageActuel)) {
                maj[cleApp] = {
                  valeur:     kpiData.value,
                  unite:      kpiData.unit,
                  statut:     normaliserStatut(data.status),
                  horodatage: horodatageRest,
                };
              }
            }
            return { ...prev, [idRobot]: maj };
          });
        } catch {
          // Silencieux — le WebSocket reste la source principale
        }
      }
    };

    pollRest();
    const intervalle = setInterval(pollRest, 5000);
    return () => clearInterval(intervalle);
  }, []);

  return (
    <ContexteWebSocket.Provider value={{ donneesKpi, alertes, connecte, derniereMaj }}>
      {children}
    </ContexteWebSocket.Provider>
  );
}

// ── Hook d'accès ─────────────────────────────
export function utiliserWebSocket() {
  const ctx = useContext(ContexteWebSocket);
  if (!ctx) throw new Error('utiliserWebSocket doit être utilisé dans FournisseurWebSocket');
  return ctx;
}