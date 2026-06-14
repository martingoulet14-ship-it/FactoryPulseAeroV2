// ─────────────────────────────────────────────
//  Composant : CarteRobot
//  Carte résumé sur le dashboard principal
//  Affiche les 3 KPIs en temps réel et le
//  statut global du robot avec animation
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { COULEURS, ROBOT_COULEURS } from '../constantes/theme';
import { ROBOTS, KPI_DEFINITIONS } from '../constantes/config';
import { couleurStatut, tempsEcoule } from '../constantes/utilitaires';
import { utiliserWebSocket } from '../services/ContexteWebSocket';

export default function CarteRobot({ idRobot, onAppuyer }) {
  const { donneesKpi } = utiliserWebSocket();

  const kpisRobot    = donneesKpi[idRobot] ?? {};
  const metaRobot    = ROBOTS[idRobot];
  const couleurRobot = ROBOT_COULEURS[idRobot] ?? COULEURS.accent;

  // KPIs du type du robot
  const definitionsKpi = Object.values(KPI_DEFINITIONS[metaRobot?.type] ?? {});

  // 🔄 CALCUL DU STATUT ULTRA-SÉCURISÉ (Contourne le bug de pireStatutRobot)
  let statut = 'normal';
  let aDesDonnees = false;

  definitionsKpi.forEach((def) => {
    // On cherche d'abord la clé définie, sinon sa version générique 'temperature'
    const kpi = kpisRobot[def.cle] || kpisRobot['temperature'];
    if (kpi) {
      aDesDonnees = true;
      const statutKpi = (kpi.statut ?? 'normal').toLowerCase();
      if (statutKpi === 'critical' || statutKpi === 'critique') {
        statut = 'critique';
      } else if (statutKpi === 'warning' && statut !== 'critique') {
        statut = 'warning';
      }
    }
  });

  if (!aDesDonnees) statut = 'inconnu';
  const couleur = couleurStatut(statut);

  // Animation de clignotement en état critique
  const clignotement = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (statut === 'critique' || statut === 'critical') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(clignotement, { toValue: 0.25, duration: 450, useNativeDriver: true }),
          Animated.timing(clignotement, { toValue: 1,    duration: 450, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
    clignotement.setValue(1);
  }, [statut]);

  // Dernier horodatage connu
  const premierKpiConnu = Object.values(kpisRobot)[0];
  const dernierHorodatage = premierKpiConnu?.horodatage || premierKpiConnu?.timestamp;

  return (
    <TouchableOpacity onPress={onAppuyer} activeOpacity={0.75}>
      <View style={[styles.carte, { borderLeftColor: couleurRobot }]}>

        {/* ── Ligne d'en-tête ─────────────────── */}
        <View style={styles.entete}>
          <View style={styles.titreRangee}>
            <Animated.View style={[styles.voyant, { backgroundColor: couleur, opacity: clignotement }]} />
            <Text style={[styles.idRobot, { color: couleurRobot }]}>{idRobot}</Text>
            <View style={styles.pilluleType}>
              <Text style={styles.texteType}>
                {metaRobot?.type === 'percage' ? 'PERÇAGE' : 'RIVETAGE'}
              </Text>
            </View>
          </View>
          <View style={[styles.badgeStatut, { borderColor: couleur }]}>
            <Text style={[styles.texteStatut, { color: couleur }]}>{statut.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.labelRobot}>{metaRobot?.label || 'Robot Industriel'}</Text>

        {/* ── Valeurs KPI en grille ───────────── */}
        <View style={styles.grilleKpi}>
          {definitionsKpi.map((def) => {
            // 🔄 Récupération de la valeur blindée
            const kpi = kpisRobot[def.cle] || kpisRobot['temperature'];
            const couleurKpi  = couleurStatut(kpi?.statut ?? 'normal');
            
            // Gère si le backend envoie 'valeur' ou 'value'
            const valeurBrute = kpi?.valeur !== undefined ? kpi.valeur : kpi?.value;
            const valeurAff   = valeurBrute !== undefined ? Number(valeurBrute).toFixed(1) : '—';

            return (
              <View key={def.cle} style={styles.celluleKpi}>
                <Text style={styles.kpiLabel} numberOfLines={1}>
                  {def.label.split(' ').slice(0, 2).join(' ')}
                </Text>
                <Text style={[styles.kpiValeur, { color: couleurKpi }]}>{valeurAff}</Text>
                <Text style={styles.kpiUnite}>{def.unite}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Pied de carte ───────────────────── */}
        <Text style={styles.horodatage}>
          {dernierHorodatage ? `↻ mis à jour` : 'en attente…'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: COULEURS.carte,
    borderRadius:     8,
    padding:         14,
    marginBottom:    10,
    borderWidth:     1,
    borderColor:     COULEURS.bordure,
    borderLeftWidth: 3,
  },
  entete: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   4,
  },
  titreRangee: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  voyant: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  idRobot: {
    fontFamily:    'Courier New',
    fontSize:      17,
    fontWeight:    'bold',
    letterSpacing: 1,
  },
  pilluleType: {
    backgroundColor:  COULEURS.surfaceAlt,
    borderRadius:     4,
    paddingHorizontal: 6,
    paddingVertical:  2,
  },
  texteType: {
    color:         COULEURS.texteMute,
    fontFamily:    'Courier New',
    fontSize:      9,
    letterSpacing: 1.5,
  },
  badgeStatut: {
    borderWidth:       1,
    borderRadius:      4,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  texteStatut: {
    fontFamily:    'Courier New',
    fontSize:      9,
    letterSpacing: 1.5,
  },
  labelRobot: {
    color:         COULEURS.texteSub,
    fontSize:      11,
    marginBottom:  12,
  },
  grilleKpi: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   10,
  },
  celluleKpi: {
    flex:       1,
    alignItems: 'center',
  },
  kpiLabel: {
    color:         COULEURS.texteMute,
    fontFamily:    'Courier New',
    fontSize:      8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  3,
    textAlign:     'center',
  },
  kpiValeur: {
    fontFamily:  'Courier New',
    fontSize:    20,
    fontWeight:  'bold',
  },
  kpiUnite: {
    color:      COULEURS.texteMute,
    fontFamily: 'Courier New',
    fontSize:   8,
    marginTop:  1,
  },
  horodatage: {
    color:         COULEURS.texteMute,
    fontFamily:    'Courier New',
    fontSize:      9,
    textAlign:     'right',
    letterSpacing: 0.5,
  },
});