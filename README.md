# 🚀 Traveloop X: AI-Powered Travel OS

Traveloop X is a cinematic, production-grade travel operating system designed to transform chaotic travel planning into a seamless, collaborative experience.

## ✨ Key Features

- **🪄 Magic Prompt Box**: Natural language trip generation using SSE (Server-Sent Events) for a real-time "building" experience.
- **🌍 3D Cinematic Globe**: Interactive 3D visualization using React Three Fiber.
- **🛰️ 2026 Satellite Maps**: Real-time high-resolution satellite imagery powered by Google Maps.
- **👥 Live Collaboration**: Figma-style real-time multi-user cursors via Socket.IO.
- **🎒 AI Packing Assistant**: Smart, destination-aware packing checklists.
- **💰 Expense Tracker**: Categorized budget and spending management.
- **🛡️ Security Center**: Admin dashboard for monitoring system health and edge latency.

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Graphics**: Three.js + React Three Fiber
- **Maps**: Leaflet + Google Satellite Tiles

### Backend
- **Core**: Express.js + Node.js
- **Database**: Prisma ORM + SQLite
- **Real-time**: Socket.IO

### AI Service
- **Framework**: FastAPI (Python)
- **Geocoding**: Geopy (Nominatim)
- **Logic**: Custom destination-aware generation algorithms

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- npm

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd Oodo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup environment**:
   Create `.env` files in `apps/api` and `apps/web` based on the provided logic.

### Running the Application

Terminal 1 (Backend API):
```bash
cd apps/api
npm run dev
```

Terminal 2 (AI Service):
```bash
cd apps/ai
python main.py
```

Terminal 3 (Frontend):
```bash
cd apps/web
npm run dev
```

Visit `http://localhost:3000` to start your journey.

## 📄 License
MIT License
