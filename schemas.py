from pydantic import BaseModel, EmailStr
from typing import List, Optional

# --- Creation Schemas ---
class CreationBase(BaseModel):
    prompt: str
    filename: str
    type: str # NEW: Add type field

class CreationCreate(CreationBase):
    pass

class Creation(CreationBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    creations: List[Creation] = []

    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
