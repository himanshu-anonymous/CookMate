from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict
import os
from datetime import datetime, timedelta

import models, schemas
from database import SessionLocal, engine, get_db
from services import ai_chef

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CookMate Lifestyle OS", version="6.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

active_sessions: Dict[int, Dict] = {}

# --- 1. USER ---
@app.post("/users/onboard", response_model=schemas.UserResponse)
def onboard_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # (Previous Onboarding Logic)
    multiplier = user_data.rotis_per_meal / 2.0
    if multiplier < 0.5: multiplier = 0.5
    
    user = models.UserDB(**user_data.dict(exclude={"rotis_per_meal"}), rotis_per_meal=user_data.rotis_per_meal, portion_multiplier=multiplier)
    db.add(user)
    db.commit()
    return user

# --- 2. INTELLIGENT INVENTORY ---

@app.post("/inventory/scan-bill")
async def scan_bill(user_id: int = Body(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    """NEW: Scans a grocery bill and auto-populates inventory with Expiry Dates."""
    image_bytes = await file.read()
    
    # 1. AI Parses Bill
    parsed_items = ai_chef.parse_grocery_bill(image_bytes)
    
    added_items = []
    for item in parsed_items:
        # Calculate Expiry
        expiry = datetime.utcnow() + timedelta(days=item.get("expiry_days", 7))
        
        # Add to DB
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

@app.put("/inventory/{item_id}")
def update_inventory_item(item_id: int, update: schemas.InventoryCreate, db: Session = Depends(get_db)):
    """NEW: Edit inventory (User fixes incorrect scan)."""
    item = db.query(models.InventoryDB).filter(models.InventoryDB.id == item_id).first()
    if not item: raise HTTPException(status_code=404)
    
    item.name = update.name
    item.quantity = update.quantity
    item.expiry_date = update.expiry_date
    db.commit()
    return {"status": "Updated"}

@app.get("/inventory/shopping-list/{user_id}")
def generate_shopping_list(user_id: int, db: Session = Depends(get_db)):
    """NEW: Suggests items to buy based on low stock or habits."""
    # Simple logic: If quantity < 1, add to list
    low_stock = db.query(models.InventoryDB).filter(
        models.InventoryDB.user_id == user_id, 
        models.InventoryDB.quantity < 1.0,
        models.InventoryDB.is_exhausted == False
    ).all()
    
    return {
        "shopping_list": [
            {"name": i.name, "suggested_qty": 1, "reason": "Running Low"} for i in low_stock
        ]
    }

# --- 3. COOKING & DEDUCTION ---

@app.post("/recipes/generate")
def generate_recipe(req: schemas.RecipeRequest, db: Session = Depends(get_db)):
    # (Same as before)
    user = db.query(models.UserDB).filter(models.UserDB.id == req.user_id).first()
    pantry = [i.name for i in user.inventory if not i.is_exhausted]
    
    # AI Generation
    recipe = ai_chef.ask_chef_json(
        pantry, [], user.dietary_preferences, user.health_goal, user.allergies, 
        req.meal_type, user.portion_multiplier, req.effort_level, user.persona
    )
    return recipe

@app.post("/mentor/start")
def start_session(req: schemas.SessionStart, db: Session = Depends(get_db)):
    # Need to fetch the recipe ingredients to track them for deduction later
    # For now, we assume the frontend passes the recipe back, or we regenerate/fetch it
    # We will store a placeholder for now
    
    session_id = len(active_sessions) + 1
    active_sessions[session_id] = {
        "user_id": req.user_id,
        "recipe": req.recipe_title,
        # In a real app, we would store the specific ingredients list here
        "ingredients_used": ["Placeholder: Frontend should send ingredients on End"], 
        "start_time": datetime.utcnow()
    }
    return {"session_id": session_id, "message": "Session Started"}

@app.post("/mentor/end")
def end_session(req: schemas.SessionEnd, 
                ingredients_consumed: List[str] = Body(default=[]), # Frontend sends ["2 onions", "500g chicken"]
                db: Session = Depends(get_db)):
    
    if req.session_id in active_sessions:
        data = active_sessions.pop(req.session_id)
        user = db.query(models.UserDB).filter(models.UserDB.id == data["user_id"]).first()
        
        # 1. INVENTORY DEDUCTION LOGIC
        if ingredients_consumed:
            # Get current inventory as structured list for the AI
            current_inv = [{"id": i.id, "name": i.name, "qty": i.quantity} for i in user.inventory]
            
            # AI decides what to subtract
            deductions = ai_chef.calculate_deductions(ingredients_consumed, current_inv)
            
            for d in deductions:
                item = db.query(models.InventoryDB).filter(models.InventoryDB.id == d["inventory_id"]).first()
                if item:
                    item.quantity -= d["decrement_amount"]
                    if item.quantity <= 0:
                        item.quantity = 0
                        item.is_exhausted = True
            
        # 2. SAVE SESSION & XP
        db_session = models.CookingSessionDB(
            user_id=data["user_id"], 
            recipe_title=data["recipe"],
            start_time=data["start_time"], 
            end_time=datetime.utcnow(),
            rating=req.rating
        )
        user.xp_points += 10
        db.add(db_session)
        db.commit()
        
        # 3. CHECK FOR REORDER
        # If we exhausted items, prompt user
        exhausted_items = [i.name for i in user.inventory if i.is_exhausted]
        
        return {
            "status": "Completed", 
            "inventory_updates": f"Updated {len(deductions) if ingredients_consumed else 0} items.",
            "reorder_suggestions": exhausted_items
        }
        
    return {"error": "Session Not Found"}