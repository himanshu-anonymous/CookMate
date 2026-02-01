import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

// Import All Screens
import LoginScreen from './screens/LoginScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import HomeScreen from './screens/HomeScreen';
import InventoryScreen from './screens/InventoryScreen'; // <--- 1. Import This
import ScannerScreen from './screens/ScannerScreen';
import RecipeDetailsScreen from './screens/RecipeDetailsScreen';
import RecipeGeneratorScreen from './screens/RecipeGeneratorScreen';
import CookingModeScreen from './screens/CookingModeScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegistrationScreen} />

        {/* Main App Screens */}
        <Stack.Screen name="Home" component={HomeScreen} />
        
        {/* 🚨 2. ADD THIS MISSING SCREEN 🚨 */}
        <Stack.Screen name="Inventory" component={InventoryScreen} />

        <Stack.Screen name="Scanner" component={ScannerScreen} />
        <Stack.Screen name="GenerateRecipe" component={RecipeGeneratorScreen} />
        <Stack.Screen name="RecipeDetails" component={RecipeDetailsScreen} />
        <Stack.Screen name="CookingMode" component={CookingModeScreen} />
        <Stack.Screen name="ShoppingList" component={ShoppingListScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}