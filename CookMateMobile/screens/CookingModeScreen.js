import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech'; 
import * as ImagePicker from 'expo-image-picker'; // 🚨 Added back
import { cookmateAPI } from '../services/api';

const COLORS = { 
  primary: '#1A1A1A', 
  card: '#2D2D2D',
  text: '#FFFFFF',
  accent: '#D4A056', 
  success: '#22C55E',
  danger: '#EF4444'
};

const CookingModeScreen = ({ navigation, route }) => {
  const { sessionData, userId, recipeSteps, recipeIngredients } = route.params || {};
  const sessionId = sessionData?.session_id || 1;

  const [stepIndex, setStepIndex] = useState(0);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0); 
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const steps = (recipeSteps && recipeSteps.length > 0) ? recipeSteps : ["Prepare ingredients..."];
  const currentText = steps[stepIndex];

  // 1. TTS LOGIC
  useEffect(() => {
    if (isVoiceEnabled) {
      speakInstruction(currentText);
    }
    return () => Speech.stop();
  }, [stepIndex]);

  const speakInstruction = (text) => {
    Speech.stop(); 
    Speech.speak(text, { language: 'en', pitch: 1.0, rate: 0.9 });
  };

  const toggleVoice = () => {
    if (isVoiceEnabled) {
      Speech.stop();
      setIsVoiceEnabled(false);
    } else {
      setIsVoiceEnabled(true);
      speakInstruction(currentText);
    }
  };

  // 2. SMART TIMER
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

  // 3. GUARDIAN CHECK (Fixed the ReferenceError)
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

  // 4. AI CHAT HELP
  const askAI = async () => {
    setLoading(true);
    try {
      const query = `I am on step: "${currentText}". How do I do this properly?`;
      const response = await cookmateAPI.chatWithChef(userId, query);
      Alert.alert("Chef Says:", response.reply || response.message);
      if (isVoiceEnabled) Speech.speak(response.reply || response.message);
    } catch (error) {
      Alert.alert("Chef Offline", "Check connection.");
    } finally {
      setLoading(false);
    }
  };

  // 5. FINISH LOGIC
  const handleFinish = () => {
    if (isVoiceEnabled) Speech.speak("Delicious! You have finished the recipe.");
    Alert.alert("Meal Complete! 👨‍🍳", "How was it?", [
        { text: "Cancel", style: "cancel" },
        { text: "⭐⭐⭐⭐⭐ Delicious", onPress: () => submitSession(5, false) },
        { text: "⭐⭐⭐ Leftovers", onPress: () => submitSession(3, true) }
    ]);
  };

  const submitSession = async (rating, leftovers) => {
    setLoading(true);
    try {
      const consumed = recipeIngredients ? recipeIngredients.map(i => (typeof i === 'object' ? i.name : i)) : [];
      const res = await cookmateAPI.endSession(sessionId, rating, leftovers, consumed);
      navigation.navigate('Home', { userId });
    } catch (error) {
      navigation.navigate('Home', { userId });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (stepIndex < steps.length - 1) setStepIndex(prev => prev + 1);
    else handleFinish();
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
        <TouchableOpacity onPress={toggleVoice} style={styles.voiceBtn}>
          <Ionicons name={isVoiceEnabled ? "volume-high" : "volume-mute"} size={24} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>INSTRUCTION</Text>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
           <Text style={styles.stepText}>"{currentText}"</Text>
        </ScrollView>
        <TouchableOpacity onPress={() => speakInstruction(currentText)} style={styles.replayBtn}>
           <Ionicons name="refresh" size={18} color={COLORS.accent} />
           <Text style={styles.replayText}>Repeat Instruction</Text>
        </TouchableOpacity>
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

      <View style={styles.controls}>
        <TouchableOpacity style={styles.navBtn} onPress={() => setStepIndex(p => p - 1)} disabled={stepIndex === 0}>
          <Ionicons name="chevron-back" size={30} color={stepIndex === 0 ? '#555' : COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.guardianBtn} onPress={handleGuardianCheck}>
          <Ionicons name="camera" size={28} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navBtn, stepIndex === steps.length - 1 && { backgroundColor: COLORS.success }]} 
          onPress={nextStep}
        >
          <Ionicons name={stepIndex === steps.length - 1 ? "checkmark" : "chevron-forward"} size={30} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.micContainer}>
        {loading ? (
           <ActivityIndicator size="large" color={COLORS.accent} />
        ) : (
          <TouchableOpacity style={styles.micBtn} onPress={askAI}>
            <Ionicons name="help" size={32} color={COLORS.white} />
          </TouchableOpacity>
        )}
        <Text style={styles.micHint}>Stuck? Tap for Help</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 20 },
  voiceBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 20 },
  headerTitle: { color: COLORS.accent, fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  card: { flex: 1, backgroundColor: COLORS.card, borderRadius: 20, padding: 30, marginBottom: 20, alignItems: 'center', justifyContent: 'center' },
  label: { color: COLORS.accent, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 20 },
  stepText: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', textAlign: 'center', lineHeight: 34 },
  replayBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 8 },
  replayText: { color: COLORS.accent, fontSize: 14, fontWeight: '600' },
  timerContainer: { flexDirection: 'row', backgroundColor: '#333', padding: 15, borderRadius: 15, alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  timerText: { color: COLORS.white, fontSize: 32, fontWeight: 'bold', fontFamily: 'monospace' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  navBtn: { backgroundColor: 'rgba(255,255,255,0.1)', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  guardianBtn: { backgroundColor: COLORS.accent, width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 10, borderWidth: 4, borderColor: COLORS.primary },
  micContainer: { alignItems: 'center' },
  micBtn: { backgroundColor: '#444', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  micHint: { color: '#888', fontSize: 12 }
});

export default CookingModeScreen;