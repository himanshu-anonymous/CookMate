import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { cookmateAPI } from '../services/api';
import BottomTabs from '../components/BottomTabs';

const COLORS = { primary: '#2D4F38', background: '#F7F3E8', white: '#FFFFFF', accent: '#D4A056', text: '#1F2937', textSecondary: '#6B7280', lightAccent: '#FEF3C7' };

const ProfileScreen = ({ navigation, route }) => {
  const userId = route.params?.userId || 1;
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [tempSkill, setTempSkill] = useState(5);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileData, statsData] = await Promise.all([
        cookmateAPI.getUserProfile(userId),
        cookmateAPI.getUserStats(userId)
      ]);
      setProfile(profileData);
      setStats(statsData);
      setTempSkill(profileData.cooking_skill || 5);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveSkill = async () => {
    try {
      await cookmateAPI.updateCookingSkill(userId, tempSkill);
      setProfile(prev => ({ ...prev, cooking_skill: tempSkill }));
      setEditModalVisible(false);
      Alert.alert("Updated!", `Cooking Skill set to ${tempSkill}/10.`);
    } catch (error) {
      Alert.alert("Error", "Could not update skill.");
    }
  };

  const InfoRow = ({ label, value, icon }) => (
    <View style={styles.infoRow}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
        <Ionicons name={icon} size={20} color={COLORS.textSecondary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={{fontSize: 40}}>👨‍🍳</Text>
          </View>
          <Text style={styles.username}>{profile?.username || "Chef"}</Text>
          <View style={styles.personaBadge}>
            <Text style={styles.personaText}>{(profile?.persona || "Student").toUpperCase()}</Text>
          </View>
        </View>

        {/* GAMIFICATION STATS */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.streak || 0} 🔥</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[styles.statBox, {borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#eee'}]}>
             <Text style={styles.statNumber}>{stats?.xp || 0} ⭐</Text>
             <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statBox}>
             <Text style={styles.statNumber}>{stats?.total_sessions || 0} 🥘</Text>
             <Text style={styles.statLabel}>Cooked</Text>
          </View>
        </View>

        {/* SECTION: BODY STATS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Body & Health</Text>
          <InfoRow label="Age" value={`${profile?.age} yrs`} icon="calendar-outline" />
          <InfoRow label="Weight" value={`${profile?.weight} kg`} icon="fitness-outline" />
          <InfoRow label="Height" value={`${profile?.height} cm`} icon="resize-outline" />
          <InfoRow label="Goal" value={profile?.health_goal} icon="trophy-outline" />
        </View>

        {/* SECTION: DIET & PREFERENCES */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dietary Profile</Text>
          <InfoRow label="Preference" value={profile?.dietary_preferences?.[0] || profile?.dietary_preferences || "None"} icon="nutrition-outline" />
          <InfoRow label="Rotis / Meal" value={profile?.rotis_per_meal} icon="disc-outline" />
          <InfoRow label="Allergies" value={profile?.allergies?.length > 0 ? profile.allergies.join(", ") : "None"} icon="alert-circle-outline" />
        </View>

        {/* SECTION: SKILLS (Editable) */}
        <View style={styles.card}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text style={styles.cardTitle}>Cooking Skill</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(true)}>
              <Text style={{color: COLORS.accent, fontWeight: 'bold'}}>EDIT</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.skillBarContainer}>
             <View style={[styles.skillBarFill, { width: `${(profile?.cooking_skill / 10) * 100}%` }]} />
          </View>
          <Text style={{textAlign: 'right', marginTop: 5, color: COLORS.textSecondary, fontSize: 12}}>Level {profile?.cooking_skill} / 10</Text>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Skill Level</Text>
            <Text style={{textAlign: 'center', marginBottom: 20, fontSize: 40}}>{tempSkill}</Text>
            
            <View style={{flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 20}}>
               {[1, 3, 5, 7, 9, 10].map(n => (
                 <TouchableOpacity 
                   key={n} 
                   style={[styles.skillBtn, tempSkill === n && {backgroundColor: COLORS.primary}]} 
                   onPress={() => setTempSkill(n)}>
                   <Text style={{color: tempSkill === n ? 'white' : 'black'}}>{n}</Text>
                 </TouchableOpacity>
               ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveSkill}>
              <Text style={{color: 'white', fontWeight: 'bold'}}>Save Changes</Text>
            </TouchableOpacity>
             <TouchableOpacity style={{marginTop: 15}} onPress={() => setEditModalVisible(false)}>
              <Text style={{color: COLORS.textSecondary}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomTabs navigation={navigation} activeTab="Profile" userId={userId} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginTop: 60, marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', elevation: 5, marginBottom: 10 },
  username: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  personaBadge: { backgroundColor: COLORS.lightAccent, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 5 },
  personaText: { color: COLORS.accent, fontWeight: 'bold', fontSize: 12 },

  statsContainer: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 20, borderRadius: 15, padding: 15, elevation: 3, marginBottom: 20 },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary },

  card: { backgroundColor: COLORS.white, marginHorizontal: 20, marginBottom: 15, padding: 20, borderRadius: 15, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { color: COLORS.text, fontSize: 14 },
  infoValue: { fontWeight: 'bold', color: COLORS.primary },

  skillBarContainer: { height: 10, backgroundColor: '#eee', borderRadius: 5, overflow: 'hidden' },
  skillBarFill: { height: '100%', backgroundColor: COLORS.accent },

  logoutBtn: { margin: 20, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444', alignItems: 'center' },
  logoutText: { color: '#EF4444', fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 25, borderRadius: 20, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  skillBtn: { width: 35, height: 35, borderRadius: 18, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20, marginTop: 10 }
});

export default ProfileScreen;