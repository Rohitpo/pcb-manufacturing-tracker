from sqlalchemy import Column, Integer, String, DateTime, Enum, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base

class MachineStatus(str, enum.Enum):
    AVAILABLE = "available"
    IN_USE = "in_use"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"

class Machine(Base):
    __tablename__ = "machines"
    
    id = Column(Integer, primary_key=True, index=True)
    machine_code = Column(String(50), unique=True, nullable=False)
    machine_name = Column(String(100), nullable=False)
    machine_type = Column(String(50))
    location = Column(String(100))
    status = Column(Enum(MachineStatus), default=MachineStatus.AVAILABLE)
    last_maintenance = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    board_logs = relationship("BoardLog", back_populates="machine")