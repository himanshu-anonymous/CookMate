import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Flame, User, ChevronLeft, Play, Heart, Share2, ArrowRight } from 'lucide-react-native';
import GlassCard from '../components/GlassCard';
import { getDishImage } from '../utils/AssetMap';

const { width } = Dimensions.get('window');

export default function RecipeDetail({ route, navigation }) {
  const { recipe, user } = route.params;
  const [activeTab, setActiveTab] = useState('ingredients');

  const dishImage = getDishImage(recipe.dish_name);

  return (
    <View className="flex-1 bg-earth-bg">
      {/* Full Screen Image Header */}
      <View className="absolute top-0 left-0 right-0 h-[45%] z-0">
          <Image 
            source={dishImage} 
            style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
          />
          <View className="absolute inset-0 bg-black/30" />
      </View>

      <SafeAreaView className="flex-1">
        {/* Header Controls */}
        <View className="flex-row justify-between items-center px-6 pt-2">
            <TouchableOpacity onPress={() => navigation.goBack()} className="bg-white/20 p-3 rounded-full backdrop-blur-md">
                <ChevronLeft color="#fff" size={24} />
            </TouchableOpacity>
            <View className="flex-row gap-3">
                <TouchableOpacity className="bg-white/20 p-3 rounded-full backdrop-blur-md">
                    <Heart color="#fff" size={24} />
                </TouchableOpacity>
                <TouchableOpacity className="bg-white/20 p-3 rounded-full backdrop-blur-md">
                    <Share2 color="#fff" size={24} />
                </TouchableOpacity>
            </View>
        </View>

        {/* Floating Content Card */}
        <View className="flex-1 mt-48 bg-earth-bg rounded-t-[40px] overflow-hidden shadow-2xl">
            <ScrollView className="flex-1 pt-8 px-8" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                {/* Title & Stats */}
                <View className="mb-6">
                    <Text className="text-earth-dark text-3xl font-extrabold capitalize leading-tight mb-2">
                        {recipe.dish_name}
                    </Text>
                    <View className="flex-row gap-4 mt-2">
                        <View className="flex-row items-center bg-orange-100 px-3 py-1 rounded-full">
                            <Clock size={14} color="#E07A5F" />
                            <Text className="text-[#E07A5F] font-bold ml-1 text-xs">{recipe.time || '30m'}</Text>
                        </View>
                        <View className="flex-row items-center bg-green-100 px-3 py-1 rounded-full">
                            <Flame size={14} color="#5F8063" />
                            <Text className="text-[#5F8063] font-bold ml-1 text-xs">{recipe.calories || '400 cal'}</Text>
                        </View>
                        <View className="flex-row items-center bg-blue-100 px-3 py-1 rounded-full">
                            <User size={14} color="#4A90E2" />
                            <Text className="text-[#4A90E2] font-bold ml-1 text-xs">2 Servings</Text>
                        </View>
                    </View>
                </View>

                {/* Tabs */}
                <View className="flex-row bg-white/50 p-1 rounded-2xl mb-6">
                    <TouchableOpacity onPress={() => setActiveTab('ingredients')} 
                        className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'ingredients' ? 'bg-earth-primary shadow-sm' : ''}`}>
                        <Text className={`font-bold ${activeTab === 'ingredients' ? 'text-[#F5E8D5]' : 'text-earth-dark'}`}>Ingredients</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('instructions')} 
                        className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'instructions' ? 'bg-earth-primary shadow-sm' : ''}`}>
                        <Text className={`font-bold ${activeTab === 'instructions' ? 'text-[#F5E8D5]' : 'text-earth-dark'}`}>Steps</Text>
                    </TouchableOpacity>
                </View>

                {/* Content Area */}
                <View>
                    {activeTab === 'ingredients' ? (
                        <View className="gap-3">
                            {recipe.ingredients?.map((ing, idx) => (
                                <View key={idx} className="flex-row items-center bg-white p-4 rounded-2xl border border-earth-primary/10">
                                    <View className="w-2 h-2 rounded-full bg-earth-primary mr-4" />
                                    <Text className="text-earth-dark font-medium text-lg capitalize">{ing}</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="gap-6 pl-4 border-l-2 border-earth-primary/20">
                            {recipe.instructions?.map((step, idx) => (
                                <View key={idx} className="mb-2">
                                    <Text className="text-earth-primary font-bold text-xs uppercase tracking-widest mb-1">Step {idx + 1}</Text>
                                    <Text className="text-earth-dark text-lg leading-6">{step}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* Start Cooking Button (Floating) */}
            <View className="absolute bottom-8 left-8 right-8">
                <TouchableOpacity 
                    onPress={() => navigation.navigate('Player', { recipe, user })}
                    activeOpacity={0.9}
                >
                    <GlassCard className="bg-earth-dark p-4 rounded-full flex-row items-center justify-center shadow-xl shadow-earth-dark/40" intensity="high">
                        <Play fill="#F5E8D5" color="#F5E8D5" size={24} className="mr-3" />
                        <Text className="text-[#F5E8D5] font-bold text-xl">Start Cooking</Text>
                    </GlassCard>
                </TouchableOpacity>
            </View>
        </View>
      </SafeAreaView>
    </View>
  );
}