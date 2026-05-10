from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import asyncio
import json
import re
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from geopy.geocoders import Nominatim

load_dotenv()

geolocator = Nominatim(user_agent="traveloop_x")

app = FastAPI(title="Traveloop X AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Traveloop X AI"}

class PromptRequest(BaseModel):
    prompt: str

# Known destination database for instant activity generation
DESTINATION_ACTIVITIES = {
    "paris": [
        {"name": "Eiffel Tower Sunrise Visit", "type": "Sightseeing", "time": "07:00", "cost": 2500},
        {"name": "Croissant & Café at Le Marais", "type": "Food", "time": "09:30", "cost": 800},
        {"name": "Louvre Museum Tour", "type": "Culture", "time": "11:00", "cost": 1800},
        {"name": "Seine River Cruise", "type": "Romantic", "time": "16:00", "cost": 3500},
        {"name": "Montmartre Evening Walk", "type": "Sightseeing", "time": "19:00", "cost": 0},
    ],
    "tokyo": [
        {"name": "Tsukiji Outer Market Breakfast", "type": "Food", "time": "07:00", "cost": 1200},
        {"name": "Senso-ji Temple Visit", "type": "Culture", "time": "10:00", "cost": 0},
        {"name": "Akihabara Electric Town", "type": "Sightseeing", "time": "14:00", "cost": 3000},
        {"name": "Shibuya Crossing & Hachiko", "type": "Sightseeing", "time": "17:00", "cost": 0},
        {"name": "Shinjuku Ramen Alley Dinner", "type": "Food", "time": "19:30", "cost": 1500},
    ],
    "new york": [
        {"name": "Central Park Morning Jog", "type": "Nature", "time": "07:00", "cost": 0},
        {"name": "MoMA Museum Visit", "type": "Culture", "time": "10:00", "cost": 2500},
        {"name": "Brooklyn Bridge Walk", "type": "Sightseeing", "time": "14:00", "cost": 0},
        {"name": "Times Square Neon Lights", "type": "Sightseeing", "time": "18:00", "cost": 0},
        {"name": "Broadway Show", "type": "Entertainment", "time": "20:00", "cost": 8000},
    ],
    "pondicherry": [
        {"name": "Promenade Beach Sunrise", "type": "Nature", "time": "06:00", "cost": 0},
        {"name": "French Quarter Heritage Walk", "type": "Culture", "time": "09:00", "cost": 500},
        {"name": "Auroville Meditation Center", "type": "Wellness", "time": "11:00", "cost": 200},
        {"name": "Café des Arts Lunch", "type": "Food", "time": "13:00", "cost": 1200},
        {"name": "Paradise Beach Sunset", "type": "Nature", "time": "17:00", "cost": 800},
    ],
    "goa": [
        {"name": "Anjuna Beach Morning", "type": "Nature", "time": "07:00", "cost": 0},
        {"name": "Old Goa Churches Tour", "type": "Culture", "time": "10:00", "cost": 300},
        {"name": "Spice Plantation Lunch", "type": "Food", "time": "13:00", "cost": 1500},
        {"name": "Dudhsagar Falls Trek", "type": "Adventure", "time": "15:00", "cost": 2000},
        {"name": "Tito's Lane Night Market", "type": "Nightlife", "time": "20:00", "cost": 1000},
    ],
    "london": [
        {"name": "Tower of London Visit", "type": "Culture", "time": "09:00", "cost": 3000},
        {"name": "Borough Market Brunch", "type": "Food", "time": "11:30", "cost": 1500},
        {"name": "Thames River Walk", "type": "Sightseeing", "time": "14:00", "cost": 0},
        {"name": "British Museum Tour", "type": "Culture", "time": "16:00", "cost": 0},
        {"name": "West End Theatre Show", "type": "Entertainment", "time": "19:30", "cost": 5000},
    ],
    "dubai": [
        {"name": "Burj Khalifa Observation Deck", "type": "Sightseeing", "time": "09:00", "cost": 4000},
        {"name": "Dubai Mall & Aquarium", "type": "Entertainment", "time": "11:00", "cost": 2000},
        {"name": "Al Fahidi Heritage Walk", "type": "Culture", "time": "15:00", "cost": 0},
        {"name": "Desert Safari Sunset", "type": "Adventure", "time": "16:30", "cost": 5000},
        {"name": "Dubai Fountain Show Dinner", "type": "Food", "time": "20:00", "cost": 3500},
    ],
    "bali": [
        {"name": "Tegallalang Rice Terrace", "type": "Nature", "time": "07:00", "cost": 500},
        {"name": "Ubud Monkey Forest", "type": "Nature", "time": "10:00", "cost": 800},
        {"name": "Balinese Cooking Class", "type": "Food", "time": "12:00", "cost": 1500},
        {"name": "Tanah Lot Temple Sunset", "type": "Culture", "time": "17:00", "cost": 600},
        {"name": "Seminyak Beach Club", "type": "Nightlife", "time": "20:00", "cost": 2000},
    ],
}

def extract_city_from_prompt(prompt: str) -> str:
    """
    Extract the city/destination name from a natural language prompt.
    Uses keyword matching and known destinations first, then falls back to geopy.
    """
    prompt_lower = prompt.lower()
    
    # Check against known destinations first (instant, no API call)
    for city_key in DESTINATION_ACTIVITIES:
        if city_key in prompt_lower:
            return city_key
    
    # Try to extract location after common prepositions
    patterns = [
        r'(?:trip to|visit|travel to|explore|go to|vacation in|holiday in|tour of|heading to)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:with|under|for|in|on|during|budget|and|,|\.|$))',
        r'(?:trip to|visit|travel to|explore|go to|vacation in|holiday in|tour of|heading to)\s+([A-Z][a-zA-Z\s]+)',
        r'(?:in|at|from)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, prompt)
        if match:
            candidate = match.group(1).strip().rstrip('.,!?')
            # Filter out obviously non-place words
            noise_words = {'plan', 'day', 'budget', 'trip', 'anime', 'street', 'food', 'luxury', 'cheap', 'family'}
            if candidate.lower() not in noise_words and len(candidate) > 2:
                return candidate
    
    # Last resort: return the prompt itself for geopy to try
    return prompt

def get_activities_for_city(city_name: str, num_days: int = 1):
    """Get destination-specific activities. Falls back to generic if unknown."""
    city_lower = city_name.lower()
    
    # Check known destinations
    for key, activities in DESTINATION_ACTIVITIES.items():
        if key in city_lower or city_lower in key:
            return activities
    
    # Generate generic but descriptive activities
    return [
        {"name": f"Explore {city_name} Old Town", "type": "Sightseeing", "time": "09:00", "cost": 500},
        {"name": f"Local Food Market Tour", "type": "Food", "time": "12:00", "cost": 1200},
        {"name": f"{city_name} Heritage Museum", "type": "Culture", "time": "14:30", "cost": 800},
        {"name": f"Sunset Viewpoint Walk", "type": "Nature", "time": "17:00", "cost": 0},
        {"name": f"Traditional {city_name} Dinner", "type": "Food", "time": "19:30", "cost": 1500},
    ]

def extract_num_days(prompt: str) -> int:
    """Extract number of days from the prompt."""
    match = re.search(r'(\d+)\s*(?:-?\s*)?day', prompt.lower())
    if match:
        return min(int(match.group(1)), 7)  # Cap at 7 days
    return 3  # Default

def extract_budget(prompt: str) -> int:
    """Extract budget from the prompt."""
    match = re.search(r'(?:under|budget|within|₹|rs\.?|inr)\s*(\d[\d,]*)', prompt.lower())
    if match:
        return int(match.group(1).replace(',', ''))
    return 75000  # Default


@app.post("/generate")
async def generate_itinerary(req: PromptRequest):
    """
    Streams a cinematic JSON response progressively.
    Now with real city extraction and destination-aware activities.
    """
    async def event_generator():
        # Step 1: Extract city name from prompt
        city_query = extract_city_from_prompt(req.prompt)
        num_days = extract_num_days(req.prompt)
        budget = extract_budget(req.prompt)
        
        # Defaults
        city = city_query.title()
        lat, lng = 0.0, 0.0
        country = "Global"
        
        # Step 2: Geocode the extracted city
        yield f"data: {json.dumps({'status': 'analyzing', 'message': 'Analyzing travel DNA...'})}\n\n"
        await asyncio.sleep(0.6)
        
        try:
            location = geolocator.geocode(city_query, timeout=10)
            if location:
                # Extract clean city name from the first part of the address
                addr_parts = location.address.split(',')
                city = addr_parts[0].strip()
                country = addr_parts[-1].strip() if len(addr_parts) > 1 else "Global"
                lat, lng = location.latitude, location.longitude
        except Exception as e:
            print(f"Geocoding error: {e}")
        
        yield f"data: {json.dumps({'status': 'searching', 'message': f'Discovering optimal routes in {city}...'})}\n\n"
        await asyncio.sleep(0.6)
        
        # Step 3: Send destination data
        yield f"data: {json.dumps({'type': 'destination', 'data': {'city': city, 'country': country, 'lat': lat, 'lng': lng}})}\n\n"
        await asyncio.sleep(0.5)
        
        # Step 4: Budget optimization
        saved = int(budget * 0.15)
        yield f"data: {json.dumps({'status': 'optimizing', 'message': 'Optimizing budget algorithms...'})}\n\n"
        await asyncio.sleep(0.5)
        
        yield f"data: {json.dumps({'type': 'budget', 'data': {'total': budget, 'currency': 'INR', 'saved': saved}})}\n\n"
        await asyncio.sleep(0.5)
        
        # Step 5: Generate day-by-day itinerary
        activities = get_activities_for_city(city, num_days)
        
        yield f"data: {json.dumps({'status': 'building', 'message': f'Generating {num_days}-day timeline...'})}\n\n"
        await asyncio.sleep(0.5)
        
        for day_num in range(1, num_days + 1):
            # Rotate activities across days with slight variation
            day_activities = []
            for i, act in enumerate(activities):
                # Shift activities by day for variety
                shifted_idx = (i + day_num - 1) % len(activities)
                src = activities[shifted_idx]
                day_activities.append({
                    "name": src["name"],
                    "type": src["type"],
                    "time": src["time"],
                    "cost": src["cost"]
                })
            
            yield f"data: {json.dumps({'type': 'day', 'data': {'day': day_num, 'title': f'Day {day_num} in {city}', 'activities': day_activities}})}\n\n"
            await asyncio.sleep(0.4)
        
        # Step 6: Complete
        yield f"data: {json.dumps({'status': 'complete', 'message': 'Itinerary finalized.'})}\n\n"
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
