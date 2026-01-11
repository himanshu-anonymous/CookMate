import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Dumbbell, ChefHat, Heart, ArrowRight, Target, ChevronLeft } from 'lucide-react-native';
import GlassCard from '../components/GlassCard';
import { createUser } from '../api';

// --- DATA OPTIONS ---
const personas = [
  { id: 'hosteler', name: 'Hosteler', icon: User, desc: 'Cheap & Fast' },
  { id: 'indian_mom', name: 'Indian Mom', icon: Heart, desc: 'Healthy & Caring' },
  { id: 'gym_bro', name: 'Gym Bro', icon: Dumbbell, desc: 'High Protein' },
  { id: 'master_chef', name: 'Master Chef', icon: ChefHat, desc: 'Gourmet' },
];

const dietaryOptions = ["None", "Vegetarian", "Vegan", "Keto", "Paleo"];
const goalOptions = ["Balanced Diet", "Weight Loss", "Muscle Gain", "Quick Energy"];

export default function Onboarding({ onComplete }) {
  // Step Control (1 = Identity, 2 = Health)
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    username: '',
    persona: 'hosteler',
    dietary_goal: 'Balanced Diet',
    preferences: 'None',
    allergies: ''
  });

  // Helper to update state
  const updateForm = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  // Navigation Logic
  const handleNext = () => {
    if (step === 1) {
        if (!formData.username.trim()) {
            Alert.alert("Required", "Please tell us your name!");
            return;
        }
        setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  // Final API Submission
  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log("Submitting User:", formData);
      
      // Ensure allergies isn't undefined/null
      const finalData = {
        ...formData,
        allergies: formData.allergies.trim() || "None"
      };

      const user = await createUser(finalData);
      onComplete(user);
      
    } catch (e) {
      console.error("Login Error:", e);
      let errorMessage = "Server is unreachable.";
      
      if (e.message?.includes("Network Error")) {
        errorMessage = "Network Error: Check IP in api.js";
      } else if (e.response && e.response.status === 422) {
        errorMessage = "Data Error: Backend rejected format.";
      }
      Alert.alert("Connection Failed", errorMessage);
    }
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-earth-bg">
      
      {/* --- BACKGROUND DECOR --- */}
      <View className="absolute top-10 -left-20 w-80 h-80 bg-earth-primary/20 rounded-full blur-3xl" />
      <View className="absolute bottom-10 -right-20 w-80 h-80 bg-earth-accent/20 rounded-full blur-3xl" />

      <SafeAreaView className="flex-1 p-6">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          
          {/* --- HEADER --- */}
          <View className="mb-6">
            <Text className="text-earth-dark text-4xl font-extrabold tracking-tight">
              {step === 1 ? "Who's Cooking?" : "Your Goals"}
            </Text>
            <Text className="text-earth-primary text-xl font-medium mt-1">
              Step {step} of 2
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            
            {/* ================= STEP 1: IDENTITY ================= */}
            {step === 1 && (
              <>
                <Text className="text-earth-dark font-bold text-lg mb-3 ml-1">What should we call you?</Text>
                <GlassCard className="mb-8 p-0 bg-white/60 !rounded-2xl" intensity="high">
                  <TextInput 
                    placeholder="Enter your name" 
                    placeholderTextColor="#A8BFA6"
                    className="text-earth-dark text-xl p-5 font-bold"
                    onChangeText={(t) => updateForm('username', t)}
                    value={formData.username}
                  />
                </GlassCard>

                <Text className="text-earth-dark font-bold text-lg mb-3 ml-1">Choose your Persona</Text>
                <View className="flex-row flex-wrap justify-between gap-y-4">
                  {personas.map((p) => {
                    const Icon = p.icon;
                    const isActive = formData.persona === p.id;
                    return (
                      <TouchableOpacity 
                        key={p.id} 
                        onPress={() => updateForm('persona', p.id)} 
                        className="w-[48%]"
                        activeOpacity={0.9}
                      >
                        <GlassCard 
                            className={`items-center py-6 px-2 ${isActive ? "bg-earth-primary border-transparent" : "bg-[#FFF8F0]/80"}`}
                            intensity={isActive ? "high" : "medium"}
                        >
                          <Icon color={isActive ? "#F5E8D5" : "#5F8063"} size={32} />
                          <Text className={`font-bold mt-3 text-lg ${isActive ? "text-[#F5E8D5]" : "text-earth-dark"}`}>
                            {p.name}
                          </Text>
                          <Text className={`text-xs mt-1 ${isActive ? "text-[#F5E8D5]/80" : "text-gray-500"}`}>
                            {p.desc}
                          </Text>
                        </GlassCard>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* ================= STEP 2: HEALTH PROFILE ================= */}
            {step === 2 && (
              <>
                {/* 1. Diet Type */}
                <Text className="text-earth-dark font-bold text-lg mb-3 ml-1">Dietary Preference</Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                  {dietaryOptions.map((opt) => {
                    const isSelected = formData.preferences === opt;
                    return (
                        <TouchableOpacity 
                          key={opt} 
                          onPress={() => updateForm('preferences', opt)}
                          className={`px-5 py-3 rounded-full border ${
                              isSelected 
                                ? 'bg-earth-primary border-earth-primary' 
                                : 'bg-white/40 border-earth-primary/20'
                          }`}
                        >
                          <Text className={`font-semibold ${isSelected ? 'text-[#F5E8D5]' : 'text-earth-dark'}`}>
                              {opt}
                          </Text>
                        </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2. Primary Goal */}
                <Text className="text-earth-dark font-bold text-lg mb-3 ml-1">Primary Goal</Text>
                <View className="mb-6">
                  {goalOptions.map((opt) => {
                    const isSelected = formData.dietary_goal === opt;
                    return (
                     <TouchableOpacity 
                      key={opt} 
                      onPress={() => updateForm('dietary_goal', opt)}
                      activeOpacity={0.8}
                      className={`flex-row items-center p-4 mb-3 rounded-2xl border ${
                          isSelected 
                            ? 'bg-earth-primary/10 border-earth-primary bg-[#FFF8F0]' 
                            : 'bg-white/40 border-transparent'
                      }`}
                    >
                      <Target size={20} color="#5F8063" />
                      <Text className="ml-3 text-earth-dark font-bold text-lg">{opt}</Text>
                    </TouchableOpacity>
                  );})}
                </View>

                {/* 3. Allergies */}
                <Text className="text-earth-dark font-bold text-lg mb-3 ml-1">Allergies (Optional)</Text>
                <GlassCard className="mb-8 p-0 bg-white/60 !rounded-2xl" intensity="high">
                  <TextInput 
                    placeholder="e.g. Peanuts, Dairy, Shellfish" 
                    placeholderTextColor="#A8BFA6"
                    className="text-earth-dark text-lg p-5 font-medium"
                    onChangeText={(t) => updateForm('allergies', t)}
                    value={formData.allergies}
                  />
                </GlassCard>
              </>
            )}

          </ScrollView>

          {/* --- BOTTOM NAVIGATION BAR --- */}
          <View className="absolute bottom-6 left-6 right-6">
            {step === 1 ? (
              // Step 1: "Next" Button
              <TouchableOpacity 
                onPress={handleNext} 
                className="bg-earth-primary p-5 rounded-full flex-row justify-center items-center shadow-xl shadow-earth-primary/40"
              >
                <Text className="text-[#F5E8D5] font-bold text-xl mr-2">Next Step</Text>
                <ArrowRight color="#F5E8D5" size={24} strokeWidth={3} />
              </TouchableOpacity>
            ) : (
              // Step 2: "Back" + "Submit" Buttons
              <View className="flex-row gap-4">
                <TouchableOpacity 
                    onPress={handleBack} 
                    className="flex-1 bg-white/80 p-5 rounded-full items-center flex-row justify-center border border-earth-primary/10"
                >
                  <ChevronLeft color="#5F8063" size={24} />
                  <Text className="text-earth-dark font-bold text-lg ml-1">Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={handleSubmit} 
                    disabled={loading} 
                    className={`flex-[2] p-5 rounded-full items-center shadow-xl shadow-earth-primary/40 ${loading ? 'bg-gray-400' : 'bg-earth-primary'}`}
                >
                  <Text className="text-[#F5E8D5] font-bold text-xl">
                      {loading ? "Cooking..." : "Enter Kitchen"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}