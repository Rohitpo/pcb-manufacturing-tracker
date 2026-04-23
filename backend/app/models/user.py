from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base

class UserRole(str, enum.Enum):
    OPERATOR = "operator"
    SUPERVISOR = "supervisor"
    MANAGER = "manager"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.OPERATOR)
    department = Column(String(50), nullable=True)
    employee_id = Column(String(20), unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    hashed_password = Column(String(255), nullable=False)
    
    # Relationships
    boards_created = relationship("Board", foreign_keys="Board.created_by", back_populates="creator")
    boards_assigned = relationship("Board", foreign_keys="Board.assigned_to", back_populates="assignee")
    board_logs = relationship("BoardLog", foreign_keys="BoardLog.user_id", back_populates="user")
    assigned_logs = relationship("BoardLog", foreign_keys="BoardLog.assigned_to")
    images_uploaded = relationship("BoardImage", back_populates="uploader")
    reviews = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    performance_metrics = relationship("PerformanceMetric", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")  # <-- ADD THIS