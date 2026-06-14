// ─────────────────────────────────────────────
//  Service Notifications
//  Gère les permissions et l'envoi de
//  notifications push locales depuis les alertes
// ─────────────────────────────────────────────

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Les notifs s'affichent même app au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

const ServiceNotifications = {
  // Initialisation : demande des permissions + création des canaux Android
  async initialiser() {
    if (!Device.isDevice) {
      console.log('[Notifs] Appareil simulé — permissions limitées');
      return false;
    }

    const { status: existant } = await Notifications.getPermissionsAsync();
    let statut = existant;

    if (existant !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      statut = status;
    }

    if (statut !== 'granted') {
      console.warn('[Notifs] Permission refusée par l\'utilisateur');
      return false;
    }

    // Canaux Android spécifiques par niveau d'alerte
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('canal-critique', {
        name:              'Alertes critiques',
        importance:        Notifications.AndroidImportance.MAX,
        vibrationPattern:  [0, 300, 200, 300],
        lightColor:        '#FF3B55',
        sound:             true,
      });
      await Notifications.setNotificationChannelAsync('canal-warning', {
        name:       'Avertissements',
        importance: Notifications.AndroidImportance.HIGH,
        sound:      true,
      });
    }

    console.log('[Notifs] Service initialisé avec succès');
    return true;
  },

  // Envoie une notification locale à partir d'une alerte reçue du backend
  async envoyerNotificationAlerte(alerte) {
    const { robot, kpi, level, value } = alerte;
    const estCritique = level === 'critical' || level === 'critique';

    const titre = estCritique
      ? `🔴 CRITIQUE — ${robot}`
      : `🟡 AVERTISSEMENT — ${robot}`;

    const kpiLibelle = kpi?.replace(/_/g, ' ').toUpperCase();
    const corps      = `${kpiLibelle} : ${value} — Intervention requise`;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title:    titre,
          body:     corps,
          data:     alerte,
          sound:    true,
          ...(Platform.OS === 'android' && {
            channelId: estCritique ? 'canal-critique' : 'canal-warning',
          }),
        },
        trigger: null, // Envoi immédiat
      });
    } catch (erreur) {
      console.warn('[Notifs] Échec envoi notification :', erreur.message);
    }
  },
};

export default ServiceNotifications;
