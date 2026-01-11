import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { X, Mic, ChevronRight, ChevronLeft, Volume2 } from 'lucide-react-native';
import { startSession, nextStep, sendVoiceCommand } from '../api';
import { getDishImage } from '../utils/AssetMap';

// REMOVED: Animated imports to prevent crashes

const { width } = Dimensions.get('window');

export default function Player({ route, navigation }) {
  const { recipe, user } = route.params;
  
  // Session State
  const [sessionId, setSessionId] = useState(null);
  const [stepData, setStepData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Audio Refs
  const recordingRef = useRef(null);
  const soundRef = useRef(null);

  // 1. INITIALIZE SESSION ON MOUNT
  useEffect(() => {
    initCookingSession();
    return () => {
        // Cleanup audio on exit
        if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  const initCookingSession = async () => {
    try {
        const data = await startSession(user.id, recipe);
        setSessionId(data.session_id);
        setStepData(data);
    } catch (e) {
        alert("Failed to start session");
    }
  };

  // 2. HANDLE VOICE RECORDING (The "Ears")
  const toggleMic = async () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
  };

  const startRecording = async () => {
    try {
        const perm = await Audio.requestPermissionsAsync();
        if (perm.status !== 'granted') return;

        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

        const { recording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        setIsRecording(true);
        // Pulse animation removed for stability

    } catch (err) {
        console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);

    if (!recordingRef.current) return;
    
    await recordingRef.current.stopAndUnloadAsync();
    const uri = recordingRef.current.getURI(); 
    recordingRef.current = null;

    // Send to AI (The "Brain")
    handleVoiceProcess(uri);
  };

  // 3. SEND TO AI & PLAY RESPONSE (The "Mouth")
  const handleVoiceProcess = async (audioUri) => {
      setIsSpeaking(true); // Show "AI Thinking" UI
      try {
          // Send audio file to backend, get back an MP3 URL (Data URI)
          const audioUrl = await sendVoiceCommand(sessionId, audioUri);
          
          // Play the response
          const { sound } = await Audio.Sound.createAsync(
              { uri: audioUrl }, 
              { shouldPlay: true }
          );
          soundRef.current = sound;
          
          // Wait for playback to finish
          sound.setOnPlaybackStatusUpdate((status) => {
              if (status.didJustFinish) setIsSpeaking(false);
          });
      } catch (e) {
          console.error("Voice Error:", e);
          setIsSpeaking(false);
      }
  };

  // 4. NEXT STEP LOGIC
  const handleNext = async () => {
      if (!sessionId) return;
      const data = await nextStep(sessionId);
      setStepData(data);
  };

  if (!stepData) return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
          <Text className="text-white font-bold">Initializing Kitchen...</Text>
      </View>
  );

  return (
    <View className="flex-1 bg-[#1A1A1A]">
      <SafeAreaView className="flex-1 justify-between p-6">
        
        {/* HEADER */}
        <View className="flex-row justify-between items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="bg-white/10 p-3 rounded-full">
                <X color="#fff" size={24} />
            </TouchableOpacity>
            <View className="items-center">
                <Text className="text-gray-400 text-xs uppercase tracking-widest">Cooking Mode</Text>
                <Text className="text-white font-bold text-lg">{recipe.dish_name}</Text>
            </View>
            <TouchableOpacity className="bg-white/10 p-3 rounded-full">
                <Volume2 color="#fff" size={24} />
            </TouchableOpacity>
        </View>

        {/* MAIN VISUAL (Album Art Style) */}
        <View className="items-center justify-center flex-1 my-8">
             <View className="w-64 h-64 rounded-full border-4 border-[#2F3E32] overflow-hidden shadow-2xl shadow-black">
                 <Image 
                    source={getDishImage(recipe.dish_name)} 
                    style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                 />
             </View>
             
             {/* Dynamic Status Text */}
             <Text className="text-white/60 mt-8 text-sm font-medium">
                 {isRecording ? "Listening..." : isSpeaking ? "Chef is speaking..." : "Step " + stepData.step_number}
             </Text>
             
             {/* HUGE INSTRUCTION TEXT */}
             <Text className="text-white text-3xl font-bold text-center mt-4 leading-9">
                 {stepData.instruction}
             </Text>

             {/* TIMER (If exists) */}
             {stepData.timer_seconds > 0 && (
                 <View className="mt-6 bg-[#2F3E32] px-6 py-2 rounded-full">
                     <Text className="text-[#F5E8D5] font-bold text-xl">{Math.floor(stepData.timer_seconds / 60)}:00</Text>
                 </View>
             )}
        </View>

        {/* CONTROLS */}
        <View className="flex-row items-center justify-between mb-8">
            {/* Prev Button (Dummy for now) */}
            <TouchableOpacity className="p-4 bg-white/5 rounded-full">
                <ChevronLeft color="#fff" size={32} />
            </TouchableOpacity>

            {/* MIC BUTTON (The Star) */}
            <View>
                {/* REMOVED PULSE ANIMATION VIEW */}
                
                <TouchableOpacity 
                    onPress={toggleMic}
                    activeOpacity={0.8}
                    className={`w-20 h-20 rounded-full items-center justify-center ${isRecording ? 'bg-[#E07A5F]' : 'bg-earth-primary'}`}
                >
                    <Mic color="#fff" size={32} />
                </TouchableOpacity>
            </View>

            {/* Next Button */}
            <TouchableOpacity onPress={handleNext} className="p-4 bg-white/20 rounded-full">
                <ChevronRight color="#fff" size={32} />
            </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}