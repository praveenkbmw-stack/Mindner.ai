import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from .database import Base

class Caregiver(Base):
    __tablename__ = "caregivers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patients = relationship("Patient", back_populates="caregiver", cascade="all, delete-orphan")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    caregiver_id = Column(Integer, ForeignKey("caregivers.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    caregiver = relationship("Caregiver", back_populates="patients")
    memories = relationship("Memory", back_populates="patient", cascade="all, delete-orphan")
    memory_recordings = relationship("MemoryVoiceRecording", back_populates="patient", cascade="all, delete-orphan")
    family_members = relationship("FamilyMember", back_populates="patient", cascade="all, delete-orphan")
    family_recordings = relationship("FamilyVoiceRecording", back_populates="patient", cascade="all, delete-orphan")
    game_sessions = relationship("GameSession", back_populates="patient", cascade="all, delete-orphan")
    routines = relationship("RoutineItem", back_populates="patient", cascade="all, delete-orphan")

class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=True) # Alias / direct user FK
    category_name = Column(String, nullable=False, default="Important Events")
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    photo_url = Column(String, nullable=True) # Photo url
    image_path = Column(String, nullable=True) # Path to uploaded photograph
    voice_recording_url = Column(String, nullable=True) # Direct voice recording url
    is_custom = Column(Boolean, default=False)
    year = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="memories", foreign_keys=[patient_id])
    voice_recordings = relationship("MemoryVoiceRecording", back_populates="memory", cascade="all, delete-orphan")

class MemoryVoiceRecording(Base):
    __tablename__ = "memory_voice_recordings"

    id = Column(Integer, primary_key=True, index=True)
    memory_id = Column(Integer, ForeignKey("memories.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    audio_path = Column(String, nullable=False) # Path to user's recorded memory audio
    duration = Column(Float, nullable=True) # duration in seconds
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    memory = relationship("Memory", back_populates="voice_recordings")
    patient = relationship("Patient", back_populates="memory_recordings")

class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=True)
    name = Column(String, nullable=False)
    relationship = Column(String, nullable=False) # e.g. "Son", "Daughter"
    image_url = Column(String, nullable=True) # Family member image url
    image_path = Column(String, nullable=True) # Path to family member's photo
    voice_recording_url = Column(String, nullable=True) # Family voice recording url
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="family_members", foreign_keys=[patient_id])
    voice_recordings = relationship("FamilyVoiceRecording", back_populates="family_member", cascade="all, delete-orphan")

class FamilyVoiceRecording(Base):
    __tablename__ = "family_voice_recordings"

    id = Column(Integer, primary_key=True, index=True)
    family_member_id = Column(Integer, ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    audio_path = Column(String, nullable=False) # Stored family voice message recording
    duration = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    family_member = relationship("FamilyMember", back_populates="voice_recordings")
    patient = relationship("Patient", back_populates="family_recordings")

class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=True)
    game_type = Column(String, nullable=False) # "routine_sequencing", "memory_match", "photo_recall"
    difficulty = Column(String, nullable=False) # "Easy", "Medium", "Hard"
    score = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=False) # percentage accuracy e.g., 85.5
    response_time_seconds = Column(Float, nullable=True) # response time in seconds
    response_time = Column(Float, nullable=True) # backward compat
    attempts = Column(Integer, nullable=False)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="game_sessions", foreign_keys=[patient_id])

class RoutineItem(Base):
    __tablename__ = "routine_items"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    time_of_day = Column(String, nullable=False) # "HH:MM" e.g., "08:30"
    is_completed = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="routines")

class PhotoRecallItem(Base):
    __tablename__ = "photo_recall_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=True)
    person_name = Column(String, nullable=False)
    relationship = Column(String, nullable=True)
    description = Column(String, nullable=True)
    image_path = Column(String, nullable=False) # Path to uploaded photo
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

