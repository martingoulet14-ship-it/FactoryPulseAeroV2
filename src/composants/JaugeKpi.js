// ─────────────────────────────────────────────
//  Composant : JaugeKpi
//  Affiche la valeur, le statut et une barre
//  de progression animée pour un KPI donné
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COULEURS } from '../constantes/theme';
import { couleurStatut, formaterValeur, calculerStatut } from '../constantes/utilitaires';

export default function JaugeKpi({ definition, valeur, statut }) {
  const { label, unite, min, max, seuilWarning, seuilCritique, alerteSiDessous, description } = definition;

  const animLargeur = useRef(new Animated.Value(0)).current;

  // Position de la valeur sur [min, max] → ratio [0, 1]
  const ratio = Math.max(0, Math.min(1, ((valeur ?? min) - min) / (max - min)));

  useEffect(() => {
    Animated.spring(animLargeur, {
      toValue:         ratio,
      useNativeDriver: false,
      tension:         60,
      friction:        9,
    }).start();
  }, [ratio]);

  const statutEffectif = statut ?? calculerStatut(valeur, definition);
  const couleur        = couleurStatut(statutEffectif);

  // Positions des marqueurs de seuil sur la barre
  const ratioWarning  = Math.max(0, Math.min(1, (seuilWarning  - min) / (max - min)));
  const ratioCritique = Math.max(0, Math.min(1, (seuilCritique - min) / (max - min)));

  return (
    <View style={styles.conteneur}>
      {/* En-tête : label + badge statut */}
      <View style={styles.entete}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <View style={[styles.badge, { backgroundColor: couleur + '20', borderColor: couleur }]}>
          <Text style={[styles.badgeTexte, { color: couleur }]}>
            {statutEffectif.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Valeur numérique */}
      <Text style={[styles.valeur, { color: couleur }]}>
        {formaterValeur(valeur, unite)}
      </Text>

      {/* Barre de progression */}
      <View style={styles.barreConteneur}>
        <View style={styles.barreFond} />

        <Animated.View
          style={[
            styles.barreRemplissage,
            {
              backgroundColor: couleur,
              width: animLargeur.interpolate({
                inputRange:  [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />

        {/* Marqueur seuil warning */}
        <View style={[styles.marqueur, { left: `${ratioWarning * 100}%`, borderColor: COULEURS.warning }]} />

        {/* Marqueur seuil critique */}
        <View style={[styles.marqueur, { left: `${ratioCritique * 100}%`, borderColor: COULEURS.critique }]} />
      </View>

      {/* Échelle min/max */}
      <View style={styles.echelle}>
        <Text style={styles.echelleTexte}>{min} {unite}</Text>
        <Text style={styles.echelleTexte}>{max} {unite}</Text>
      </View>

      {description ? (
        <Text style={styles.description} numberOfLines={1}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    backgroundColor: COULEURS.carte,
    borderRadius:    8,
    padding:         14,
    marginBottom:    10,
    borderWidth:     1,
    borderColor:     COULEURS.bordure,
  },
  entete: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   6,
  },
  label: {
    color:         COULEURS.texteSub,
    fontFamily:    'Courier New',
    fontSize:      10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    flex:          1,
    marginRight:   8,
  },
  badge: {
    borderRadius:    3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth:     1,
  },
  badgeTexte: {
    fontFamily:    'Courier New',
    fontSize:      9,
    letterSpacing: 1,
  },
  valeur: {
    fontFamily:  'Courier New',
    fontSize:    24,
    fontWeight:  'bold',
    marginBottom: 10,
  },
  barreConteneur: {
    height:    7,
    position:  'relative',
    marginBottom: 4,
  },
  barreFond: {
    position:     'absolute',
    inset:         0,
    backgroundColor: COULEURS.bordure,
    borderRadius: 4,
  },
  barreRemplissage: {
    position:     'absolute',
    top:           0,
    left:          0,
    bottom:        0,
    borderRadius:  4,
    opacity:       0.85,
  },
  marqueur: {
    position:    'absolute',
    top:         -3,
    width:       1,
    height:      13,
    borderLeftWidth: 1.5,
  },
  echelle: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      2,
  },
  echelleTexte: {
    color:      COULEURS.texteMute,
    fontFamily: 'Courier New',
    fontSize:   9,
  },
  description: {
    color:      COULEURS.texteMute,
    fontSize:   10,
    fontStyle:  'italic',
    marginTop:  6,
  },
});
