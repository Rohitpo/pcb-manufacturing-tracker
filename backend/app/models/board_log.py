from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base

class LogStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    DONE = "done"
    FAILED = "failed"
    PENDING_REVIEW = "pending_review"
    REVIEWED = "reviewed"
    REWORK = "rework"

class BoardLog(Base):
    __tablename__ = "board_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"))
    step_id = Column(Integer, ForeignKey("process_steps.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(LogStatus), default=LogStatus.IN_PROGRESS)
    comment = Column(Text, nullable=True)
    defect_description = Column(Text, nullable=True)
    repair_action = Column(Text, nullable=True)
    time_spent_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    board = relationship("Board", back_populates="logs")
    step = relationship("ProcessStep", back_populates="logs")
    user = relationship("User", foreign_keys=[user_id], back_populates="board_logs")
    assigned_user = relationship("User", foreign_keys=[assigned_to])
    machine = relationship("Machine", back_populates="board_logs")
    images = relationship("BoardImage", back_populates="log", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="log")