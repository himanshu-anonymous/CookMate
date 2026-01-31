import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = { primary: '#2D4F38', background: '#F7F3E8', white: '#FFFFFF', accent: '#D4A056', textSecondary: '#6B7280' };
const SHADOWS = { medium: { elevation: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 } };

const HomeScreen = ({ navigation }) => {
  const [stats, setStats] = useState({ xp: 100, streak: 5 });

  return (
    <View style={styles.container}>
      {/* Header */}
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
        </View>

        {/* AI Generator Button */}
        <TouchableOpacity 
          style={styles.aiButton}
          onPress={() => navigation.navigate('GenerateRecipe')}
        >
          <Ionicons name="sparkles" size={24} color={COLORS.white} />
          <Text style={styles.aiButtonText}>Generate New Recipe</Text>
        </TouchableOpacity>

        {/* Featured Card */}
        <TouchableOpacity onPress={() => navigation.navigate('RecipeDetails')}>
          <View style={styles.heroCard}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }} style={styles.heroImage} />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>Healthy Salad Bowl</Text>
              <Text style={styles.heroSubtitle}>Tap to see Recipe</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Scanner')}>
              <Ionicons name="scan" size={24} color={COLORS.white} />
              <Text style={styles.actionText}>Scan Bill</Text>
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
  aiButton: { marginHorizontal: 20, marginBottom: 15, backgroundColor: COLORS.accent, padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium },
  aiButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  heroCard: { marginHorizontal: 20, marginBottom: 20, height: 200, borderRadius: 16, overflow: 'hidden' },
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