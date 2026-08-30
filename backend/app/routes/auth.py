from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional

from ..database import get_db
from ..models import Caregiver, Patient
from ..schemas import CaregiverCreate, CaregiverResponse, Token

router = APIRouter()

# Password hashing configuration (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "MINDNER_SECURE_JWT_SECRET_KEY_FOR_CAREGIVER_AUTH"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=CaregiverResponse, status_code=status.HTTP_201_CREATED)
def register_caregiver(caregiver_in: CaregiverCreate, db: Session = Depends(get_db)):
    # Check if email/username already registered
    existing_email = db.query(Caregiver).filter(Caregiver.email == caregiver_in.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email is already in use")
        
    existing_username = db.query(Caregiver).filter(Caregiver.username == caregiver_in.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username is already taken")
        
    hashed_pw = get_password_hash(caregiver_in.password)
    new_caregiver = Caregiver(
        full_name=caregiver_in.full_name,
        email=caregiver_in.email,
        phone=caregiver_in.phone,
        username=caregiver_in.username,
        password_hash=hashed_pw
    )
    db.add(new_caregiver)
    db.commit()
    db.refresh(new_caregiver)
    return new_caregiver

@router.post("/login", response_model=Token)
def login_caregiver(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Authenticate by username OR email
    caregiver = db.query(Caregiver).filter(
        (Caregiver.username == form_data.username) | (Caregiver.email == form_data.username)
    ).first()
    
    if not caregiver or not verify_password(form_data.password, caregiver.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": caregiver.username, "id": caregiver.id, "role": "caregiver"},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_caregiver(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate caregiver credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    caregiver = db.query(Caregiver).filter(Caregiver.username == username).first()
    if caregiver is None:
        raise credentials_exception
    return caregiver
