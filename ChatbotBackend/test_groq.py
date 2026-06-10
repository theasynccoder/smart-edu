from dotenv import load_dotenv
import os, requests, json
from pymongo import MongoClient

load_dotenv()
client = MongoClient(os.getenv('MONGO_URI'))
db = client['test']
GROQ_KEY = os.getenv('GROQ_API_KEY')

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

queries = [
    'show all students in class 10A',
    'find student named Rahul',
    'show all students',
    'student with roll number 5',
]

for q in queries:
    res = requests.post(
        'https://api.groq.com/openai/v1/chat/completions',
        headers={'Authorization': f'Bearer {GROQ_KEY}', 'Content-Type': 'application/json'},
        json={
            'model': 'llama-3.3-70b-versatile',
            'messages': [
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': q}
            ],
            'temperature': 0.0, 'max_tokens': 64
        }, timeout=15
    )
    ai_text = res.json()['choices'][0]['message']['content']
    cleaned = ai_text.strip().replace('```json','').replace('```','').strip()
    try:
        parsed = json.loads(cleaned)
        mongo_query = parsed.get('query', parsed.get('filter', {}))
        results = list(db['students'].find(mongo_query).limit(5))
        names = [r.get('name') for r in results]
        print(f'OK Q: "{q}"')
        print(f'   AI: {cleaned}')
        print(f'   Found {len(results)}: {names}')
    except Exception as e:
        print(f'ERR Q: "{q}" -> Error: {e}, AI: {cleaned}')
    print()
