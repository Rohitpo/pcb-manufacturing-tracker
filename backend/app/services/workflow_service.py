from sqlalchemy.orm import Session
from typing import Optional, Tuple
from ..models.board import Board, BoardStatus
from ..models.process_step import ProcessStep
from ..models.board_log import BoardLog, LogStatus

class WorkflowService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_step_sequence(self) -> list:
        """Get all active steps in order"""
        return self.db.query(ProcessStep)\
            .filter(ProcessStep.is_active == True)\
            .filter(ProcessStep.name != "Repair")\
            .order_by(ProcessStep.display_order)\
            .all()
    
    def get_next_step(self, current_step_id: int) -> Optional[ProcessStep]:
        """Get the next step in sequence"""
        current_step = self.db.query(ProcessStep).filter(ProcessStep.id == current_step_id).first()
        if not current_step:
            return None
        
        steps = self.get_step_sequence()
        for i, step in enumerate(steps):
            if step.id == current_step_id and i < len(steps) - 1:
                return steps[i + 1]
        
        return None
    
    def get_repair_step(self) -> ProcessStep:
        """Get the repair step"""
        return self.db.query(ProcessStep).filter(ProcessStep.name == "Repair").first()
    
    def process_step_update(
        self,
        board_id: int,
        step_id: int,
        user_id: int,
        status: LogStatus,
        comment: str = None,
        defect_description: str = None,
        repair_action: str = None,
        machine_id: int = None,
        assigned_to: int = None,
        time_spent_minutes: int = None
    ) -> Tuple[BoardLog, Optional[BoardLog]]:
        """
        Process a step update and handle workflow transitions
        Returns: (current_log, next_step_log)
        """
        board = self.db.query(Board).filter(Board.id == board_id).first()
        if not board:
            raise ValueError("Board not found")
        
        # Create current step log
        current_log = BoardLog(
            board_id=board_id,
            step_id=step_id,
            user_id=user_id,
            status=status,
            comment=comment,
            defect_description=defect_description,
            repair_action=repair_action,
            machine_id=machine_id,
            assigned_to=assigned_to,
            time_spent_minutes=time_spent_minutes
        )
        self.db.add(current_log)
        self.db.flush()
        
        next_log = None
        repair_step = self.get_repair_step()
        
        if status == LogStatus.DONE:
            next_step = self.get_next_step(step_id)
            if next_step:
                # Move to next step
                next_log = BoardLog(
                    board_id=board_id,
                    step_id=next_step.id,
                    user_id=user_id,
                    status=LogStatus.IN_PROGRESS
                )
                self.db.add(next_log)
                board.status = BoardStatus.IN_PROGRESS
                board.current_step_id = next_step.id
            else:
                # Completed all steps
                board.status = BoardStatus.COMPLETED
        
        elif status == LogStatus.FAILED:
            # Move to repair step
            if repair_step and step_id != repair_step.id:
                next_log = BoardLog(
                    board_id=board_id,
                    step_id=repair_step.id,
                    user_id=user_id,
                    status=LogStatus.IN_PROGRESS,
                    defect_description=defect_description
                )
                self.db.add(next_log)
                board.status = BoardStatus.IN_PROGRESS
                board.current_step_id = repair_step.id
            else:
                board.status = BoardStatus.REJECTED
        
        elif status == LogStatus.IN_PROGRESS:
            board.status = BoardStatus.IN_PROGRESS
            board.current_step_id = step_id
        
        self.db.commit()
        self.db.refresh(current_log)
        if next_log:
            self.db.refresh(next_log)
        
        return current_log, next_log