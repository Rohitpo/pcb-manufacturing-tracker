from sqlalchemy import Column, Integer, DECIMAL, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    board_id = Column(Integer, ForeignKey("boards.id"))
    boards_completed = Column(Integer, default=0)
    boards_failed = Column(Integer, default=0)
    avg_time_minutes = Column(Integer)
    success_rate = Column(DECIMAL(5, 2))
    week_start = Column(Date)
    week_end = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="performance_metrics")
    board = relationship("Board", back_populates="performance_metrics")
    