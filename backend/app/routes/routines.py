from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import RoutineItem, User
from ..schemas import RoutineItemCreate, RoutineItemResponse
from .auth import get_current_user

router = APIRouter()

@router.post("/create", response_model=RoutineItemResponse)
def create_routine(
    routine_in: RoutineItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "CAREGIVER":
        raise HTTPException(status_code=403, detail="Only caregivers can configure routine items")
    
    db_elderly = db.query(User).filter(User.id == routine_in.elderly_id, User.role == "ELDERLY_USER").first()
    if not db_elderly:
        raise HTTPException(status_code=404, detail="Elderly user not found")

    new_routine = RoutineItem(
        elderly_id=routine_in.elderly_id,
        title=routine_in.title,
        description=routine_in.description,
        time_of_day=routine_in.time_of_day,
        is_completed=routine_in.is_completed,
        is_active=routine_in.is_active
    )
    db.add(new_routine)
    db.commit()
    db.refresh(new_routine)
    return new_routine

@router.get("/my-routines", response_model=List[RoutineItemResponse])
def get_my_routines(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # If caregiver logs in, get all active routines for any elderly user they manage.
    # If elderly logs in, get routines for themselves.
    if current_user.role == "ELDERLY_USER":
        routines = db.query(RoutineItem).filter(
            RoutineItem.elderly_id == current_user.id,
            RoutineItem.is_active == True
        ).order_by(RoutineItem.time_of_day.asc()).all()
    else:
        routines = db.query(RoutineItem).filter(RoutineItem.is_active == True).order_by(RoutineItem.time_of_day.asc()).all()
    return routines

@router.put("/complete/{routine_id}", response_model=RoutineItemResponse)
def complete_routine(routine_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    routine = db.query(RoutineItem).filter(RoutineItem.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
        
    routine.is_completed = True
    db.commit()
    db.refresh(routine)
    return routine
