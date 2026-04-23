from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.review import Review, ReviewStatus
from ..models.board import Board, BoardStatus
from ..models.board_log import BoardLog, LogStatus
from ..models.user import User, UserRole
from ..schemas.review import ReviewCreate, ReviewResponse
from ..utils.auth import get_current_active_user

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

@router.post("/", response_model=ReviewResponse)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Manager reviews a board step"""
    if current_user.role not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only managers can review")
    
    # Create review
    review = Review(
        **review_data.dict(),
        reviewer_id=current_user.id
    )
    db.add(review)
    
    # Update board log status
    log = db.query(BoardLog).filter(BoardLog.id == review_data.log_id).first()
    if log:
        if review_data.status == ReviewStatus.APPROVED:
            log.status = LogStatus.REVIEWED
        elif review_data.status == ReviewStatus.NEEDS_REWORK:
            log.status = LogStatus.REWORK
    
    # Update board assignment if specified
    if review_data.assigned_to:
        board = db.query(Board).filter(Board.id == review_data.board_id).first()
        if board:
            board.assigned_to = review_data.assigned_to
            board.status = BoardStatus.ASSIGNED
    
    db.commit()
    db.refresh(review)
    return review

@router.get("/pending", response_model=List[ReviewResponse])
async def get_pending_reviews(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all pending reviews for manager"""
    if current_user.role not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get logs pending review
    pending_logs = db.query(BoardLog).filter(
        BoardLog.status == LogStatus.PENDING_REVIEW
    ).all()
    
    return pending_logs
