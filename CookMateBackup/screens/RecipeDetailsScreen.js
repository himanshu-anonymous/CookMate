import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const RecipeDetailsScreen = ({ navigation, route }) => {
  // Dummy data if nothing is passed
  const recipe = route.params?.recipe || {
    title: "Grilled Chicken Salad",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    calories: 450, protein: 45, carb: 10, fat: 15,
    description: "High protein, low effort. Perfect for cutting.",
    ingredients: ["200g Chicken", "Spinach", "Olive Oil", "Salt"]
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Image source={{ uri: recipe.image }} style={{ width: '100%', height: 300 }} />
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
      </TouchableOpacity>
      
      <View style={styles.sheet}>
        <Text style={styles.title}>{recipe.title}</Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>{recipe.calories} kcal</Text>
          <Text style={styles.stat}>{recipe.protein}g Protein</Text>
          <Text style={styles.stat}>{recipe.carb}g Carb</Text>
        </View>
        <Text style={styles.section}>Ingredients</Text>
        {recipe.ingredients.map((i, idx) => (
          <Text key={idx} style={styles.item}>• {i}</Text>
        ))}
        <View style={{height: 100}}/>
      </View>

      <TouchableOpacity style={styles.cookBtn} onPress={() => alert("Starting Cooking Mode!")}>
        <Text style={styles.cookText}>Start Cooking 🔥</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  backBtn: { position: 'absolute', top: 50, left: 20, backgroundColor: 'white', padding: 8, borderRadius: 20 },
  sheet: { flex: 1, backgroundColor: COLORS.background, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 },
  stats: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  stat: { backgroundColor: COLORS.white, padding: 8, borderRadius: 8, color: COLORS.primary, fontWeight: 'bold' },
  section: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginTop: 10, marginBottom: 5 },
  item: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 5 },
  cookBtn: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: COLORS.primary, padding: 18, borderRadius: 30, alignItems: 'center', ...SHADOWS.medium },
  cookText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});

export default RecipeDetailsScreen;