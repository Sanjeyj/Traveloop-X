from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import os, asyncio, json, re
import google.generativeai as genai
import httpx

load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
WEATHER_KEY = os.getenv("OPENWEATHER_API_KEY")

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

app = FastAPI(title="Traveloop X AI Service v2")
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ─── Models ───────────────────────────────────────────────────────────────────
class PromptRequest(BaseModel):
    prompt: str

class ChatRequest(BaseModel):
    message: str
    history: list = []
    tripContext: dict = {}

class AdaptRequest(BaseModel):
    tripId: str
    weatherCondition: str
    activities: list
    destination: str

class BudgetRequest(BaseModel):
    tripId: str
    budget: float
    days: list
    destination: str

class PackingRequest(BaseModel):
    destination: str
    duration: int
    activities: list = []
    season: str = "summer"

class PersonalityRequest(BaseModel):
    answers: dict

# ─── Utilities ────────────────────────────────────────────────────────────────
DESTINATION_DB = {
    "japan": {"lat": 35.6762, "lng": 139.6503, "city": "Tokyo", "country": "Japan"},
    "tokyo": {"lat": 35.6762, "lng": 139.6503, "city": "Tokyo", "country": "Japan"},
    "paris": {"lat": 48.8566, "lng": 2.3522, "city": "Paris", "country": "France"},
    "bali": {"lat": -8.3405, "lng": 115.0920, "city": "Bali", "country": "Indonesia"},
    "goa": {"lat": 15.2993, "lng": 74.1240, "city": "Goa", "country": "India"},
    "london": {"lat": 51.5074, "lng": -0.1278, "city": "London", "country": "UK"},
    "dubai": {"lat": 25.2048, "lng": 55.2708, "city": "Dubai", "country": "UAE"},
    "new york": {"lat": 40.7128, "lng": -74.0060, "city": "New York", "country": "USA"},
    "singapore": {"lat": 1.3521, "lng": 103.8198, "city": "Singapore", "country": "Singapore"},
    "pondicherry": {"lat": 11.9416, "lng": 79.8083, "city": "Pondicherry", "country": "India"},
    "kyoto": {"lat": 35.0116, "lng": 135.7681, "city": "Kyoto", "country": "Japan"},
    "rome": {"lat": 41.9028, "lng": 12.4964, "city": "Rome", "country": "Italy"},
    "barcelona": {"lat": 41.3851, "lng": 2.1734, "city": "Barcelona", "country": "Spain"},
    "thailand": {"lat": 13.7563, "lng": 100.5018, "city": "Bangkok", "country": "Thailand"},
    "amsterdam": {"lat": 52.3676, "lng": 4.9041, "city": "Amsterdam", "country": "Netherlands"},
}

FALLBACK_ACTIVITIES = {
    "tokyo": [
        {"name": "Tsukiji Market Breakfast", "type": "Food", "time": "07:00", "cost": 1200, "note": "Best fresh sushi in the world"},
        {"name": "Senso-ji Temple", "type": "Culture", "time": "09:30", "cost": 0, "note": "Arrive early to avoid crowds"},
        {"name": "Akihabara Electric Town", "type": "Sightseeing", "time": "14:00", "cost": 3000, "note": "Anime merchandise paradise"},
        {"name": "Shibuya Crossing at Dusk", "type": "Sightseeing", "time": "18:00", "cost": 0, "note": "Most famous crosswalk on earth"},
        {"name": "Shinjuku Ramen Alley", "type": "Food", "time": "20:00", "cost": 1500, "note": "Tonkotsu ramen at its finest"},
    ],
    "paris": [
        {"name": "Eiffel Tower Sunrise", "type": "Sightseeing", "time": "07:00", "cost": 2500, "note": "Golden hour lighting is magical"},
        {"name": "Croissant at Le Marais", "type": "Food", "time": "09:00", "cost": 800},
        {"name": "Louvre Museum", "type": "Culture", "time": "11:00", "cost": 1800, "note": "Book tickets online to skip queues"},
        {"name": "Seine River Cruise", "type": "Romantic", "time": "17:00", "cost": 3500},
        {"name": "Montmartre by Night", "type": "Sightseeing", "time": "20:00", "cost": 0},
    ],
}

def resolve_destination(prompt: str) -> dict:
    prompt_lower = prompt.lower()
    for key, data in DESTINATION_DB.items():
        if key in prompt_lower:
            return data
    return {"lat": 0.0, "lng": 0.0, "city": "Unknown", "country": "Global"}

def extract_days(prompt: str) -> int:
    m = re.search(r'(\d+)\s*(?:-?\s*)?day', prompt.lower())
    return min(int(m.group(1)), 7) if m else 3

def extract_budget(prompt: str) -> int:
    m = re.search(r'(?:under|budget|₹|rs\.?|inr)\s*(\d[\d,]*)', prompt.lower())
    return int(m.group(1).replace(",", "")) if m else 75000

def get_fallback_activities(city: str) -> list:
    city_lower = city.lower()
    for key, acts in FALLBACK_ACTIVITIES.items():
        if key in city_lower or city_lower in key:
            return acts
    return [
        {"name": f"Morning walk in {city}", "type": "Nature", "time": "08:00", "cost": 0},
        {"name": f"Local market exploration", "type": "Food", "time": "11:00", "cost": 1000},
        {"name": f"{city} Heritage Museum", "type": "Culture", "time": "14:00", "cost": 800},
        {"name": f"Sunset viewpoint", "type": "Sightseeing", "time": "17:30", "cost": 0},
        {"name": f"Traditional dinner experience", "type": "Food", "time": "20:00", "cost": 1500},
    ]

async def fetch_weather(city: str, lat: float, lng: float) -> dict:
    if not WEATHER_KEY:
        return {"temp": 24, "condition": "Clear", "icon": "01d", "humidity": 65}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_KEY}&units=metric"
            r = await client.get(url)
            d = r.json()
            return {
                "temp": round(d["main"]["temp"]),
                "condition": d["weather"][0]["main"],
                "description": d["weather"][0]["description"],
                "icon": d["weather"][0]["icon"],
                "humidity": d["main"]["humidity"],
            }
    except:
        return {"temp": 24, "condition": "Clear", "icon": "01d", "humidity": 65}

# ─── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "Traveloop X AI v2", "gemini": bool(GEMINI_KEY), "weather": bool(WEATHER_KEY)}

# ─── MAIN GENERATE (Gemini streaming) ─────────────────────────────────────────
@app.post("/generate")
async def generate(req: PromptRequest):
    async def stream():
        dest = resolve_destination(req.prompt)
        num_days = extract_days(req.prompt)
        budget = extract_budget(req.prompt)
        city = dest["city"]
        lat, lng = dest["lat"], dest["lng"]

        yield f"data: {json.dumps({'status': 'analyzing', 'message': 'Analyzing travel DNA...'})}\n\n"
        await asyncio.sleep(0.5)

        weather = await fetch_weather(city, lat, lng)
        yield f"data: {json.dumps({'status': 'searching', 'message': f'Mapping {city} in real-time...'})}\n\n"
        await asyncio.sleep(0.4)

        yield f"data: {json.dumps({'type': 'destination', 'data': {'city': city, 'country': dest['country'], 'lat': lat, 'lng': lng, 'weather': weather}})}\n\n"
        await asyncio.sleep(0.3)

        saved = int(budget * 0.15)
        yield f"data: {json.dumps({'status': 'optimizing', 'message': 'Crunching budget algorithms...'})}\n\n"
        await asyncio.sleep(0.4)
        yield f"data: {json.dumps({'type': 'budget', 'data': {'total': budget, 'currency': 'INR', 'saved': saved, 'perDay': budget // num_days}})}\n\n"
        await asyncio.sleep(0.3)

        if GEMINI_KEY:
            yield f"data: {json.dumps({'status': 'building', 'message': 'Gemini AI generating your itinerary...'})}\n\n"
            await asyncio.sleep(0.3)
            prompt_text = f"""You are an expert travel planner. Create a detailed {num_days}-day itinerary for: "{req.prompt}"
Destination: {city}, {dest['country']}. Budget: ₹{budget} INR total.
Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{{"days": [{{"day": 1, "title": "Day title", "activities": [{{"name": "activity name", "type": "Food|Sightseeing|Culture|Adventure|Nature|Entertainment|Transport", "time": "HH:MM", "cost": 1500, "note": "insider tip"}}]}}]}}
Include 4-5 activities per day. Make it authentic, specific, and exciting for {city}."""

            try:
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(prompt_text)
                raw = response.text.strip()
                if raw.startswith("```"):
                    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
                parsed = json.loads(raw)
                for day_data in parsed.get("days", []):
                    yield f"data: {json.dumps({'type': 'day', 'data': {'day': day_data['day'], 'title': day_data['title'], 'activities': day_data['activities']}})}\n\n"
                    await asyncio.sleep(0.5)
            except Exception as e:
                print(f"Gemini error: {e}")
                activities = get_fallback_activities(city)
                for i in range(1, num_days + 1):
                    day_acts = [activities[(j + i - 1) % len(activities)] for j in range(len(activities))]
                    yield f"data: {json.dumps({'type': 'day', 'data': {'day': i, 'title': f'Day {i} in {city}', 'activities': day_acts}})}\n\n"
                    await asyncio.sleep(0.4)
        else:
            activities = get_fallback_activities(city)
            for i in range(1, num_days + 1):
                yield f"data: {json.dumps({'status': 'building', 'message': f'Building Day {i} timeline...'})}\n\n"
                await asyncio.sleep(0.3)
                day_acts = [activities[(j + i - 1) % len(activities)] for j in range(len(activities))]
                yield f"data: {json.dumps({'type': 'day', 'data': {'day': i, 'title': f'Day {i} in {city}', 'activities': day_acts}})}\n\n"
                await asyncio.sleep(0.5)

        # Packing list
        packing = await generate_packing_items(city, num_days, weather.get("condition", "Clear"))
        yield f"data: {json.dumps({'type': 'packing', 'data': packing})}\n\n"
        await asyncio.sleep(0.2)

        yield f"data: {json.dumps({'status': 'complete', 'message': 'Your trip is ready!'})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")

# ─── WEATHER ──────────────────────────────────────────────────────────────────
@app.get("/weather")
async def weather_endpoint(city: str, lat: float = 0, lng: float = 0):
    data = await fetch_weather(city, lat, lng)
    return data

# ─── AI CHAT ─────────────────────────────────────────────────────────────────
@app.post("/chat")
async def chat(req: ChatRequest):
    if not GEMINI_KEY:
        return {"reply": f"I'm your Traveloop X AI assistant! I can help you plan activities, find local tips, and optimize your travel budget. What would you like to know about your trip?"}
    try:
        ctx = req.tripContext
        system = f"You are Traveloop X, an expert AI travel assistant. Be concise, helpful, and enthusiastic. Current trip context: {json.dumps(ctx)}"
        model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system)
        history_fmt = [{"role": m["role"], "parts": [m["content"]]} for m in req.history[-6:]]
        chat_session = model.start_chat(history=history_fmt)
        resp = chat_session.send_message(req.message)
        return {"reply": resp.text}
    except Exception as e:
        return {"reply": "I'm having trouble connecting right now. Try asking me about local food, best times to visit, or packing tips!"}

# ─── AI ADAPT ────────────────────────────────────────────────────────────────
@app.post("/adapt")
async def adapt(req: AdaptRequest):
    """Adapts itinerary based on weather changes."""
    is_rain = "rain" in req.weatherCondition.lower() or "storm" in req.weatherCondition.lower()
    if not GEMINI_KEY:
        if is_rain:
            return {"adapted": True, "message": f"Rain detected in {req.destination}! Switched outdoor activities to indoor alternatives.", "suggestions": [{"original": "Outdoor activities", "replacement": "Museum visit or indoor cultural experience", "reason": "Rain forecast"}]}
        return {"adapted": False, "message": "Weather looks great! No changes needed."}
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""Weather in {req.destination}: {req.weatherCondition}. Activities: {json.dumps(req.activities[:5])}.
Suggest adaptations. Return JSON: {{"adapted": true/false, "message": "brief message", "suggestions": [{{"original": "...", "replacement": "...", "reason": "..."}}]}}"""
        resp = model.generate_content(prompt)
        raw = resp.text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`")
        return json.loads(raw)
    except:
        return {"adapted": is_rain, "message": f"Adjusted for {req.weatherCondition} in {req.destination}.", "suggestions": []}

# ─── BUDGET OPTIMIZE ──────────────────────────────────────────────────────────
@app.post("/optimize-budget")
async def optimize_budget(req: BudgetRequest):
    total_cost = sum(a.get("cost", 0) for d in req.days for a in d.get("activities", []))
    over_budget = total_cost > req.budget
    saved_estimate = int(total_cost * 0.12)
    if not GEMINI_KEY:
        return {
            "overBudget": over_budget, "totalEstimated": total_cost, "budget": req.budget,
            "savings": saved_estimate,
            "tips": [f"Book accommodation 3 days in advance to save ₹{saved_estimate//3}", "Use local transport instead of taxis", "Eat at local markets for lunch"]
        }
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""Trip to {req.destination}, budget ₹{req.budget}, estimated cost ₹{total_cost}.
Return JSON: {{"overBudget": bool, "savings": number, "tips": ["tip1","tip2","tip3"], "message": "one line summary"}}"""
        resp = model.generate_content(prompt)
        raw = resp.text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`")
        return json.loads(raw)
    except:
        return {"overBudget": over_budget, "savings": saved_estimate, "tips": ["Book early", "Use public transport", "Eat local"], "message": "Optimized!"}

# ─── PACKING ASSISTANT ────────────────────────────────────────────────────────
async def generate_packing_items(destination: str, duration: int, weather: str) -> list:
    essentials = [
        {"name": "Passport / ID", "category": "Documents", "isChecked": False},
        {"name": "Travel insurance", "category": "Documents", "isChecked": False},
        {"name": "Phone charger", "category": "Electronics", "isChecked": False},
        {"name": "Power bank", "category": "Electronics", "isChecked": False},
        {"name": f"{'Light clothes' if 'clear' in weather.lower() or 'sun' in weather.lower() else 'Warm layers'}", "category": "Clothing", "isChecked": False},
        {"name": "Comfortable walking shoes", "category": "Clothing", "isChecked": False},
        {"name": "Sunscreen SPF 50+", "category": "Health", "isChecked": False},
        {"name": "Reusable water bottle", "category": "Essentials", "isChecked": False},
        {"name": "Offline maps downloaded", "category": "Tech", "isChecked": False},
        {"name": f"{'Umbrella / Rain jacket' if 'rain' in weather.lower() else 'Sunglasses'}", "category": "Weather", "isChecked": False},
    ]
    return essentials

@app.post("/packing")
async def packing(req: PackingRequest):
    if not GEMINI_KEY:
        items = await generate_packing_items(req.destination, req.duration, req.season)
        return {"items": items}
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""Create a packing list for {req.duration} days in {req.destination} during {req.season}.
Return ONLY JSON: {{"items": [{{"name": "item", "category": "Documents|Clothing|Electronics|Health|Essentials", "isChecked": false}}]}}
Include 12-15 items specific to {req.destination}."""
        resp = model.generate_content(prompt)
        raw = resp.text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`")
        return json.loads(raw)
    except:
        items = await generate_packing_items(req.destination, req.duration, req.season)
        return {"items": items}

# ─── PERSONALITY PROFILING ────────────────────────────────────────────────────
@app.post("/personality")
async def personality(req: PersonalityRequest):
    answers = req.answers
    styles = {
        "adventure": ["adventure", "hiking", "extreme", "outdoor"],
        "culture": ["museums", "history", "art", "heritage"],
        "foodie": ["food", "restaurant", "cuisine", "tasting"],
        "relaxation": ["beach", "spa", "resort", "relax"],
        "nightlife": ["party", "clubs", "bars", "nightlife"],
    }
    scores = {s: 0 for s in styles}
    for ans in answers.values():
        ans_lower = str(ans).lower()
        for style, keywords in styles.items():
            if any(k in ans_lower for k in keywords):
                scores[style] += 1
    dominant = max(scores, key=scores.get)
    profiles = {
        "adventure": {"title": "The Adventurer", "emoji": "🏔️", "description": "You live for thrills and off-the-beaten-path experiences."},
        "culture": {"title": "The Culture Seeker", "emoji": "🏛️", "description": "History, art, and local traditions fuel your soul."},
        "foodie": {"title": "The Culinary Explorer", "emoji": "🍜", "description": "Every trip is a gastronomic adventure for you."},
        "relaxation": {"title": "The Zen Traveler", "emoji": "🌅", "description": "You travel to recharge and find inner peace."},
        "nightlife": {"title": "The Social Butterfly", "emoji": "🦋", "description": "You bloom when the sun goes down."},
    }
    return {"profile": dominant, **profiles[dominant], "scores": scores}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
