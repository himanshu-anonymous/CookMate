import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = { primary: '#2D4F38', white: '#FFFFFF', active: '#D4A056', inactive: '#A3B1AA' };

const BottomTabs = ({ navigation, activeTab, userId }) => {
  return (
    <View style={styles.bar}>
      {/* Home Tab */}
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => navigation.navigate('Home', { userId: userId })}
      >
        <Ionicons name="home" size={24} color={activeTab === 'Home' ? COLORS.active : COLORS.inactive} />
        <Text style={[styles.label, activeTab === 'Home' && styles.activeLabel]}>Home</Text>
      </TouchableOpacity>

      {/* Pantry Tab */}
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => navigation.navigate('Inventory', { userId: userId })}
      >
        <Ionicons name="nutrition" size={24} color={activeTab === 'Inventory' ? COLORS.active : COLORS.inactive} />
        <Text style={[styles.label, activeTab === 'Inventory' && styles.activeLabel]}>Pantry</Text>
      </TouchableOpacity>

      {/* Scan Tab (Middle Button) */}
      <TouchableOpacity 
        style={styles.scanBtn} 
        onPress={() => navigation.navigate('Scanner', { userId: userId })}
      >
        <Ionicons name="scan" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Chef Tab */}
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => navigation.navigate('GenerateRecipe', { userId: userId })}
      >
        <Ionicons name="restaurant" size={24} color={activeTab === 'Chef' ? COLORS.active : COLORS.inactive} />
        <Text style={[styles.label, activeTab === 'Chef' && styles.activeLabel]}>Chef</Text>
      </TouchableOpacity>

      {/* Profile Tab (FIXED) */}
      <TouchableOpacity 
        style={styles.tab}
        onPress={() => navigation.navigate('Profile', { userId: userId })}
      >
        <Ionicons name="person" size={24} color={activeTab === 'Profile' ? COLORS.active : COLORS.inactive} />
        <Text style={[styles.label, activeTab === 'Profile' && styles.activeLabel]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 80,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 10,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    elevation: 10
  },
  tab: { alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  label: { fontSize: 10, color: COLORS.inactive, marginTop: 2 },
  activeLabel: { color: COLORS.active, fontWeight: 'bold' },
  scanBtn: {
    top: -20,
    backgroundColor: COLORS.active,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    borderWidth: 4,
    borderColor: '#F7F3E8'
  }
});

export default BottomTabs;