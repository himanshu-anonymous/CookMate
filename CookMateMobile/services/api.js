import axios from 'axios';

// --------------------------------------------------------
// ⚠️ CHECK: Is this your Laptop's IP?
// --------------------------------------------------------
const API_URL = 'http://192.168.5.71:8000'; 

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, 
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

  // 1.5 Register User
  registerUser: async (userData) => {
    const response = await api.post('/users/onboard', userData);
    return response.data;
  },

  // 1.6 Login User
  loginUser: async (username) => {
    const response = await api.post('/users/login', { username: username });
    return response.data;
  },

  // 2. Upload Bill Image
  scanBill: async (userId, imageUri) => {
    const formData = new FormData();
    const uri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
    
    formData.append('file', { uri: uri, name: 'bill.jpg', type: 'image/jpeg' });
    formData.append('user_id', String(userId));

    try {
      const response = await fetch(`${API_URL}/inventory/scan-bill`, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(json));
      return json;
    } catch (error) {
      console.error("Scan Error:", error);
      throw error;
    }
  },

  // 3. Start Cooking Session
  startSession: async (userId, recipeName, recipeSteps) => {
    console.log(`Starting session for: ${recipeName}`);
    const response = await api.post('/mentor/start', {
      user_id: parseInt(userId),
      recipe_title: recipeName,
      steps: recipeSteps || ["Just cook it!"] 
    });
    return response.data;
  },

  // 4. Generate Recipe
  generateRecipe: async (userId, mealType) => {
    console.log(`Generating ${mealType}...`);
    const response = await api.post('/recipes/generate', {
      user_id: parseInt(userId),
      meal_type: mealType,
      ingredients: [],        
      preferences: "healthy", 
      time_limit: 30,         
      effort_level: "medium" 
    });
    return response.data;
  },

  // 5. Chat with AI Chef
  chatWithChef: async (userId, userMessage) => {
    console.log("Sending to Chat:", userMessage);
    const response = await api.post('/mentor/chat', {
      user_id: parseInt(userId),
      message: userMessage,
      audio_url: "" 
    });
    return response.data;
  },

  // 6. Get Current Inventory
  getInventory: async (userId) => {
    const response = await api.get(`/inventory/${userId}`);
    return response.data;
  },

  // 7. Manual Add
  addInventoryItems: async (userId, items) => {
    const response = await api.post('/inventory/add', items, {
      params: { user_id: parseInt(userId) } 
    });
    return response.data;
  },

  // 8. Guardian Check
  guardianCheck: async (sessionId, instruction, imageUri) => {
    const formData = new FormData();
    const uri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
    
    formData.append('file', { uri: uri, name: 'check.jpg', type: 'image/jpeg' });
    formData.append('session_id', String(sessionId));
    formData.append('instruction', instruction);

    try {
      const response = await fetch(`${API_URL}/mentor/guardian-check`, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
      });
      return await response.json();
    } catch (error) {
      console.error("Guardian Check Failed:", error);
      throw error;
    }
  },

  // 10. Get User Stats
  getUserStats: async (userId) => {
    const response = await api.get(`/users/stats/${userId}`);
    return response.data;
  },

  // 11. End Session (XP + Inventory Update)
  endSession: async (sessionId, rating, leftovers, ingredientsConsumed) => {
    const response = await api.post('/mentor/end', {
      session_id: parseInt(sessionId),
      rating: rating || 5,
      leftovers: leftovers || false,
      ingredients_consumed: ingredientsConsumed || []
    });
    return response.data;
  },
  
  // 12. Get Shopping List
  getShoppingList: async (userId) => {
    const response = await api.get(`/inventory/shopping-list/${userId}`);
    return response.data;
  },

  // 13. Get Full User Profile
  getUserProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // 14. Update Cooking Skill
  updateCookingSkill: async (userId, skillLevel) => {
    const response = await api.put(`/users/${userId}/skill`, { skill_level: skillLevel });
    return response.data;
  }
};