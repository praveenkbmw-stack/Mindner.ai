import os
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import auth, memories, routines, games, caregiver, family

# Ensure database tables are created (simplifies local setup)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MINDNER API",
    description="Cognitive Engagement & Activity Tracking for Supportive Purposes (Non-Diagnostic)",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Medical Safety Boundary Header
@app.middleware("http")
async def add_safety_header(request, call_next):
    response = await call_next(request)
    response.headers["X-Medical-Safety-Disclaimer"] = (
        "MINDNER is a Cognitive Engagement & Activity Tracking Platform for Supportive Purposes. "
        "It is Non-Diagnostic and does not claim to prevent, diagnose, or reverse dementia."
    )
    return response

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(memories.router, prefix="/api/memories", tags=["Memory Book"])
app.include_router(routines.router, prefix="/api/routines", tags=["Routine Manager"])
app.include_router(games.router, prefix="/api/games", tags=["Cognitive Games"])
app.include_router(caregiver.router, prefix="/api/caregiver", tags=["Caregiver Dashboard"])
app.include_router(family.router, prefix="/api/family", tags=["Family Voices"])

@app.get("/")
def read_root():
    return {
        "app": "MINDNER",
        "description": "AI Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients",
        "medical_disclaimer": "Cognitive Engagement & Activity Tracking for Supportive Purposes (Non-Diagnostic). MINDNER does not claim to cure, diagnose, prevent, or reverse dementia.",
        "status": "active"
    }

# WebSockets for Voice Interactions (Mock Voice Processing Layer)
@app.websocket("/ws/voice")
async def websocket_voice_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive STT string or audio data
            data = await websocket.receive_text()
            
            # Simple AI conversational responses for dementia patients
            # (Calm, short, slow-paced responses)
            message = data.lower().strip()
            response_text = ""
            
            if "hello" in message or "hi" in message:
                response_text = "Hello! I am here with you. How are you feeling today?"
            elif "schedule" in message or "routine" in message or "today" in message:
                response_text = "Today, you have your breakfast scheduled, followed by matching cards game. Would you like me to show your routine?"
            elif "memory" in message or "photos" in message or "family" in message:
                response_text = "I would love to show you your family photos. Let's look at your memory timeline."
            elif "help" in message or "call" in message:
                response_text = "I am sending a notification to your caregiver. Everything is okay. Just relax."
            else:
                response_text = "I hear you. Let's play a game or look at some of your favorite memories together."
            
            await websocket.send_json({
                "response": response_text,
                "speaking_speed": 0.85, # slower reading speed for elderly clarity
                "language": "en"
            })
    except WebSocketDisconnect:
        pass
