// ─────────────────────────────────────────────
//  Composant : GraphiqueHistorique
//  Trace l'historique d'un KPI en SVG natif
//  Pas de bibliothèque externe requise
// ─────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Polyline, Line, Text as SvgText, Rect } from 'react-native-svg';
import { COULEURS } from '../constantes/theme';
import { couleurStatut } from '../constantes/utilitaires';

const MARGES = { haut: 12, bas: 28, gauche: 38, droite: 12 };

export default function GraphiqueHistorique({ donnees = [], statut = 'normal', unite = '', hauteur = 140 }) {
  const { width: largeurEcran } = useWindowDimensions();
  const largeur = largeurEcran - 28; // Padding de l'écran

  if (!donnees || donnees.length < 2) {
    return (
      <View style={[styles.vide, { height: hauteur }]}>
        <Text style={styles.videTexte}>Aucune donnée historique</Text>
      </View>
    );
  }

  const couleur  = couleurStatut(statut);
  const valeurs  = donnees.map((d) => (typeof d === 'number' ? d : d.value ?? d.valeur ?? 0));
  const temps    = donnees.map((d, i) => (d.time ? new Date(d.time).getTime() : i * 1000));

  const minVal = Math.min(...valeurs);
  const maxVal = Math.max(...valeurs);
  const rangeV = maxVal - minVal || 1;

  const minT   = Math.min(...temps);
  const maxT   = Math.max(...temps);
  const rangeT = maxT - minT || 1;

  const zoneW = largeur  - MARGES.gauche - MARGES.droite;
  const zoneH = hauteur  - MARGES.haut   - MARGES.bas;

  // Calcul des points polyline
  const points = valeurs.map((v, i) => {
    const x = MARGES.gauche + ((temps[i] - minT) / rangeT) * zoneW;
    const y = MARGES.haut   + zoneH - ((v - minVal) / rangeV) * zoneH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // 3 graduations Y
  const graduations = [minVal, (minVal + maxVal) / 2, maxVal];

  // Horodatages début/fin
  const horaireDebut = donnees[0]?.time
    ? new Date(donnees[0].time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';
  const horaireFin = donnees[donnees.length - 1]?.time
    ? new Date(donnees[donnees.length - 1].time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={styles.conteneur}>
      <Svg width={largeur} height={hauteur}>
        {/* Graduations Y */}
        {graduations.map((val, i) => {
          const y = MARGES.haut + zoneH - ((val - minVal) / rangeV) * zoneH;
          return (
            <React.Fragment key={i}>
              <Line
                x1={MARGES.gauche}
                y1={y}
                x2={largeur - MARGES.droite}
                y2={y}
                stroke={COULEURS.bordure}
                strokeWidth="1"
                strokeDasharray="3,4"
              />
              <SvgText
                x={MARGES.gauche - 4}
                y={y + 4}
                textAnchor="end"
                fontSize="9"
                fill={COULEURS.texteMute}
                fontFamily="Courier New"
              >
                {val.toFixed(0)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Courbe de données */}
        <Polyline
          points={points}
          fill="none"
          stroke={couleur}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Unité */}
        <SvgText
          x={MARGES.gauche}
          y={hauteur - 4}
          fontSize="8"
          fill={COULEURS.texteMute}
          fontFamily="Courier New"
        >
          {horaireDebut}
        </SvgText>
        <SvgText
          x={largeur - MARGES.droite}
          y={hauteur - 4}
          textAnchor="end"
          fontSize="8"
          fill={COULEURS.texteMute}
          fontFamily="Courier New"
        >
          {horaireFin}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    backgroundColor: COULEURS.surfaceAlt,
    borderRadius:    6,
    overflow:        'hidden',
    marginBottom:    4,
  },
  vide: {
    justifyContent: 'center',
    alignItems:     'center',
    backgroundColor: COULEURS.surfaceAlt,
    borderRadius:   6,
  },
  videTexte: {
    color:      COULEURS.texteMute,
    fontFamily: 'Courier New',
    fontSize:   11,
  },
});
