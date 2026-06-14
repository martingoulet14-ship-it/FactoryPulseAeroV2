// ─────────────────────────────────────────────
//  Écran : Tableau de Bord
//  Vue principale — 4 robots en temps réel
//  Connexion WebSocket + navigation vers détail
// ─────────────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COULEURS } from '../constantes/theme';
import { utiliserWebSocket } from '../services/ContexteWebSocket';
import { pireStatutRobot, couleurStatut } from '../constantes/utilitaires';
import CarteRobot from '../composants/CarteRobot';
import BanniereConnexion from '../composants/BanniereConnexion';

const TOUS_LES_ROBOTS = ['R01', 'R02', 'R03', 'R04'];

export default function EcranTableauDeBord({ navigation }) {
  const { donneesKpi, connecte, derniereMaj } = utiliserWebSocket();

  // Statut global = pire statut parmi tous les robots
  const statutGlobal = TOUS_LES_ROBOTS.reduce((pire, id) => {
    const s = pireStatutRobot(donneesKpi, id);
    const ordre = { critique: 3, warning: 2, normal: 1, inconnu: 0 };
    return (ordre[s] ?? 0) > (ordre[pire] ?? 0) ? s : pire;
  }, 'inconnu');

  const couleurGlobale = couleurStatut(statutGlobal);

  const allerVersDetail = (idRobot) => {
    navigation.navigate('DetailRobot', { idRobot });
  };

  return (
    <SafeAreaView style={styles.racine} edges={['bottom']}>
      <BanniereConnexion />

      <ScrollView
        style={styles.defilement}
        contentContainerStyle={styles.contenu}
        refreshControl={<RefreshControl refreshing={false} tintColor={COULEURS.accent} />}
      >
        {/* ── En-tête de ligne ─────────────────── */}
        <View style={styles.entete}>
          <View>
            <Text style={styles.titreLigne}>LIGNE DE RIVETAGE A320</Text>
            <Text style={styles.sousTitre}>Saint-Nazaire · Section fuselage avant</Text>
          </View>
          <View style={[styles.badgeGlobal, { borderColor: couleurGlobale }]}>
            <View style={[styles.voyantGlobal, { backgroundColor: couleurGlobale }]} />
            <Text style={[styles.texteStatutGlobal, { color: couleurGlobale }]}>
              {statutGlobal.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Indicateur WebSocket ──────────────── */}
        <View style={styles.rangeeWs}>
          <View style={[styles.pointWs, { backgroundColor: connecte ? COULEURS.ok : COULEURS.critique }]} />
          <Text style={styles.texteWs}>
            {connecte
              ? `WebSocket live · MAJ ${derniereMaj?.toLocaleTimeString('fr-FR') ?? '—'}`
              : 'WebSocket déconnecté'}
          </Text>
        </View>

        {/* ── Robots de perçage ────────────────── */}
        <Text style={styles.enteteSection}>— ROBOTS DE PERÇAGE (FlexTrack)</Text>
        {['R01', 'R02'].map((id) => (
          <CarteRobot key={id} idRobot={id} onAppuyer={() => allerVersDetail(id)} />
        ))}

        {/* ── Robots de rivetage ───────────────── */}
        <Text style={styles.enteteSection}>— ROBOTS DE RIVETAGE (Kuka 7 axes)</Text>
        {['R03', 'R04'].map((id) => (
          <CarteRobot key={id} idRobot={id} onAppuyer={() => allerVersDetail(id)} />
        ))}

        {/* ── Note dépendance séquentielle ─────── */}
        <View style={styles.noteDependance}>
          <Text style={styles.texteNote}>
            ⛓  Dépendance séquentielle — R-03 et R-04 sont automatiquement bloqués
            si le taux de défauts de perçage de R-01 dépasse 1,5 %.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  racine:    { flex: 1, backgroundColor: COULEURS.fond },
  defilement: { flex: 1 },
  contenu:   { padding: 14, paddingBottom: 32 },

  entete: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   8,
  },
  titreLigne: {
    color:         COULEURS.texte,
    fontFamily:    'Courier New',
    fontSize:      13,
    letterSpacing: 2,
    fontWeight:    'bold',
  },
  sousTitre: {
    color:     COULEURS.texteMute,
    fontSize:  11,
    marginTop: 2,
  },
  badgeGlobal: {
    flexDirection:     'row',
    alignItems:        'center',
    borderWidth:       1,
    borderRadius:      6,
    paddingHorizontal: 10,
    paddingVertical:   5,
    gap:               6,
  },
  voyantGlobal: {
    width:        7,
    height:       7,
    borderRadius: 4,
  },
  texteStatutGlobal: {
    fontFamily:    'Courier New',
    fontSize:      10,
    letterSpacing: 1.5,
  },
  rangeeWs: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginBottom:  16,
  },
  pointWs: {
    width:        5,
    height:       5,
    borderRadius: 3,
  },
  texteWs: {
    color:         COULEURS.texteMute,
    fontFamily:    'Courier New',
    fontSize:      10,
  },
  enteteSection: {
    color:         COULEURS.texteMute,
    fontFamily:    'Courier New',
    fontSize:      10,
    letterSpacing: 1.8,
    marginBottom:  8,
    marginTop:     6,
  },
  noteDependance: {
    backgroundColor: COULEURS.surfaceAlt,
    borderRadius:    6,
    padding:         12,
    borderWidth:     1,
    borderColor:     COULEURS.bordure,
    marginTop:       8,
  },
  texteNote: {
    color:      COULEURS.texteMute,
    fontFamily: 'Courier New',
    fontSize:   10,
    lineHeight: 16,
  },
});
