from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import func  # Add this with other imports
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.board import Board, BoardStatus, BoardPriority
from ..models.user import User
from ..models.board_log import BoardLog, LogStatus
from ..models.board_image import BoardImage
from ..schemas.board import BoardCreate, BoardResponse, BoardDetailResponse
from ..services.workflow_service import WorkflowService
from ..utils.auth import get_current_active_user
from ..utils.file_upload import upload_handler

router = APIRouter(prefix="/api/boards", tags=["boards"])


@router.post("/create")
async def create_board(
    board_data: BoardCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new PCB board"""
    # Check if board ID already exists
    existing = db.query(Board).filter(Board.board_id == board_data.board_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Board ID already exists")
    
    # Convert priority string to enum
    priority_map = {
        'low': BoardPriority.LOW,
        'medium': BoardPriority.MEDIUM,
        'high': BoardPriority.HIGH,
        'urgent': BoardPriority.URGENT
    }
    priority = priority_map.get(board_data.priority, BoardPriority.MEDIUM)
    
    # Create board
    board = Board(
        board_id=board_data.board_id,
        board_name=board_data.board_name,
        batch_number=board_data.batch_number,
        priority=priority,
        created_by=current_user.id,
        assigned_to=board_data.assigned_to,
        estimated_days=board_data.estimated_days or 1,
        status=BoardStatus.CREATED
    )
    db.add(board)
    db.commit()
    db.refresh(board)
    
    return {
        "id": board.id,
        "board_id": board.board_id,
        "board_name": board.board_name,
        "batch_number": board.batch_number,
        "priority": board.priority.value if board.priority else None,
        "status": board.status.value if board.status else None,
        "created_by": board.created_by,
        "created_at": board.created_at.isoformat() if board.created_at else None,
        "estimated_days": board.estimated_days,
        "message": "Board created successfully"
    }


@router.post("/{board_id}/update-step")
async def update_board_step(
    board_id: int,
    step_id: int = Form(...),
    status: str = Form(...),
    comment: Optional[str] = Form(None),
    defect_description: Optional[str] = Form(None),
    repair_action: Optional[str] = Form(None),
    machine_id: Optional[int] = Form(None),
    assigned_to: Optional[int] = Form(None),
    time_spent_minutes: Optional[int] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a board's manufacturing step"""
    # Get board
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Convert status string to enum
    try:
        log_status = LogStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    # Create board log entry
    current_log = BoardLog(
        board_id=board_id,
        step_id=step_id,
        user_id=current_user.id,
        status=log_status,
        comment=comment,
        defect_description=defect_description,
        repair_action=repair_action,
        machine_id=machine_id,
        assigned_to=assigned_to,
        time_spent_minutes=time_spent_minutes
    )
    db.add(current_log)
    db.flush()  # Get the log ID
    
    # Handle image uploads
    if images:
        for image in images:
            if image and image.filename:
                try:
                    image_path = await upload_handler.save_file(image, board.board_id)
                    board_image = BoardImage(
                        log_id=current_log.id,
                        image_path=image_path,
                        uploaded_by=current_user.id
                    )
                    db.add(board_image)
                except Exception as e:
                    print(f"Error uploading image: {e}")
    
    # Update board status based on log status
    if log_status == LogStatus.DONE:
        board.status = BoardStatus.PENDING_REVIEW
    elif log_status == LogStatus.FAILED:
        board.status = BoardStatus.REJECTED
    elif log_status == LogStatus.IN_PROGRESS:
        board.status = BoardStatus.IN_PROGRESS
    
    # Update assignment if specified
    if assigned_to:
        board.assigned_to = assigned_to
    
    # Update current step
    board.current_step_id = step_id
    
    db.commit()
    db.refresh(current_log)
    
    return {
        "message": "Board updated successfully",
        "log_id": current_log.id,
        "board_status": board.status.value if hasattr(board.status, 'value') else str(board.status)
    }



@router.get("/{board_id}/history")
@router.get("/{board_id}/history")
async def get_board_history(
    board_id: int,
    db: Session = Depends(get_db)
):
    """Get complete history of a board"""
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Get all logs ordered by creation time
    logs = db.query(BoardLog)\
        .filter(BoardLog.board_id == board_id)\
        .order_by(BoardLog.created_at)\
        .all()
    
    # Convert logs to serializable format
    serialized_logs = []
    first_comment = None
    last_comment = None
    
    for log in logs:
        if log.comment:
            if first_comment is None:
                first_comment = log.comment
            last_comment = log.comment
        
        # Get images for this log
        images = []
        for img in log.images:
            images.append({
                "id": img.id,
                "image_path": img.image_path,
                "image_type": img.image_type.value if hasattr(img.image_type, 'value') else str(img.image_type) if img.image_type else None
            })
        
        serialized_logs.append({
            "id": log.id,
            "board_id": log.board_id,
            "step_id": log.step_id,
            "user_id": log.user_id,
            "status": log.status.value if hasattr(log.status, 'value') else str(log.status),
            "comment": log.comment,
            "defect_description": log.defect_description,
            "repair_action": log.repair_action,
            "time_spent_minutes": log.time_spent_minutes,
            "machine_id": log.machine_id,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "step": {
                "id": log.step.id,
                "name": log.step.name,
                "department": log.step.department
            } if log.step else None,
            "user": {
                "id": log.user.id,
                "full_name": log.user.full_name,
                "username": log.user.username
            } if log.user else None,
            "machine": {
                "id": log.machine.id,
                "machine_name": log.machine.machine_name,
                "machine_code": log.machine.machine_code
            } if log.machine else None,
            "images": images
        })
    
    # Get current step from the latest log
    current_step = None
    if logs:
        latest_log = logs[-1]  # This is a SQLAlchemy object
        if latest_log.step:
            current_step = latest_log.step.name
    
    # Build response
    return {
        "id": board.id,
        "board_id": board.board_id,
        "board_name": board.board_name,
        "batch_number": board.batch_number,
        "priority": board.priority.value if hasattr(board.priority, 'value') else str(board.priority) if board.priority else None,
        "status": board.status.value if hasattr(board.status, 'value') else str(board.status) if board.status else None,
        "current_step": current_step,
        "assigned_to": board.assigned_to,
        "created_by": board.created_by,
        "created_at": board.created_at.isoformat() if board.created_at else None,
        "updated_at": board.updated_at.isoformat() if board.updated_at else None,
        "estimated_days": board.estimated_days,
        "actual_days": board.actual_days,
        "completed_at": board.completed_at.isoformat() if board.completed_at else None,
        "creator": {
            "id": board.creator.id,
            "full_name": board.creator.full_name,
            "email": board.creator.email,
            "username": board.creator.username
        } if board.creator else None,
        "assignee": {
            "id": board.assignee.id,
            "full_name": board.assignee.full_name,
            "email": board.assignee.email,
            "username": board.assignee.username
        } if board.assignee else None,
        "logs": serialized_logs,
        "first_comment": first_comment,
        "last_comment": last_comment,
        "total_logs": len(serialized_logs)
    }


@router.get("/all")
async def get_all_boards(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all boards with optional filters"""
    query = db.query(Board)
    
    # Apply filters
    if status:
        try:
            board_status = BoardStatus(status)
            query = query.filter(Board.status == board_status)
        except ValueError:
            pass
    
    if priority:
        try:
            board_priority = BoardPriority(priority)
            query = query.filter(Board.priority == board_priority)
        except ValueError:
            pass
    
    if assigned_to:
        query = query.filter(Board.assigned_to == assigned_to)
    
    # Get boards
    boards = query.order_by(Board.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    # Enrich with current step info
    result = []
    for board in boards:
        latest_log = db.query(BoardLog)\
            .filter(BoardLog.board_id == board.id)\
            .order_by(BoardLog.created_at.desc())\
            .first()
        
        # Count total logs
        total_logs = db.query(BoardLog)\
            .filter(BoardLog.board_id == board.id)\
            .count()
        
        board_data = {
            "id": board.id,
            "board_id": board.board_id,
            "board_name": board.board_name,
            "batch_number": board.batch_number,
            "priority": board.priority.value if hasattr(board.priority, 'value') else str(board.priority) if board.priority else None,
            "status": board.status.value if hasattr(board.status, 'value') else str(board.status) if board.status else None,
            "created_by": board.created_by,
            "created_at": board.created_at.isoformat() if board.created_at else None,
            "updated_at": board.updated_at.isoformat() if board.updated_at else None,
            "estimated_days": board.estimated_days,
            "actual_days": board.actual_days,
            "current_step": latest_log.step.name if latest_log and latest_log.step else None,
            "latest_comment": latest_log.comment if latest_log else None,
            "latest_user": latest_log.user.full_name if latest_log and latest_log.user else None,
            "total_logs": total_logs,
            "assignee": {
                "id": board.assignee.id,
                "full_name": board.assignee.full_name
            } if board.assignee else None,
            "creator": {
                "id": board.creator.id,
                "full_name": board.creator.full_name
            } if board.creator else None
        }
        result.append(board_data)
    
    return {
        "total": len(result),
        "skip": skip,
        "limit": limit,
        "boards": result
    }


@router.get("/{board_id}/summary")
async def get_board_summary(
    board_id: int,
    db: Session = Depends(get_db)
):
    """Get quick summary of a board"""
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Get latest log
    latest_log = db.query(BoardLog)\
        .filter(BoardLog.board_id == board_id)\
        .order_by(BoardLog.created_at.desc())\
        .first()
    
    # Get total time spent
    total_time = db.query(func.sum(BoardLog.time_spent_minutes))\
        .filter(BoardLog.board_id == board_id)\
        .scalar() or 0
    
    return {
        "id": board.id,
        "board_id": board.board_id,
        "board_name": board.board_name,
        "status": board.status.value if board.status else None,
        "priority": board.priority.value if board.priority else None,
        "current_step": latest_log.step.name if latest_log and latest_log.step else None,
        "assigned_to": board.assignee.full_name if board.assignee else "Unassigned",
        "total_time_spent_minutes": total_time,
        "total_time_spent_hours": round(total_time / 60, 1) if total_time else 0,
        "created_at": board.created_at.isoformat() if board.created_at else None,
        "last_updated": latest_log.created_at.isoformat() if latest_log and latest_log.created_at else None
    }
@router.put("/{board_id}/assign")
async def assign_board(
    board_id: int,
    assigned_to: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Assign or reassign a board to an operator (Manager/Admin only)"""
    # Check permissions
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if user_role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Only admin or manager can assign boards")
    
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Check if user exists and is operator
    assignee = db.query(User).filter(User.id == assigned_to).first()
    if not assignee:
        raise HTTPException(status_code=404, detail="User not found")
    
    old_assignee = board.assigned_to
    board.assigned_to = assigned_to
    board.status = BoardStatus.ASSIGNED
    
    # Create notification log
    notification_log = BoardLog(
        board_id=board_id,
        step_id=board.current_step_id,
        user_id=current_user.id,
        status=LogStatus.IN_PROGRESS,
        comment=f"Board reassigned from User #{old_assignee} to {assignee.full_name}",
        assigned_to=assigned_to
    )
    db.add(notification_log)
    
    db.commit()
    
    return {
        "message": f"Board assigned to {assignee.full_name}",
        "board_id": board.id,
        "assigned_to": assignee.full_name
    }

@router.get("/assigned-to/{user_id}")
async def get_user_boards(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all boards assigned to a specific user"""
    boards = db.query(Board).filter(Board.assigned_to == user_id).all()
    return boards

@router.delete("/{board_id}")
async def delete_board(
    board_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a board (admin only)"""
    if current_user.role.value not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete boards")
    
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    board_id_str = board.board_id
    db.delete(board)
    db.commit()
    
    return {
        "message": f"Board {board_id_str} deleted successfully"
    }