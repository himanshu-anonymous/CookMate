import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cookmateAPI } from '../services/api';

const COLORS = { primary: '#2D4F38', background: '#F7F3E8', white: '#FFFFFF', accent: '#D4A056', text: '#1F2937', textSecondary: '#6B7280' };

// Configuration Arrays
const DIET_OPTIONS = ["Vegetarian", "Non-Vegetarian", "Vegan", "Eggetarian"];

const PERSONA_OPTIONS = [
  { id: "student", label: "🎓 Student (Budget)" },
  { id: "gym_bro", label: "💪 Gym Bro (Protein)" },
  { id: "indian_mom", label: "🏠 Home Chef (Trad)" },
  { id: "busy_professional", label: "💼 Busy Pro (Quick)" }
];

const RegistrationScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  
  // FORM STATE
  const [formData, setFormData] = useState({
    username: "",
    age: "",
    weight: "",
    height: "",
    gender: "Male",
    persona: "student",
    health_goal: "Maintain", 
    rotis_per_meal: "2",
    cooking_skill: "5",
    allergies: "",         // String input (comma separated)
    dietary_preferences: "Vegetarian" // Default
  });

  const updateField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!formData.username || !formData.age || !formData.weight) {
      Alert.alert("Missing Info", "Please enter your Name, Age, and Weight.");
      return;
    }

    setLoading(true);
    try {
      // 1. Format Data for Backend
      const payload = {
        username: formData.username,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height) || 170, // Default height if missing
        gender: formData.gender,
        persona: formData.persona,
        health_goal: formData.health_goal,
        rotis_per_meal: parseInt(formData.rotis_per_meal),
        cooking_skill: parseInt(formData.cooking_skill),
        
        // 🚨 NEW FIELDS ADDED HERE
        dietary_preferences: formData.dietary_preferences, 
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
        
        // Defaults for others
        medical_conditions: [],
        spice_tolerance: "Medium",
        fav_cuisine: ["Indian"],
        weekly_budget: 5000
      };

      console.log("Sending Payload:", payload);

      // 2. Send to Backend
      const user = await cookmateAPI.registerUser(payload);
      
      // 3. Success!
      Alert.alert("Welcome Chef! 👨‍🍳", `Profile created for ${user.username}.`, [
        { text: "Let's Cook", onPress: () => navigation.replace('Home', { userId: user.id, username: user.username }) }
      ]);

    } catch (error) {
      console.error(error);
      const msg = error.response ? JSON.stringify(error.response.data) : "Connection failed. Check Server.";
      Alert.alert("Registration Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
      
      {/* Header */}
      <View style={styles.headerContainer}>
         <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
         </TouchableOpacity>
         <Text style={styles.header}>Create Profile</Text>
         <View style={{width: 24}} />
      </View>
      
      {/* SECTION 1: IDENTITY */}
      <Text style={styles.sectionTitle}>Identity</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Username (e.g. ChefRaj)" 
        value={formData.username}
        onChangeText={(t) => updateField('username', t)} 
      />
      
      <View style={styles.row}>
        {['Male', 'Female'].map(g => (
          <TouchableOpacity 
            key={g} 
            style={[styles.chip, formData.gender === g && styles.chipActive]} 
            onPress={() => updateField('gender', g)}>
            <Text style={[styles.chipText, formData.gender === g && styles.chipTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SECTION 2: DIET (🚨 NEW SECTION) */}
      <Text style={styles.sectionTitle}>Dietary Preference</Text>
      <View style={styles.row}>
        {DIET_OPTIONS.map(diet => (
          <TouchableOpacity 
            key={diet} 
            style={[styles.chip, formData.dietary_preferences === diet && styles.chipActive]} 
            onPress={() => updateField('dietary_preferences', diet)}>
            <Text style={[styles.chipText, formData.dietary_preferences === diet && styles.chipTextActive]}>
              {diet}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SECTION 3: BODY STATS */}
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

      {/* SECTION 4: CHEF PERSONA */}
      <Text style={styles.sectionTitle}>Your Persona</Text>
      <View style={styles.personaList}>
        {PERSONA_OPTIONS.map(p => (
          <TouchableOpacity 
            key={p.id} 
            style={[styles.personaCard, formData.persona === p.id && styles.personaActive]} 
            onPress={() => updateField('persona', p.id)}>
            <Ionicons 
               name={formData.persona === p.id ? "radio-button-on" : "radio-button-off"} 
               size={20} 
               color={formData.persona === p.id ? COLORS.accent : COLORS.textSecondary} 
            />
            <Text style={[styles.personaText, formData.persona === p.id && styles.personaTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SECTION 5: HABITS */}
      <Text style={styles.sectionTitle}>Eating Habits</Text>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
         <Text style={styles.label}>Rotis per meal:</Text>
         <Text style={{fontWeight: 'bold', fontSize: 18, color: COLORS.accent}}>{formData.rotis_per_meal}</Text>
      </View>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5, 6].map(n => (
          <TouchableOpacity 
            key={n} 
            style={[styles.circleBtn, formData.rotis_per_meal == n && styles.chipActive]} 
            onPress={() => updateField('rotis_per_meal', String(n))}>
            <Text style={[styles.chipText, formData.rotis_per_meal == n && styles.chipTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ALLERGIES */}
      <Text style={styles.sectionTitle}>Allergies (Optional)</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Peanuts, Shellfish, etc." 
        value={formData.allergies}
        onChangeText={(t) => updateField('allergies', t)} 
      />

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
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 40, marginBottom: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginTop: 20, marginBottom: 10 },
  label: { color: COLORS.textSecondary, marginBottom: 5 },
  
  input: { backgroundColor: COLORS.white, padding: 15, borderRadius: 12, marginBottom: 10, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  
  // Chips (Gender, Diet)
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 5 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.text },
  chipTextActive: { color: COLORS.white, fontWeight: 'bold' },
  
  // Persona Cards
  personaList: { gap: 8 },
  personaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 15, borderRadius: 12, gap: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  personaActive: { borderColor: COLORS.accent, backgroundColor: '#FFFBEB' },
  personaText: { fontSize: 16, color: COLORS.text },
  personaTextActive: { color: COLORS.primary, fontWeight: 'bold' },

  // Circle Buttons (Rotis)
  circleBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#D1D5DB' },
  
  submitBtn: { backgroundColor: COLORS.accent, padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 30, elevation: 5 },
  submitText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' }
});

export default RegistrationScreen;