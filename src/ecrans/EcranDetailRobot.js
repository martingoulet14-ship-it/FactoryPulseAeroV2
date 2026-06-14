// ─────────────────────────────────────────────
//  Écran : Détail Robot
//  Affiche les 3 KPIs en jauge + graphes
//  historiques sur 1h et 24h
// ─────────────────────────────────────────────

import React, { useState } from 'react';
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
import { ROBOTS, getKpisDuRobot, KPI_DEFINITIONS } from '../constantes/config';
import { utiliserWebSocket } from '../services/ContexteWebSocket';
import { utiliserHistorique } from '../hooks/utiliserHistorique';
import { pireStatutRobot, couleurStatut } from '../constantes/utilitaires';
import JaugeKpi from '../composants/JaugeKpi';
import GraphiqueHistorique from '../composants/GraphiqueHistorique';

// ── Sous-composant : section graphe d'un KPI ──
function SectionGraphe({ idRobot, definition, fenetreHeures }) {
  const { donnees, chargement, erreur, recharger } = utiliserHistorique(
    idRobot,
    definition.cle,
    fenetreHeures
  );

  return (
    <View style={styles.sectionGraphe}>
      <View style={styles.enteteGraphe}>
        <Text style={styles.titreGraphe}>
          {definition.label.toUpperCase()} — {fenetreHeures === 1 ? '1 heure' : '24 heures'}
        </Text>
        <TouchableOpacity onPress={recharger}>
          <Text style={styles.boutonRecharger}>↻</Text>
        </TouchableOpacity>
      </View>

      {chargement && <ActivityIndicator color={COULEURS.accent} style={{ margin: 20 }} />}
      {erreur     && <Text style={styles.texteErreur}>Erreur : {erreur}</Text>}
      {!chargement && !erreur && (
        <GraphiqueHistorique
          donnees={donnees}
          statut="normal"
          unite={definition.unite}
        />
      )}
    </View>
  );
}

// ── Écran principal ───────────────────────────
export default function EcranDetailRobot({ route }) {
  const { idRobot } = route.params;
  const { donneesKpi } = utiliserWebSocket();

  const [fenetreHeures, setFenetreHeures] = useState(1);
  const [kpiSelectionne, setKpiSelectionne] = useState(null);

  const metaRobot    = ROBOTS[idRobot];
  const kpisRobot    = donneesKpi[idRobot] ?? {};
  const statut       = pireStatutRobot(donneesKpi, idRobot);
  const couleurRobot = ROBOT_COULEURS[idRobot] ?? COULEURS.accent;
  const definitions  = getKpisDuRobot(idRobot);

  // KPI sélectionné pour le graphe (défaut : le premier)
  const defSelectionnee = definitions.find((d) => d.cle === kpiSelectionne) ?? definitions[0];

  return (
    <SafeAreaView style={styles.racine} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.contenu}>

        {/* ── En-tête robot ───────────────────── */}
        <View style={[styles.enteteRobot, { borderLeftColor: couleurRobot }]}>
          <View>
            <Text style={[styles.idRobot, { color: couleurRobot }]}>{idRobot}</Text>
            <Text style={styles.labelRobot}>{metaRobot?.label}</Text>
          </View>
          <View style={[styles.badgeStatut, { borderColor: couleurStatut(statut) }]}>
            <Text style={[styles.texteStatut, { color: couleurStatut(statut) }]}>
              {statut.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Jauges KPI en temps réel ─────────── */}
        <Text style={styles.sectionTitre}>VALEURS EN TEMPS RÉEL</Text>
        {definitions.map((def) => {
          const kpi = kpisRobot[def.cle];
          return (
            <TouchableOpacity key={def.cle} onPress={() => setKpiSelectionne(def.cle)}>
              <View style={kpiSelectionne === def.cle ? styles.kpiSelectionne : null}>
                <JaugeKpi
                  definition={def}
                  valeur={kpi?.valeur}
                  statut={kpi?.statut}
                />
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ── Sélecteur de fenêtre temporelle ──── */}
        <Text style={styles.sectionTitre}>HISTORIQUE — {defSelectionnee?.label?.toUpperCase()}</Text>

        <View style={styles.selectorFenetre}>
          {[1, 24].map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.boutonFenetre, fenetreHeures === h && styles.boutonFenetreActif]}
              onPress={() => setFenetreHeures(h)}
            >
              <Text style={[styles.texteFenetre, fenetreHeures === h && styles.texteFenetreActif]}>
                {h === 1 ? '1 heure' : '24 heures'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Sélecteur de KPI pour le graphe ──── */}
        <View style={styles.selectorKpi}>
          {definitions.map((def) => (
            <TouchableOpacity
              key={def.cle}
              style={[
                styles.boutonKpi,
                defSelectionnee?.cle === def.cle && { borderColor: couleurRobot, backgroundColor: couleurRobot + '20' },
              ]}
              onPress={() => setKpiSelectionne(def.cle)}
            >
              <Text style={[
                styles.texteKpi,
                defSelectionnee?.cle === def.cle && { color: couleurRobot },
              ]}>
                {def.label.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Graphe historique ────────────────── */}
        {defSelectionnee && (
          <SectionGraphe
            idRobot={idRobot}
            definition={defSelectionnee}
            fenetreHeures={fenetreHeures}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  racine:  { flex: 1, backgroundColor: COULEURS.fond },
  contenu: { padding: 14, paddingBottom: 40 },

  enteteRobot: {
    backgroundColor: COULEURS.carte,
    borderRadius:    8,
    padding:         14,
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     COULEURS.bordure,
    borderLeftWidth: 3,
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
  },
  idRobot: {
    fontFamily:    'Courier New',
    fontSize:      22,
    fontWeight:    'bold',
    letterSpacing: 1,
  },
  labelRobot: {
    color:     COULEURS.texteSub,
    fontSize:  12,
    marginTop: 2,
  },
  badgeStatut: {
    borderWidth:       1,
    borderRadius:      6,
    paddingHorizontal: 10,
    paddingVertical:   5,
  },
  texteStatut: {
    fontFamily:    'Courier New',
    fontSize:      10,
    letterSpacing: 1.5,
  },

  sectionTitre: {
    color:         COULEURS.texteMute,
    fontFamily:    'Courier New',
    fontSize:      10,
    letterSpacing: 2,
    marginBottom:  10,
    marginTop:     14,
  },

  kpiSelectionne: {
    borderRadius: 8,
    borderWidth:  1,
    borderColor:  COULEURS.accent + '60',
  },

  selectorFenetre: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  10,
  },
  boutonFenetre: {
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      6,
    borderWidth:       1,
    borderColor:       COULEURS.bordure,
  },
  boutonFenetreActif: {
    borderColor:     COULEURS.accent,
    backgroundColor: COULEURS.accent + '20',
  },
  texteFenetre: {
    color:         COULEURS.texteMute,
    fontFamily:    'Courier New',
    fontSize:      12,
  },
  texteFenetreActif: {
    color: COULEURS.accent,
  },

  selectorKpi: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  12,
    flexWrap:      'wrap',
  },
  boutonKpi: {
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:      4,
    borderWidth:       1,
    borderColor:       COULEURS.bordure,
  },
  texteKpi: {
    color:         COULEURS.texteMute,
    fontFamily:    'Courier New',
    fontSize:      11,
  },

  sectionGraphe: {
    backgroundColor: COULEURS.carte,
    borderRadius:    8,
    padding:         12,
    borderWidth:     1,
    borderColor:     COULEURS.bordure,
    marginBottom:    10,
  },
  enteteGraphe: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   8,
  },
  titreGraphe: {
    color:         COULEURS.texteSub,
    fontFamily:    'Courier New',
    fontSize:      9,
    letterSpacing: 1.5,
  },
  boutonRecharger: {
    color:         COULEURS.accent,
    fontFamily:    'Courier New',
    fontSize:      16,
  },
  texteErreur: {
    color:      COULEURS.critique,
    fontFamily: 'Courier New',
    fontSize:   11,
    padding:    10,
  },
});
