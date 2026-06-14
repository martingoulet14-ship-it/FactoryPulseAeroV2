// ─────────────────────────────────────────────
//  App.js — Point d'entrée de l'application
//
//  Structure de navigation :
//    FournisseurWebSocket (connexion WS globale)
//    └─ NavigationContainer
//       └─ Tab.Navigator (3 onglets)
//          ├─ Tableau de bord
//          │   └─ Stack : EcranTableauDeBord → EcranDetailRobot
//          ├─ Alertes
//          │   └─ EcranAlertes
//          └─ Ligne
//              └─ EcranStatutLigne
// ─────────────────────────────────────────────

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { FournisseurWebSocket, utiliserWebSocket } from './src/services/ContexteWebSocket';
import ServiceNotifications from './src/services/ServiceNotifications';
import { COULEURS } from './src/constantes/theme';

import EcranTableauDeBord from './src/ecrans/EcranTableauDeBord';
import EcranDetailRobot   from './src/ecrans/EcranDetailRobot';
import EcranAlertes       from './src/ecrans/EcranAlertes';
import EcranStatutLigne   from './src/ecrans/EcranStatutLigne';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Icônes textuels (pas de lib requise) ──────
const ICONES = {
  'Tableau de bord': { actif: '▣', inactif: '▢' },
  'Alertes':         { actif: '⚑', inactif: '⚐' },
  'Ligne':           { actif: '◈', inactif: '◇' },
};

function IconeOnglet({ nom, actif, nbAlertes }) {
  const icone = ICONES[nom]?.[actif ? 'actif' : 'inactif'] ?? '●';
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: actif ? COULEURS.accent : COULEURS.texteMute, fontSize: 18 }}>
        {icone}
      </Text>
      {nom === 'Alertes' && nbAlertes > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeTexte}>{nbAlertes > 99 ? '99+' : nbAlertes}</Text>
        </View>
      )}
    </View>
  );
}

// ── Stack du tableau de bord ──────────────────
function StackTableauDeBord() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: COULEURS.surface },
        headerTintColor:  COULEURS.accent,
        headerTitleStyle: { fontFamily: 'Courier New', fontSize: 13, letterSpacing: 2 },
        headerShadowVisible: false,
        headerBackTitle:  'Retour',
      }}
    >
      <Stack.Screen
        name="TableauDeBord"
        component={EcranTableauDeBord}
        options={{ title: 'FACTORYPULSE AÉRO' }}
      />
      <Stack.Screen
        name="DetailRobot"
        component={EcranDetailRobot}
        options={({ route }) => ({
          title: `ROBOT ${route.params?.idRobot ?? ''}`,
        })}
      />
    </Stack.Navigator>
  );
}

// ── Onglets ───────────────────────────────────
function OngletsPrincipaux() {
  const { alertes } = utiliserWebSocket();
  const nbCritiques = alertes.filter(
    (a) => a.level === 'critical' || a.level === 'critique'
  ).length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown:          false,
        tabBarStyle:          styles.barreOnglets,
        tabBarActiveTintColor:   COULEURS.accent,
        tabBarInactiveTintColor: COULEURS.texteMute,
        tabBarLabelStyle:     styles.labelOnglet,
        tabBarIcon: ({ focused }) => (
          <IconeOnglet nom={route.name} actif={focused} nbAlertes={nbCritiques} />
        ),
      })}
    >
      <Tab.Screen name="Tableau de bord" component={StackTableauDeBord} />
      <Tab.Screen name="Alertes"         component={EcranAlertes} />
      <Tab.Screen name="Ligne"           component={EcranStatutLigne} />
    </Tab.Navigator>
  );
}

// ── Application racine ────────────────────────
export default function App() {
  useEffect(() => {
    ServiceNotifications.initialiser();
  }, []);

  return (
    <SafeAreaProvider>
      <FournisseurWebSocket>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={COULEURS.fond} />
          <OngletsPrincipaux />
        </NavigationContainer>
      </FournisseurWebSocket>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  barreOnglets: {
    backgroundColor:  COULEURS.surface,
    borderTopColor:   COULEURS.bordure,
    borderTopWidth:   1,
    paddingBottom:    8,
    paddingTop:       8,
    height:           68,
  },
  labelOnglet: {
    fontFamily:    'Courier New',
    fontSize:      9,
    letterSpacing: 1.2,
    marginTop:     2,
  },
  badge: {
    position:         'absolute',
    top:              -4,
    right:            -8,
    backgroundColor:  COULEURS.critique,
    borderRadius:     8,
    minWidth:         16,
    height:           16,
    alignItems:       'center',
    justifyContent:   'center',
    paddingHorizontal: 3,
  },
  badgeTexte: {
    color:      '#FFF',
    fontSize:   8,
    fontWeight: 'bold',
    fontFamily: 'Courier New',
  },
});
