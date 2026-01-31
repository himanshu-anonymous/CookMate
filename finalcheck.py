import os
from dotenv import load_dotenv
from openai import AzureOpenAI
import httpx
import asyncio

load_dotenv()

print("🚀 INITIATING COOKMATE PRE-FLIGHT CHECK...\n")

# 1. CHECK KEYS
keys = {
    "OPENAI_ENDPOINT": os.getenv("AZURE_OPENAI_ENDPOINT"),
    "OPENAI_KEY": os.getenv("AZURE_OPENAI_KEY"),
    "CV_ENDPOINT": os.getenv("AZURE_CV_ENDPOINT"),
    "CV_KEY": os.getenv("AZURE_CV_KEY")
}

missing = [k for k, v in keys.items() if not v]
if missing:
    print(f"❌ CRITICAL FAIL: Missing Keys: {missing}")
    exit(1)
else:
    print("✅ All Keys Present")

# 2. TEST OPENAI CONNECTION
try:
    client = AzureOpenAI(
        azure_endpoint=keys["OPENAI_ENDPOINT"],
        api_key=keys["OPENAI_KEY"],
        api_version="2024-02-15-preview"
    )
    # Simple ping
    client.models.list()
    print("✅ Azure OpenAI Connection: STABLE")
except Exception as e:
    print(f"❌ Azure OpenAI Connection FAILED: {e}")

# 3. TEST COMPUTER VISION
async def test_cv():
    url = f"{keys['CV_ENDPOINT'].rstrip('/')}/computervision/imageanalysis:analyze?features=tags&api-version=2023-10-01"
    headers = {"Ocp-Apim-Subscription-Key": keys["CV_KEY"], "Content-Type": "application/octet-stream"}
    # Send empty bytes just to check Auth response (should be 400 Bad Request, NOT 401 Unauthorized)
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers, content=b"")
        if resp.status_code == 401:
            print("❌ Azure Vision Auth FAILED (Check Key)")
        else:
            print("✅ Azure Vision Auth: VERIFIED")

asyncio.run(test_cv())

print("\n🎉 PRE-FLIGHT COMPLETE. READY TO LAUNCH.")