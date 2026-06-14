// ─────────────────────────────────────────────
//  Composant : CarteAlerte
//  Affiche une alerte dans la liste des alertes
// ─────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COULEURS, ROBOT_COULEURS } from '../constantes/theme';
import { couleurStatut, formaterHeure } from '../constantes/utilitaires';

export default function CarteAlerte({ alerte }) {
  const { robot, kpi, level, value, horodatage, timestamp } = alerte;
  const estCritique = level === 'critical' || level === 'critique';
  const couleur     = estCritique ? COULEURS.critique : COULEURS.warning;
  const couleurRobot = ROBOT_COULEURS[robot] ?? COULEURS.accent;
  const kpiLibelle  = kpi?.replace(/_/g, ' ') ?? '—';
  const heure       = formaterHeure(horodatage ?? timestamp);

  return (
    <View style={[styles.carte, { borderLeftColor: couleur }]}>
      <View style={styles.ligne}>
        {/* Robot */}
        <View style={[styles.pillule, { backgroundColor: couleurRobot + '22', borderColor: couleurRobot }]}>
          <Text style={[styles.pilluleTexte, { color: couleurRobot }]}>{robot}</Text>
        </View>

        {/* Niveau */}
        <View style={[styles.pillule, { backgroundColor: couleur + '22', borderColor: couleur }]}>
          <Text style={[styles.pilluleTexte, { color: couleur }]}>
            {estCritique ? '🔴 CRITIQUE' : '🟡 WARNING'}
          </Text>
        </View>

        <Text style={styles.heure}>{heure}</Text>
      </View>

      <Text style={styles.kpi}>{kpiLibelle.toUpperCase()}</Text>
      <Text style={styles.valeur} style={[styles.valeur, { color: couleur }]}>
        Valeur mesurée : <Text style={{ fontWeight: 'bold' }}>{value}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor:  COULEURS.carte,
    borderRadius:     8,
    padding:          12,
    marginBottom:     8,
    borderWidth:      1,
    borderColor:      COULEURS.bordure,
    borderLeftWidth:  3,
  },
  ligne: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    marginBottom:   6,
    flexWrap:       'wrap',
  },
  pillule: {
    borderRadius:      4,
    paddingHorizontal: 7,
    paddingVertical:   2,
    borderWidth:       1,
  },
  pilluleTexte: {
    fontFamily:    'Courier New',
    fontSize:      9,
    letterSpacing: 1,
  },
  heure: {
    color:         COULEURS.texteMute,
    fontFamily:    'Courier New',
    fontSize:      9,
    marginLeft:    'auto',
  },
  kpi: {
    color:         COULEURS.texte,
    fontFamily:    'Courier New',
    fontSize:      12,
    letterSpacing: 1,
    marginBottom:  4,
  },
  valeur: {
    fontFamily: 'Courier New',
    fontSize:   12,
  },
});
