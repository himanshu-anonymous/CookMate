import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Clock, ChevronRight } from 'lucide-react-native';

export default function SavedRecipes() {
  // Dummy data for now
  const saved = [
    { id: 1, name: "Avocado Toast", time: "5 min", tags: ["Healthy", "Breakfast"] },
    { id: 2, name: "Creamy Pesto Pasta", time: "20 min", tags: ["Dinner", "Comfort"] },
    { id: 3, name: "Green Smoothie", time: "3 min", tags: ["Detox"] },
  ];

  return (
    <View className="flex-1 bg-earth-bg">
      <SafeAreaView className="flex-1 p-6">
        <Text className="text-earth-dark text-3xl font-bold mb-6">Cookbook</Text>
        
        <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
          {saved.map((item) => (
            <TouchableOpacity key={item.id} className="bg-earth-card p-4 rounded-3xl shadow-sm flex-row items-center justify-between border border-earth-primary/10">
              <View className="flex-row items-center space-x-4">
                <View className="bg-earth-primary/20 p-3 rounded-full">
                  <Heart size={24} color="#5F8063" fill="#5F8063" />
                </View>
                <View>
                  <Text className="text-earth-dark font-bold text-lg">{item.name}</Text>
                  <View className="flex-row items-center mt-1">
                    <Clock size={14} color="#888" />
                    <Text className="text-gray-500 text-xs ml-1">{item.time}</Text>
                  </View>
                </View>
              </View>
              <ChevronRight color="#5F8063" />
            </TouchableOpacity>
          ))}
          {/* Bottom spacer so content doesn't get hidden behind nav bar */}
          <View className="h-20" /> 
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}