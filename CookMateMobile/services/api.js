import axios from 'axios';

// --------------------------------------------------------
// ⚠️ FINAL CHECK: Is this your Laptop's IP?
// Run 'ipconfig' (Windows) or 'ifconfig' (Mac) to check.
// --------------------------------------------------------
const API_URL = 'http://192.168.5.71:8000'; 

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // Wait up to 15 seconds
});

export const cookmateAPI = {
  // 1. Health Check
  healthCheck: async () => {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      console.error("Health Check Failed:", error);
      throw error;
    }
  },

  // 2. Upload Bill Image
  scanBill: async (userId, imageUri) => {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: 'bill.jpg',
      type: 'image/jpeg',
    });
    
    const id = parseInt(userId); 
    const response = await api.post(`/scan/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // 3. Start Cooking Session (Fixed for 'recipe_title')
  startSession: async (userId, recipeName) => {
    console.log(`Starting session for: ${recipeName}`);
    const response = await api.post('/mentor/start', {
      user_id: parseInt(userId),
      recipe_title: recipeName // 🚨 Backend demands 'recipe_title'
    });
    return response.data;
  },

  // 4. Generate Recipe (Fixed for 'effort_level')
  generateRecipe: async (userId, mealType) => {
    console.log(`Generating ${mealType}...`);
    const response = await api.post('/recipes/generate', {
      user_id: parseInt(userId),
      meal_type: mealType,
      ingredients: [],        
      preferences: "healthy", 
      time_limit: 30,         
      effort_level: "medium"  // 🚨 Backend demands 'effort_level'
    });
    return response.data;
  },

  // 5. Chat with AI Chef (Fixed for 'audio_url')
  chatWithChef: async (userId, userMessage) => {
    console.log("Sending to Chat:", userMessage);
    const response = await api.post('/mentor/chat', {
      user_id: parseInt(userId),
      message: userMessage,
      audio_url: ""  // 🚨 Backend crashes if this is null
    });
    return response.data;
  }
};