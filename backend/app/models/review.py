from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base

class ReviewStatus(str, enum.Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_REWORK = "needs_rework"

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"))
    log_id = Column(Integer, ForeignKey("board_logs.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(ReviewStatus), default=ReviewStatus.APPROVED)
    comment = Column(Text)
    action_required = Column(Text)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    board = relationship("Board", back_populates="reviews")
    log = relationship("BoardLog", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews")
    assignee = relationship("User", foreign_keys=[assigned_to])