import axios from 'axios';
import { Platform } from 'react-native';

// REPLACE THIS with your Laptop's IP (Run 'ipconfig' in terminal)
const BASE_URL = 'http://192.168.5.71:8000'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const cookmateAPI = {
  onboardUser: async (data) => (await api.post('/users/onboard', data)).data,
  
  scanBill: async (userId, imageUri) => {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('file', { uri: imageUri, name: 'bill.jpg', type: 'image/jpeg' });
    return (await api.post('/inventory/scan-bill', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },

  generateRecipe: async (userId, mealType) => (await api.post('/recipes/generate', { user_id: userId, meal_type: mealType, effort_level: "medium" })).data,
  
  startSession: async (userId, recipeTitle) => (await api.post('/mentor/start', { user_id: userId, recipe_title: recipeTitle })).data,
  
  endSession: async (data) => (await api.post('/mentor/end', data)).data,

  getUserStats: async (userId) => (await api.get(`/users/stats/${userId}`)).data
};