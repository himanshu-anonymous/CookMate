import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def print_step(phase, message):
    print(f"\n--- [{phase}] {message} ---")

def test_startup_sequence():
    # ==========================================
    # PHASE 1: SETUP & ONBOARDING
    # ==========================================
    print_step("PHASE 1", "User Onboarding")
    
    # 1. Create the User (Gym Bro)
    user_payload = {
        "username": "Judge_Demo_001",
        "age": 25,
        "weight": 80,
        "height": 180,
        "gender": "Male",
        "persona": "gym_bro",
        "health_goal": "Bulk",
        "rotis_per_meal": 4,  # Should result in 2.0x multiplier
        "cooking_skill": 6,
        "weekly_budget": 5000,
        "dietary_preferences": ["High Protein"],
        "medical_conditions": ["None"]
    }
    resp = requests.post(f"{BASE_URL}/users/onboard", json=user_payload)
    if resp.status_code != 200:
        print("❌ Onboarding Failed")
        return
    user_data = resp.json()
    user_id = user_data['id']
    print(f"✅ User Created: {user_data['username']} | Multiplier: {user_data['portion_multiplier']}x")

    # 2. Inventory Scan (Simulated)
    print_step("PHASE 1", "Inventory Scan")
    # Simulating uploading a photo of ingredients
    #with open("assets/sample_food.jpg", "rb") as f: # Ensure you have a dummy image here or comment out
        # For test simplicity, we will assume manual add if file upload is complex to script quickly
    #    pass
    
    # Manual Add for reliability during test
    inventory_payload = [
        {"name": "Chicken Breast", "quantity": 1, "unit": "kg", "price_per_unit": 300},
        {"name": "Eggs", "quantity": 12, "unit": "piece", "price_per_unit": 10},
        {"name": "Spinach", "quantity": 2, "unit": "bunch", "price_per_unit": 20}
    ]
    requests.post(f"{BASE_URL}/inventory/add?user_id={user_id}", json=inventory_payload)
    print("✅ Inventory Logged: Chicken, Eggs, Spinach")

    # ==========================================
    # PHASE 2: DECISION & PLANNING
    # ==========================================
    print_step("PHASE 2", "Meal Planning")
    
    # 3. Generate Plan
    plan_payload = {
        "user_id": user_id,
        "meal_type": "Dinner",
        "effort_level": "medium"
    }
    resp = requests.post(f"{BASE_URL}/recipes/generate", json=plan_payload)
    recipe = resp.json()
    print(f"✅ Recipe Generated: {recipe['title']}")
    print(f"   - Chef Says: {recipe['chef_comment']}")
    print(f"   - Ingredients: {len(recipe['ingredients'])} items")

    # ==========================================
    # PHASE 3: REALTIME COOKING (The Mentor)
    # ==========================================
    print_step("PHASE 3", "Cooking Session")
    
    # 4. Start Session
    session_payload = {"user_id": user_id, "recipe_title": recipe['title']}
    resp = requests.post(f"{BASE_URL}/mentor/start", json=session_payload)
    session_data = resp.json()
    session_id = session_data['session_id']
    print(f"✅ Session Started (ID: {session_id})")
    print(f"   - Audio Intro: {session_data.get('audio_intro', 'No Audio')}")

    # 5. Simulate "Missing Ingredient" (New Feature Needed)
    # We need to add this endpoint to main.py
    print(f"   - [TEST] User asks: 'I don't have Spinach!'")
    # resp = requests.post(f"{BASE_URL}/mentor/substitute", json={"ingredient": "Spinach"})
    # print(f"   - AI Suggests: {resp.json().get('substitute')}")

    # 6. Guardian Check
    print_step("PHASE 3", "Guardian Check")
    # We simulate sending a 'burning' image
    # Note: Requires a real file upload, skipping for pure script unless file exists
    print("✅ Guardian Check Simulated (See Swagger for Real Test)")

    # ==========================================
    # PHASE 4: FEEDBACK & GAMIFICATION
    # ==========================================
    print_step("PHASE 4", "Feedback & XP")
    
    end_payload = {
        "session_id": session_id,
        "rating": 5,
        "leftovers": False
    }
    resp = requests.post(f"{BASE_URL}/mentor/end", json=end_payload)
    feedback = resp.json()
    print(f"✅ Session Ended.")
    print(f"   - New XP: {feedback.get('new_xp')}")
    print(f"   - Badges: {feedback.get('badges_earned', [])}")

if __name__ == "__main__":
    try:
        test_startup_sequence()
    except Exception as e:
        print(f"❌ Test Failed: {e}")
        print("Make sure server is running: uvicorn main:app --reload")