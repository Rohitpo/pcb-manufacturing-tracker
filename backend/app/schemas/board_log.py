# backend/app/schemas/board_log.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ..models.board_log import LogStatus
from .user import UserResponse
from .process_step import ProcessStepResponse

class BoardLogBase(BaseModel):
    step_id: int
    status: LogStatus = LogStatus.IN_PROGRESS
    comment: Optional[str] = None
    defect_description: Optional[str] = None
    repair_action: Optional[str] = None

class BoardLogCreate(BoardLogBase):
    board_id: int
    user_id: int

class BoardLogUpdate(BaseModel):
    status: Optional[LogStatus] = None
    comment: Optional[str] = None
    defect_description: Optional[str] = None
    repair_action: Optional[str] = None

class BoardLogResponse(BoardLogBase):
    id: int
    board_id: int
    user_id: int
    image_path: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]
    user: Optional[UserResponse]
    step: Optional[ProcessStepResponse]
    
    class Config:
        from_attributes = True
