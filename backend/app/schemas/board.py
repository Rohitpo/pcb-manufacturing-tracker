from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class BoardCreate(BaseModel):
    board_id: str = Field(..., min_length=1, max_length=50)
    board_name: Optional[str] = None
    batch_number: Optional[str] = None
    priority: Optional[str] = "medium"
    estimated_days: Optional[int] = 1
    assigned_to: Optional[int] = None

class BoardResponse(BaseModel):
    id: int
    board_id: str
    board_name: Optional[str] = None
    batch_number: Optional[str] = None
    priority: Optional[str] = None
    status: str
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    estimated_days: Optional[int] = None
    current_step: Optional[str] = None
    latest_comment: Optional[str] = None
    latest_user: Optional[str] = None
    
    class Config:
        from_attributes = True

class BoardDetailResponse(BaseModel):
    id: int
    board_id: str
    board_name: Optional[str] = None
    batch_number: Optional[str] = None
    priority: Optional[str] = None
    status: str
    current_step: Optional[str] = None
    created_at: datetime
    logs: List = []
    first_comment: Optional[str] = None
    last_comment: Optional[str] = None
    
    class Config:
        from_attributes = True