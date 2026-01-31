import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

// Import Screens
import HomeScreen from './screens/HomeScreen';
import ScannerScreen from './screens/ScannerScreen';
import RecipeDetailsScreen from './screens/RecipeDetailsScreen';
import RecipeGeneratorScreen from './screens/RecipeGeneratorScreen';
import CookingModeScreen from './screens/CookingModeScreen';
// import ProfileScreen from './screens/ProfileScreen'; // Waiting for teammate

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Scanner" component={ScannerScreen} />
        <Stack.Screen name="GenerateRecipe" component={RecipeGeneratorScreen} />
        <Stack.Screen name="RecipeDetails" component={RecipeDetailsScreen} />
        <Stack.Screen name="CookingMode" component={CookingModeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}