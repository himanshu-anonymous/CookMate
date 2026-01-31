import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { cookmateAPI } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [stats, setStats] = useState({ xp: 0, streak: 0 });

  useEffect(() => {
    // Fetch stats on load (User ID 1 is hardcoded for demo)
    cookmateAPI.getUserStats(1).then(setStats).catch(console.error);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>COOK MATE</Text>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>🔥 {stats.streak} | ⭐ {stats.xp}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.greeting}>Hey, Chef! 👋</Text>
          <Text style={styles.subGreeting}>Time to cook.</Text>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput placeholder="Search recipes..." style={styles.searchInput} />
          </View>
        </View>

        {/* CLICKABLE CARD -> Goes to Recipe Details */}
        <TouchableOpacity onPress={() => navigation.navigate('RecipeDetails')}>
          <View style={styles.heroCard}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }} style={styles.heroImage} />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>Healthy Salad Bowl</Text>
              <Text style={styles.heroSubtitle}>Tap to see Recipe & Macros</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Scanner')}>
              <Ionicons name="scan" size={24} color={COLORS.white} />
              <Text style={styles.actionText}>Scan Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.accent }]} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person" size={24} color={COLORS.white} />
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  xpBadge: { backgroundColor: COLORS.white, padding: 5, borderRadius: 10, ...SHADOWS.medium },
  xpText: { fontWeight: 'bold', color: COLORS.accent },
  section: { padding: 20 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
  subGreeting: { color: COLORS.textSecondary },
  searchBar: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 12, borderRadius: 16, marginTop: 15 },
  searchInput: { marginLeft: 10, flex: 1 },
  heroCard: { margin: 20, height: 200, borderRadius: 16, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.5)', padding: 15 },
  heroTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  heroSubtitle: { color: COLORS.accent },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 },
  grid: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: COLORS.primary, padding: 20, borderRadius: 16, alignItems: 'center' },
  actionText: { color: COLORS.white, fontWeight: 'bold', marginTop: 5 }
});

export default HomeScreen;