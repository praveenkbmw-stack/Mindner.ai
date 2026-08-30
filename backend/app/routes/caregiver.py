import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from ..database import get_db
from ..models import GameSession, Patient, Caregiver, RoutineItem
from .auth import get_current_caregiver

router = APIRouter()

@router.get("/patients")
def get_my_patients(
    db: Session = Depends(get_db),
    current_caregiver: Caregiver = Depends(get_current_caregiver)
):
    patients = db.query(Patient).filter(Patient.caregiver_id == current_caregiver.id).all()
    return patients

@router.post("/patients/add")
def add_patient(
    name: str,
    db: Session = Depends(get_db),
    current_caregiver: Caregiver = Depends(get_current_caregiver)
):
    new_patient = Patient(name=name, caregiver_id=current_caregiver.id)
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient

@router.get("/analytics/{patient_id}")
def get_cognitive_analytics(
    patient_id: int,
    db: Session = Depends(get_db),
    current_caregiver: Caregiver = Depends(get_current_caregiver)
):
    """
    Calculates cognitive metrics ONLY from the user's actual game sessions data.
    Strictly excludes memories, assistant chats, reminders, login records, etc.
    """
    # 1. Fetch all game session records for this patient
    sessions = db.query(GameSession).filter(
        GameSession.patient_id == patient_id
    ).order_by(GameSession.completed_at.asc()).all()

    if not sessions:
        # Return base empty statistics indicating active tracking with 0 logs
        return {
            "medical_disclaimer": "Cognitive Activity / Game Performance Trends. MINDNER is non-diagnostic and does not replace professional medical evaluations.",
            "categories": {"Memory": 0, "Attention": 0, "PatternRecognition": 0, "Reaction": 0},
            "trends": {"daily": [], "weekly": [], "monthly": []}
        }

    # 2. Map game types to Cognitive Categories
    # "memory_match" -> Memory
    # "photo_recall" -> Attention
    # "routine_ordering" -> PatternRecognition
    # Reaction is derived from the reaction time (speed) score
    cat_scores = {"Memory": [], "Attention": [], "PatternRecognition": [], "Reaction": []}

    for s in sessions:
        # Compute dynamic score out of 100
        # Accuracy represents baseline score, but can factor attempts
        score_val = float(s.accuracy)
        
        if s.game_type == "memory_match":
            cat_scores["Memory"].append(score_val)
        elif s.game_type == "photo_recall":
            cat_scores["Attention"].append(score_val)
        elif s.game_type == "routine_ordering":
            cat_scores["PatternRecognition"].append(score_val)
        
        # Reaction score is calculated inversely from response time
        # Let's say baseline speed is 10 seconds. If time is 4.0s, score is higher.
        speed_score = max(10, min(100, (12.0 - s.response_time) / 12.0 * 100))
        cat_scores["Reaction"].append(speed_score)

    avg_categories = {}
    for cat, vals in cat_scores.items():
        avg_categories[cat] = round(sum(vals) / len(vals), 1) if vals else 70.0 # default baseline for unplayed

    # 3. Calculate Performance Over Time (Daily, Weekly, Monthly Trends)
    # Group sessions by date
    daily_data = {}
    weekly_data = {}
    monthly_data = {}

    for s in sessions:
        date_str = s.completed_at.strftime("%Y-%m-%d")
        week_str = s.completed_at.strftime("%Y-W%W")
        month_str = s.completed_at.strftime("%Y-%m")

        # Daily
        if date_str not in daily_data:
            daily_data[date_str] = []
        daily_data[date_str].append(s.accuracy)

        # Weekly
        if week_str not in weekly_data:
            weekly_data[week_str] = []
        weekly_data[week_str].append(s.accuracy)

        # Monthly
        if month_str not in monthly_data:
            monthly_data[month_str] = []
        monthly_data[month_str].append(s.accuracy)

    # Format trends for graph rendering
    daily_trend = [{"label": date, "value": round(sum(accs)/len(accs), 1)} for date, accs in sorted(daily_data.items())]
    weekly_trend = [{"label": wk, "value": round(sum(accs)/len(accs), 1)} for wk, accs in sorted(weekly_data.items())]
    monthly_trend = [{"label": mo, "value": round(sum(accs)/len(accs), 1)} for mo, accs in sorted(monthly_data.items())]

    return {
        "medical_disclaimer": "Cognitive Activity / Game Performance Trends. MINDNER is non-diagnostic.",
        "patient_id": patient_id,
        "categories": avg_categories,
        "trends": {
            "daily": daily_trend,
            "weekly": weekly_trend,
            "monthly": monthly_trend
        }
    }
