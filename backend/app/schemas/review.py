from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ..models.review import ReviewStatus

class ReviewBase(BaseModel):
    board_id: int
    log_id: int
    status: ReviewStatus = ReviewStatus.APPROVED
    comment: Optional[str] = None
    action_required: Optional[str] = None
    assigned_to: Optional[int] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    id: int
    reviewer_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True