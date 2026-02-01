import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cookmateAPI } from '../services/api';
import BottomTabs from '../components/BottomTabs';

const COLORS = { primary: '#2D4F38', background: '#F7F3E8', white: '#FFFFFF', accent: '#D4A056', textSecondary: '#6B7280' };

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: '🍳', time: 'Morning' },
  { id: 'lunch', label: 'Lunch', icon: '🍛', time: 'Afternoon' },
  { id: 'dinner', label: 'Dinner', icon: '🍲', time: 'Evening' },
  { id: 'snack', label: 'Snack', icon: '🍿', time: 'Anytime' },
];

const RecipeGeneratorScreen = ({ navigation, route }) => {
  const userId = route.params?.userId || 1;
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(""); // "Checking pantry...", "Cooking up logic..."

  const handleGenerate = async (mealType) => {
    setLoading(true);
    setLoadingStep("Scanning your pantry...");
    
    try {
      // Fake delay to show off the "AI Thinking" process
      setTimeout(() => setLoadingStep("Consulting the AI Chef..."), 1500);

      const response = await cookmateAPI.generateRecipe(userId, mealType);
      
      console.log("Generated Recipe:", response);

      if (!response || !response.title) {
        throw new Error("AI returned an empty recipe.");
      }

      // Navigate to Details with the NEW recipe data
      navigation.navigate('RecipeDetails', { 
        recipe: response, 
        userId: userId 
      });

    } catch (error) {
      console.error(error);
      Alert.alert("Chef Error", "Could not generate recipe. Is your pantry empty?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Chef 👨‍🍳</Text>
        <Text style={styles.subtitle}>What are we cooking today?</Text>
      </View>

      <View style={styles.grid}>
        {MEAL_TYPES.map((meal) => (
          <TouchableOpacity 
            key={meal.id} 
            style={styles.card} 
            onPress={() => handleGenerate(meal.id)}
            disabled={loading}
          >
            <Text style={styles.icon}>{meal.icon}</Text>
            <Text style={styles.cardTitle}>{meal.label}</Text>
            <Text style={styles.cardSub}>{meal.time}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LOADING OVERLAY */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>{loadingStep}</Text>
          </View>
        </View>
      )}

      <BottomTabs navigation={navigation} activeTab="Chef" userId={userId} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60 },
  header: { paddingHorizontal: 20, marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: 5 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, paddingHorizontal: 20, justifyContent: 'center' },
  card: { width: '45%', backgroundColor: COLORS.white, borderRadius: 20, padding: 20, alignItems: 'center', elevation: 5, marginBottom: 10 },
  icon: { fontSize: 40, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  cardSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 5 },

  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  loadingBox: { backgroundColor: COLORS.white, padding: 30, borderRadius: 20, alignItems: 'center', width: '80%' },
  loadingText: { marginTop: 15, fontSize: 16, fontWeight: 'bold', color: COLORS.primary }
});

export default RecipeGeneratorScreen;