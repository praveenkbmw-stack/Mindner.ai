from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

# --- CAREGIVER SCHEMAS ---
class CaregiverBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    username: str

class CaregiverCreate(CaregiverBase):
    password: str

class CaregiverResponse(CaregiverBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class CaregiverLogin(BaseModel):
    username: str
    password: str

# --- PATIENT/ELDERLY SCHEMAS ---
class PatientBase(BaseModel):
    name: str

class PatientCreate(PatientBase):
    caregiver_id: int

class PatientResponse(PatientBase):
    id: int
    caregiver_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- MEMORY SCHEMAS ---
class MemoryBase(BaseModel):
    title: str
    description: Optional[str] = None
    category_name: Optional[str] = "Important Events"
    photo_url: Optional[str] = None
    voice_recording_url: Optional[str] = None
    is_custom: Optional[bool] = False
    year: Optional[int] = None

class MemoryCreate(MemoryBase):
    patient_id: Optional[int] = None
    user_id: Optional[int] = None

class MemoryResponse(MemoryBase):
    id: int
    patient_id: Optional[int] = None
    user_id: Optional[int] = None
    image_path: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class MemoryVoiceRecordingCreate(BaseModel):
    memory_id: int
    patient_id: Optional[int] = None
    user_id: Optional[int] = None
    audio_path: str
    duration: Optional[float] = None

class MemoryVoiceRecordingResponse(BaseModel):
    id: int
    memory_id: int
    patient_id: Optional[int] = None
    user_id: Optional[int] = None
    audio_path: str
    duration: Optional[float] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- FAMILY MEMBER & VOICE SCHEMAS ---
class FamilyMemberBase(BaseModel):
    name: str
    relationship: str
    image_url: Optional[str] = None
    voice_recording_url: Optional[str] = None

class FamilyMemberCreate(FamilyMemberBase):
    patient_id: Optional[int] = None
    user_id: Optional[int] = None

class FamilyMemberResponse(FamilyMemberBase):
    id: int
    patient_id: Optional[int] = None
    user_id: Optional[int] = None
    image_path: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class FamilyVoiceRecordingCreate(BaseModel):
    family_member_id: int
    patient_id: Optional[int] = None
    user_id: Optional[int] = None
    audio_path: str
    duration: Optional[float] = None

class FamilyVoiceRecordingResponse(BaseModel):
    id: int
    family_member_id: int
    patient_id: Optional[int] = None
    user_id: Optional[int] = None
    audio_path: str
    duration: Optional[float] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- GAME SESSION SCHEMAS ---
class GameSessionBase(BaseModel):
    game_type: str
    difficulty: str # "Easy", "Medium", "Hard"
    score: int
    accuracy: float
    response_time_seconds: Optional[float] = None
    response_time: Optional[float] = None
    attempts: int

class GameSessionCreate(GameSessionBase):
    patient_id: Optional[int] = None
    user_id: Optional[int] = None

class GameSessionResponse(GameSessionBase):
    id: int
    patient_id: Optional[int] = None
    user_id: Optional[int] = None
    completed_at: datetime.datetime

    class Config:
        from_attributes = True

# --- ROUTINE SCHEMAS ---
class RoutineItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    time_of_day: str # "HH:MM"
    is_completed: bool = False
    is_active: bool = True

class RoutineItemCreate(RoutineItemBase):
    patient_id: int

class RoutineItemResponse(RoutineItemBase):
    id: int
    patient_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- PHOTO RECALL ITEM SCHEMAS ---
class PhotoRecallItemBase(BaseModel):
    person_name: str
    relationship: Optional[str] = None
    description: Optional[str] = None

class PhotoRecallItemCreate(PhotoRecallItemBase):
    user_id: Optional[int] = None
    patient_id: Optional[int] = None
    image_path: str
    image_url: Optional[str] = None

class PhotoRecallItemResponse(PhotoRecallItemBase):
    id: int
    user_id: int
    patient_id: Optional[int] = None
    image_path: str
    image_url: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# --- AUTHENTICATION TOKEN SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class DifficultyAdjustmentResponse(BaseModel):
    next_difficulty_tier: str
    reduce_visual_clues: bool
    trigger_audio_guidance: bool
    simplify_layout: bool

