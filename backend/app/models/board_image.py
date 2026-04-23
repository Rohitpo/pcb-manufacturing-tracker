from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base

class ImageType(str, enum.Enum):
    BEFORE = "before"
    AFTER = "after"
    DEFECT = "defect"
    GENERAL = "general"

class BoardImage(Base):
    __tablename__ = "board_images"
    
    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("board_logs.id", ondelete="CASCADE"))
    image_path = Column(String(500), nullable=False)
    image_type = Column(Enum(ImageType), default=ImageType.GENERAL)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    log = relationship("BoardLog", back_populates="images")
    uploader = relationship("User", back_populates="images_uploaded")