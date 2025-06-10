from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    creations = relationship("Creation", back_populates="owner")

class Creation(Base):
    __tablename__ = "creations"
    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(String, index=True)
    
    # NEW: Differentiate between creation types
    type = Column(String, default='image') # 'image' or 'music'
    
    # Filename can be for an image or a music file
    filename = Column(String, index=True) 
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="creations")
