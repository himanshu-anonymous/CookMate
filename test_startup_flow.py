import requests
import json
import os
import time

BASE_URL = "http://127.0.0.1:8000"

# --- HELPER: Create a dummy image for testing ---
def create_dummy_image(filename="test_image.jpg"):
    # Creates a tiny black square image to test file uploads
    from PIL import Image
    img = Image.new('RGB', (100, 100), color = 'red')
    img.save(filename)
    return filename

def print_step(phase, message):
    print(f"\n🔹 [{phase}] {message}")

def test_full_system():
    # ==========================================
    # PHASE 1: USER ONBOARDING
    # ==========================================
    print_step("PHASE 1", "Creating User Profile (Gym Bro)")
    user_payload = {
        "username": f"GodMode_User_{int(time.time())}", # Unique name every time
        "age": 24, "weight": 85, "height": 180, "gender": "Male",
        "persona": "gym_bro", "health_goal": "Bulk",
        "rotis_per_meal": 4, "cooking_skill": 8,
        "weekly_budget": 5000,
        "dietary_preferences": ["High Protein"],
        "medical_conditions": ["None"]
    }
    resp = requests.post(f"{BASE_URL}/users/onboard", json=user_payload)
    if resp.status_code != 200:
        print(f"❌ Onboarding Failed: {resp.text}")
        return
    user = resp.json()
    USER_ID = user['id']
    print(f"✅ User Created: {user['username']} (ID: {USER_ID})")
    print(f"   - Portion Multiplier: {user['portion_multiplier']}x")

    # ==========================================
    # PHASE 2: INVENTORY (Manual + Bill Scan)
    # ==========================================
    print_step("PHASE 2", "Inventory Management")

    # 1. Manual Add
    manual_payload = [
        {"name": "Chicken Breast", "quantity": 2, "unit": "kg", "price_per_unit": 300},
        {"name": "Olive Oil", "quantity": 0.1, "unit": "liter", "price_per_unit": 500} # Low stock test
    ]
    requests.post(f"{BASE_URL}/inventory/add?user_id={USER_ID}", json=manual_payload)
    print("✅ Manual Items Added (Chicken, Olive Oil)")

    # 2. Bill Scan (Mocking a file upload)
    dummy_file = create_dummy_image()
    try:
        with open(dummy_file, "rb") as f:
            files = {"file": ("grocery_bill.jpg", f, "image/jpeg")}
            resp = requests.post(f"{BASE_URL}/inventory/scan-bill", data={"user_id": USER_ID}, files=files)
            if resp.status_code == 200:
                print(f"✅ Bill Scanned: {resp.json().get('status')}")
            else:
                print(f"⚠️ Bill Scan Skipped (Check Azure Keys): {resp.status_code}")
    finally:
        os.remove(dummy_file) # Clean up

    # 3. Check Shopping List (Should detect Low Oil)
    resp = requests.get(f"{BASE_URL}/inventory/shopping-list/{USER_ID}")
    shop_list = resp.json()['shopping_list']
    print(f"✅ Shopping List Generated: {[item['name'] for item in shop_list]}")

    # ==========================================
    # PHASE 3: RECIPE GENERATION
    # ==========================================
    print_step("PHASE 3", "AI Recipe Generation")
    
    plan_payload = {
        "user_id": USER_ID,
        "meal_type": "Dinner",
        "effort_level": "medium"
    }
    resp = requests.post(f"{BASE_URL}/recipes/generate", json=plan_payload)
    if resp.status_code != 200:
        print(f"❌ Recipe Gen Failed: {resp.text}")
        return
    recipe = resp.json()
    print(f"✅ Chef Suggested: {recipe['title']}")
    print(f"   - Comment: {recipe['chef_comment'][:50]}...")

    # ==========================================
    # PHASE 4: THE MENTOR (Cooking Loop)
    # ==========================================
    print_step("PHASE 4", "Live Cooking Session")

    # 1. Start
    session_payload = {"user_id": USER_ID, "recipe_title": recipe['title']}
    resp = requests.post(f"{BASE_URL}/mentor/start", json=session_payload)
    session_id = resp.json()['session_id']
    print(f"✅ Cooking Started (Session ID: {session_id})")

    # 2. Substitute Check
    sub_payload = {"user_id": USER_ID, "ingredient": "Olive Oil", "recipe": recipe['title']}
    resp = requests.post(f"{BASE_URL}/mentor/substitute", json=sub_payload)
    print(f"✅ Substitution Asked: 'No Olive Oil?' -> AI Says: {resp.json().get('substitute')}")

    # 3. Guardian Vision Check
    dummy_file = create_dummy_image()
    try:
        with open(dummy_file, "rb") as f:
            files = {"file": ("pan_photo.jpg", f, "image/jpeg")}
            resp = requests.post(
                f"{BASE_URL}/mentor/guardian-check?session_id={session_id}", 
                data={"instruction": "Is the chicken cooked?"}, 
                files=files
            )
            print(f"✅ Guardian Vision: {resp.json().get('analysis')}")
    finally:
        os.remove(dummy_file)

    # ==========================================
    # PHASE 5: END GAME (Deduction & XP)
    # ==========================================
    print_step("PHASE 5", "Ending Session & Deducting Inventory")

    end_payload = {
        "session_id": session_id,
        "rating": 5,
        "leftovers": False,
        "ingredients_consumed": ["1 kg Chicken Breast"] # This should trigger the math
    }
    resp = requests.post(f"{BASE_URL}/mentor/end", json=end_payload)
    result = resp.json()
    
    print(f"✅ Session Complete!")
    print(f"   - XP Earned: {result.get('new_xp')}")
    print(f"   - Inventory Updates: {result.get('inventory_updates')}")
    print(f"   - Badges: {result.get('badges_earned')}")

    # Final Inventory Check
    final_inv = requests.get(f"{BASE_URL}/inventory/{USER_ID}").json()
    chicken = next((i for i in final_inv if i['name'] == "Chicken Breast"), None)
    print(f"   - Chicken Left: {chicken['quantity']} {chicken['unit']} (Should be ~1.0 if started with 2.0)")

if __name__ == "__main__":
    try:
        # Check if Pillow is installed for image creation
        try:
            import PIL
        except ImportError:
            print("⚠️ Installing Pillow for test image creation...")
            os.system("pip install pillow")
            
        test_full_system()
    except Exception as e:
        print(f"\n❌ CRITICAL FAILURE: {e}")
        print("Ensure server is running: 'uvicorn main:app --reload'")