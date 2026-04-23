# backend/app/schemas/process_step.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ProcessStepBase(BaseModel):
    name: str
    display_order: int

class ProcessStepCreate(ProcessStepBase):
    pass

class ProcessStepUpdate(BaseModel):
    name: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class ProcessStepResponse(ProcessStepBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
