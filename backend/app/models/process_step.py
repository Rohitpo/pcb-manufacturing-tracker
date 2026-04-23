from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class ProcessStep(Base):
    __tablename__ = "process_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    department = Column(String(50))
    display_order = Column(Integer, nullable=False)
    estimated_hours = Column(Integer, default=4)
    requires_review = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    logs = relationship("BoardLog", back_populates="step")
    boards = relationship("Board", foreign_keys="Board.current_step_id", back_populates="current_step")