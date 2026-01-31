from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# --- ENUMS ---
class UserPersona(str, Enum):
    HOSTELER = "hosteler"
    INDIAN_MOM = "indian_mom"
    GYM_BRO = "gym_bro"
    MASTER_CHEF = "master_chef"

# --- 1. USER & ONBOARDING ---
class UserBase(BaseModel):
    username: str
    age: int
    weight: float
    height: float
    gender: str
    persona: UserPersona = UserPersona.HOSTELER
    
    # Health & Preferences
    health_goal: str = "Maintain"
    rotis_per_meal: int = 2
    cooking_skill: int = 5
    
    medical_conditions: List[str] = [] # New
    allergies: List[str] = []
    dietary_preferences: List[str] = []
    
    spice_tolerance: str = "Medium" # New
    fav_cuisine: List[str] = [] # New
    weekly_budget: float = 0.0 # New

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
    badges: List[BadgeResponse] = [] # New
    
    class Config:
        from_attributes = True

# --- 2. INVENTORY ---
class InventoryCreate(BaseModel):
    name: str
    quantity: float
    unit: str # Dozen, Litre, etc.
    category: str = "General"
    price_per_unit: float = 0.0 # New
    expiry_date: Optional[datetime] = None

class InventoryResponse(InventoryCreate):
    id: int
    is_exhausted: bool
    
    class Config:
        from_attributes = True

# --- 3. RECIPE ENGINE ---
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

# --- 4. REAL-TIME SESSION ---
class SessionStart(BaseModel):
    user_id: int
    recipe_title: str

class InteractionRequest(BaseModel):
    session_id: int
    input_type: str 
    content: Optional[str] = None 
    image_base64: Optional[str] = None 

class InteractionResponse(BaseModel):
    response_text: str 
    audio_base64: Optional[str] = None 
    action: Optional[str] = None 

class SessionEnd(BaseModel):
    session_id: int
    rating: int
    leftovers: bool
    
class SearchRequest(BaseModel):
    user_id: int
    query: str

class SearchResult(BaseModel):
    title: str
    match_score: int
    
class RateMealRequest(BaseModel):
    user_id: int
    dish_name: str
    rating: int

class DayPlanRequest(BaseModel):
    user_id: int
    diet_preference: List[str]