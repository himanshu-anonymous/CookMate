import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cookmateAPI } from '../services/api';

const COLORS = { primary: '#2D4F38', background: '#F7F3E8', white: '#FFFFFF', accent: '#D4A056', mic: '#EF4444' };

const CookingModeScreen = ({ navigation, route }) => {
  const { initialStep } = route.params || { initialStep: "Get your ingredients ready!" };
  
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVoiceCommand = async () => {
    setIsListening(true);
    // Fake "Listening" Delay
    setTimeout(async () => {
      setIsListening(false);
      setLoading(true);

      try {
        console.log("Asking AI: 'What is the next step?'");
        const response = await cookmateAPI.chatWithChef(1, "What is the next step?");
        
        // 🧠 Checks all possible fields the backend might return
        const aiResponse = response.reply || response.message || response.response || "Next Step: Chop veggies.";
        setCurrentStep(aiResponse);

      } catch (error) {
        console.error(error);
        setCurrentStep("⚠️ AI Connection Lost. Try again.");
      } finally {
        setLoading(false);
      }
    }, 1000); 
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cooking Mode 🍳</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <View style={styles.stepContainer}>
        <Text style={styles.stepLabel}>CURRENT INSTRUCTION</Text>
        <ScrollView style={styles.stepBox} contentContainerStyle={{alignItems: 'center'}}>
          {loading ? (
             <ActivityIndicator size="large" color={COLORS.accent} />
          ) : (
             <Text style={styles.stepText}>"{currentStep}"</Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.controls}>
         <TouchableOpacity 
           style={[styles.micBtn, isListening && styles.micBtnActive]} 
           onPress={handleVoiceCommand}
         >
           <Ionicons name={isListening ? "mic" : "mic-outline"} size={40} color={COLORS.white} />
         </TouchableOpacity>
      </View>
      <Text style={styles.micHint}>Tap Mic to ask for the next step</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50, alignItems: 'center' },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 20 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  stepContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  stepLabel: { color: COLORS.accent, fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10, textAlign: 'center' },
  stepBox: { maxHeight: 300 },
  stepText: { color: COLORS.white, fontSize: 28, fontWeight: 'bold', lineHeight: 38, textAlign: 'center' },
  controls: { alignItems: 'center', marginBottom: 30 },
  micBtn: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.mic, justifyContent: 'center', alignItems: 'center', elevation: 10, borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)' },
  micBtnActive: { backgroundColor: '#B91C1C', transform: [{ scale: 1.1 }] },
  micHint: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 40 }
});

export default CookingModeScreen;