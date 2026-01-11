import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Settings, LogOut, Award, User, Target, Leaf, AlertTriangle } from 'lucide-react-native';
import GlassCard from '../components/GlassCard';

export default function Profile({ route, navigation }) {
  // Use data passed from login
  // Defaults added just in case
  const user = route.params?.user || { 
    username: "Guest", 
    streak_count: 0, 
    persona: "Explorer",
    dietary_goal: "Balanced",
    preferences: "None",
    allergies: "None"
  };

  return (
    <View className="flex-1 bg-earth-bg">
      {/* Decorative BG Blob */}
      <View className="absolute top-0 right-0 w-64 h-64 bg-earth-primary/10 rounded-full blur-3xl" />

      <SafeAreaView className="flex-1 p-6">
        {/* --- HEADER --- */}
        <View className="flex-row justify-between items-center mb-8">
          <Text className="text-earth-dark text-3xl font-bold">Profile</Text>
          <TouchableOpacity className="bg-white/50 p-2 rounded-full">
            <Settings color="#5F8063" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          {/* --- AVATAR & IDENTITY --- */}
          <View className="items-center mb-8">
            <View className="bg-white p-2 rounded-full shadow-xl shadow-earth-primary/20 mb-4">
              <View className="bg-earth-primary/10 p-6 rounded-full border border-earth-primary/20">
                <User size={64} color="#5F8063" />
              </View>
            </View>
            <Text className="text-earth-dark text-3xl font-bold">{user.username}</Text>
            <Text className="text-earth-primary font-medium text-lg capitalize">{user.persona} Persona</Text>
          </View>

          {/* --- GAMIFICATION STATS --- */}
          <View className="flex-row justify-between mb-6">
            <GlassCard className="w-[48%] items-center py-6 bg-[#FFF8F0]" intensity="high">
              <Flame color="#D4A373" size={32} fill="#D4A373" />
              <Text className="text-3xl font-bold text-earth-dark mt-2">{user.streak_count}</Text>
              <Text className="text-gray-500 text-xs uppercase tracking-widest font-bold">Day Streak</Text>
            </GlassCard>

            <GlassCard className="w-[48%] items-center py-6 bg-[#FFF8F0]" intensity="high">
              <Award color="#5F8063" size={32} />
              <Text className="text-3xl font-bold text-earth-dark mt-2">Novice</Text>
              <Text className="text-gray-500 text-xs uppercase tracking-widest font-bold">Chef Rank</Text>
            </GlassCard>
          </View>

          {/* --- NEW: FOOD IDENTITY SECTION --- */}
          <Text className="text-earth-dark font-bold text-xl mb-4 ml-1">My Food Identity</Text>
          
          <GlassCard className="p-5 mb-8 bg-white/60" intensity="medium">
            
            {/* Goal */}
            <View className="flex-row items-center mb-4 border-b border-gray-100 pb-4">
              <View className="bg-blue-100 p-2 rounded-full mr-4">
                <Target size={20} color="#3B82F6" />
              </View>
              <View>
                <Text className="text-gray-500 text-xs uppercase font-bold">Primary Goal</Text>
                <Text className="text-earth-dark text-lg font-bold">{user.dietary_goal || "Balanced"}</Text>
              </View>
            </View>

            {/* Diet */}
            <View className="flex-row items-center mb-4 border-b border-gray-100 pb-4">
              <View className="bg-green-100 p-2 rounded-full mr-4">
                <Leaf size={20} color="#22C55E" />
              </View>
              <View>
                <Text className="text-gray-500 text-xs uppercase font-bold">Diet Type</Text>
                <Text className="text-earth-dark text-lg font-bold">{user.preferences || "No Restrictions"}</Text>
              </View>
            </View>

            {/* Allergies (Red if exists) */}
            <View className="flex-row items-center">
              <View className={`p-2 rounded-full mr-4 ${user.allergies && user.allergies !== "None" ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertTriangle size={20} color={user.allergies && user.allergies !== "None" ? "#EF4444" : "#9CA3AF"} />
              </View>
              <View>
                <Text className="text-gray-500 text-xs uppercase font-bold">Allergies</Text>
                <Text className={`text-lg font-bold ${user.allergies && user.allergies !== "None" ? 'text-red-500' : 'text-earth-dark'}`}>
                  {user.allergies || "None"}
                </Text>
              </View>
            </View>

          </GlassCard>

          {/* --- LOGOUT --- */}
          <TouchableOpacity 
            onPress={() => navigation.replace('Onboarding')}
            className="flex-row justify-center items-center bg-red-50 p-4 rounded-2xl border border-red-100 mb-6"
          >
            <LogOut size={20} color="#EF4444" />
            <Text className="text-red-500 font-bold ml-2 text-lg">Log Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}