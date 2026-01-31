import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cookmateAPI } from '../services/api';

const COLORS = { primary: '#2D4F38', background: '#F7F3E8', white: '#FFFFFF', accent: '#D4A056', textSecondary: '#6B7280' };

const RecipeDetailsScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const recipe = route.params?.recipe || {}; 

const handleStartCooking = async () => {
    setLoading(true);
    try {
      // 1. Extract Instructions from the Recipe Object
      // (The AI usually sends them as a list of strings)
      const steps = recipe.instructions || ["Step 1: Prep", "Step 2: Cook"];

      // 2. Send Title AND Steps to Backend
      const response = await cookmateAPI.startSession(1, recipe.title, steps);
      
      // 3. Navigate
      navigation.navigate('CookingMode', { 
        recipeId: 1, 
        initialStep: response.message 
      });
      
    } catch (error) {
       // ... existing error handling ...
    }
    // ...
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Image 
          source={{ uri: recipe.image || 'https://via.placeholder.com/300' }} 
          style={{ width: '100%', height: 300 }} 
        />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        <View style={styles.sheet}>
          <Text style={styles.title}>{recipe.title || "Recipe Name"}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBadge}><Text style={styles.statText}>🔥 {recipe.calories || 0} kcal</Text></View>
          </View>

          <Text style={styles.section}>Ingredients</Text>
          {recipe.ingredients && recipe.ingredients.map((item, idx) => {
            let itemText = typeof item === 'object' ? `${item.name} (${item.qty})` : item;
            return <Text key={idx} style={styles.item}>• {itemText}</Text>;
          })}
          
          <Text style={styles.section}>Instructions</Text>
          <Text style={styles.description}>{recipe.description || "No description available."}</Text>
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
  item: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 5, paddingLeft: 10 },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  footer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  cookBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 30, alignItems: 'center', elevation: 5 },
  cookText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});

export default RecipeDetailsScreen;