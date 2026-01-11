# backend/final_check.py
import os
from pathlib import Path
from dotenv import load_dotenv

# 1. Force load the .env file
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

print("\n---  CONFIGURATION CHECK ---")


endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")

print(f"1. TARGET ENDPOINT:   {endpoint}")
print(f"2. DEPLOYMENT NAME:   {name}")


print("\n---  DIAGNOSIS ---")

if "icx-openai-backend" in str(endpoint):
    print(" ERROR: You are still using the OLD Endpoint!")
    print("    Fix: Open .env and replace AZURE_OPENAI_ENDPOINT with the new 'alone-mjsz...' URL.")

elif "alone-mjsz" in str(endpoint):
    print(" Endpoint looks correct (New Server).")
    
    if name == "YourAPI_deployment_name":
        print("Deployment Name looks correct.")
        print(" VERDICT: If this setup fails, restart")
