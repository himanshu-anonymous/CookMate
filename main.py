from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Optional
import os
from datetime import datetime, timedelta

import models, schemas
from database import SessionLocal, engine, get_db
from services import ai_chef

# --- SETUP ---
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CookMate Lifestyle OS", version="9.0-Platinum")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory Session State (For Speed during Demo)
active_sessions: Dict[int, Dict] = {} 

# ==========================================
# 1. USER & ONBOARDING (The "Roti Logic")
# ==========================================

@app.post("/users/onboard", response_model=schemas.UserResponse)
def onboard_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Creates a user profile. 
    Calculates 'Portion Multiplier' based on their standard Roti consumption.
    """
    existing = db.query(models.UserDB).filter(models.UserDB.username == user_data.username).first()
    if existing: return existing

    # Roti Logic: 2 rotis = 1.0x multiplier. 4 rotis = 2.0x.
    multiplier = user_data.rotis_per_meal / 2.0
    if multiplier < 0.5: multiplier = 0.5

    new_user = models.UserDB(
        username=user_data.username,
        age=user_data.age,
        weight=user_data.weight,
        height=user_data.height,
        gender=user_data.gender,
        persona=user_data.persona.value, 
        health_goal=user_data.health_goal,
        rotis_per_meal=user_data.rotis_per_meal,
        portion_multiplier=multiplier,
        allergies=user_data.allergies,
        dietary_preferences=user_data.dietary_preferences,
        medical_conditions=user_data.medical_conditions,
        spice_tolerance=user_data.spice_tolerance,
        fav_cuisine=user_data.fav_cuisine,
        weekly_budget=user_data.weekly_budget,
        cooking_skill=user_data.cooking_skill
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/stats/{user_id}")
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """
    NEW: Returns Home Page Stats.
    - XP, Streak
    - Most Cooked Recipe
    """
    user = db.query(models.UserDB).filter(models.UserDB.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate Most Cooked Recipe (Aggregation)
    fav_recipe = db.query(
        models.CookingSessionDB.recipe_title, 
        func.count(models.CookingSessionDB.recipe_title)
    ).filter(models.CookingSessionDB.user_id == user_id)\
     .group_by(models.CookingSessionDB.recipe_title)\
     .order_by(func.count(models.CookingSessionDB.recipe_title).desc()).first()

    return {
        "xp": user.xp_points,
        "streak": user.current_streak,
        "most_cooked_recipe": fav_recipe[0] if fav_recipe else "Nothing yet!",
        "total_sessions": fav_recipe[1] if fav_recipe else 0
    }

# ==========================================
# 2. INTELLIGENT INVENTORY (Vision & Math)
# ==========================================

@app.post("/inventory/add")
def add_items(user_id: int, items: List[schemas.InventoryCreate], db: Session = Depends(get_db)):
    """Manual Entry: Adds items to pantry when you don't have a bill."""
    for item in items:
        exists = db.query(models.InventoryDB).filter(
            models.InventoryDB.user_id == user_id,
            models.InventoryDB.name == item.name
        ).first()
        if exists:
            exists.quantity += item.quantity 
        else:
            new_item = models.InventoryDB(**item.dict(), user_id=user_id)
            db.add(new_item)
    db.commit()
    return {"status": "Updated"}

@app.post("/inventory/scan-bill")
async def scan_bill(user_id: int = Body(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    AI OCR: Scans a grocery bill.
    1. Extracts Item Name, Price, Quantity.
    2. AI estimates Expiry Date based on item type.
    """
    image_bytes = await file.read()
    
    # AI Parsing from ai_chef.py
    parsed_items = ai_chef.parse_grocery_bill(image_bytes)
    
    added_items = []
    for item in parsed_items:
        expiry = datetime.utcnow() + timedelta(days=item.get("expiry_days", 7))
        db_item = models.InventoryDB(
            user_id=user_id,
            name=item["name"],
            quantity=item["quantity"],
            unit=item["unit"],
            price_per_unit=item.get("price", 0.0),
            category=item.get("category", "General"),
            expiry_date=expiry
        )
        db.add(db_item)
        added_items.append(db_item)
    
    db.commit()
    return {"status": "Success", "items_added": len(added_items), "details": parsed_items}

@app.get("/inventory/{user_id}", response_model=List[schemas.InventoryResponse])
def get_inventory(user_id: int, db: Session = Depends(get_db)):
    """Fetches user's current pantry."""
    return db.query(models.InventoryDB).filter(models.InventoryDB.user_id == user_id).all()

@app.put("/inventory/{item_id}")
def update_inventory_item(item_id: int, update: schemas.InventoryCreate, db: Session = Depends(get_db)):
    """Edit inventory item (e.g., if User wants to correct the quantity)."""
    item = db.query(models.InventoryDB).filter(models.InventoryDB.id == item_id).first()
    if not item: raise HTTPException(status_code=404)
    item.name = update.name
    item.quantity = update.quantity
    item.expiry_date = update.expiry_date
    db.commit()
    return {"status": "Updated"}

@app.get("/inventory/shopping-list/{user_id}", response_model=schemas.ShoppingListResponse)
def generate_shopping_list(user_id: int, db: Session = Depends(get_db)):
    """
    Smart Prediction: Suggests items to buy based on:
    1. Low Stock (Quantity < 1)
    2. Persona Essentials (NEW: Gym Bro gets Protein suggestions)
    """
    user = db.query(models.UserDB).filter(models.UserDB.id == user_id).first()
    if not user: raise HTTPException(status_code=404)
    
    # 1. Low Stock Logic
    low_stock = db.query(models.InventoryDB).filter(
        models.InventoryDB.user_id == user_id, 
        models.InventoryDB.quantity < 1.0,
        models.InventoryDB.is_exhausted == False
    ).all()
    
    list_items = [
        schemas.ShoppingItem(name=i.name, suggested_qty=1, reason="Running Low") 
        for i in low_stock
    ]
    
    # 2. Persona-Based Suggestions (NEW)
    if user.persona == "gym_bro":
        list_items.append(schemas.ShoppingItem(name="Chicken Breast", suggested_qty=1, reason="Core Protein Source"))
        list_items.append(schemas.ShoppingItem(name="Whey Protein", suggested_qty=1, reason="Post-Workout Essential"))
    elif user.persona == "indian_mom":
        list_items.append(schemas.ShoppingItem(name="Ghee", suggested_qty=0.5, reason="Flavor Essential"))
        list_items.append(schemas.ShoppingItem(name="Turmeric", suggested_qty=0.1, reason="Health Essential"))
        
    return {"shopping_list": list_items}

# ==========================================
# 3. RECIPES & PLANNING (The Brain)
# ==========================================

@app.post("/recipes/generate", response_model=schemas.RecipeResponse)
def generate_recipe(req: schemas.RecipeRequest, db: Session = Depends(get_db)):
    """
    Generates a cookable recipe.
    - Context: Uses Pantry, Persona, and Health Goal.
    - Logic: Prioritizes expiring items.
    """
    user = db.query(models.UserDB).filter(models.UserDB.id == req.user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    pantry_items = [i.name for i in user.inventory if not i.is_exhausted]
    expiring = pantry_items[:2] if len(pantry_items) > 5 else []

    recipe_json = ai_chef.ask_chef_json(
        ingredients=pantry_items,
        expiring_items=expiring,
        preferences=user.dietary_preferences,
        dietary_goal=user.health_goal,
        allergies=user.allergies,
        meal_type=req.meal_type,
        portion_multiplier=user.portion_multiplier, 
        effort_level=req.effort_level,
        persona=user.persona
    )
    
    if not recipe_json or "title" not in recipe_json:
         raise HTTPException(status_code=500, detail="AI Chef Offline")

    return recipe_json

@app.post("/recipes/search")
def search_smart(request: schemas.SearchRequest, db: Session = Depends(get_db)):
    """RAG-style search: Find recipes that use what I HAVE (not just keywords)."""
    user = db.query(models.UserDB).filter(models.UserDB.id == request.user_id).first()
    pantry = [i.name for i in user.inventory]
    return ai_chef.search_recipes_smart(request.query, pantry)

@app.post("/generate-day-plan")
def daily_plan(user_id: int = Body(..., embed=True), db: Session = Depends(get_db)):
    """Generates a full day Breakfast, Lunch, Dinner plan."""
    user = db.query(models.UserDB).filter(models.UserDB.id == user_id).first()
    pantry = [i.name for i in user.inventory]
    return ai_chef.generate_daily_plan(pantry, user.dietary_preferences, user.health_goal)

# ==========================================
# 4. MENTOR LOOP (The "Cook With Me" Mode)
# ==========================================

@app.post("/mentor/start")
def start_session(req: schemas.SessionStart):
    """Initializes a cooking session. Plays the Audio Intro."""
    session_id = len(active_sessions) + 1
    active_sessions[session_id] = {
        "user_id": req.user_id,
        "recipe": req.recipe_title,
        "current_step": 1,
        "start_time": datetime.utcnow()
    }
    return {
        "session_id": session_id, 
        "message": f"Session started for {req.recipe_title}",
        "audio_intro": "Let's get cooking! Wash your hands first." 
    }

@app.post("/mentor/next-step/{session_id}")
def next_step(session_id: int):
    """Advances to the next instruction in the loop."""
    if session_id not in active_sessions: raise HTTPException(status_code=404)
    active_sessions[session_id]["current_step"] += 1
    step_num = active_sessions[session_id]["current_step"]
    return {"session_id": session_id, "step": step_num, "instruction": "Next step...", "timer": 300}

@app.post("/mentor/substitute")
def get_substitute(user_id: int = Body(...), ingredient: str = Body(...), recipe: str = Body(...)):
    """Answers: 'I don't have X'. Suggests alternatives."""
    return ai_chef.get_substitute_suggestion(ingredient, recipe)

@app.post("/mentor/guardian-check")
async def guardian_check(session_id: int, instruction: str = Body(...), file: UploadFile = File(...)):
    """Computer Vision: Checks if food is burnt/ready."""
    img_bytes = await file.read()
    base64_img = ai_chef.encode_image(img_bytes)
    return {"analysis": ai_chef.analyze_cooking_progress(base64_img, instruction)}

@app.post("/mentor/end")
def end_session(req: schemas.SessionEnd, db: Session = Depends(get_db)):
    """
    THE FINALE:
    1. Inventory Deduction (Supply Chain).
    2. Portion Self-Correction (NEW).
    3. XP & Badges.
    """
    if req.session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    data = active_sessions.pop(req.session_id)
    user = db.query(models.UserDB).filter(models.UserDB.id == data["user_id"]).first()
    
    # 1. INVENTORY DEDUCTION (The Supply Chain)
    updates_made = 0
    if req.ingredients_consumed:
        current_inv = [{"id": i.id, "name": i.name, "qty": i.quantity} for i in user.inventory]
        deductions = ai_chef.calculate_deductions(req.ingredients_consumed, current_inv)
        
        for d in deductions:
            item = db.query(models.InventoryDB).filter(models.InventoryDB.id == d["inventory_id"]).first()
            if item:
                item.quantity -= d["decrement_amount"]
                if item.quantity <= 0:
                    item.quantity = 0
                    item.is_exhausted = True
                updates_made += 1
    
    # 2. PORTION SELF-CORRECTION (NEW: The Learning Loop)
    portion_adjustment = "Unchanged"
    if req.leftovers:
        # If leftovers exist, reduce portion size by 10%
        user.portion_multiplier = max(0.5, user.portion_multiplier * 0.9)
        portion_adjustment = "Reduced (Leftovers Detected)"
    elif req.rating < 3:
        # If rating is low (maybe too small?), increase slightly
        user.portion_multiplier = min(3.0, user.portion_multiplier * 1.05)
        portion_adjustment = "Increased (Low Satisfaction)"

    # 3. SAVE SESSION & XP
    db_session = models.CookingSessionDB(
        user_id=data["user_id"], 
        recipe_title=data["recipe"], 
        start_time=data["start_time"], 
        end_time=datetime.utcnow(), 
        status="completed", 
        rating=req.rating, 
        leftovers=req.leftovers
    )
    user.xp_points += 10
    user.current_streak += 1
    
    # 4. BADGES
    earned_badges = []
    if user.current_streak == 3:
        badge = models.UserBadgeDB(user_id=user.id, badge_name="Streak Master", description="Cooked 3 days in a row!")
        db.add(badge)
        earned_badges.append("Streak Master")

    db.add(db_session)
    db.commit()
    
    # 5. REORDER SUGGESTIONS
    exhausted = [i.name for i in user.inventory if i.is_exhausted]
    
    return {
        "status": "Completed", 
        "new_xp": user.xp_points, 
        "inventory_updates": f"Updated {updates_made} items", 
        "portion_adjustment": portion_adjustment,
        "reorder_suggestions": exhausted,
        "badges_earned": earned_badges
    }

@app.get("/")
def health_check():
    return {"status": "COOKMATE_READY", "mode": "PLATINUM_EDITION"}