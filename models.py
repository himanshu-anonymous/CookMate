from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, JSON, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

#  1. DEFINE PERSONAS 
class UserPersona(str, enum.Enum):
    HOSTELER = "hosteler"
    INDIAN_MOM = "indian_mom"
    GYM_BRO = "gym_bro"
    MASTER_CHEF = "master_chef"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    
    #  Core Profile 
    persona = Column(Enum(UserPersona), default=UserPersona.HOSTELER) # The "Brain" Type
    preferences = Column(String, default="None")    # e.g., "Vegetarian"
    dietary_goal = Column(String, default="Balanced") # e.g., "Muscle Gain"
    allergies = Column(String, default="None")      # e.g., "Peanuts"
    portion_multiplier = Column(Float, default=1.0)
    
    #  Dynamic Context 
    taste_profile = Column(JSON, default={}) 
    current_effort_level = Column(String, default="normal") # low, normal, high
    planning_horizon = Column(String, default="daily") 
    
    #  Gamification 
    streak_count = Column(Integer, default=0)
    last_cooked_date = Column(DateTime, nullable=True)
    
    #  Relationships 
    inventory = relationship("InventoryItem", back_populates="owner")
    meal_logs = relationship("MealLog", back_populates="owner")
    saved_recipes = relationship("SavedRecipe", back_populates="owner")
    cooking_sessions = relationship("CookingSession", back_populates="owner")

class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    name = Column(String, index=True) 
    quantity = Column(Float) 
    unit = Column(String) 
    expiry_date = Column(DateTime, nullable=True) 
    category = Column(String, default="pantry") 
    
    owner = relationship("User", back_populates="inventory")

class MealLog(Base):
    __tablename__ = "meal_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    dish_name = Column(String)
    date_cooked = Column(DateTime, default=datetime.utcnow)
    
    rating = Column(Integer, nullable=True)
    leftover_amount = Column(String, nullable=True)
    comments = Column(String, nullable=True)

    owner = relationship("User", back_populates="meal_logs")

class SavedRecipe(Base):
    __tablename__ = "saved_recipes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    dish_name = Column(String)
    recipe_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Effort Metrics
    effort_score = Column(Float, default=5.0) 
    prep_time_minutes = Column(Integer, default=0)
    cleanup_score = Column(String, default="medium") 
    
    owner = relationship("User", back_populates="saved_recipes")

class CookingSession(Base):
    __tablename__ = "cooking_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    recipe_snapshot = Column(JSON) 
    
    current_step_index = Column(Integer, default=0)
    status = Column(String, default="active")
    start_time = Column(DateTime, default=datetime.utcnow)
    
    timer_target_time = Column(DateTime, nullable=True) 
    last_voice_command = Column(String, nullable=True) 
    
    owner = relationship("User", back_populates="cooking_sessions")
