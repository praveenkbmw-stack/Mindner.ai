from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import GameSession, Patient
from ..schemas import GameSessionCreate, GameSessionResponse, DifficultyAdjustmentResponse
from ..ai.difficulty_engine import AdaptiveDifficultyEngine
from .auth import get_current_caregiver

router = APIRouter()

@router.post("/log", response_model=GameSessionResponse)
def log_game_session(
    session_in: GameSessionCreate,
    db: Session = Depends(get_db)
):
    # Ensure patient exists
    patient = db.query(Patient).filter(Patient.id == session_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    new_session = GameSession(
        patient_id=session_in.patient_id,
        game_type=session_in.game_type,
        difficulty=session_in.difficulty,
        score=session_in.score,
        accuracy=session_in.accuracy,
        response_time=session_in.response_time,
        attempts=session_in.attempts
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/difficulty-adjustment", response_model=DifficultyAdjustmentResponse)
def adjust_difficulty(
    game_type: str,
    current_tier: str, # "Easy", "Medium", "Hard"
    accuracy: float,
    response_time: float,
    attempts: int,
    patient_id: int,
    db: Session = Depends(get_db)
):
    # Fetch recent logs of this patient to analyze trend
    history = db.query(GameSession).filter(
        GameSession.patient_id == patient_id,
        GameSession.game_type == game_type
    ).order_by(GameSession.completed_at.desc()).limit(5).all()

    past_sessions = [
        {"response_time": s.response_time, "completed": True} 
        for s in history
    ]

    # Map text difficulties to numeric tiers for engine calculations
    tier_map = {"Easy": 1, "Medium": 3, "Hard": 5}
    reverse_map = {1: "Easy", 2: "Easy", 3: "Medium", 4: "Medium", 5: "Hard"}
    
    numeric_tier = tier_map.get(current_tier, 2)

    # Calculate adjustment using the AI Engine
    result = AdaptiveDifficultyEngine.calculate_next_difficulty(
        game_type=game_type,
        current_tier=numeric_tier,
        accuracy=accuracy,
        response_time=response_time,
        attempts=attempts,
        past_sessions=past_sessions
    )
    
    text_tier = reverse_map.get(result["next_difficulty_tier"], "Medium")
    
    return {
        "next_difficulty_tier": text_tier,
        "reduce_visual_clues": result["reduce_visual_clues"],
        "trigger_audio_guidance": result["trigger_audio_guidance"],
        "simplify_layout": result["simplify_layout"]
    }

@router.get("/history/{patient_id}", response_model=List[GameSessionResponse])
def get_game_history(patient_id: int, db: Session = Depends(get_db)):
    # Caregivers can view game activity logs to monitor progress
    history = db.query(GameSession).filter(
        GameSession.patient_id == patient_id
    ).order_by(GameSession.completed_at.desc()).all()
    return history
