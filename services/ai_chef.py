import os
import json
import logging
import io
from pathlib import Path
from openai import AzureOpenAI
from dotenv import load_dotenv

# --- CONFIGURATION & DEBUGGING ---
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

main_key = os.getenv("AZURE_OPENAI_KEY")
tts_key = os.getenv("AZURE_TTS_KEY")

print("\n--- [ICX] AI SERVICE STATUS ---")
print(f"Loading .env from: {env_path}")
print(f"MAIN AI (East US 2): {'✅ FOUND' if main_key else '❌ MISSING'}")
print(f"TTS AI (Sweden/NC):  {'✅ FOUND' if tts_key else '❌ MISSING'}")
print("-------------------------------\n")

# --- CLIENT 1: MAIN (Brain + Eyes + Ears) ---
try:
    client_main = AzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=main_key,
        api_version="2024-02-15-preview"
    )
    DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
except Exception as e:
    logger.error(f"Failed to init Main Client: {e}")
    client_main = None

# --- CLIENT 2: VOICE OUTPUT (Mouth) ---
try:
    if tts_key:
        client_tts = AzureOpenAI(
            azure_endpoint=os.getenv("AZURE_TTS_ENDPOINT"),
            api_key=tts_key,
            api_version="2024-02-15-preview"
        )
    else:
        client_tts = None
except Exception as e:
    logger.error(f"Failed to init TTS Client: {e}")
    client_tts = None

# ==========================================
# 1. VISUAL INTELLIGENCE (The Eyes) [NEW]
# ==========================================

def analyze_pantry_image(base64_image: str):
    """
    Sends an image to Azure GPT-4o to identify ingredients.
    """
    if not client_main: return []
    try:
        response = client_main.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {
                    "role": "system", 
                    "content": "You are an AI Pantry Tracker. Identify food items in the image. Return a JSON list of strings: {'items': ['milk', 'eggs']}."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What ingredients are in this fridge/pantry?"},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }
            ],
            max_tokens=300
        )
        content = response.choices[0].message.content
        if "```json" in content:
            content = content.replace("```json", "").replace("```", "")
        data = json.loads(content)
        return data.get("items", [])
    except Exception as e:
        logger.error(f"Vision Error: {e}")
        return []

# ==========================================
# 2. SEARCH & DISCOVERY [NEW]
# ==========================================

def search_recipes_smart(query: str, inventory: list):
    """
    Searches for recipes matching the query BUT ranked by inventory availability.
    """
    if not client_main: return []
    try:
        prompt = f"""
        User wants: "{query}".
        User Inventory: {', '.join(inventory)}.
        
        Generate 3 recipe options.
        Rule: Prioritize recipes where the user owns >50% of ingredients.
        
        Output JSON:
        [
            {{
                "dish_name": "...",
                "match_score": 90, 
                "missing_ingredients": ["..."],
                "effort_level": "Medium"
            }}
        ]
        """
        response = client_main.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[{"role": "system", "content": "You are a pragmatic Chef. JSON Output only."}, 
                      {"role": "user", "content": prompt}]
        )
        content = response.choices[0].message.content
        if "```json" in content:
            content = content.replace("```json", "").replace("```", "")
        return json.loads(content)
    except Exception as e:
        logger.error(f"Search Error: {e}")
        return []

# ==========================================
# 3. VOICE SERVICES 
# ==========================================

async def transcribe_audio(audio_bytes: bytes) -> str:
    """Converts User Voice (Mic Input) -> Text using Whisper (East US 2)."""
    if not client_main: return "System Offline"
    try:
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "user_voice.mp3" 
        transcript = client_main.audio.transcriptions.create(
            model="whisper-1", file=audio_file
        )
        return transcript.text
    except Exception as e:
        logger.error(f"Whisper Error: {e}")
        return "I couldn't hear you clearly."

async def generate_speech(text: str) -> bytes:
    """Converts Text -> AI Voice Audio."""
    if not client_tts:
        return b""
    try:
        response = client_tts.audio.speech.create(
            model="tts-1", voice="alloy", input=text
        )
        return response.content 
    except Exception as e:
        logger.error(f"TTS Error: {e}")
        return b"" 

# ==========================================
# 4. RECIPE GENERATOR (UPDATED)
# ==========================================

def get_persona_prompt(persona: str) -> str:
    """Returns the specific system instructions for the user type."""
    if persona == "hosteler":
        return "ROLE: HOSTELER CHEF. PRIORITIES: Speed, Microwave, Cheap. TONE: Casual, 'Bro'."
    elif persona == "indian_mom":
        return "ROLE: INDIAN MOM CHEF. PRIORITIES: Health, Taste, Home-cooked. TONE: Caring, Authoritative."
    elif persona == "gym_bro":
        return "ROLE: GYM BRO CHEF. PRIORITIES: Protein, Macros, Fuel. TONE: Energetic, Focused."
    elif persona == "master_chef":
        return "ROLE: MASTER CHEF. PRIORITIES: Technique, Plating, Flavor. TONE: Professional, Sophisticated."
    return "ROLE: Helpful Chef."

def ask_chef_json(ingredients: list, expiring_items: list, preferences: str, dietary_goal: str, allergies: str, meal_type: str, portion_multiplier: float, effort_level: str, persona: str):
    if not client_main: return {}
    try:
        # 1. Get Persona-specific system prompt
        persona_instruction = get_persona_prompt(persona)
        
        system_message = f"{persona_instruction}. You output ONLY valid JSON data."
        
        # 2. Effort Filter (Updated Logic)
        effort_instruction = ""
        if effort_level == "low":
            effort_instruction = "STRICT FILTER: Low Effort. Max 15 mins. Max 5 ingredients. One-pot preferred."
        elif effort_level == "high":
            effort_instruction = "High Effort allowed. Focus on complex techniques and plating."
        else:
            effort_instruction = "User wants NORMAL EFFORT. Balance ease and quality."
        
        # 3. Shelf Life Logic (Priority Usage)
        expiry_prompt = ""
        if expiring_items:
            expiry_prompt = f"PRIORITY: You MUST try to use these expiring ingredients: {', '.join(expiring_items)}."

        # 4. Snack Mode Logic
        if meal_type.lower() == "snack":
            effort_instruction += " This is a SNACK. Keep it light, quick, and easy to eat."

        user_prompt = f"""
        Create a {persona} style recipe.
        - Inventory: {', '.join(ingredients)}
        - {expiry_prompt}
        - Goal: {dietary_goal}
        - Meal: {meal_type}
        - Preferences: {preferences}
        - Allergies: {allergies}
        - Portion Scale: {portion_multiplier}x
        - Effort Level: {effort_level} ({effort_instruction})

        Return JSON matching this structure EXACTLY:
        {{
            "dish_name": "Name",
            "description": "Why it fits the persona and goal",
            "ingredients": ["Item 1", "Item 2"],
            "missing_ingredients_alert": ["List items user might NOT have"],
            "substitutions": {{"Heavy Cream": "Milk + Butter"}},
            "equipment": ["Pan"],
            "total_time_minutes": 15,
            "effort_score": 5.0,
            "prep_time_minutes": 5,
            "cleanup_score": "low",
            "macros_estimate": {{"protein": "High", "carbs": "Low"}},
            "steps": [
                {{
                    "step_number": 1,
                    "instruction": "Step instruction.",
                    "duration_seconds": 300,
                    "heat_level": "off",
                    "visual_cue": "Cue"
                }}
            ]
        }}
        """

        response = client_main.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=1000,
            temperature=0.7 
        )
        content = response.choices[0].message.content
        if "```json" in content:
            content = content.replace("```json", "").replace("```", "")
            
        return json.loads(content)

    except Exception as e:
        logger.error(f"JSON Chef Error: {str(e)}")
        # Fallback recipe to prevent crash
        return {
            "dish_name": "Emergency Simple Pasta",
            "description": "AI generation failed, but this works.",
            "ingredients": ["Pasta", "Water", "Salt"],
            "equipment": ["Pot"],
            "total_time_minutes": 15,
            "effort_score": 1.0,
            "prep_time_minutes": 2,
            "cleanup_score": "low",
            "macros_estimate": {"protein": "5g"},
            "steps": [{"step_number": 1, "instruction": "Cook pasta.", "duration_seconds": 600, "heat_level": "high"}]
        }

# ==========================================
# 5. COOKING MENTOR
# ==========================================

def get_mentor_guidance(step_data: dict, user_query: str = None, persona: str = "indian_mom"):
    if not client_main: return "AI Offline"
    try:
        persona_prompt = get_persona_prompt(persona)
        
        if not user_query:
            prompt = f"""
            {persona_prompt}
            User is starting step: "{step_data['instruction']}".
            Duration: {step_data['duration_seconds']} seconds.
            Cue: {step_data.get('visual_cue', 'None')}
            Generate a short, encouraging spoken command (max 2 sentences).
            """
        else:
            prompt = f"""
            {persona_prompt}
            Context: User is on step "{step_data['instruction']}".
            User asked: "{user_query}"
            Answer helpfully in character. Keep it brief.
            """

        response = client_main.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100
        )
        return response.choices[0].message.content
        
    except Exception:
        return f"Please proceed to: {step_data['instruction']}"

# ==========================================
# 6. UTILITIES (Planner & Substitute)
# ==========================================

def get_substitute(ingredient: str, dish_context: str):
    if not client_main: return "AI Offline"
    try:
        prompt = f"""
        The user is cooking '{dish_context}' but is missing '{ingredient}'.
        Suggest the best possible substitute from a standard kitchen.
        Explain WHY it works. Keep it brief (max 2 sentences).
        """
        response = client_main.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Substitute Error: {e}")
        return "Could not find a substitute."

def generate_daily_plan(ingredients: list, preferences: str, dietary_goal: str):
    if not client_main: return {"error": "AI Offline"}
    try:
        system_msg = "You are the ICX Meal Planner. Output valid JSON only."
        
        user_msg = f"""
        Create a 1-day meal plan (Breakfast, Lunch, Snack, Dinner).
        Inventory: {', '.join(ingredients)}
        Goal: {dietary_goal}
        Preferences: {preferences}

        REQUIRED JSON OUTPUT FORMAT:
        {{
            "breakfast": {{ "dish_name": "...", "calories": "...", "time": "..." }},
            "lunch": {{ "dish_name": "...", "calories": "...", "time": "..." }},
            "snack": {{ "dish_name": "...", "calories": "...", "time": "..." }},
            "dinner": {{ "dish_name": "...", "calories": "...", "time": "..." }}
        }}
        """
        
        response = client_main.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[{"role": "system", "content": system_msg}, {"role": "user", "content": user_msg}],
            temperature=0.7
        )
        content = response.choices[0].message.content
        if "```json" in content:
            content = content.replace("```json", "").replace("```", "")
        return json.loads(content)
        
    except Exception as e:
        logger.error(f"Planner Error: {e}")
        return {
            "breakfast": {"dish_name": "Oatmeal", "calories": "300 kcal", "time": "10m"},
            "lunch": {"dish_name": "Rice Bowl", "calories": "500 kcal", "time": "15m"},
            "snack": {"dish_name": "Apple", "calories": "100 kcal", "time": "5m"},
            "dinner": {"dish_name": "Stir Fry", "calories": "600 kcal", "time": "20m"}
        }