// ─────────────────────────────────────────────
//  Écran : Statut de la Ligne
//  Vue globale : statut opérationnel / bloqué,
//  dépendance séquentielle, résumé des robots
// ─────────────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COULEURS, ROBOT_COULEURS } from '../constantes/theme';
import { ROBOTS, getKpisDuRobot } from '../constantes/config';
import { utiliserWebSocket } from '../services/ContexteWebSocket';
import { utiliserStatutLigne } from '../hooks/utiliserStatutLigne';
import {
  pireStatutRobot,
  couleurStatut,
  formaterValeur,
} from '../constantes/utilitaires';

const TOUS_LES_ROBOTS = ['R-01', 'R-02', 'R-03', 'R-04'];

// ── Sous-composant : résumé d'un robot ────────
function RangeeRobot({ idRobot }) {
  const { donneesKpi } = utiliserWebSocket();
  const kpisRobot   = donneesKpi[idRobot] ?? {};
  const metaRobot   = ROBOTS[idRobot];
  const statut      = pireStatutRobot(donneesKpi, idRobot);
  const couleur     = couleurStatut(statut);
  const couleurBot  = ROBOT_COULEURS[idRobot] ?? COULEURS.accent;
  const definitions = getKpisDuRobot(idRobot);

  return (
    <View style={styles.rangeeRobot}>
      {/* Identité */}
      <View style={styles.identiteRobot}>
        <View style={[styles.voyant, { backgroundColor: couleur }]} />
        <Text style={[styles.idRobot, { color: couleurBot }]}>{idRobot}</Text>
        <Text style={styles.labelCourt}>{metaRobot?.court}</Text>
      </View>

      {/* KPIs condensés */}
      <View style={styles.kpisCondenses}>
        {definitions.map((def) => {
          const kpi = kpisRobot[def.cle];
          const c   = couleurStatut(kpi?.statut ?? 'inconnu');
          return (
            <View key={def.cle} style={styles.kpiCondense}>
              <Text style={[styles.valeurCondensee, { color: c }]}>
                {kpi?.valeur !== undefined ? kpi.valeur.toFixed(0) : '—'}
              </Text>
              <Text style={styles.uniteCondensee}>{def.unite}</Text>
            </View>
          );
        })}
      </View>

      {/* Statut */}
      <View style={[styles.badgeLigne, { borderColor: couleur }]}>
        <Text style={[styles.texteStatutLigne, { color: couleur }]}>
          {statut.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

// ── Écran principal ───────────────────────────
export default function EcranStatutLigne() {
  const { statut, chargement, recharger } = utiliserStatutLigne();

  const estBloque    = statut?.statut === 'bloque' || statut?.status === 'blocked';
  const couleurLigne = estBloque ? COULEURS.critique : COULEURS.ok;
  const libelleLigne = estBloque ? 'BLOQUÉE' : 'OPÉRATIONNELLE';

  return (
    <SafeAreaView style={styles.racine} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.contenu}>

        {/* ── Statut global de la ligne ─────────── */}
        <View style={[styles.carteStatutGlobal, { borderColor: couleurLigne }]}>
          {chargement ? (
            <ActivityIndicator color={COULEURS.accent} />
          ) : (
            <>
              <View style={[styles.voyantGrand, { backgroundColor: couleurLigne }]} />
              <Text style={[styles.titreStatutGlobal, { color: couleurLigne }]}>
                LIGNE {libelleLigne}
              </Text>
              {estBloque && statut?.cause && (
                <Text style={styles.causeBlockage}>
                  ▸ Cause : {statut.cause}
                </Text>
              )}
            </>
          )}
          <TouchableOpacity onPress={recharger} style={styles.boutonActualiser}>
            <Text style={styles.texteActualiser}>↻ Actualiser</Text>
          </TouchableOpacity>
        </View>

        {/* ── Dépendance séquentielle ───────────── */}
        <View style={styles.carteDependance}>
          <Text style={styles.titreDependance}>⛓  DÉPENDANCE SÉQUENTIELLE</Text>
          <View style={styles.chaineDependance}>
            {['R-01', 'R-02'].map((id) => (
              <View key={id} style={[styles.noeud, { borderColor: ROBOT_COULEURS[id] }]}>
                <Text style={[styles.noeudTexte, { color: ROBOT_COULEURS[id] }]}>{id}</Text>
                <Text style={styles.noeudLabel}>Perçage</Text>
              </View>
            ))}
            <Text style={styles.fleche}>→</Text>
            <View style={styles.noeudCondition}>
              <Text style={styles.noeudConditionTexte}>P3 {'>'} 1,5 %</Text>
              <Text style={styles.noeudConditionSous}>bloque</Text>
            </View>
            <Text style={styles.fleche}>→</Text>
            {['R-03', 'R-04'].map((id) => (
              <View key={id} style={[styles.noeud, { borderColor: ROBOT_COULEURS[id] }]}>
                <Text style={[styles.noeudTexte, { color: ROBOT_COULEURS[id] }]}>{id}</Text>
                <Text style={styles.noeudLabel}>Rivetage</Text>
              </View>
            ))}
          </View>
          <Text style={styles.texteDependance}>
            Si le taux de défauts de perçage de R-01 ou R-02 dépasse 1,5 %, les robots
            de rivetage R-03 et R-04 sont automatiquement arrêtés jusqu'à remise en conformité.
          </Text>
        </View>

        {/* ── Tableau récapitulatif des robots ─────── */}
        <Text style={styles.titreSectionRobots}>ÉTAT DE CHAQUE ROBOT</Text>

        {/* En-tête tableau */}
        <View style={styles.enteteTableau}>
          <Text style={[styles.enteteCellule, { flex: 2 }]}>Robot</Text>
          <Text style={[styles.enteteCellule, { flex: 3 }]}>KPIs</Text>
          <Text style={[styles.enteteCellule, { flex: 1.5, textAlign: 'right' }]}>Statut</Text>
        </View>

        {TOUS_LES_ROBOTS.map((id) => (
          <RangeeRobot key={id} idRobot={id} />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  racine:  { flex: 1, backgroundColor: COULEURS.fond },
  contenu: { padding: 14, paddingBottom: 40 },

  carteStatutGlobal: {
    backgroundColor: COULEURS.carte,
    borderRadius:    10,
    padding:         20,
    marginBottom:    16,
    borderWidth:     2,
    alignItems:      'center',
  },
  voyantGrand: {
    width:        16,
    height:       16,
    borderRadius: 8,
    marginBottom: 10,
  },
  titreStatutGlobal: {
    fontFamily:    'Courier New',
    fontSize:      20,
    fontWeight:    'bold',
    letterSpacing: 2,
    marginBottom:  4,
  },
  causeBlockage: {
    color:     COULEURS.warning,
    fontFamily:'Courier New',
    fontSize:  12,
    marginTop: 6,
    textAlign: 'center',
  },
  boutonActualiser: {
    marginTop: 14,
  },
  texteActualiser: {
    color:         COULEURS.accent,
    fontFamily:    'Courier New',
    fontSize:      12,
    letterSpacing: 1,
  },

  carteDependance: {
    backgroundColor: COULEURS.carte,
    borderRadius:    8,
    padding:         14,
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     COULEURS.bordureVive,
  },
  titreDependance: {
    color:         COULEURS.texteSub,
    fontFamily:    'Courier New',
    fontSize:      11,
    letterSpacing: 1.5,
    marginBottom:  12,
  },
  chaineDependance: {
    flexDirection:  'row',
    alignItems:     'center',
    flexWrap:       'wrap',
    gap:            6,
    marginBottom:   12,
  },
  noeud: {
    borderWidth:       1,
    borderRadius:      6,
    paddingHorizontal: 8,
    paddingVertical:   5,
    alignItems:        'center',
  },
  noeudTexte: {
    fontFamily:  'Courier New',
    fontSize:    12,
    fontWeight:  'bold',
  },
  noeudLabel: {
    color:      COULEURS.texteMute,
    fontFamily: 'Courier New',
    fontSize:   8,
  },
  noeudCondition: {
    backgroundColor: COULEURS.critique + '20',
    borderRadius:    6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems:      'center',
  },
  noeudConditionTexte: {
    color:      COULEURS.critique,
    fontFamily: 'Courier New',
    fontSize:   11,
    fontWeight: 'bold',
  },
  noeudConditionSous: {
    color:      COULEURS.critique,
    fontFamily: 'Courier New',
    fontSize:   8,
  },
  fleche: {
    color:      COULEURS.texteMute,
    fontSize:   18,
  },
  texteDependance: {
    color:      COULEURS.texteMute,
    fontFamily: 'Courier New',
    fontSize:   10,
    lineHeight: 16,
  },

  titreSectionRobots: {
    color:         COULEURS.texteMute,
    fontFamily:    'Courier New',
    fontSize:      10,
    letterSpacing: 2,
    marginBottom:  8,
  },

  enteteTableau: {
    flexDirection:    'row',
    paddingVertical:  6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COULEURS.bordure,
    marginBottom:      4,
  },
  enteteCellule: {
    color:         COULEURS.texteMute,
    fontFamily:    'Courier New',
    fontSize:      9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  rangeeRobot: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: COULEURS.carte,
    borderRadius:   6,
    marginBottom:   6,
    borderWidth:    1,
    borderColor:    COULEURS.bordure,
  },
  identiteRobot: {
    flex:          2,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  voyant: {
    width:        7,
    height:       7,
    borderRadius: 4,
  },
  idRobot: {
    fontFamily:    'Courier New',
    fontSize:      13,
    fontWeight:    'bold',
  },
  labelCourt: {
    color:      COULEURS.texteMute,
    fontFamily: 'Courier New',
    fontSize:   8,
  },
  kpisCondenses: {
    flex:          3,
    flexDirection: 'row',
    gap:           4,
  },
  kpiCondense: {
    flex:       1,
    alignItems: 'center',
  },
  valeurCondensee: {
    fontFamily:  'Courier New',
    fontSize:    13,
    fontWeight:  'bold',
  },
  uniteCondensee: {
    color:      COULEURS.texteMute,
    fontFamily: 'Courier New',
    fontSize:   7,
  },
  badgeLigne: {
    flex:              1.5,
    borderWidth:       1,
    borderRadius:      4,
    paddingVertical:   3,
    alignItems:        'center',
  },
  texteStatutLigne: {
    fontFamily:    'Courier New',
    fontSize:      8,
    letterSpacing: 1,
  },
});
