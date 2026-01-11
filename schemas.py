from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from models import UserPersona 

# --- 1. INVENTORY & EXPIRY ---
class InventoryItemBase(BaseModel):
    name: str
    quantity: float
    unit: str
    expiry_date: Optional[datetime] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItem(InventoryItemBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class ExpiryAlert(BaseModel):
    item_name: str
    days_remaining: int
    status: str 
    
class ImageAnalysisRequest(BaseModel):
    image_base64: str  # Frontend sends image as Base64 string

#  2. USER & PROFILE 
class UserBase(BaseModel):
    username: str
    preferences: str = "None"
    dietary_goal: str = "Balanced"
    allergies: str = "None"
    persona: UserPersona = UserPersona.HOSTELER
    current_effort_level: str = "normal"
    planning_horizon: str = "daily"

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    portion_multiplier: float
    streak_count: int
    class Config:
        from_attributes = True

# 3. RECIPES & SMART SEARCH 
class RecipeRequest(BaseModel):
    user_id: int
    meal_type: str = "dinner"
    effort_level: Optional[str] = "normal"

# Smart Search Schema
class SearchRequest(BaseModel):
    user_id: int
    query: str

class SearchResult(BaseModel):
    dish_name: str
    match_score: int
    missing_ingredients: List[str]
    effort_level: str

# NEW: Collaborative Filtering (Ratings)
class RateMealRequest(BaseModel):
    user_id: int
    dish_name: str
    rating: int
    tags: List[str] = []

class CookingStep(BaseModel):
    step_number: int
    instruction: str
    duration_seconds: int = 60 
    heat_level: str = "medium"
    visual_cue: Optional[str] = None

class StructuredRecipe(BaseModel):
    dish_name: str
    description: str = "No description provided."
    ingredients: List[str] = []
    # NEW: AI will now return these fields for inventory management
    missing_ingredients_alert: List[str] = [] 
    substitutions: Dict[str, str] = {}
    
    equipment: List[str] = []
    steps: List[CookingStep]
    total_time_minutes: int = 15
    macros_estimate: Dict[str, str] = {}
    
    effort_score: float = 5.0
    prep_time_minutes: int = 5
    cleanup_score: str = "medium"

# --- 4. SAVED RECIPES ---
class SavedRecipeCreate(BaseModel):
    dish_name: str
    recipe_json: Dict[str, Any]
    effort_score: float = 5.0
    prep_time_minutes: int = 15
    cleanup_score: str = "medium"

class SavedRecipe(SavedRecipeCreate):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# 5. COOKING MENTOR 
class SessionStartRequest(BaseModel):
    user_id: int
    recipe_data: StructuredRecipe 

class MentorStepResponse(BaseModel):
    session_id: int
    step_number: int
    total_steps: int
    instruction: str
    timer_seconds: int
    visual_cue: Optional[str] = None
    voice_response_text: str
    all_step_timers: List[int] = []

#  6. DAY PLAN 
class DayPlanRequest(BaseModel):
    user_id: int
    diet_preference: str = "non-veg"
