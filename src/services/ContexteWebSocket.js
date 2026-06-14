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
import ServiceNotifications from './ServiceNotifications';

// ── Contexte ─────────────────────────────────
const ContexteWebSocket = createContext(null);

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
    // Changement ici : on utilise let pour pouvoir réassigner le nom de la clé kpi
    let { robot, kpi, value, unit, status } = msg;
    if (!robot || !kpi) return;

    // 🔄 TRADUCTION MAGIQUE : Reconnecte les données Docker ("temperature") aux écrans
    if (kpi === 'temperature') {
      if (robot === 'R01' || robot === 'R02') {
        kpi = 'temp_percage';
      } else if (robot === 'R03' || robot === 'R04') {
        kpi = 'temp_hydraulique';
      }
    }

    setDonneesKpi((prev) => ({
      ...prev,
      [robot]: {
        ...(prev[robot] ?? {}),
        [kpi]: {
          valeur:      value,
          unite:       unit,
          statut:      status ?? 'normal',
          horodatage:  new Date().toISOString(),
        },
      },
    }));
  }, []);

  // ── Gestion d'une alerte ────────────────────
  const traiterAlerte = useCallback((msg) => {
    let { robot, kpi } = msg;
    
    // Même traduction pour les alertes pour éviter les bugs visuels
    if (kpi === 'temperature') {
      if (robot === 'R01' || robot === 'R02') kpi = 'temp_percage';
      if (robot === 'R03' || robot === 'R04') kpi = 'temp_hydraulique';
    }

    const alerte = {
      ...msg,
      kpi,
      id:          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      horodatage:  new Date().toISOString(),
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