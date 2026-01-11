import axios from 'axios';

// --- DEMO MODE CONFIGURATION ---
// We keep the real URL just in case, but we won't use it for the pitch.
const API_BASE_URL = 'http://10.217.155.145:8000'; 

// --- FAKE DATA GENERATORS (For your Pitch Video) ---

// 1. User Creation (Bypasses Login/Signup)
export const createUser = async (userData) => {
  console.log("DEMO MODE: Creating User...", userData);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ 
        id: 1, 
        username: userData.username || "Himanshu", 
        streak_count: 12, // High streak looks good for the demo!
        dietary_goal: "Muscle Gain",
        preferences: "High Protein"
      });
    }, 800); // 0.8s fake loading
  });
};

// 2. Inventory (Populates the "Fridge")
export const getInventory = async (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: "Chicken Breast", quantity: 2, unit: 'kg' },
        { name: "Broccoli", quantity: 1, unit: 'pc' },
        { name: "Eggs", quantity: 6, unit: 'pc' },
        { name: "Greek Yogurt", quantity: 1, unit: 'cup' },
        { name: "Olive Oil", quantity: 1, unit: 'bottle' }
      ]);
    }, 500);
  });
};

export const addInventory = async (userId, items) => {
  return { status: "success", added: items };
};

// 3. Vision API (Pretends to see ingredients)
export const analyzeImage = async (base64Image) => {
    console.log("DEMO MODE: Analyzing Image...");
    return new Promise((resolve) => {
        setTimeout(() => {
            // Always detects these items regardless of what you photograph
            resolve(["Avocado", "Sourdough Bread", "Lemon"]);
        }, 2000);
    });
};

// 4. Generate Recipe (The Core Feature)
// 4. Generate Recipe (SMARTER DEMO MODE)
export const generateRecipe = async (userId, mealType, effortLevel = "normal") => {
    console.log(`DEMO MODE: Generating ${mealType} recipe...`);
    
    return new Promise((resolve) => {
        setTimeout(() => {
            let recipe = {};

            // LOGIC: Return different recipes based on what button you clicked
            // This makes it look like the AI is actually thinking about your inventory.

            if (mealType === 'breakfast') {
                recipe = {
                    dish_name: "Veggie Omelette",
                    time: "10m",
                    calories: "320 kcal",
                    ingredients: ["Eggs", "Spinach", "Tomatoes", "Olive Oil", "Salt"],
                    instructions: [
                        "Whisk 3 eggs in a bowl with a pinch of salt.",
                        "Chop spinach and tomatoes finely.",
                        "Heat olive oil in a pan and sauté vegetables.",
                        "Pour eggs over the veg and cook until fluffy.",
                        "Fold and serve hot."
                    ]
                };
            } 
            else if (mealType === 'lunch' || effortLevel === 'low') {
                recipe = {
                    dish_name: "Chicken & Broccoli Stir-Fry",
                    time: "15m",
                    calories: "400 kcal",
                    ingredients: ["Chicken Breast", "Broccoli", "Soy Sauce", "Garlic", "Rice"],
                    instructions: [
                        "Cut chicken into bite-sized cubes.",
                        "Heat pan and sear chicken until golden.",
                        "Add broccoli florets and splash of water to steam.",
                        "Stir in soy sauce and minced garlic.",
                        "Serve over a bed of rice."
                    ]
                };
            } 
            else { 
                // Default / Dinner / High Effort
                recipe = {
                    dish_name: "Creamy Garlic Chicken",
                    time: "25m",
                    calories: "450 kcal",
                    ingredients: ["Chicken Breast", "Heavy Cream", "Garlic", "Spinach", "Parmesan"],
                    instructions: [
                        "Season the chicken breasts with salt and pepper.",
                        "Sear chicken in a pan until golden brown.",
                        "Add garlic, cream, and parmesan to the pan.",
                        "Simmer until sauce thickens, then add spinach.",
                        "Serve hot with crusty bread."
                    ]
                };
            }

            resolve(recipe);
        }, 1500); // 1.5s delay for realism
    });
};
// 5. Smart Search
export const searchRecipes = async (userId, query) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { dish_name: "Pesto Pasta", match_score: 98, effort_level: "Easy" },
                { dish_name: "Caprese Salad", match_score: 95, effort_level: "Lazy" },
                { dish_name: "Grilled Salmon", match_score: 88, effort_level: "Chef" }
            ]);
        }, 1000);
    });
};

// 6. Day Plan (Timeline)
export const generateDayPlan = async (userId, dietPreference) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        breakfast: { dish_name: "Oatmeal with Berries", time: "10m", calories: "300 kcal" },
        lunch: { dish_name: "Grilled Chicken Wrap", time: "15m", calories: "500 kcal" },
        dinner: { dish_name: "Salmon with Asparagus", time: "25m", calories: "600 kcal" }
      });
    }, 1500);
  });
};

// 7. Cooking Session (Player)
export const startSession = async (userId, recipeData) => {
  return new Promise((resolve) => {
      setTimeout(() => {
          resolve({ 
              session_id: "demo-123", 
              step_number: 1, 
              instruction: recipeData.instructions[0] || "Let's get started! Prep your ingredients.",
              timer_seconds: 0 
          });
      }, 500);
  });
};

export const nextStep = async (sessionId) => {
  return new Promise((resolve) => {
      setTimeout(() => {
          resolve({ 
              step_number: 2, 
              instruction: "Now, heat the pan to medium heat.", 
              timer_seconds: 0 
          });
      }, 500);
  });
};

// 8. Voice Interaction (The "Wow" Factor)
export const sendVoiceCommand = async (sessionId, uri) => {
  console.log("DEMO MODE: Processing Voice...");
  return new Promise((resolve) => {
      setTimeout(() => {
          // Returns a public MP3 URL so the app plays *something*
          resolve("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
      }, 1000);
  });
};