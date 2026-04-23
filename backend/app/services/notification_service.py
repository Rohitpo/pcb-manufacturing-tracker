from sqlalchemy.orm import Session
from ..models.notification import Notification

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "info",
    link: str = None
):
    """Create a notification for a user"""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link
    )
    db.add(notification)
    db.commit()
    return notification

def notify_board_assigned(db: Session, user_id: int, board_id: str, board_name: str = None):
    """Notify operator when board is assigned"""
    title = "New Board Assigned"
    message = f"Board {board_id}" + (f" ({board_name})" if board_name else "") + " has been assigned to you."
    create_notification(
        db, user_id, title, message, 
        notification_type="info",
        link=f"/boards"
    )

def notify_review_complete(db: Session, user_id: int, board_id: str, status: str):
    """Notify operator when review is complete"""
    title = "Review Completed"
    message = f"Your work on board {board_id} has been {status}."
    create_notification(
        db, user_id, title, message,
        notification_type="success" if status == "approved" else "warning",
        link=f"/boards"
    )