from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# --- ENUMS (Shared with Frontend) ---
class UserPersona(str, Enum):
    HOSTELER = "hosteler"
    INDIAN_MOM = "indian_mom"
    GYM_BRO = "gym_bro"
    MASTER_CHEF = "master_chef"

# ==========================================
# 1. USER PROFILE & ONBOARDING
# ==========================================
class UserBase(BaseModel):
    username: str
    age: int
    weight: float
    height: float
    gender: str
    persona: UserPersona = UserPersona.HOSTELER
    
    # Core Health & Logic
    health_goal: str = "Maintain"
    rotis_per_meal: int = 2
    cooking_skill: int = 5
    
    # Advanced Preferences
    medical_conditions: List[str] = [] 
    allergies: List[str] = []
    dietary_preferences: List[str] = []
    spice_tolerance: str = "Medium" 
    fav_cuisine: List[str] = [] 
    weekly_budget: float = 0.0 

class UserCreate(UserBase):
    pass

class BadgeResponse(BaseModel):
    badge_name: str
    description: str
    earned_at: datetime

class UserResponse(UserBase):
    id: int
    portion_multiplier: float
    xp_points: int
    current_streak: int
    badges: List[BadgeResponse] = [] 
    
    class Config:
        from_attributes = True

# ==========================================
# 2. INVENTORY & SHOPPING
# ==========================================
class InventoryCreate(BaseModel):
    name: str
    quantity: float
    unit: str
    category: str = "General"
    price_per_unit: float = 0.0 
    expiry_date: Optional[datetime] = None

class InventoryResponse(InventoryCreate):
    id: int
    is_exhausted: bool
    
    class Config:
        from_attributes = True

class ShoppingItem(BaseModel):
    name: str
    suggested_qty: float
    reason: str

class ShoppingListResponse(BaseModel):
    shopping_list: List[ShoppingItem]

# ==========================================
# 3. RECIPE ENGINE & PLANNING
# ==========================================
class RecipeRequest(BaseModel):
    user_id: int
    meal_type: str 
    effort_level: str 
    craving: Optional[str] = None

class CookingStep(BaseModel):
    step_number: int
    instruction: str
    duration_seconds: int = 60
    requires_visual_check: bool = False 

class RecipeResponse(BaseModel):
    id: Optional[int] = None
    title: str
    ingredients: List[Dict[str, Any]] 
    steps: List[CookingStep]
    macros: Dict[str, float]
    chef_comment: str 
    effort_level: str
    image_prompt: Optional[str] = None

# Search & Daily Plan
class SearchRequest(BaseModel):
    user_id: int
    query: str

class SearchResult(BaseModel):
    title: str
    match_score: int

class DayPlanRequest(BaseModel):
    user_id: int
    diet_preference: List[str]

# ==========================================
# 4. REAL-TIME MENTOR & GAMIFICATION
# ==========================================
class SessionStart(BaseModel):
    user_id: int
    recipe_title: str

class SessionEnd(BaseModel):
    session_id: int
    rating: int
    leftovers: bool 
    # Vital for Inventory Logic - This connects the cooking to the pantry
    ingredients_consumed: List[str] = [] 

class SubstituteRequest(BaseModel):
    user_id: int
    ingredient: str
    recipe: str

class GuardianCheckResponse(BaseModel):
    analysis: str
    status: str