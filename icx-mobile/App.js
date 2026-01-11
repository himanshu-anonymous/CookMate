import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BookOpen, User } from 'lucide-react-native';

// Screens
import Onboarding from './src/screens/Onboarding';
import Dashboard from './src/screens/Dashboard';
import RecipeDetail from './src/screens/RecipeDetail';
import Player from './src/screens/Player';
import SavedRecipes from './src/screens/SavedRecipes';
import Profile from './src/screens/Profile'; 

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- 1. THE BOTTOM TABS ---
function MainTabs({ route }) {
  const { user } = route.params; 

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#F5E8D5', 
          borderTopWidth: 0,
          height: 80,
          elevation: 0,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#5F8063', 
        tabBarInactiveTintColor: '#A8BFA6', 
        tabBarShowLabel: false, 
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={Dashboard} 
        initialParams={{ user }}
        options={{
          tabBarIcon: ({ color }) => <Home size={28} color={color} />
        }}
      />
      <Tab.Screen 
        name="Saved" 
        component={SavedRecipes} 
        initialParams={{ user }} 
        options={{
          tabBarIcon: ({ color }) => <BookOpen size={28} color={color} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile} 
        initialParams={{ user }} 
        options={{
          tabBarIcon: ({ color }) => <User size={28} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}

// --- 2. THE MAIN STACK ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {/* Login Screen */}
        <Stack.Screen name="Onboarding">
          {(props) => (
            <Onboarding 
              {...props} 
              onComplete={(user) => props.navigation.replace('Main', { user })} 
            />
          )}
        </Stack.Screen>

        {/* Main Tabbed Interface */}
        <Stack.Screen name="Main" component={MainTabs} />

        {/* 3D Recipe Page (Standard Slide Animation) */}
        <Stack.Screen 
            name="RecipeDetail" 
            component={RecipeDetail} 
            options={{ animation: 'slide_from_right' }}
        />

        {}
        <Stack.Screen 
            name="Player" 
            component={Player} 
            options={{ 
                animation: 'slide_from_bottom', 
                presentation: 'modal'
            }} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
