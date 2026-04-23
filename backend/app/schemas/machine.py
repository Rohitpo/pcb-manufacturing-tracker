from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from ..models.machine import MachineStatus

class MachineBase(BaseModel):
    machine_code: str
    machine_name: str
    machine_type: Optional[str] = None
    location: Optional[str] = None
    status: MachineStatus = MachineStatus.AVAILABLE

class MachineCreate(MachineBase):
    pass

class MachineUpdate(BaseModel):
    machine_name: Optional[str] = None
    machine_type: Optional[str] = None
    location: Optional[str] = None
    status: Optional[MachineStatus] = None
    last_maintenance: Optional[date] = None

class MachineResponse(MachineBase):
    id: int
    last_maintenance: Optional[date] = None
    created_at: datetime
    
    class Config:
        from_attributes = True