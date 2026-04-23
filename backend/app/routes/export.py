from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import csv
import io
from datetime import datetime
from ..database import get_db
from ..models.board import Board
from ..models.board_log import BoardLog
from ..models.user import User
from ..utils.auth import get_current_active_user

router = APIRouter(prefix="/api/export", tags=["export"])

@router.get("/boards/csv")
async def export_boards_csv(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export all boards to CSV"""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Board ID", "Board Name", "Batch", "Priority", "Status",
        "Current Step", "Assigned To", "Created By", "Created At",
        "Estimated Days", "Actual Days", "Completed At"
    ])
    
    # Write data
    boards = db.query(Board).all()
    for board in boards:
        writer.writerow([
            board.board_id,
            board.board_name or "",
            board.batch_number or "",
            board.priority.value if board.priority else "",
            board.status.value if board.status else "",
            board.current_step.name if board.current_step else "",
            board.assignee.full_name if board.assignee else "",
            board.creator.full_name if board.creator else "",
            board.created_at.isoformat() if board.created_at else "",
            board.estimated_days or "",
            board.actual_days or "",
            board.completed_at.isoformat() if board.completed_at else ""
        ])
    
    output.seek(0)
    filename = f"boards_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/performance/csv")
async def export_performance_csv(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export user performance to CSV"""
    from ..models.performance_metric import PerformanceMetric
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Employee", "Department", "Week Start", "Week End",
        "Boards Completed", "Boards Failed", "Success Rate", "Avg Time (min)"
    ])
    
    metrics = db.query(PerformanceMetric).join(User).all()
    for m in metrics:
        writer.writerow([
            m.user.full_name,
            m.user.department or "",
            m.week_start.isoformat() if m.week_start else "",
            m.week_end.isoformat() if m.week_end else "",
            m.boards_completed,
            m.boards_failed,
            float(m.success_rate) if m.success_rate else 0,
            m.avg_time_minutes or ""
        ])
    
    output.seek(0)
    filename = f"performance_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
