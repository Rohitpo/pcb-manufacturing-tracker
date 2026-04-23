from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from ..database import get_db
from ..models.board import Board, BoardStatus
from ..models.process_step import ProcessStep
from ..models.board_log import BoardLog, LogStatus
from ..models.user import User
from ..utils.auth import get_current_active_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/summary")
async def get_dashboard_summary(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Total boards
    total_boards = db.query(func.count(Board.id)).scalar() or 0
    
    # Boards by status
    created = db.query(func.count(Board.id)).filter(Board.status == BoardStatus.CREATED).scalar() or 0
    assigned = db.query(func.count(Board.id)).filter(Board.status == BoardStatus.ASSIGNED).scalar() or 0
    in_progress = db.query(func.count(Board.id)).filter(Board.status == BoardStatus.IN_PROGRESS).scalar() or 0
    pending_review = db.query(func.count(Board.id)).filter(Board.status == BoardStatus.PENDING_REVIEW).scalar() or 0
    completed = db.query(func.count(Board.id)).filter(Board.status == BoardStatus.COMPLETED).scalar() or 0
    rejected = db.query(func.count(Board.id)).filter(Board.status == BoardStatus.REJECTED).scalar() or 0
    
    boards_by_status = [
        {"status": "created", "count": created},
        {"status": "assigned", "count": assigned},
        {"status": "in_progress", "count": in_progress},
        {"status": "pending_review", "count": pending_review},
        {"status": "completed", "count": completed},
        {"status": "rejected", "count": rejected}
    ]
    
    # Boards in each step
    step_stats = []
    steps = db.query(ProcessStep).filter(ProcessStep.is_active == True).all()
    
    for step in steps:
        count = db.query(func.count(Board.id))\
            .filter(Board.current_step_id == step.id)\
            .scalar() or 0
        
        step_stats.append({
            "step_id": step.id,
            "step_name": step.name,
            "count": count
        })
    
    # Failed boards count
    failed_boards = db.query(func.count(Board.id))\
        .filter(Board.status == BoardStatus.REJECTED)\
        .scalar() or 0
    
    # Completed boards
    completed_boards = completed
    
    # Daily stats for last 7 days
    daily_stats = []
    for i in range(7):
        date = datetime.now().date() - timedelta(days=i)
        boards_created = db.query(func.count(Board.id))\
            .filter(func.date(Board.created_at) == date)\
            .scalar() or 0
        
        boards_completed = db.query(func.count(Board.id))\
            .filter(
                func.date(Board.updated_at) == date,
                Board.status == BoardStatus.COMPLETED
            ).scalar() or 0
        
        daily_stats.append({
            "date": date.isoformat(),
            "created": boards_created,
            "completed": boards_completed
        })
    
    # User performance stats - simplified
    user_stats = []
    users = db.query(User).filter(User.role == 'operator').limit(5).all()
    for user in users:
        user_stats.append({
            "name": user.full_name,
            "actions": 0  # Placeholder
        })
    
    # Recent activity - simplified query
    recent_activity = []
    logs = db.query(BoardLog).order_by(BoardLog.created_at.desc()).limit(10).all()
    for log in logs:
        recent_activity.append({
            "id": log.id,
            "board_id": log.board.board_id if log.board else "Unknown",
            "step": log.step.name if log.step else None,
            "user": log.user.full_name if log.user else None,
            "status": log.status.value if hasattr(log.status, 'value') else str(log.status),
            "comment": (log.comment[:50] + "...") if log.comment and len(log.comment) > 50 else log.comment,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    
    return {
        "total_boards": total_boards,
        "boards_by_status": boards_by_status,
        "step_stats": step_stats,
        "failed_boards": failed_boards,
        "completed_boards": completed_boards,
        "daily_stats": daily_stats,
        "user_performance": user_stats,
        "recent_activity": recent_activity
    }