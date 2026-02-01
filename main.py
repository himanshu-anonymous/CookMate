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

@app.post("/users/login")
def login_user(username: str = Body(..., embed=True), db: Session = Depends(get_db)):
    """Simple Login: Checks if username exists and returns the User ID."""
    user = db.query(models.UserDB).filter(models.UserDB.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please Register.")
    return {"id": user.id, "username": user.username, "persona": user.persona}

@app.get("/users/stats/{user_id}")
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """
    Returns Home Page Stats.
    - XP, Streak
    - Most Cooked Recipe
    - TOTAL Sessions (Fixed to count all rows)
    """
    user = db.query(models.UserDB).filter(models.UserDB.id == user_id).first()
    if not user: 
        raise HTTPException(status_code=404, detail="User not found")
    
    # 1. Calculate TOTAL Sessions (The fix for your "Meal Cooked" number)
    total_count = db.query(models.CookingSessionDB).filter(
        models.CookingSessionDB.user_id == user_id
    ).count()

    # 2. Calculate Most Cooked Recipe (The "Fav" recipe)
    fav_query = db.query(
        models.CookingSessionDB.recipe_title, 
        func.count(models.CookingSessionDB.recipe_title)
    ).filter(models.CookingSessionDB.user_id == user_id)\
     .group_by(models.CookingSessionDB.recipe_title)\
     .order_by(func.count(models.CookingSessionDB.recipe_title).desc()).first()

    return {
        "xp": user.xp_points,
        "streak": user.current_streak,
        "most_cooked_recipe": fav_query[0] if fav_query else "Nothing yet!",
        "total_sessions": total_count  # <--- Now returns the actual total
    }

@app.get("/users/{user_id}", response_model=schemas.UserResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """Fetches full profile details (Age, Weight, Skill, etc.)"""
    user = db.query(models.UserDB).filter(models.UserDB.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}/skill")
def update_cooking_skill(user_id: int, skill_level: int = Body(..., embed=True), db: Session = Depends(get_db)):
    """Updates just the cooking skill (1-10)."""
    user = db.query(models.UserDB).filter(models.UserDB.id == user_id).first()
    if not user: raise HTTPException(status_code=404)
    user.cooking_skill = skill_level
    db.commit()
    return {"status": "Updated", "new_skill": skill_level}

# ==========================================
# 2. INTELLIGENT INVENTORY (Vision & Math)
# ==========================================

@app.post("/inventory/add")
def add_items(user_id: int, items: List[schemas.InventoryCreate], db: Session = Depends(get_db)):
    """Manual Entry: Adds items to pantry."""
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
    """AI OCR: Scans a grocery bill and estimates expiry."""
    image_bytes = await file.read()
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

@app.post("/inventory/consume")
def consume_inventory(request: schemas.ConsumeRequest, db: Session = Depends(get_db)):
    """Manual deduction endpoint."""
    user_inventory = db.query(models.InventoryDB).filter(models.InventoryDB.user_id == request.user_id).all()
    updated_items = []
    for recipe_item in request.ingredients:
        clean_recipe_item = recipe_item.lower()
        for db_item in user_inventory:
            if db_item.name.lower() in clean_recipe_item:
                db_item.quantity -= 1.0 
                updated_items.append(db_item.name)
                if db_item.quantity <= 0:
                    db_item.is_exhausted = True
                break 
    db.commit()
    return {"status": "success", "deducted": updated_items}

@app.get("/inventory/shopping-list/{user_id}", response_model=schemas.ShoppingListResponse)
def generate_shopping_list(user_id: int, db: Session = Depends(get_db)):
    """Smart Prediction: Low Stock + Persona Essentials."""
    user = db.query(models.UserDB).filter(models.UserDB.id == user_id).first()
    if not user: raise HTTPException(status_code=404)
    
    low_stock = db.query(models.InventoryDB).filter(
        models.InventoryDB.user_id == user_id, 
        models.InventoryDB.quantity < 1.0,
        models.InventoryDB.is_exhausted == False
    ).all()
    
    list_items = [schemas.ShoppingItem(name=i.name, suggested_qty=1, reason="Running Low") for i in low_stock]
    
    if user.persona == "gym_bro":
        list_items.append(schemas.ShoppingItem(name="Chicken Breast", suggested_qty=1, reason="Core Protein Source"))
        list_items.append(schemas.ShoppingItem(name="Whey Protein", suggested_qty=1, reason="Post-Workout Essential"))
    elif user.persona == "indian_mom":
        list_items.append(schemas.ShoppingItem(name="Ghee", suggested_qty=0.5, reason="Flavor Essential"))
        
    return {"shopping_list": list_items}

# ==========================================
# 3. RECIPES & PLANNING
# ==========================================

@app.post("/recipes/generate", response_model=schemas.RecipeResponse)
def generate_recipe(req: schemas.RecipeRequest, db: Session = Depends(get_db)):
    user = db.query(models.UserDB).filter(models.UserDB.id == req.user_id).first()
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
    return recipe_json

@app.post("/recipes/search")
def search_smart(request: schemas.SearchRequest, db: Session = Depends(get_db)):
    user = db.query(models.UserDB).filter(models.UserDB.id == request.user_id).first()
    pantry = [i.name for i in user.inventory]
    return ai_chef.search_recipes_smart(request.query, pantry)

@app.post("/generate-day-plan")
def daily_plan(user_id: int = Body(..., embed=True), db: Session = Depends(get_db)):
    user = db.query(models.UserDB).filter(models.UserDB.id == user_id).first()
    pantry = [i.name for i in user.inventory]
    return ai_chef.generate_daily_plan(pantry, user.dietary_preferences, user.health_goal)

# ==========================================
# 4. MENTOR LOOP (The "Cook With Me" Mode)
# ==========================================

@app.post("/mentor/start")
def start_session(req: schemas.SessionStart):
    session_id = len(active_sessions) + 1
    active_sessions[session_id] = {
        "user_id": req.user_id,
        "recipe": req.recipe_title,
        "steps": req.steps, 
        "current_step_index": 0,
        "start_time": datetime.utcnow()
    }
    first_instruction = req.steps[0] if req.steps else "Ready to cook!"
    return {"session_id": session_id, "message": first_instruction, "audio_intro": f"Starting {req.recipe_title}. {first_instruction}"}

@app.post("/mentor/chat")
def chat_with_mentor(user_id: int = Body(...), message: str = Body(...), audio_url: Optional[str] = Body(None)):
    session = next((s for s in active_sessions.values() if s["user_id"] == user_id), None)
    msg = message.lower()
    
    if session:
        steps = session["steps"]
        idx = session["current_step_index"]
        if "next" in msg or "done" in msg:
            if idx < len(steps) - 1:
                session["current_step_index"] += 1
                return {"reply": steps[session["current_step_index"]]}
            return {"reply": "You have finished all steps! Enjoy your meal."}
        elif "previous" in msg or "back" in msg:
            if idx > 0:
                session["current_step_index"] -= 1
                return {"reply": steps[session["current_step_index"]]}
    
    # Advanced Contextual AI logic
    if "salt" in msg: return {"reply": "Add about 1 teaspoon of salt, or to taste."}
    if "substitute" in msg: return {"reply": "You can use butter instead of oil if you prefer."}
    if "burnt" in msg: return {"reply": "Turn off heat immediately and move to a cool burner!"}
    
    return {"reply": f"I'm listening. The current recipe is {session['recipe'] if session else 'not started'}."}

@app.post("/mentor/guardian-check")
async def guardian_check(session_id: int = Body(...), instruction: str = Body(...), file: UploadFile = File(...)):
    img_bytes = await file.read()
    base64_img = ai_chef.encode_image(img_bytes)
    return {"analysis": ai_chef.analyze_cooking_progress(base64_img, instruction)}

@app.post("/mentor/end")
def end_session(req: schemas.SessionEnd, db: Session = Depends(get_db)):
    if req.session_id not in active_sessions:
        return {"status": "Completed", "new_xp": 0}

    data = active_sessions.pop(req.session_id)
    user = db.query(models.UserDB).filter(models.UserDB.id == data["user_id"]).first()
    
    # 1. INVENTORY DEDUCTION (The Supply Chain)
    updates_made = 0
    if req.ingredients_consumed:
        for ing in req.ingredients_consumed:
            for item in user.inventory:
                if item.name.lower() in ing.lower():
                    item.quantity -= 1.0
                    if item.quantity <= 0:
                        item.quantity = 0
                        item.is_exhausted = True
                    updates_made += 1
                    break
    
    # 2. PORTION SELF-CORRECTION (The Learning Loop)
    if req.leftovers:
        user.portion_multiplier = max(0.5, user.portion_multiplier * 0.9)
    elif req.rating < 3:
        user.portion_multiplier = min(3.0, user.portion_multiplier * 1.05)

    # 3. SAVE SESSION & XP
    db_session = models.CookingSessionDB(
        user_id=data["user_id"], recipe_title=data["recipe"], 
        start_time=data["start_time"], end_time=datetime.utcnow(), 
        status="completed", rating=req.rating, leftovers=req.leftovers
    )
    user.xp_points += 10
    user.current_streak += 1
    
    # 4. BADGES
    earned_badges = []
    if user.current_streak == 3:
        db.add(models.UserBadgeDB(user_id=user.id, badge_name="Streak Master", description="Cooked 3 days in a row!"))
        earned_badges.append("Streak Master")

    db.add(db_session)
    db.commit()
    
    return {"status": "Completed", "new_xp": user.xp_points, "badges_earned": earned_badges}

@app.get("/")
def health_check():
    return {"status": "COOKMATE_READY", "mode": "PLATINUM_EDITION"}