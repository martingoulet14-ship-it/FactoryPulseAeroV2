# FactoryPulse Aéro — Application Mobile

Application React Native / Expo de surveillance temps réel d'une ligne de rivetage A320.

---

## Structure du projet

```
FactoryPulseAeroV2/
├── App.js                          # Point d'entrée — navigation + providers
├── app.json                        # Config Expo
├── package.json
│
└── src/
    ├── constantes/
    │   ├── config.js               # ⚙️  URL backend + définitions KPIs + robots
    │   ├── theme.js                # 🎨 Palette de couleurs
    │   └── utilitaires.js          # 🔧 Fonctions helpers partagées
    │
    ├── services/
    │   ├── ContexteWebSocket.js    # 🔌 Flux temps réel (WebSocket)
    │   ├── ServiceApi.js           # 🌐 Appels REST vers FastAPI
    │   └── ServiceNotifications.js # 🔔 Notifications push locales
    │
    ├── hooks/
    │   ├── utiliserHistorique.js   # 📈 Historique InfluxDB via REST
    │   └── utiliserStatutLigne.js  # 🏭 Statut global de la ligne
    │
    ├── composants/
    │   ├── BanniereConnexion.js    # 📶 Bandeau hors-ligne
    │   ├── CarteRobot.js           # 🤖 Carte résumé d'un robot
    │   ├── CarteAlerte.js          # ⚠️  Item d'une alerte
    │   ├── JaugeKpi.js             # 📊 Jauge animée d'un KPI
    │   └── GraphiqueHistorique.js  # 📉 Graphe SVG historique
    │
    └── ecrans/
        ├── EcranTableauDeBord.js   # 🏠 Écran principal (4 robots)
        ├── EcranDetailRobot.js     # 🔍 Détail d'un robot (jauges + graphes)
        ├── EcranAlertes.js         # 🚨 Journal des alertes
        └── EcranStatutLigne.js     # 🏭 Statut global de la ligne
```

---

## Installation

### Prérequis

- Node.js ≥ 18
- Expo CLI : `npm install -g expo-cli`
- Application **Expo Go** sur votre téléphone (iOS ou Android)

### Étapes

```bash
# 1. Installer les dépendances
cd FactoryPulseAeroV2
npm install

# 2. Configurer l'IP du backend
#    Ouvrez src/constantes/config.js
#    Remplacez ADRESSE_BACKEND par l'IP de la machine
#    qui fait tourner docker compose

# 3. Lancer l'application
npx expo start

# 4. Scanner le QR code avec Expo Go (même réseau Wi-Fi que le backend)
```

---

## Configuration réseau

Ouvrez `src/constantes/config.js` et modifiez :

```js
export const ADRESSE_BACKEND = '192.168.1.100'; // ← Votre IP ici
```

| Situation | Valeur |
|---|---|
| Réseau local (Wi-Fi) | IP de votre machine (ex: `192.168.1.42`) |
| Émulateur Android | `10.0.2.2` |
| Simulateur iOS | `localhost` |

Trouvez votre IP :
- **macOS/Linux** : `ifconfig | grep inet`
- **Windows** : `ipconfig` → adresse IPv4

> ⚠️ Votre téléphone et le PC faisant tourner Docker **doivent être sur le même réseau Wi-Fi**.

---

## Ce que fait l'application

### Onglet "Tableau de bord"
- Affiche les 4 robots en temps réel via **WebSocket**
- Statut global de la ligne (pire statut parmi tous les robots)
- Clignotement rouge en cas d'alerte critique
- Appui sur un robot → écran détail

### Écran détail d'un robot
- 3 **jauges animées** avec marqueurs de seuil warning/critique
- Sélection du KPI à afficher
- **Graphe historique** 1h ou 24h depuis InfluxDB (via REST)
- Rafraîchissement auto toutes les 30 secondes

### Onglet "Alertes"
- Journal des alertes en temps réel (WebSocket) + historique (REST)
- Filtres : toutes / critiques / warnings
- Compteurs par niveau

### Onglet "Ligne"
- Statut opérationnel / bloqué de la ligne
- Visualisation de la dépendance séquentielle R-01/R-02 → R-03/R-04
- Tableau récapitulatif de tous les robots

### Notifications push
- Déclenchées automatiquement à chaque alerte warning ou critique
- Fonctionnelles **sur appareil physique** (pas sur simulateur)

---

## Format des messages WebSocket attendus du backend

L'application accepte les formats suivants depuis `/ws/live` :

```json
// KPI unique
{ "type": "kpi", "robot": "R-01", "kpi": "temp_percage", "value": 74.2, "unit": "°C", "status": "normal" }

// Lot de KPIs (plus efficace)
{ "type": "kpi_batch", "data": [ ...liste de messages kpi... ] }

// Alerte
{ "type": "alert", "robot": "R-01", "kpi": "temp_percage", "level": "critical", "value": 96.2 }

// Compatibilité : objet KPI brut sans champ "type"
{ "robot": "R-01", "kpi": "temp_percage", "value": 74.2, "unit": "°C", "status": "normal" }
```

---

## Endpoints REST utilisés

| Méthode | Route | Usage |
|---|---|---|
| GET | `/robots` | Liste des robots |
| GET | `/robots/{id}/kpis` | Dernières valeurs KPIs |
| GET | `/robots/{id}/history?kpi=&from=&to=` | Historique InfluxDB |
| GET | `/alerts?limit=100` | Journal des alertes |
| GET | `/line/status` | Statut opérationnel/bloqué |
| WS | `/ws/live` | Flux temps réel |

---

## Dépannage

**"Network request failed" / WebSocket ne se connecte pas**
→ Vérifiez que `ADRESSE_BACKEND` dans `config.js` correspond à l'IP de la machine Docker
→ Vérifiez que le téléphone est sur le même réseau Wi-Fi
→ Testez depuis un navigateur : `http://IP:8000/robots`

**Notifications push qui ne s'affichent pas**
→ Les notifications requièrent un **appareil physique** (pas un simulateur)
→ Acceptez les permissions au premier lancement

**Graphes vides**
→ Normal si InfluxDB ne contient pas encore d'historique
→ Attendez quelques minutes que le simulateur produise des données
