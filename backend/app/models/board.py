from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base

class BoardStatus(str, enum.Enum):
    CREATED = "created"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    PENDING_REVIEW = "pending_review"
    COMPLETED = "completed"
    REJECTED = "rejected"
    ON_HOLD = "on_hold"

class BoardPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class Board(Base):
    __tablename__ = "boards"
    
    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(String(50), unique=True, nullable=False)
    board_name = Column(String(100), nullable=True)
    batch_number = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)  # <-- ADD THIS LINE HERE
    priority = Column(Enum(BoardPriority), default=BoardPriority.MEDIUM)
    status = Column(Enum(BoardStatus), default=BoardStatus.CREATED)
    current_step_id = Column(Integer, ForeignKey("process_steps.id"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    estimated_days = Column(Integer, default=1)
    actual_days = Column(Integer, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by], back_populates="boards_created")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="boards_assigned")
    current_step = relationship("ProcessStep", foreign_keys=[current_step_id])
    logs = relationship("BoardLog", back_populates="board", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="board", cascade="all, delete-orphan")
    performance_metrics = relationship("PerformanceMetric", back_populates="board")
    attachments = relationship("BoardAttachment", back_populates="board", cascade="all, delete-orphan")  # <-- ADD THIS LINE HERE