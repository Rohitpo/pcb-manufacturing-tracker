from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.machine import Machine
from ..schemas.machine import MachineCreate, MachineResponse, MachineUpdate
from ..utils.auth import get_current_active_user

router = APIRouter(prefix="/api/machines", tags=["machines"])

@router.get("/", response_model=List[MachineResponse])
async def get_machines(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    machines = db.query(Machine).offset(skip).limit(limit).all()
    return machines

@router.post("/", response_model=MachineResponse)
async def create_machine(
    machine_data: MachineCreate,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Machine).filter(Machine.machine_code == machine_data.machine_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Machine code exists")
    
    machine = Machine(**machine_data.dict())
    db.add(machine)
    db.commit()
    db.refresh(machine)
    return machine

@router.put("/{machine_id}", response_model=MachineResponse)
async def update_machine(
    machine_id: int,
    machine_data: MachineUpdate,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    for key, value in machine_data.dict(exclude_unset=True).items():
        setattr(machine, key, value)
    
    db.commit()
    db.refresh(machine)
    return machine
