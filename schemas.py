from pydantic import BaseModel
from typing import List, Optional

# NEW: Base schema for a creation
class CreationBase(BaseModel):
    prompt: str
    image_filename: str

class CreationCreate(CreationBase):
    pass

class Creation(CreationBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True

# --- User Schemas ---
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

# Update the User schema to include the list of creations
class User(UserBase):
    id: int
    creations: List[Creation] = []

    class Config:
        orm_mode = True
