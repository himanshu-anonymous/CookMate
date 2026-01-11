import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Flame, Search, Leaf, Utensils, Zap, Clock, Camera, Sparkles, ArrowRight, Calendar } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { getInventory, addInventory, generateRecipe, generateDayPlan, analyzeImage, searchRecipes } from '../api';
import GlassCard from '../components/GlassCard';
import { getDishImage } from '../utils/AssetMap'; 

const DIET_TYPES = [
  { id: 'veg', label: 'Veg', icon: Leaf },
  { id: 'non-veg', label: 'Non-Veg', icon: Utensils },
];

const EFFORT_LEVELS = [
    { id: 'low', label: 'Lazy', icon: Zap },     
    { id: 'normal', label: 'Normal', icon: Clock }, 
    { id: 'high', label: 'Chef', icon: Flame },  
];

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner'];

export default function Dashboard({ route, navigation }) {
  const { user } = route.params;
  
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  
  // States
  const [diet, setDiet] = useState('non-veg'); 
  const [effort, setEffort] = useState('normal'); 
  const [dayPlan, setDayPlan] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  useEffect(() => { loadPantry(); }, []);

  const loadPantry = async () => {
    try {
      const data = await getInventory(user.id);
      setItems(data);
    } catch(e) {}
  };

  const handleAdd = async () => {
    if(!newItem.trim()) return;
    
    // 1. Format the name (Capitalize first letter)
    const formattedName = newItem.trim().charAt(0).toUpperCase() + newItem.slice(1);

    const itemToAdd = { 
        name: formattedName, 
        quantity: 1, 
        unit: 'pc' 
    };
    
    // 2. INSTANTLY add to the front of the list (Optimistic UI for Video)
    setItems([itemToAdd, ...items]); 
    setNewItem(''); 

    // 3. Background API call (Demo Mode handles this)
    await addInventory(user.id, [itemToAdd]);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to scan ingredients!');
        return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true, 
    });

    if (!result.canceled) {
        setLoading(true);
        setLoadingText("AI is scanning your fridge...");
        
        const detected = await analyzeImage(result.assets[0].base64);
        
        if (detected.length > 0) {
            const newItems = detected.map(name => ({ name, quantity: 1, unit: 'pc' }));
            
            // Instant update for camera too
            setItems([...newItems, ...items]);
            
            await addInventory(user.id, newItems);
            Alert.alert("Success", `Added: ${detected.join(", ")}`);
        } else {
            Alert.alert("AI Vision", "Couldn't identify food items clearly.");
        }
        setLoading(false);
    }
  };

  const handleSmartSearch = async () => {
      if(!searchQuery) return;
      setLoading(true);
      setLoadingText("Chef is searching...");
      const results = await searchRecipes(user.id, searchQuery);
      setSearchResults(results);
      setLoading(false);
  };

  const handleGenerateDay = async () => {
    setLoading(true);
    setLoadingText("Planning your day...");
    try {
      const plan = await generateDayPlan(user.id, diet);
      setDayPlan(plan);
      setSearchResults(null);
    } catch (e) {
      alert("AI is thinking... try again.");
    }
    setLoading(false);
  };

  const handleQuickSnack = async () => {
      setLoading(true);
      setLoadingText("Finding a quick snack...");
      try {
          const recipe = await generateRecipe(user.id, 'snack', 'low');
          navigation.navigate('RecipeDetail', { recipe, user });
      } catch(e) {
          alert("Snack generation failed.");
      }
      setLoading(false);
  };

  const handleMealClick = async (mealType, dishName) => {
    setLoading(true);
    setLoadingText(`Chef is cooking ${mealType}...`);
    try {
        const recipe = await generateRecipe(user.id, mealType, effort); 
        navigation.navigate('RecipeDetail', { recipe, user, heroImageName: dishName || recipe.dish_name });
    } catch(e) {
        alert("Could not load recipe details.");
    }
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-earth-bg">
      <SafeAreaView className="flex-1">
        <ScrollView className="p-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-earth-primary font-bold text-lg tracking-widest uppercase">Hello,</Text>
              <Text className="text-earth-dark text-4xl font-extrabold capitalize">{user.username}</Text>
            </View>
            <View>
                <GlassCard className="px-4 py-2 flex-row items-center !rounded-full bg-white/50" intensity="high">
                    <Flame color="#D4A373" size={20} fill="#D4A373" />
                    <Text className="text-earth-dark font-bold ml-2 text-lg">{user.streak_count || 0}</Text>
                </GlassCard>
            </View>
          </View>

          {/* Controls */}
          <View className="flex-row gap-3 mb-6">
              <View className="flex-1 bg-white/40 p-1 rounded-2xl flex-row">
                 {DIET_TYPES.map((type) => (
                    <TouchableOpacity key={type.id} onPress={() => setDiet(type.id)}
                        className={`flex-1 items-center justify-center rounded-xl py-2 ${diet === type.id ? 'bg-earth-primary' : ''}`}>
                        <Text className={`font-bold ${diet === type.id ? 'text-[#F5E8D5]' : 'text-earth-dark'}`}>{type.label}</Text>
                    </TouchableOpacity>
                 ))}
              </View>
              <View className="flex-[1.5] bg-white/40 p-1 rounded-2xl flex-row">
                 {EFFORT_LEVELS.map((lvl) => {
                    const Icon = lvl.icon;
                    return (
                        <TouchableOpacity key={lvl.id} onPress={() => setEffort(lvl.id)}
                            className={`flex-1 items-center justify-center rounded-xl py-2 ${effort === lvl.id ? 'bg-earth-dark' : ''}`}>
                            <Icon size={16} color={effort === lvl.id ? "#F5E8D5" : "#5F8063"} />
                        </TouchableOpacity>
                    )
                 })}
              </View>
          </View>

          {/* Smart Search */}
          <GlassCard className="p-2 pl-4 flex-row items-center mb-6 !rounded-xl bg-white/80">
                <Sparkles color="#E07A5F" size={20} />
                <TextInput 
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSmartSearch}
                  placeholder="I want something sweet..."
                  placeholderTextColor="#8BA88E"
                  className="flex-1 text-earth-dark text-lg ml-3 font-medium"
                />
                <TouchableOpacity onPress={handleSmartSearch} className="bg-earth-primary/10 p-2 rounded-lg">
                  <Search color="#5F8063" size={24} />
                </TouchableOpacity>
          </GlassCard>

          {/* Search Results */}
          {searchResults && (
              <View className="mb-6">
                  {searchResults.map((res, idx) => (
                      <TouchableOpacity key={idx} onPress={() => handleMealClick('dinner', res.dish_name)} className="mb-2">
                          <GlassCard className="p-4 flex-row justify-between items-center bg-white/60">
                              <View>
                                  <Text className="font-bold text-earth-dark text-lg">{res.dish_name}</Text>
                                  <Text className="text-xs text-gray-500">Match: {res.match_score}% • Effort: {res.effort_level}</Text>
                              </View>
                              <ArrowRight color="#5F8063" />
                          </GlassCard>
                      </TouchableOpacity>
                  ))}
              </View>
          )}

          {/* --- UPDATED PANTRY SECTION --- */}
          <View className="mb-8">
            <View className="flex-row justify-between items-end mb-3 px-1">
                <Text className="text-earth-dark font-bold text-xl">Your Pantry</Text>
                <Text className="text-earth-primary text-xs font-medium">{items.length} items</Text>
            </View>

            <GlassCard className="p-2 pl-4 flex-row items-center mb-4 !rounded-2xl bg-white/70 border border-white/40">
                <TextInput 
                  value={newItem}
                  onChangeText={setNewItem}
                  placeholder="Add items (e.g. Chicken)..."
                  placeholderTextColor="#8BA88E"
                  className="flex-1 text-earth-dark text-lg font-medium py-2"
                />
                
                {/* Camera Button (Visual Distinction) */}
                <TouchableOpacity onPress={pickImage} className="bg-earth-primary/10 p-3 rounded-xl mr-2">
                  <Camera color="#5F8063" size={20} />
                </TouchableOpacity>

                {/* Add Button (Green Action) */}
                <TouchableOpacity onPress={handleAdd} className="bg-earth-primary p-3 rounded-xl shadow-lg shadow-earth-primary/30">
                  <Plus color="#F5E8D5" size={20} strokeWidth={3} />
                </TouchableOpacity>
            </GlassCard>
            
            {/* Horizontal Scroll */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row overflow-visible pl-1">
              {items.map((i, idx) => (
                <View key={idx} className="bg-white border border-earth-primary/20 px-4 py-3 rounded-xl mr-3 shadow-sm">
                  <Text className="text-earth-dark font-semibold text-sm capitalize">{i.name}</Text>
                </View>
              ))}
              {/* Fake empty view for padding */}
              <View className="w-4" />
            </ScrollView>
          </View>

          {/* Quick Snack */}
          <TouchableOpacity onPress={handleQuickSnack} disabled={loading} activeOpacity={0.9} className="mb-4">
             <GlassCard className="p-4 flex-row items-center bg-[#FFF8F0] border-earth-primary/20" intensity="medium">
                 <View className="bg-orange-100 p-3 rounded-full mr-4">
                     <Zap color="#E07A5F" size={24} fill="#E07A5F" />
                 </View>
                 <View className="flex-1">
                     <Text className="text-earth-dark text-lg font-bold">Quick Snack</Text>
                     <Text className="text-gray-500 text-xs">Low effort, ready in 5 mins</Text>
                 </View>
                 <ArrowRight color="#E07A5F" />
             </GlassCard>
          </TouchableOpacity>

          {/* Generate Day Plan */}
          {!dayPlan && !searchResults && (
             <TouchableOpacity onPress={handleGenerateDay} disabled={loading} activeOpacity={0.9}>
                <GlassCard className="p-8 items-center justify-center bg-earth-primary border-none shadow-xl shadow-earth-primary/40" intensity="high">
                    <Calendar color="#F5E8D5" size={48} />
                    <Text className="text-[#F5E8D5] text-2xl font-bold mt-4">Generate Day Plan</Text>
                </GlassCard>
            </TouchableOpacity>
          )}

          {/* Timeline */}
          {dayPlan && (
            <View>
                {MEAL_ORDER.map((slot) => {
                    const meal = dayPlan[slot];
                    if (!meal) return null;

                    const dishImage = getDishImage(meal.dish_name);

                    return (
                        <TouchableOpacity key={slot} onPress={() => handleMealClick(slot, meal.dish_name)} className="mb-4">
                             <GlassCard className="flex-row items-center p-4 bg-white/60 border-earth-primary/10">
                                {/* STANDARD IMAGE (No Shared Transition) */}
                                <Image 
                                    source={dishImage}
                                    style={{ width: 60, height: 60, resizeMode: 'contain', marginRight: 16 }}
                                />
                                
                                <View className="flex-1">
                                    <Text className="text-earth-primary text-xs font-bold uppercase tracking-widest mb-1">{slot}</Text>
                                    <Text className="text-earth-dark text-xl font-bold capitalize">{meal.dish_name}</Text>
                                    <Text className="text-gray-500 text-sm mt-1">{meal.time} • {meal.calories}</Text>
                                </View>
                                <ArrowRight color="#5F8063" size={16} />
                             </GlassCard>
                        </TouchableOpacity>
                    );
                })}
            </View>
          )}
        </ScrollView>

        {loading && (
            <View className="absolute inset-0 bg-black/40 items-center justify-center z-50">
                <GlassCard className="p-6 items-center bg-white w-3/4">
                    <ActivityIndicator color="#5F8063" size="large" />
                    <Text className="text-earth-dark font-bold mt-4 text-lg">{loadingText}</Text>
                </GlassCard>
            </View>
        )}
      </SafeAreaView>
    </View>
  );
}