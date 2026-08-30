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
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    image_path = Column(String, nullable=True) # Path to uploaded photograph
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="memories")
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
    name = Column(String, nullable=False)
    relationship = Column(String, nullable=False) # e.g. "Son", "Daughter"
    image_path = Column(String, nullable=True) # Path to family member's photo
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="family_members")
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
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    game_type = Column(String, nullable=False) # "memory_match", "photo_recall", "routine_ordering"
    difficulty = Column(String, nullable=False) # "Easy", "Medium", "Hard" or specific numeric tiers
    score = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=False) # percentage accuracy
    response_time = Column(Float, nullable=False) # response time in seconds
    attempts = Column(Integer, nullable=False)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="game_sessions")

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
