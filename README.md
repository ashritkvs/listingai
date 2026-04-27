# 🏠 ListingAI

AI-powered real estate listing description generator built with 
FastAPI, OpenAI GPT-4o-mini, and React.

## What it does
Paste in a property's details and instantly get 3 professional 
listing descriptions — Luxury, Standard, and Concise — ready 
to copy and publish.

## Tech Stack
- Backend: Python, FastAPI, OpenAI API (GPT-4o-mini)
- Frontend: React, Vite
- Deployment: Render (backend), Vercel (frontend)

## Run Locally

### Backend
cd listingai/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api:app --host 0.0.0.0 --port 8000 --reload

### Frontend
cd listingai/frontend
npm install
npm run dev

### Environment Variables
Create a .env file in listingai/backend/:
OPENAI_API_KEY=your-key-here

## Deployed Link:
(https://listingai-pearl-pi.vercel.app/)

## Author
Venkata Sai Ashrit Kommireddy

