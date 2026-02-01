import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cookmateAPI } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

const COLORS = { 
  primary: '#1A1A1A', 
  card: '#2D2D2D',
  text: '#FFFFFF',
  accent: '#D4A056', 
  success: '#22C55E',
  danger: '#EF4444'
};

const CookingModeScreen = ({ navigation, route }) => {
  // Grab Ingredients from params so we can deduct them later
  const { sessionData, userId, recipeSteps, recipeIngredients } = route.params || {};
  const sessionId = sessionData?.session_id || 1;

  const [stepIndex, setStepIndex] = useState(0);
  const steps = (recipeSteps && recipeSteps.length > 0) ? recipeSteps : ["Prepare ingredients..."];
  const currentText = steps[stepIndex];
  
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0); 
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // 1. SMART TIMER
  useEffect(() => {
    const timeMatch = currentText.match(/(\d+)\s*(?:min|minute)/i);
    if (timeMatch && timeMatch[1]) {
      setTimer(parseInt(timeMatch[1]) * 60);
      setIsTimerRunning(true);
    } else {
      setTimer(0);
      setIsTimerRunning(false);
    }
  }, [stepIndex]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timer > 0) interval = setInterval(() => setTimer((p) => p - 1), 1000);
    else if (timer === 0) setIsTimerRunning(false);
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  // 2. FINISH LOGIC (Updates Pantry & XP)
  const handleFinish = () => {
    Alert.alert(
      "Meal Complete! 👨‍🍳",
      "How was it? This will update your pantry.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "⭐⭐⭐⭐⭐ Delicious", onPress: () => submitSession(5, false) },
        { text: "⭐⭐⭐ Leftovers", onPress: () => submitSession(3, true) }
      ]
    );
  };

  const submitSession = async (rating, leftovers) => {
    setLoading(true);
    try {
      // Clean up ingredients list (ensure strings)
      const consumed = recipeIngredients 
        ? recipeIngredients.map(i => (typeof i === 'object' ? i.name : i)) 
        : [];
      
      console.log("Ending Session & Consuming:", consumed);

      const res = await cookmateAPI.endSession(sessionId, rating, leftovers, consumed);

      let msg = `XP Gained: +${res.new_xp - (res.new_xp - 10) || 10}`;
      if (res.inventory_updates) msg += `\n${res.inventory_updates}`;
      if (res.badges_earned && res.badges_earned.length > 0) msg += `\n🏆 Badge: ${res.badges_earned[0]}`;

      Alert.alert("All Done! 🎉", msg, [
        { text: "Back Home", onPress: () => navigation.navigate('Home', { userId }) }
      ]);
      
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save session stats.");
      navigation.navigate('Home', { userId });
    } finally {
      setLoading(false);
    }
  };

  // 3. NAVIGATION HANDLERS
  const nextStep = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(prev => prev + 1);
    } else {
      // If on last step, Trigger Finish
      handleFinish();
    }
  };

  const prevStep = () => {
    if (stepIndex > 0) setStepIndex(prev => prev - 1);
  };

  // 4. AI HELP
  const askAI = async () => {
    setLoading(true);
    try {
      const query = `I am on step: "${currentText}". How do I do this properly?`;
      const response = await cookmateAPI.chatWithChef(userId, query);
      Alert.alert("Chef Says:", response.reply || response.message);
    } catch (error) {
      Alert.alert("Chef Offline", "Check connection.");
    } finally {
      setLoading(false);
    }
  };

  // 5. GUARDIAN CHECK
  const handleGuardianCheck = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.5,
    });
    if (!result.canceled) {
      setLoading(true);
      try {
        const check = await cookmateAPI.guardianCheck(sessionId, currentText, result.assets[0].uri);
        Alert.alert("AI Analysis", check.analysis || "Looks good!");
      } catch (error) {
        Alert.alert("Error", "Guardian Check Failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STEP {stepIndex + 1} OF {steps.length}</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>INSTRUCTION</Text>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
           <Text style={styles.stepText}>"{currentText}"</Text>
        </ScrollView>
      </View>

      {timer > 0 && (
        <View style={styles.timerContainer}>
          <Ionicons name="timer-outline" size={24} color={COLORS.accent} />
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
          <TouchableOpacity onPress={() => setIsTimerRunning(!isTimerRunning)}>
            <Ionicons name={isTimerRunning ? "pause-circle" : "play-circle"} size={40} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.navBtn} onPress={prevStep} disabled={stepIndex === 0}>
          <Ionicons name="chevron-back" size={30} color={stepIndex === 0 ? '#555' : COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.guardianBtn} onPress={handleGuardianCheck}>
          <Ionicons name="camera" size={28} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navBtn, stepIndex === steps.length - 1 && { backgroundColor: COLORS.success }]} 
          onPress={nextStep}
        >
          <Ionicons 
            name={stepIndex === steps.length - 1 ? "checkmark" : "chevron-forward"} 
            size={30} 
            color={COLORS.text} 
          />
        </TouchableOpacity>
      </View>

      {/* Mic / Spinner */}
      <View style={styles.micContainer}>
        {loading ? (
           <ActivityIndicator size="large" color={COLORS.accent} />
        ) : (
          <TouchableOpacity style={styles.micBtn} onPress={askAI}>
            <Ionicons name="help" size={32} color={COLORS.white} />
          </TouchableOpacity>
        )}
        <Text style={styles.micHint}>{loading ? "Thinking..." : "Stuck? Tap for Help"}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 20 },
  headerTitle: { color: COLORS.accent, fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  card: { flex: 1, backgroundColor: COLORS.card, borderRadius: 20, padding: 30, marginBottom: 20, alignItems: 'center', justifyContent: 'center' },
  label: { color: COLORS.accent, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 20 },
  stepText: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', textAlign: 'center', lineHeight: 34 },
  timerContainer: { flexDirection: 'row', backgroundColor: '#333', padding: 15, borderRadius: 15, alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  timerText: { color: COLORS.white, fontSize: 32, fontWeight: 'bold', fontFamily: 'monospace' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  navBtn: { backgroundColor: 'rgba(255,255,255,0.1)', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  guardianBtn: { backgroundColor: COLORS.accent, width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 10, borderWidth: 4, borderColor: COLORS.primary },
  micContainer: { alignItems: 'center' },
  micBtn: { backgroundColor: '#444', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 5 },
  micHint: { color: '#888', fontSize: 12 }
});

export default CookingModeScreen;