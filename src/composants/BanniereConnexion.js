// ─────────────────────────────────────────────
//  Composant : BanniereConnexion
//  Bandeau rouge visible quand le WebSocket
//  est déconnecté du backend
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COULEURS } from '../constantes/theme';
import { utiliserWebSocket } from '../services/ContexteWebSocket';

export default function BanniereConnexion() {
  const { connecte } = utiliserWebSocket();
  const opacite      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacite, {
      toValue:         connecte ? 0 : 1,
      duration:        400,
      useNativeDriver: true,
    }).start();
  }, [connecte]);

  return (
    <Animated.View style={[styles.bandeau, { opacity: opacite }]} pointerEvents="none">
      <View style={styles.point} />
      <Text style={styles.texte}>HORS LIGNE — Reconnexion en cours…</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bandeau: {
    backgroundColor:  '#2B0A12',
    borderBottomWidth: 1,
    borderBottomColor: COULEURS.critique,
    paddingVertical:   7,
    paddingHorizontal: 14,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
  },
  point: {
    width:        7,
    height:       7,
    borderRadius: 4,
    backgroundColor: COULEURS.critique,
  },
  texte: {
    color:       COULEURS.critique,
    fontSize:    11,
    fontFamily:  'Courier New',
    letterSpacing: 1.2,
  },
});
