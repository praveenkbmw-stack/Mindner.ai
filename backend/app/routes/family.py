import os
import shutil
import random
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import FamilyMember, FamilyVoiceRecording, Patient, Caregiver
from ..schemas import FamilyMemberResponse, FamilyVoiceRecordingResponse
from .auth import get_current_caregiver

router = APIRouter()

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/add")
async def add_family_voice(
    patient_id: int = Form(...),
    name: str = Form(...),
    relationship: str = Form(...),
    image: Optional[UploadFile] = File(None),
    audio: UploadFile = File(...),
    duration: Optional[float] = Form(None),
    db: Session = Depends(get_db),
    current_caregiver: Caregiver = Depends(get_current_caregiver)
):
    # Ensure patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Save family member photo
    image_path = None
    if image:
        image_filename = f"family_photo_{random.randint(1000, 9999)}_{image.filename}"
        image_path = os.path.join(UPLOAD_DIR, image_filename)
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    # Add FamilyMember record
    family_member = FamilyMember(
        patient_id=patient_id,
        name=name,
        relationship=relationship,
        image_path=image_path
    )
    db.add(family_member)
    db.commit()
    db.refresh(family_member)

    # Save family recorded voice message file
    audio_filename = f"family_voice_{family_member.id}_{random.randint(1000, 9999)}_{audio.filename}"
    audio_path = os.path.join(UPLOAD_DIR, audio_filename)
    with open(audio_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    # Add FamilyVoiceRecording record
    voice_recording = FamilyVoiceRecording(
        family_member_id=family_member.id,
        patient_id=patient_id,
        audio_path=audio_path,
        duration=duration
    )
    db.add(voice_recording)
    db.commit()
    db.refresh(voice_recording)

    return {
        "family_member_id": family_member.id,
        "name": family_member.name,
        "relationship": family_member.relationship,
        "image_path": family_member.image_path,
        "voice_recording_id": voice_recording.id,
        "audio_path": voice_recording.audio_path,
        "duration": voice_recording.duration,
        "created_at": family_member.created_at
    }

@router.get("/patient/{patient_id}")
def get_family_voices(patient_id: int, db: Session = Depends(get_db)):
    members = db.query(FamilyMember).filter(FamilyMember.patient_id == patient_id).all()
    results = []
    
    for m in members:
        # Fetch matching voice recording
        recording = db.query(FamilyVoiceRecording).filter(
            FamilyVoiceRecording.family_member_id == m.id
        ).order_by(FamilyVoiceRecording.created_at.desc()).first()
        
        results.append({
            "id": m.id,
            "patient_id": m.patient_id,
            "name": m.name,
            "relationship": m.relationship,
            "image_path": m.image_path,
            "audio_path": recording.audio_path if recording else None,
            "duration": recording.duration if recording else None
        })
        
    return results

@router.delete("/delete/{member_id}")
def delete_family_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_caregiver: Caregiver = Depends(get_current_caregiver)
):
    member = db.query(FamilyMember).filter(FamilyMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")
        
    db.delete(member)
    db.commit()
    return {"status": "success", "message": "Family member and associated voice recording removed"}
