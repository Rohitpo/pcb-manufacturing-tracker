from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, List
import os
import hashlib
from jose import jwt

# Database
DATABASE_URL = "sqlite:///./pcb_simple.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Simple Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    full_name = Column(String)
    role = Column(String, default="operator")
    password = Column(String)
    is_active = Column(String, default="true")

class Board(Base):
    __tablename__ = "boards"
    id = Column(Integer, primary_key=True)
    board_id = Column(String, unique=True)
    board_name = Column(String, nullable=True)
    status = Column(String, default="created")
    priority = Column(String, default="medium")
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    assignee = relationship("User", foreign_keys=[assigned_to])

class ProcessStep(Base):
    __tablename__ = "process_steps"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    display_order = Column(Integer)

class BoardLog(Base):
    __tablename__ = "board_logs"
    id = Column(Integer, primary_key=True)
    board_id = Column(Integer, ForeignKey("boards.id"))
    step_id = Column(Integer, ForeignKey("process_steps.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# Add default data
db = SessionLocal()
if db.query(User).count() == 0:
    db.add_all([
        User(username="admin", full_name="Admin", role="admin", password="admin123"),
        User(username="manager1", full_name="Manager", role="manager", password="manager123"),
        User(username="operator1", full_name="Operator", role="operator", password="operator123"),
    ])
    db.commit()

if db.query(ProcessStep).count() == 0:
    db.add_all([
        ProcessStep(name="Soldering", display_order=1),
        ProcessStep(name="Optical Inspection", display_order=2),
        ProcessStep(name="X-Ray Inspection", display_order=3),
        ProcessStep(name="Testing", display_order=4),
        ProcessStep(name="Repair", display_order=5),
    ])
    db.commit()
db.close()

# FastAPI App
app = FastAPI(title="PCB Tracker API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Schemas
class LoginData(BaseModel):
    username: str
    password: str

class BoardCreate(BaseModel):
    board_id: str
    board_name: Optional[str] = None
    priority: str = "medium"
    assigned_to: Optional[int] = None

# Routes
@app.post("/api/auth/login")
async def login(data: LoginData):
    db = SessionLocal()
    user = db.query(User).filter(User.username == data.username, User.password == data.password).first()
    db.close()
    if user:
        token = jwt.encode({"sub": user.username, "exp": datetime.utcnow() + timedelta(hours=24)}, "secret", algorithm="HS256")
        return {"access_token": token, "user": {"id": user.id, "username": user.username, "full_name": user.full_name, "role": user.role}}
    raise HTTPException(401, "Invalid credentials")

@app.get("/api/boards/all")
async def get_boards():
    db = SessionLocal()
    boards = db.query(Board).all()
    result = []
    for b in boards:
        result.append({
            "id": b.id, "board_id": b.board_id, "board_name": b.board_name,
            "status": b.status, "priority": b.priority,
            "assignee": {"full_name": b.assignee.full_name} if b.assignee else None,
            "created_at": b.created_at.isoformat()
        })
    db.close()
    return result

@app.post("/api/boards/create")
async def create_board(board: BoardCreate):
    db = SessionLocal()
    new_board = Board(**board.dict())
    db.add(new_board)
    db.commit()
    db.refresh(new_board)
    db.close()
    return {"id": new_board.id, "message": "Board created"}

@app.get("/api/steps/")
async def get_steps():
    db = SessionLocal()
    steps = db.query(ProcessStep).all()
    db.close()
    return [{"id": s.id, "name": s.name} for s in steps]

@app.get("/api/dashboard/summary")
async def dashboard():
    db = SessionLocal()
    total = db.query(Board).count()
    completed = db.query(Board).filter(Board.status == "completed").count()
    db.close()
    return {"total_boards": total, "completed_boards": completed, "boards_by_status": [], "step_stats": [], "recent_activity": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)