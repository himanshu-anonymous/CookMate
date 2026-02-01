import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cookmateAPI } from '../services/api';

const COLORS = { primary: '#2D4F38', background: '#F7F3E8', white: '#FFFFFF', accent: '#D4A056', textSecondary: '#6B7280' };

const RecipeDetailsScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  
  const recipe = route.params?.recipe || {};
  const userId = route.params?.userId || 1;

  // 🛠 INTELLIGENT PARSER: Handles Strings OR Smart Objects
  const getCleanSteps = () => {
    // 1. Find the Raw Array (Recursive Search)
    const findRawArray = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      if (Array.isArray(obj.instructions) && obj.instructions.length > 0) return obj.instructions;
      if (Array.isArray(obj.steps) && obj.steps.length > 0) return obj.steps;
      if (Array.isArray(obj.directions) && obj.directions.length > 0) return obj.directions;
      if (Array.isArray(obj.method) && obj.method.length > 0) return obj.method;
      
      for (const key in obj) {
        const value = obj[key];
        if (Array.isArray(value) && value.length > 0) return value; // Found an array!
        if (typeof value === 'object') {
          const found = findRawArray(value);
          if (found) return found;
        }
      }
      return null;
    };

    let steps = findRawArray(recipe);

    // 2. If we found nothing, try string splitting (Fallback)
    if (!steps) {
      const rawText = recipe.instructions || recipe.steps || JSON.stringify(recipe);
      if (typeof rawText === 'string') {
        steps = rawText.split(/\d+\.\s+|\n/).map(l => l.trim()).filter(l => l.length > 5);
      }
    }

    // 3. 🚨 CRITICAL FIX: Normalize Objects to Strings 🚨
    // The backend sends objects like: { instruction: "Chop onions", duration_seconds: 60 }
    // We must convert them to simple strings for React to render.
    if (steps && Array.isArray(steps)) {
      return steps.map(step => {
        if (typeof step === 'string') return step;
        if (typeof step === 'object') {
          // Extract the text part from the object
          return step.instruction || step.step || step.description || step.text || "Follow this step";
        }
        return "Prepare ingredients";
      });
    }

    // 4. Default Fallback
    return ["Prepare your ingredients.", "Follow standard procedures.", "Serve and enjoy!"];
  };

  // Get the cleaned steps once
  const finalSteps = getCleanSteps();

  const handleStartCooking = async () => {
    setLoading(true);
    try {
      console.log("🚀 Starting Session with steps:", finalSteps);
      
      // Send the CLEAN strings to the backend and cooking mode
      const response = await cookmateAPI.startSession(userId, recipe.title || "Recipe", finalSteps);
      
      navigation.navigate('CookingMode', { 
        sessionData: response, 
        userId: userId, 
        recipeSteps: finalSteps 
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not start cooking session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }} style={{ width: '100%', height: 300 }} />
        
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        <View style={styles.sheet}>
          <Text style={styles.title}>{recipe.title || "Delicious Recipe"}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBadge}><Text style={styles.statText}>🔥 {recipe.calories || 250} kcal</Text></View>
            <View style={styles.statBadge}><Text style={styles.statText}>⏱️ {recipe.time || "30 mins"}</Text></View>
          </View>

          <Text style={styles.section}>Ingredients</Text>
          {recipe.ingredients && Array.isArray(recipe.ingredients) ? recipe.ingredients.map((item, idx) => {
            let itemText = typeof item === 'object' ? `${item.name} (${item.qty || ''})` : item;
            return <Text key={idx} style={styles.item}>• {itemText}</Text>;
          }) : <Text style={styles.item}>• Check pantry items</Text>}
          
          <Text style={styles.section}>Instructions</Text>
          {/* Now safe to render because finalSteps contains only Strings */}
          {finalSteps.map((step, idx) => (
             <Text key={idx} style={styles.item}>{idx + 1}. {step}</Text>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <TouchableOpacity style={styles.cookBtn} onPress={handleStartCooking}>
            <Text style={styles.cookText}>Start Cooking 🔥</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backBtn: { position: 'absolute', top: 50, left: 20, backgroundColor: 'white', padding: 8, borderRadius: 20, elevation: 5 },
  sheet: { flex: 1, backgroundColor: COLORS.background, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBadge: { backgroundColor: COLORS.white, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  statText: { fontWeight: 'bold', color: COLORS.primary },
  section: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginTop: 15, marginBottom: 5 },
  item: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 8, paddingLeft: 10, lineHeight: 22 },
  footer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  cookBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 30, alignItems: 'center', elevation: 5 },
  cookText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});

export default RecipeDetailsScreen;