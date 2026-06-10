import os
import json
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import json_util
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")

if not GROQ_API_KEY or not MONGO_URI:
    raise EnvironmentError("Missing GROQ_API_KEY or MONGO_URI in .env file")

# MongoDB connection
client = MongoClient(MONGO_URI)
db = client["test"]
collection = db["students"]

# FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryInput(BaseModel):
    query: str


SYSTEM_PROMPT = """You are a MongoDB filter generator. Generate MongoDB find() filter objects for a students collection.

VALID FIELDS ONLY: name, roll_no, email, phone_no, address, dob, class
DO NOT use any other field names. DO NOT add "action", "table", "collection" or any made-up keys.

Output format: {"query": { ...only valid MongoDB filter here... }}

EXAMPLES (copy this pattern exactly):

Input: show students in class 10A
Output: {"query": {"class": "10A"}}

Input: find student named Rahul
Output: {"query": {"name": {"$regex": "Rahul", "$options": "i"}}}

Input: student with roll number 3
Output: {"query": {"roll_no": 3}}

Input: all students in 10B
Output: {"query": {"class": "10B"}}

Input: show all students
Output: {"query": {}}

Input: find Priya
Output: {"query": {"name": {"$regex": "Priya", "$options": "i"}}}

RULES:
- Output ONLY raw JSON, no markdown, no backticks, no explanation
- Use ONLY the fields listed above in the filter
- Always wrap the MongoDB filter inside {"query": { ... }}"""


def call_groq(user_input: str) -> str:
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_input}
            ],
            "temperature": 0.0,
            "max_tokens": 128
        },
        timeout=15
    )

    if response.status_code != 200:
        raise Exception(f"Groq API error {response.status_code}: {response.text[:200]}")

    return response.json()["choices"][0]["message"]["content"]


def extract_mongo_query(ai_text: str) -> dict:
    """Robustly extract the MongoDB filter from AI response."""
    # Strip markdown code fences if present
    cleaned = ai_text.strip()
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()

    # Parse JSON
    parsed = json.loads(cleaned)

    # Handle different possible response shapes
    if "query" in parsed:
        return parsed["query"]
    elif "filter" in parsed:
        return parsed["filter"]
    elif "find" in parsed:
        # { "find": "students", "filter": {...} }
        return parsed.get("filter", {})
    else:
        # Maybe the whole object IS the query
        return parsed


@app.post("/query")
async def handle_query(input: QueryInput):
    try:
        print(f"📥 User query: {input.query}")
        ai_text = call_groq(input.query)
        print(f"🤖 AI response: {ai_text}")

        mongo_query = extract_mongo_query(ai_text)
        print(f"🔍 MongoDB query: {mongo_query}")

        if not mongo_query:
            return JSONResponse(
                content={"message": "Could not generate a specific query. Please be more specific."},
                status_code=200
            )

        cursor = collection.find(mongo_query).limit(10)
        results = list(cursor)
        print(f"✅ Found {len(results)} student(s)")

        if not results:
            return JSONResponse(
                content={"message": "No students found matching your query."},
                status_code=200
            )

        json_docs = json.loads(json_util.dumps(results))
        return {"results": json_docs}

    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {str(e)}")
    except Exception as e:
        print(f"Error in handle_query: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
