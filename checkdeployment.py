# backend/check_deployments.py
import os
import httpx
import asyncio
from dotenv import load_dotenv
from pathlib import Path

# FIX: Look in the CURRENT folder (backend), not the parent ---
current_folder = Path(__file__).resolve().parent
env_path = current_folder / ".env"

print(f"📂 Looking for .env at: {env_path}")
load_dotenv(dotenv_path=env_path)

ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
API_KEY = os.getenv("AZURE_OPENAI_KEY")

async def list_deployments():
    if not ENDPOINT or not API_KEY:
        print("❌ Error: Still can't find keys. Is the file named '.env' exactly?")
        return

    # Clean the endpoint url
    base_url = ENDPOINT.rstrip("/")
    url = f"{base_url}/openai/deployments?api-version=2023-05-15"
    
    headers = {"api-key": API_KEY}
    
    print(f"Connecting to Azure: {base_url}...")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ SUCCESS! Found these Deployments:")
            print("-" * 40)
            if len(data['data']) == 0:
                print("⚠️  NO DEPLOYMENTS FOUND.")
                print("ACTION: Go to Azure Studio -> Deployments -> Create New.")
                print("Select Model: gpt-35-turbo")
            else:
                for item in data['data']:
                    print(f"👉 DEPLOYMENT NAME:  {item['id']}") # <--- THIS IS THE NAME YOU NEED
                    print(f"   Model: {item['model']}")
                    print("-" * 40)
        else:
            print(f"\n❌ FAILED. Status: {response.status_code}")
            print(f"Message: {response.text}")

if __name__ == "__main__":
    asyncio.run(list_deployments())