import os
import shutil
import random
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Memory, MemoryVoiceRecording, Patient, Caregiver
from ..schemas import MemoryResponse, MemoryVoiceRecordingResponse
from .auth import get_current_caregiver

router = APIRouter()

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/create", response_model=MemoryResponse)
async def create_memory(
    patient_id: int = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_caregiver: Caregiver = Depends(get_current_caregiver)
):
    # Ensure patient belongs to this caregiver or exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    image_path = None
    if image:
        image_filename = f"memory_{random.randint(1000, 9999)}_{image.filename}"
        image_path = os.path.join(UPLOAD_DIR, image_filename)
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    db_memory = Memory(
        patient_id=patient_id,
        title=title,
        description=description,
        image_path=image_path
    )
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    return db_memory

@router.post("/lock/{memory_id}", response_model=MemoryVoiceRecordingResponse)
async def lock_memory_voice(
    memory_id: int,
    patient_id: int = Form(...),
    duration: Optional[float] = Form(None),
    audio: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory entry not found")

    # Save user recorded voice
    audio_filename = f"voice_lock_{memory_id}_{random.randint(1000, 9999)}_{audio.filename}"
    audio_path = os.path.join(UPLOAD_DIR, audio_filename)
    with open(audio_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    voice_rec = MemoryVoiceRecording(
        memory_id=memory_id,
        patient_id=patient_id,
        audio_path=audio_path,
        duration=duration
    )
    db.add(voice_rec)
    db.commit()
    db.refresh(voice_rec)
    return voice_rec

@router.get("/patient/{patient_id}", response_model=List[MemoryResponse])
def get_patient_memories(patient_id: int, db: Session = Depends(get_db)):
    memories = db.query(Memory).filter(Memory.patient_id == patient_id).order_by(Memory.created_at.desc()).all()
    return memories

@router.get("/playback/{memory_id}")
def get_memory_playback(memory_id: int, db: Session = Depends(get_db)):
    memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    # Fetch recorded voice recordings
    recording = db.query(MemoryVoiceRecording).filter(
        MemoryVoiceRecording.memory_id == memory_id
    ).order_by(MemoryVoiceRecording.created_at.desc()).first()

    return {
        "memory_id": memory.id,
        "title": memory.title,
        "description": memory.description,
        "image_path": memory.image_path,
        "ai_description_reader_text": memory.description, # read by TTS
        "user_recorded_voice_path": recording.audio_path if recording else None
    }

@router.put("/edit/{memory_id}", response_model=MemoryResponse)
def edit_memory(
    memory_id: int,
    title: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_caregiver: Caregiver = Depends(get_current_caregiver)
):
    memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    memory.title = title
    if description is not None:
        memory.description = description
    db.commit()
    db.refresh(memory)
    return memory

@router.delete("/delete/{memory_id}")
def delete_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    current_caregiver: Caregiver = Depends(get_current_caregiver)
):
    memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
        
    db.delete(memory)
    db.commit()
    return {"status": "success", "message": "Memory entry deleted successfully"}
