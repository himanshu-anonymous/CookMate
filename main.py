from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from datetime import datetime, timedelta 
import os
import json
import models, schemas
from database import SessionLocal, engine
from services import ai_chef

# --- 1. SETUP & CONFIGURATION ---
load_dotenv()

# Initialize Database
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#  2. CORE ENDPOINTS (User & Inventory) 

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user: return db_user
    new_user = models.User(
        username=user.username,
        persona=user.persona,
        preferences=user.preferences,
        dietary_goal=user.dietary_goal,
        allergies=user.allergies,
        current_effort_level=user.current_effort_level
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/inventory/{user_id}/bulk-add")
def add_inventory(user_id: int, items: list[schemas.InventoryItemCreate], db: Session = Depends(get_db)):
    for item in items:
        # Check if item exists to avoid duplicates
        existing = db.query(models.InventoryItem).filter(
            models.InventoryItem.user_id == user_id, 
            models.InventoryItem.name == item.name
        ).first()
        
        if not existing:
            db_item = models.InventoryItem(**item.dict(), user_id=user_id)
            db.add(db_item)
    db.commit()
    return {"status": "success"}

@app.get("/inventory/{user_id}", response_model=list[schemas.InventoryItem])
def get_inventory(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.InventoryItem).filter(models.InventoryItem.user_id == user_id).all()

#  NEW: VISUAL INPUT ENDPOINT 
@app.post("/inventory/analyze-image")
def analyze_inventory_image(request: schemas.ImageAnalysisRequest):
    """
    Frontend sends a base64 photo of the fridge.
    AI returns a list of detected ingredients.
    """
    print(" Analyzing Pantry Image...")
    # Calls the vision function in ai_chef.py
    detected_items = ai_chef.analyze_pantry_image(request.image_base64)
    return {"detected_items": detected_items}


#  3. INTELLIGENT ENDPOINTS (Recipe & Search) 

@app.post("/generate-recipe/")
def generate_recipe(request: schemas.RecipeRequest, db: Session = Depends(get_db)):
    # 1. Fetch User Data
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    pantry_objs = user.inventory
    pantry_names = [i.name for i in pantry_objs]
    
    # 2. SHELF LIFE LOGIC: Find expiring items
    # We look for items expiring within the next 3 days
    now = datetime.utcnow()
    limit = now + timedelta(days=3)
    
    expiring_soon = []
    for item in pantry_objs:
        if item.expiry_date and item.expiry_date <= limit:
            expiring_soon.append(item.name)
            
    if expiring_soon:
        print(f"⚠️ PRIORITY: Using expiring items: {expiring_soon}")

    # 3. Determine Effort Level
    final_effort = request.effort_level if request.effort_level else user.current_effort_level
    print(f"🍳 Chef ({user.persona}) making {request.meal_type} with {final_effort} effort...")

    # 4. Call AI Logic (Updated with expiring_items)
    try:
        recipe_data = ai_chef.ask_chef_json(
            ingredients=pantry_names,
            expiring_items=expiring_soon, # <--- Passing the expiring items
            preferences=user.preferences,
            dietary_goal=user.dietary_goal,
            allergies=user.allergies,
            meal_type=request.meal_type,
            portion_multiplier=user.portion_multiplier,
            effort_level=final_effort,
            persona=user.persona.value
        )

        if recipe_data and "dish_name" in recipe_data:
            print(" Recipe Generated Successfully")
            return recipe_data
        else:
            raise ValueError("Empty response from AI Chef")

    except Exception as e:
        print(f" AI Failed: {e}")
        # Fallback
        return {
            "dish_name": "Emergency Pantry Pasta",
            "description": "AI was unreachable.",
            "ingredients": ["Pasta", "Oil"],
            "steps": [{"step_number": 1, "instruction": "Boil pasta.", "duration_seconds": 600}],
            "total_time_minutes": 15,
            "effort_score": 1.0
        }

# --- NEW: SMART SEARCH ENDPOINT ---
@app.post("/recipes/search", response_model=list[schemas.SearchResult])
def search_recipes(request: schemas.SearchRequest, db: Session = Depends(get_db)):
    """
    Search for recipes (e.g. 'Sweet') ranked by inventory match.
    """
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    pantry = [i.name for i in user.inventory]
    
    print(f"🔍 Searching for '{request.query}' in pantry...")
    results = ai_chef.search_recipes_smart(request.query, pantry)
    return results

# --- NEW: RATINGS (Data Collection) ---
@app.post("/recipes/rate")
def rate_meal(request: schemas.RateMealRequest, db: Session = Depends(get_db)):
    """
    User rates a meal. Used for Collaborative Filtering logic later.
    """
    print(f" User {request.user_id} rated '{request.dish_name}' {request.rating}/5")
    # Logic to save rating to DB would go here
    return {"status": "recorded"}


@app.post("/generate-day-plan/")
def generate_day_plan(request: schemas.DayPlanRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    pantry = [i.name for i in user.inventory]
    
    print(f"📅 Generating Day Plan via AI Chef...")

    plan_data = ai_chef.generate_daily_plan(
        ingredients=pantry,
        preferences=request.diet_preference,
        dietary_goal=user.dietary_goal
    )
    
    return plan_data

# --- 4. COOKING MENTOR ---

sessions = {}

@app.post("/mentor/start")
def start_session(req: schemas.SessionStartRequest):
    session_id = len(sessions) + 1
    sessions[session_id] = {"recipe": req.recipe_data, "step_index": 0}
    
    if not req.recipe_data.steps:
        first_step = schemas.CookingStep(step_number=1, instruction="Prepare ingredients", duration_seconds=60, heat_level="none")
    else:
        first_step = req.recipe_data.steps[0]

    return {
        "session_id": session_id,
        "step_number": 1,
        "instruction": first_step.instruction,
        "timer_seconds": first_step.duration_seconds,
        "voice_response_text": "Let's start cooking.",
        "all_step_timers": [s.duration_seconds for s in req.recipe_data.steps]
    }

@app.post("/mentor/next-step/{session_id}")
def next_step(session_id: int):
    if session_id not in sessions: raise HTTPException(status_code=404)
    sess = sessions[session_id]
    sess["step_index"] += 1
    
    if sess["step_index"] >= len(sess["recipe"].steps):
        return {"session_id": session_id, "step_number": 99, "instruction": "Done!", "timer_seconds": 0}
    
    step = sess["recipe"].steps[sess["step_index"]]
    return {
        "session_id": session_id, 
        "step_number": step.step_number, 
        "instruction": step.instruction, 
        "timer_seconds": step.duration_seconds
    }

@app.post("/mentor/voice-interaction/{session_id}")
async def voice_interaction(session_id: int, file: UploadFile = File(...)):
    if os.path.exists("assets/sample_audio.mp3"):
         return FileResponse("assets/sample_audio.mp3", media_type="audio/mpeg", filename="response.mp3")
    return {"status": "success"}
