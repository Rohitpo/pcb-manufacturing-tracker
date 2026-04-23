# backend/app/routes/steps.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.process_step import ProcessStep
from ..schemas.process_step import ProcessStepResponse, ProcessStepCreate, ProcessStepUpdate
from ..utils.auth import get_current_active_user, require_role
from ..models.user import User

router = APIRouter(prefix="/api/steps", tags=["process_steps"])

@router.get("/", response_model=List[ProcessStepResponse])
async def get_all_steps(
    db: Session = Depends(get_db)
):
    steps = db.query(ProcessStep)\
        .filter(ProcessStep.is_active == True)\
        .order_by(ProcessStep.display_order)\
        .all()
    return steps

@router.post("/", response_model=ProcessStepResponse)
async def create_step(
    step_data: ProcessStepCreate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    existing = db.query(ProcessStep).filter(ProcessStep.name == step_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Step name already exists")
    
    step = ProcessStep(**step_data.dict())
    db.add(step)
    db.commit()
    db.refresh(step)
    return step

@router.put("/{step_id}", response_model=ProcessStepResponse)
async def update_step(
    step_id: int,
    step_data: ProcessStepUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    step = db.query(ProcessStep).filter(ProcessStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    for key, value in step_data.dict(exclude_unset=True).items():
        setattr(step, key, value)
    
    db.commit()
    db.refresh(step)
    return step

@router.delete("/{step_id}")
async def delete_step(
    step_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    step = db.query(ProcessStep).filter(ProcessStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    # Soft delete
    step.is_active = False
    db.commit()
    
    return {"message": "Step deleted successfully"}
