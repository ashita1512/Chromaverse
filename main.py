import os
import requests
import uuid 
import io
import base64
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles

# New imports from our created files
from sqlalchemy.orm import Session
import auth, models, schemas
from database import SessionLocal, engine

# Create a directory to store generated images if it doesn't exist
os.makedirs("generated_images", exist_ok=True)

# Create the database tables
models.Base.metadata.create_all(bind=engine)

# --- FastAPI App Initialization ---
app = FastAPI()

# Mount the static directory to serve images
app.mount("/images", StaticFiles(directory="generated_images"), name="images")

# --- CORS Middleware ---
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependencies ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    # --- TEMPORARY DEBUGGING ---
    # This will print the token the server receives from the browser.
    print(f"--- DEBUG: Token received by backend: {token} ---")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except auth.JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


# --- USER AUTHENTICATION ENDPOINTS ---
@app.post("/signup/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


# --- Pydantic Model ---
class ImagePrompt(BaseModel):
    text: str
    style: str = "photographic" 

# --- UPDATED IMAGE GENERATION ENDPOINT ---
@app.post("/generate-image/", response_model=schemas.Creation)
async def generate_image(prompt: ImagePrompt, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    load_dotenv()
    HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

    if not HF_API_KEY:
        raise HTTPException(status_code=500, detail="Hugging Face API key not configured. Please check your .env file.")

    API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    payload = {"inputs": f"{prompt.text}, {prompt.style} style"}
    
    response = requests.post(API_URL, headers=headers, json=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Error from AI service: {response.text}")

    image_bytes = response.content
    filename = f"{uuid.uuid4()}.jpeg"
    filepath = os.path.join("generated_images", filename)
    
    with open(filepath, "wb") as f:
        f.write(image_bytes)

    db_creation = models.Creation(
        prompt=prompt.text,
        image_filename=filename,
        owner_id=current_user.id
    )
    db.add(db_creation)
    db.commit()
    db.refresh(db_creation)
    
    return db_creation

# --- NEW HISTORY ENDPOINT ---
@app.get("/history/", response_model=List[schemas.Creation])
def get_user_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Creation).filter(models.Creation.owner_id == current_user.id).order_by(models.Creation.id.desc()).all()
