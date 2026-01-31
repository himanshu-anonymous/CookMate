import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cookmateAPI } from '../services/api';

const COLORS = { primary: '#2D4F38', background: '#F7F3E8', white: '#FFFFFF', accent: '#D4A056', textSecondary: '#6B7280' };

const RecipeGeneratorScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState('lunch');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await cookmateAPI.generateRecipe(1, mealType);
      navigation.navigate('RecipeDetails', { recipe: response });
    } catch (error) {
      console.error(error);
      const msg = error.response ? JSON.stringify(error.response.data) : error.message;
      Alert.alert("Generation Failed", `Backend said:\n${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>AI Chef</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.question}>What are we cooking?</Text>
        <View style={styles.options}>
          {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
            <TouchableOpacity 
              key={type} 
              style={[styles.optionBtn, mealType === type && styles.selectedOption]} 
              onPress={() => setMealType(type)}
            >
              <Text style={[styles.optionText, mealType === type && styles.selectedText]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
            <Ionicons name="sparkles" size={24} color={COLORS.white} style={{ marginRight: 10 }} />
            <Text style={styles.generateText}>Generate Recipe</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  content: { padding: 20, flex: 1 },
  question: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 30 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 40 },
  optionBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary },
  selectedOption: { backgroundColor: COLORS.primary },
  optionText: { color: COLORS.primary, fontWeight: 'bold' },
  selectedText: { color: COLORS.white },
  generateBtn: { backgroundColor: COLORS.accent, padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  generateText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' }
});

export default RecipeGeneratorScreen;