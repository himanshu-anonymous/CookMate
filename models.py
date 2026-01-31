from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# --- DATABASE MODELS ---

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    
    # --- CORE PROFILE ---
    persona = Column(String, default="hosteler") 
    age = Column(Integer)
    weight = Column(Float)
    height = Column(Float)
    gender = Column(String)
    
    # --- THE "ROTI LOGIC" ---
    rotis_per_meal = Column(Integer, default=2)
    portion_multiplier = Column(Float, default=1.0)
    
    # --- HEALTH & PREFS ---
    health_goal = Column(String, default="Maintain")
    medical_conditions = Column(JSON, default=[])
    allergies = Column(JSON, default=[])
    dietary_preferences = Column(JSON, default=[])
    
    spice_tolerance = Column(String, default="Medium")
    fav_cuisine = Column(JSON, default=[])
    cooking_skill = Column(Integer, default=5)
    
    # --- BUDGET ---
    weekly_budget = Column(Float, default=0.0)
    
    # --- GAMIFICATION ---
    xp_points = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    
    # --- RELATIONSHIPS (The Fix is Here) ---
    # These strings MUST match the property names in the other classes exactly.
    inventory = relationship("InventoryDB", back_populates="user")
    sessions = relationship("CookingSessionDB", back_populates="user")
    badges = relationship("UserBadgeDB", back_populates="user")


class InventoryDB(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    name = Column(String, index=True)
    quantity = Column(Float)
    unit = Column(String)
    category = Column(String, default="General")
    
    price_per_unit = Column(Float, default=0.0)
    expiry_date = Column(DateTime, nullable=True)
    is_exhausted = Column(Boolean, default=False)
    
    # MATCHING RELATIONSHIP
    user = relationship("UserDB", back_populates="inventory")


class UserBadgeDB(Base):
    __tablename__ = "user_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    badge_name = Column(String) 
    description = Column(String)
    earned_at = Column(DateTime, default=datetime.utcnow)
    
    # MATCHING RELATIONSHIP
    user = relationship("UserDB", back_populates="badges")


class CookingSessionDB(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    recipe_title = Column(String)
    
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, default="active")
    
    current_step_index = Column(Integer, default=0)
    last_guardian_check = Column(String, nullable=True)
    
    rating = Column(Integer, nullable=True)
    leftovers = Column(Boolean, default=False)
    
    # MATCHING RELATIONSHIP
    user = relationship("UserDB", back_populates="sessions")

# (Note: RecipeDB doesn't need relationships for now as it's standalone)
class RecipeDB(Base):
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    ingredients_json = Column(JSON) 
    steps_json = Column(JSON) 
    macros_json = Column(JSON) 
    effort_level = Column(String) 
    image_url = Column(String, nullable=True) 
    created_at = Column(DateTime, default=datetime.utcnow)