// src/utils/AssetMap.js

// 1. Map for DISHES (The big floating plates)
const DISH_IMAGES = {
  'pasta': require('../../assets/dishes/pasta.png'),
  'salad': require('../../assets/dishes/salad.png'),
  'steak': require('../../assets/dishes/steak.png'),
  // Add as many as you have files for
};

// 2. Map for INGREDIENTS (The small icons)
const INGREDIENT_IMAGES = {
  'tomato': require('../../assets/ingredients/tomato.png'),
  'cheese': require('../../assets/ingredients/cheese.png'),
  'egg': require('../../assets/ingredients/egg.png'),
  'spinach': require('../../assets/ingredients/spinach.png'),
};

export const getDishImage = (name) => {
  // Simple logic: check if the dish name contains a keyword we have an image for
  const key = Object.keys(DISH_IMAGES).find(k => name.toLowerCase().includes(k));
  return key ? DISH_IMAGES[key] : require('../../assets/dishes/default.png');
};

export const getIngredientImage = (name) => {
  const key = Object.keys(INGREDIENT_IMAGES).find(k => name.toLowerCase().includes(k));
  // Return the specific image, or null if we don't have it (so we don't crash)
  return key ? INGREDIENT_IMAGES[key] : null; 
};