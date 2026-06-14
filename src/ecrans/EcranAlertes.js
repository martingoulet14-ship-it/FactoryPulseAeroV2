// ─────────────────────────────────────────────
//  Écran : Alertes
//  Fusionne les alertes WebSocket (temps réel)
//  et les alertes REST (historique InfluxDB)
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COULEURS } from '../constantes/theme';
import { utiliserWebSocket } from '../services/ContexteWebSocket';
import ServiceApi from '../services/ServiceApi';
import CarteAlerte from '../composants/CarteAlerte';

export default function EcranAlertes() {
  const { alertes: alertesWs } = utiliserWebSocket();

  const [alertesRest,  setAlertesRest]  = useState([]);
  const [chargement,   setChargement]   = useState(false);
  const [erreur,       setErreur]       = useState(null);
  const [filtre,       setFiltre]       = useState('toutes'); // 'toutes' | 'critique' | 'warning'

  // Chargement initial + polling toutes les 15 s
  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      try {
        const data = await ServiceApi.obtenirAlertes(100);
        const liste = Array.isArray(data) ? data : (data.alerts ?? []);
        setAlertesRest(liste);
        setErreur(null);
      } catch (e) {
        setErreur(e.message);
      } finally {
        setChargement(false);
      }
    };

    charger();
    const intervalle = setInterval(charger, 15_000);
    return () => clearInterval(intervalle);
  }, []);

  // Fusion : les alertes WS (live) en premier, puis REST (historique)
  const toutesLesAlertes = [
    ...alertesWs,
    ...alertesRest.filter(
      (a) => !alertesWs.some((w) => w.horodatage === (a.timestamp ?? a.horodatage))
    ),
  ];

  // Filtrage par niveau
  const alertesFiltrees = toutesLesAlertes.filter((a) => {
    if (filtre === 'toutes')   return true;
    if (filtre === 'critique') return a.level === 'critical' || a.level === 'critique';
    if (filtre === 'warning')  return a.level === 'warning';
    return true;
  });

  const compteurCritiques = toutesLesAlertes.filter(
    (a) => a.level === 'critical' || a.level === 'critique'
  ).length;

  const compteurWarnings = toutesLesAlertes.filter(
    (a) => a.level === 'warning'
  ).length;

  return (
    <SafeAreaView style={styles.racine} edges={['top', 'bottom']}>

      {/* ── En-tête ──────────────────────────── */}
      <View style={styles.entete}>
        <Text style={styles.titre}>JOURNAL DES ALERTES</Text>
        <View style={styles.compteurs}>
          <View style={[styles.compteur, { borderColor: COULEURS.critique }]}>
            <Text style={[styles.compteurNombre, { color: COULEURS.critique }]}>
              {compteurCritiques}
            </Text>
            <Text style={styles.compteurLabel}>critique</Text>
          </View>
          <View style={[styles.compteur, { borderColor: COULEURS.warning }]}>
            <Text style={[styles.compteurNombre, { color: COULEURS.warning }]}>
              {compteurWarnings}
            </Text>
            <Text style={styles.compteurLabel}>warning</Text>
          </View>
        </View>
      </View>

      {/* ── Filtres ──────────────────────────── */}
      <View style={styles.filtres}>
        {[
          { cle: 'toutes',   label: 'Toutes' },
          { cle: 'critique', label: '🔴 Critiques' },
          { cle: 'warning',  label: '🟡 Warnings' },
        ].map(({ cle, label }) => (
          <TouchableOpacity
            key={cle}
            style={[styles.boutonFiltre, filtre === cle && styles.boutonFiltreActif]}
            onPress={() => setFiltre(cle)}
          >
            <Text style={[styles.texteFiltre, filtre === cle && styles.texteFiltreActif]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Contenu ──────────────────────────── */}
      {chargement && alertesFiltrees.length === 0 && (
        <ActivityIndicator color={COULEURS.accent} style={{ margin: 30 }} />
      )}

      {erreur && (
        <Text style={styles.texteErreur}>
          ⚠ Impossible de charger l'historique : {erreur}
        </Text>
      )}

      <FlatList
        data={alertesFiltrees}
        keyExtractor={(item) => item.id ?? `${item.robot}-${item.horodatage ?? item.timestamp}`}
        renderItem={({ item }) => <CarteAlerte alerte={item} />}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={
          !chargement && (
            <View style={styles.vide}>
              <Text style={styles.texteVide}>✓ Aucune alerte</Text>
              <Text style={styles.sousTexteVide}>La ligne fonctionne normalement</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  racine: { flex: 1, backgroundColor: COULEURS.fond },

  entete: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        14,
    paddingBottom:  10,
    borderBottomWidth: 1,
    borderBottomColor: COULEURS.bordure,
  },
  titre: {
    color:         COULEURS.texte,
    fontFamily:    'Courier New',
    fontSize:      13,
    fontWeight:    'bold',
    letterSpacing: 2,
  },
  compteurs: {
    flexDirection: 'row',
    gap:           8,
  },
  compteur: {
    borderWidth:       1,
    borderRadius:      6,
    paddingHorizontal: 10,
    paddingVertical:   4,
    alignItems:        'center',
  },
  compteurNombre: {
    fontFamily:  'Courier New',
    fontSize:    18,
    fontWeight:  'bold',
  },
  compteurLabel: {
    color:         COULEURS.texteMute,
    fontFamily:    'Courier New',
    fontSize:      8,
    letterSpacing: 1,
  },

  filtres: {
    flexDirection:  'row',
    padding:        12,
    gap:            8,
  },
  boutonFiltre: {
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      6,
    borderWidth:       1,
    borderColor:       COULEURS.bordure,
  },
  boutonFiltreActif: {
    borderColor:     COULEURS.accent,
    backgroundColor: COULEURS.accent + '18',
  },
  texteFiltre: {
    color:         COULEURS.texteMute,
    fontFamily:    'Courier New',
    fontSize:      11,
  },
  texteFiltreActif: {
    color: COULEURS.accent,
  },

  liste: {
    paddingHorizontal: 14,
    paddingBottom:     30,
  },
  vide: {
    alignItems:  'center',
    marginTop:   60,
  },
  texteVide: {
    color:         COULEURS.ok,
    fontFamily:    'Courier New',
    fontSize:      18,
    marginBottom:  8,
  },
  sousTexteVide: {
    color:     COULEURS.texteMute,
    fontSize:  13,
  },
  texteErreur: {
    color:     COULEURS.warning,
    fontFamily:'Courier New',
    fontSize:  11,
    padding:   14,
  },
});
