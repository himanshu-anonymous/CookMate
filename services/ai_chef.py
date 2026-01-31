import os
import json
import logging
import base64
from pathlib import Path
from openai import AzureOpenAI
from dotenv import load_dotenv

# --- CONFIGURATION ---
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- CLIENT INITIALIZATION ---
try:
    client_main = AzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_KEY"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
    )
    DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
except Exception as e:
    logger.error(f"Azure Client Init Failed: {e}")
    client_main = None

def encode_image(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode('utf-8')

def get_persona_prompt(persona: str) -> str:
    p_map = {
        "hosteler": "ROLE: Broke Student. PRIORITIES: Speed, Cheap, Microwave.",
        "indian_mom": "ROLE: Indian Mom. PRIORITIES: Nutrition, Freshness, Tradition.",
        "gym_bro": "ROLE: Fitness Coach. PRIORITIES: High Protein, Macros.",
        "master_chef": "ROLE: Michelin Chef. PRIORITIES: Technique, Flavor."
    }
    return p_map.get(persona, "ROLE: Helpful Chef.")

# --- 1. BILL SCANNER (OCR) ---
def parse_grocery_bill(image_bytes: bytes):
    if not client_main: return []
    try:
        base64_img = encode_image(image_bytes)
        system_msg = "You are an Inventory Clerk. Extract grocery items from this receipt image."
        user_msg = """
        Analyze this bill. Return a JSON list of items.
        For each item, ESTIMATE a shelf life (expiry_days).
        RETURN JSON FORMAT:
        { "items": [ {"name": "Milk", "quantity": 1, "unit": "Litre", "price": 45.0, "expiry_days": 3, "category": "Dairy"} ] }
        """
        response = client_main.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": [
                    {"type": "text", "text": user_msg},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_img}"}}
                ]}
            ],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("items", [])
    except Exception as e:
        logger.error(f"Bill Scan Failed: {e}")
        return []

# --- 2. INVENTORY DEDUCTION ---
def calculate_deductions(recipe_ingredients: list, current_inventory: list):
    if not client_main: return []
    try:
        prompt = f"""
        I cooked a recipe using: {json.dumps(recipe_ingredients)}
        My current inventory is: {json.dumps(current_inventory)}
        Task: Match ingredients and calculate how much to SUBTRACT from the inventory.
        Return a JSON list: {{ "deductions": [{{"inventory_id": 12, "decrement_amount": 2}}] }}
        """
        response = client_main.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[{"role": "system", "content": "You are a Supply Chain Algorithm. JSON Output."}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content).get("deductions", [])
    except Exception:
        return []

# --- 3. RECIPE GENERATION ---
def ask_chef_json(ingredients: list, expiring_items: list, preferences: list, dietary_goal: str, allergies: list, meal_type: str, portion_multiplier: float, effort_level: str, persona: str):
    if not client_main: return get_fallback_recipe()

    try:
        system_msg = f"{get_persona_prompt(persona)}. You output ONLY valid JSON."
        user_prompt = f"""
        Generate a {meal_type} recipe.
        - Inventory: {', '.join(ingredients)}
        - Goal: {dietary_goal}
        - Scale: {portion_multiplier}x portion.
        - Effort: {effort_level}

        RETURN JSON EXACTLY LIKE THIS:
        {{
            "title": "Dish Name",
            "chef_comment": "Intro",
            "ingredients": [{{"name": "Item", "qty": "Amount"}}],
            "macros": {{"protein": 0, "carbs": 0, "fats": 0}},
            "effort_level": "{effort_level}",
            "steps": [
                {{
                    "step_number": 1,
                    "instruction": "Do X",
                    "duration_seconds": 60,
                    "requires_visual_check": false
                }}
            ]
        }}
        """

        response = client_main.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[{"role": "system", "content": system_msg}, {"role": "user", "content": user_prompt}],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

    except Exception as e:
        logger.error(f"Recipe Gen Failed: {e}")
        return get_fallback_recipe()

# --- 4. UTILS & SUBSTITUTIONS ---
def get_substitute_suggestion(missing_item: str, dish_context: str):
    if not client_main: return {"substitute": "Water", "advice": "AI Offline"}
    try:
        prompt = f"Substitute for {missing_item} in {dish_context}? Return JSON {{'substitute': '...', 'advice': '...'}}"
        response = client_main.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception:
        return {"substitute": "Skip it", "advice": "Just omit this ingredient."}

def get_fallback_recipe():
    return {
        "title": "Emergency Pasta (AI Offline)",
        "chef_comment": "My brain is disconnected, but here is a simple meal.",
        "ingredients": [{"name": "Pasta", "qty": "200g"}, {"name": "Oil", "qty": "1 tbsp"}],
        "macros": {"protein": 5, "carbs": 40, "fats": 10},
        "effort_level": "Low",
        "steps": [{"step_number": 1, "instruction": "Boil pasta.", "duration_seconds": 600, "requires_visual_check": False}]
    }

async def analyze_pantry_vision_api(image_bytes: bytes):
    import httpx
    endpoint = os.getenv("AZURE_CV_ENDPOINT")
    key = os.getenv("AZURE_CV_KEY")
    if not endpoint or not key: return ["Mock Apple"]
    
    url = f"{endpoint.rstrip('/')}/computervision/imageanalysis:analyze?features=tags&api-version=2023-10-01"
    headers = {"Ocp-Apim-Subscription-Key": key, "Content-Type": "application/octet-stream"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, content=image_bytes)
            if response.status_code == 200:
                data = response.json()
                return [t["name"] for t in data.get("tagsResult", {}).get("values", []) if t["confidence"] > 0.5]
        except Exception:
            pass
    return ["Mock Item"] 

def analyze_cooking_progress(image_base64: str, instruction: str):
    return "Safe to proceed. Looks delicious."

def search_recipes_smart(query: str, inventory: list):
    return [{"title": "Pantry Special", "match_score": 90}]

def generate_daily_plan(ingredients: list, preferences: list, dietary_goal: str):
    return {"breakfast": "Oats", "lunch": "Rice", "dinner": "Salad"}