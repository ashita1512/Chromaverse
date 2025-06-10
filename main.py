import os
import requests
import uuid 
import io
import time
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles

from sqlalchemy.orm import Session
import auth, models, schemas
from database import SessionLocal, engine

# Create directories to store generated files
os.makedirs("generated_images", exist_ok=True)
os.makedirs("generated_music", exist_ok=True)

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Mount static directories to serve files
app.mount("/images", StaticFiles(directory="generated_images"), name="images")
app.mount("/music", StaticFiles(directory="generated_music"), name="music")

# --- CORS, Dependencies, and User Getters ---
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None: raise credentials_exception
    except auth.JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None: raise credentials_exception
    return user

# --- AUTHENTICATION ENDPOINTS ---
@app.post("/signup/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user: raise HTTPException(status_code=400, detail="Username already registered")
    db_user_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user_email: raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if user: print(f"--- PASSWORD RESET REQUEST for user: {user.username} ---")
    else: print(f"--- PASSWORD RESET REQUEST for email: {request.email} (user not found) ---")
    return {"message": "If an account with that email exists, a password reset link has been sent."}

# --- GENERATION ENDPOINTS ---

class Prompt(BaseModel):
    text: str
    style: Optional[str] = "photographic"

@app.post("/generate-image/", response_model=schemas.Creation)
async def generate_image(prompt: Prompt, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    load_dotenv()
    HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
    API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    payload = {"inputs": f"{prompt.text}, {prompt.style} style"}
    response = requests.post(API_URL, headers=headers, json=payload)
    if response.status_code != 200: raise HTTPException(status_code=500, detail=f"Error from AI service: {response.text}")
    
    image_bytes = response.content
    filename = f"{uuid.uuid4()}.jpeg"
    filepath = os.path.join("generated_images", filename)
    with open(filepath, "wb") as f: f.write(image_bytes)
        
    db_creation = models.Creation(prompt=prompt.text, filename=filename, type='image', owner_id=current_user.id)
    db.add(db_creation)
    db.commit()
    db.refresh(db_creation)
    return db_creation

@app.post("/generate-music/", response_model=schemas.Creation)
async def generate_music(prompt: Prompt, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    load_dotenv()
    REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")
    if not REPLICATE_API_TOKEN:
        raise HTTPException(status_code=500, detail="Replicate API key not configured.")

    # Step 1: Start the music generation process on Replicate
    start_response = requests.post(
        "https://api.replicate.com/v1/predictions",
        headers={"Authorization": f"Token {REPLICATE_API_TOKEN}", "Content-Type": "application/json"},
        json={
            "version": "8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05",
            "input": {"prompt_a": prompt.text},
        },
    )
    start_data = start_response.json()
    prediction_id = start_data.get("id")
    if not prediction_id:
        raise HTTPException(status_code=500, detail=f"Failed to start music generation: {start_data.get('detail')}")

    # Step 2: Poll for the result until it's ready
    status_url = f"https://api.replicate.com/v1/predictions/{prediction_id}"
    music_output_url = None
    for _ in range(60): # Poll for up to 60 seconds
        time.sleep(1)
        status_response = requests.get(status_url, headers={"Authorization": f"Token {REPLICATE_API_TOKEN}"})
        status_data = status_response.json()
        if status_data.get("status") == "succeeded":
            music_output_url = status_data["output"]
            break
        elif status_data.get("status") == "failed":
            raise HTTPException(status_code=500, detail=f"Music generation failed: {status_data.get('error')}")

    if not music_output_url:
        raise HTTPException(status_code=500, detail="Music generation timed out.")

    # Step 3: Download the generated audio file
    music_response = requests.get(music_output_url)
    if music_response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to download generated music file.")

    music_bytes = music_response.content
    filename = f"{uuid.uuid4()}.wav"
    filepath = os.path.join("generated_music", filename)
    with open(filepath, "wb") as f: f.write(music_bytes)

    db_creation = models.Creation(prompt=prompt.text, filename=filename, type='music', owner_id=current_user.id)
    db.add(db_creation)
    db.commit()
    db.refresh(db_creation)
    return db_creation


# --- HISTORY ENDPOINT ---
@app.get("/history/", response_model=List[schemas.Creation])
def get_user_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Creation).filter(models.Creation.owner_id == current_user.id).order_by(models.Creation.id.desc()).all()
