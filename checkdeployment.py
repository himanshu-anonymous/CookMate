import os
from dotenv import load_dotenv
from openai import AzureOpenAI

# Load the environment variables
load_dotenv()

print("\n--- AZURE DIAGNOSTIC TOOL ---")

# 1. Get Credentials
endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
key = os.getenv("AZURE_OPENAI_KEY")
api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")

print(f"ENDPOINT: {endpoint}")
print(f"KEY: {key[:5]}... (Masked)")

if not endpoint or not key:
    print("❌ ERROR: Endpoint or Key is missing in .env")
    exit()

# 2. Try to Connect
client = AzureOpenAI(
    azure_endpoint=endpoint,
    api_key=key,
    api_version=api_version
)

print("\n--- ATTEMPTING TO LIST DEPLOYMENTS ---")
try:
    # This trick asks Azure to list the models you have access to
    # It will usually show the base models, but if the connection works, 
    # it means your Credentials are correct.
    response = client.models.list()
    
    print("✅ CONNECTION SUCCESSFUL!")
    print("Available Models/Deployments:")
    for model in response:
        print(f" - ID: {model.id}")
        
    print("\n-----------------------------------")
    print("INSTRUCTIONS:")
    print("1. Look at the list above.")
    print("2. Pick the exact ID that looks like your deployment (e.g., 'gpt-4o' or 'cookmate-gpt').")
    print("3. Put THAT exact name in your .env file as AZURE_OPENAI_DEPLOYMENT_NAME.")

except Exception as e:
    print(f"❌ CONNECTION FAILED: {e}")
    print("\nPOSSIBLE CAUSES:")
    print("1. Wrong Endpoint (Check if it ends in .com/)")
    print("2. Wrong Key (Did you regenerate it?)")
    print("3. Wrong Resource (Are you using the Key for Vision instead of OpenAI?)")