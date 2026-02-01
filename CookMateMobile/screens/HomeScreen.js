import React, { useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; 
import { cookmateAPI } from '../services/api';
import BottomTabs from '../components/BottomTabs';

const COLORS = { 
  primary: '#2D4F38', 
  background: '#F7F3E8', 
  white: '#FFFFFF', 
  accent: '#D4A056', 
  textSecondary: '#6B7280', 
  lightAccent: '#FEF3C7' 
};
const SHADOWS = { medium: { elevation: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 } };

const HomeScreen = ({ navigation, route }) => {
  const userId = route.params?.userId || 1;
  const username = route.params?.username || "Chef";

  const [stats, setStats] = useState({ xp: 0, streak: 0, most_cooked_recipe: "Loading...", total_sessions: 0 });
  const [loading, setLoading] = useState(false);

  // Helper to calculate level based on 100 XP per level
  const userLevel = Math.floor((stats.xp || 0) / 100) + 1;

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await cookmateAPI.getUserStats(userId);
      // Ensure we use the exact keys returned by your new Python logic
      setStats(data);
    } catch (error) {
      console.error("Stats Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>COOK MATE</Text>
          <Text style={styles.levelText}>LEVEL {userLevel} CHEF</Text>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>🔥 {stats.streak || 0}  |  ⭐ {stats.xp || 0}</Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} colors={[COLORS.primary]} />}
      >
        
        {/* GREETING SECTION */}
        <View style={styles.section}>
          <Text style={styles.greeting}>Hey, {username}! 👋</Text>
          <Text style={styles.subGreeting}>
            {stats.most_cooked_recipe && stats.most_cooked_recipe !== "Nothing yet!" 
              ? `Ready to cook more ${stats.most_cooked_recipe}?` 
              : "Time to start your cooking journey."}
          </Text>
        </View>

        {/* MAIN ACTION BUTTON */}
        <TouchableOpacity 
          style={styles.aiButton}
          onPress={() => navigation.navigate('GenerateRecipe', { userId })}
        >
          <View style={styles.aiIconBox}>
            <Ionicons name="sparkles" size={24} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.aiButtonText}>Generate New Recipe</Text>
            <Text style={styles.aiButtonSub}>Based on your pantry items</Text>
          </View>
        </TouchableOpacity>

        {/* DASHBOARD GRID */}
        <Text style={styles.sectionTitle}>Your Kitchen Stats</Text>
        <View style={styles.statsGrid}>
           {/* Meals Cooked (Now using the fixed total_sessions) */}
           <View style={styles.statBox}>
             <Ionicons name="restaurant" size={24} color={COLORS.primary} style={{marginBottom: 5}} />
             <Text style={styles.statValue}>{stats.total_sessions || 0}</Text>
             <Text style={styles.statLabel}>Meals Cooked</Text>
           </View>
           
           {/* Buy List */}
           <TouchableOpacity 
              style={[styles.statBox, { backgroundColor: COLORS.lightAccent, borderColor: COLORS.accent, borderWidth: 1 }]} 
              onPress={() => navigation.navigate('ShoppingList', { userId })}
           >
             <Ionicons name="cart" size={28} color={COLORS.accent} style={{marginBottom: 5}} />
             <Text style={[styles.statValue, {color: COLORS.accent}]}>Buy List</Text>
             <Text style={styles.statLabel}>Smart Reorders</Text>
           </TouchableOpacity>
        </View>

        {/* DAILY PICK */}
        <Text style={styles.sectionTitle}>Featured Pick</Text>
        <TouchableOpacity onPress={() => navigation.navigate('RecipeDetails', { userId })} activeOpacity={0.9}>
          <View style={styles.heroCard}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }} 
              style={styles.heroImage} 
            />
            <View style={styles.heroOverlay}>
              <View style={{flex: 1}}>
                <Text style={styles.heroTitle}>Chicken Avocado Wrap</Text>
                <Text style={styles.heroSubtitle}>High Protein • 15 mins</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={40} color={COLORS.white} />
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* NAVIGATION BAR */}
      <BottomTabs navigation={navigation} activeTab="Home" userId={userId} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1 },
  levelText: { fontSize: 12, color: COLORS.accent, fontWeight: 'bold', letterSpacing: 1 },
  xpBadge: { backgroundColor: COLORS.white, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, ...SHADOWS.medium },
  xpText: { fontWeight: 'bold', color: COLORS.accent, fontSize: 14 },
  
  section: { paddingHorizontal: 20, marginBottom: 20 },
  greeting: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary },
  subGreeting: { color: COLORS.textSecondary, marginTop: 5, fontSize: 16 },
  
  aiButton: { marginHorizontal: 20, marginBottom: 25, backgroundColor: COLORS.primary, padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', ...SHADOWS.medium },
  aiIconBox: { width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  aiButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
  aiButtonSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginLeft: 20, marginBottom: 10 },
  
  statsGrid: { flexDirection: 'row', gap: 15, paddingHorizontal: 20, marginBottom: 25 },
  statBox: { flex: 1, backgroundColor: COLORS.white, padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium, height: 120 },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 5 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },

  heroCard: { marginHorizontal: 20, marginBottom: 20, height: 220, borderRadius: 20, overflow: 'hidden', ...SHADOWS.medium },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', padding: 20, flexDirection: 'row', alignItems: 'center' },
  heroTitle: { color: COLORS.white, fontSize: 22, fontWeight: 'bold' },
  heroSubtitle: { color: COLORS.accent, fontWeight: 'bold' }
});

export default HomeScreen;