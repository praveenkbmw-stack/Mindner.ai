from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import GameSession, Patient, PhotoRecallItem
from ..schemas import GameSessionCreate, GameSessionResponse, DifficultyAdjustmentResponse, PhotoRecallItemCreate, PhotoRecallItemResponse
from ..ai.difficulty_engine import AdaptiveDifficultyEngine
from .auth import get_current_caregiver

router = APIRouter()

@router.post("/photo-recall/custom", response_model=PhotoRecallItemResponse)
def add_custom_photo_recall_item(
    item_in: PhotoRecallItemCreate,
    db: Session = Depends(get_db)
):
    uid = item_in.user_id or item_in.patient_id or 1
    new_item = PhotoRecallItem(
        user_id=uid,
        patient_id=uid,
        person_name=item_in.person_name,
        relationship=item_in.relationship,
        description=item_in.description,
        image_path=item_in.image_path,
        image_url=item_in.image_url or item_in.image_path
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.get("/photo-recall/{user_id}", response_model=List[PhotoRecallItemResponse])
def get_user_photo_recall_items(user_id: int, db: Session = Depends(get_db)):
    items = db.query(PhotoRecallItem).filter(
        (PhotoRecallItem.user_id == user_id) | (PhotoRecallItem.patient_id == user_id)
    ).order_by(PhotoRecallItem.created_at.desc()).all()
    return items

@router.delete("/photo-recall/{item_id}")
def delete_photo_recall_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(PhotoRecallItem).filter(PhotoRecallItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Photo recall item not found")
    db.delete(item)
    db.commit()
    return {"status": "success", "message": "Photo recall item deleted"}


@router.post("/log", response_model=GameSessionResponse)
@router.post("/session", response_model=GameSessionResponse)
def log_game_session(
    session_in: GameSessionCreate,
    db: Session = Depends(get_db)
):
    pid = session_in.user_id or session_in.patient_id or 1
    
    resp_time = session_in.response_time_seconds if session_in.response_time_seconds is not None else (session_in.response_time or 0.0)

    new_session = GameSession(
        patient_id=pid,
        user_id=pid,
        game_type=session_in.game_type,
        difficulty=session_in.difficulty,
        score=session_in.score,
        accuracy=session_in.accuracy,
        response_time_seconds=resp_time,
        response_time=resp_time,
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
        {"response_time": s.response_time_seconds or s.response_time or 0.0, "completed": True} 
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

@router.get("/history/{user_id}", response_model=List[GameSessionResponse])
def get_game_history(user_id: int, db: Session = Depends(get_db)):
    # Progress Analytics: SELECT * FROM game_sessions WHERE user_id = :active_user_id ORDER BY completed_at ASC;
    history = db.query(GameSession).filter(
        (GameSession.user_id == user_id) | (GameSession.patient_id == user_id)
    ).order_by(GameSession.completed_at.asc()).all()
    return history

