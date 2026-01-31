import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { cookmateAPI } from '../services/api';

const COLORS = { primary: '#2D4F38', background: '#F7F3E8', white: '#FFFFFF', accent: '#D4A056', text: '#1F2937' };

const RegistrationScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  
  // FORM STATE - Matches your Backend Schema exactly
  const [formData, setFormData] = useState({
    username: "",
    age: "",
    weight: "",
    height: "",
    gender: "Male",
    persona: "hosteler",     // Options: hosteler, gym_bro, indian_mom
    health_goal: "Maintain", // Options: Lose, Gain, Maintain
    rotis_per_meal: "2",
    cooking_skill: "5",
    allergies: [],           // Sent as list
    dietary_preferences: []  // Sent as list
  });

  const handleSubmit = async () => {
    if (!formData.username || !formData.age) {
      Alert.alert("Missing Info", "Please enter at least a Name and Age.");
      return;
    }

    setLoading(true);
    try {
      // 1. Format Data for Backend (Convert strings to numbers)
      const payload = {
        ...formData,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        rotis_per_meal: parseInt(formData.rotis_per_meal),
        cooking_skill: parseInt(formData.cooking_skill),
        allergies: [], // Keeping empty for now (can add UI later)
        dietary_preferences: []
      };

      console.log("Sending Payload:", payload);

      // 2. Send to Backend
      const user = await cookmateAPI.registerUser(payload);
      
      // 3. Success!
      Alert.alert("Welcome Chef!", `Profile created for ${user.username}. ID: ${user.id}`);
      
      // 4. Navigate to Home (Pass the new User ID)
      navigation.replace('Home', { userId: user.id, username: user.username });

    } catch (error) {
      console.error(error);
      const msg = error.response ? JSON.stringify(error.response.data) : "Connection failed";
      Alert.alert("Registration Error", msg);
    } finally {
      setLoading(false);
    }
  };

  // Helper to update state
  const updateField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
      <Text style={styles.header}>Create Profile 📝</Text>
      
      {/* SECTION 1: IDENTITY */}
      <Text style={styles.sectionTitle}>Identity</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Username" 
        value={formData.username}
        onChangeText={(t) => updateField('username', t)} 
      />
      <View style={styles.row}>
        <TouchableOpacity 
          style={[styles.chip, formData.gender === 'Male' && styles.chipActive]} 
          onPress={() => updateField('gender', 'Male')}>
          <Text style={styles.chipText}>Male</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.chip, formData.gender === 'Female' && styles.chipActive]} 
          onPress={() => updateField('gender', 'Female')}>
          <Text style={styles.chipText}>Female</Text>
        </TouchableOpacity>
      </View>

      {/* SECTION 2: BODY STATS */}
      <Text style={styles.sectionTitle}>Body Stats</Text>
      <View style={styles.row}>
        <TextInput 
          style={[styles.input, { flex: 1 }]} placeholder="Age" keyboardType="numeric"
          value={formData.age} onChangeText={(t) => updateField('age', t)} 
        />
        <View style={{width: 10}}/>
        <TextInput 
          style={[styles.input, { flex: 1 }]} placeholder="Weight (kg)" keyboardType="numeric"
          value={formData.weight} onChangeText={(t) => updateField('weight', t)} 
        />
        <View style={{width: 10}}/>
        <TextInput 
          style={[styles.input, { flex: 1 }]} placeholder="Height (cm)" keyboardType="numeric"
          value={formData.height} onChangeText={(t) => updateField('height', t)} 
        />
      </View>

      {/* SECTION 3: LIFESTYLE */}
      <Text style={styles.sectionTitle}>Chef Persona</Text>
      <View style={styles.row}>
        {['hosteler', 'gym_bro', 'indian_mom'].map(p => (
          <TouchableOpacity 
            key={p} 
            style={[styles.chip, formData.persona === p && styles.chipActive]} 
            onPress={() => updateField('persona', p)}>
            <Text style={styles.chipText}>{p.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Health Goal</Text>
      <View style={styles.row}>
        {['Lose', 'Maintain', 'Gain'].map(g => (
          <TouchableOpacity 
            key={g} 
            style={[styles.chip, formData.health_goal === g && styles.chipActive]} 
            onPress={() => updateField('health_goal', g)}>
            <Text style={styles.chipText}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SECTION 4: EATING HABITS */}
      <Text style={styles.sectionTitle}>Habits</Text>
      <Text style={styles.label}>Rotis per meal: {formData.rotis_per_meal}</Text>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity 
            key={n} 
            style={[styles.circleBtn, formData.rotis_per_meal == n && styles.chipActive]} 
            onPress={() => updateField('rotis_per_meal', String(n))}>
            <Text style={styles.chipText}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{height: 30}} />

      {/* SUBMIT BUTTON */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Complete Registration 🚀</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, marginTop: 40, marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginTop: 20, marginBottom: 10 },
  label: { color: COLORS.textSecondary, marginBottom: 5 },
  input: { backgroundColor: COLORS.white, padding: 15, borderRadius: 12, marginBottom: 10, fontSize: 16, elevation: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primary, marginBottom: 5 },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontWeight: 'bold', color: COLORS.text }, // Dynamic color handling needed if background changes, simplified here
  circleBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primary },
  submitBtn: { backgroundColor: COLORS.accent, padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 30, elevation: 5 },
  submitText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' }
});

export default RegistrationScreen;