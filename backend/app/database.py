from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

# Get the absolute path for SQLite database
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'pcb_tracker.db')}"

# SQLite engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database with tables and default data"""
    from .models.user import User, UserRole
    from .models.process_step import ProcessStep
    from .models.machine import Machine, MachineStatus
    from .utils.auth import get_password_hash
    
    # Import all models to create tables - ADDED board_attachment and notification
    from .models import (
        board, 
        board_log, 
        board_image, 
        review, 
        performance_metric,
        board_attachment,  # <-- ADDED
        notification       # <-- ADDED (if you created it)
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Add process steps if empty
        if db.query(ProcessStep).count() == 0:
            steps = [
                ProcessStep(name="Soldering", department="Assembly", display_order=1, estimated_hours=2, requires_review=False),
                ProcessStep(name="Optical Inspection", department="Quality", display_order=2, estimated_hours=1, requires_review=True),
                ProcessStep(name="X-Ray Inspection", department="Quality", display_order=3, estimated_hours=1, requires_review=True),
                ProcessStep(name="Testing", department="Testing", display_order=4, estimated_hours=3, requires_review=True),
                ProcessStep(name="Repair", department="Repair", display_order=5, estimated_hours=2, requires_review=False),
            ]
            db.add_all(steps)
            db.commit()
            print("✅ Process steps created")
        
        # Add admin user
        if db.query(User).filter(User.username == "admin").first() is None:
            admin = User(
                username="admin",
                email="admin@pcb.com",
                full_name="System Administrator",
                role=UserRole.ADMIN,
                department="IT",
                employee_id="EMP001",
                hashed_password=get_password_hash("admin123"),
                is_active=True
            )
            db.add(admin)
        
        # Add manager user
        if db.query(User).filter(User.username == "manager1").first() is None:
            manager = User(
                username="manager1",
                email="manager@pcb.com",
                full_name="Production Manager",
                role=UserRole.MANAGER,
                department="Production",
                employee_id="EMP002",
                hashed_password=get_password_hash("manager123"),
                is_active=True
            )
            db.add(manager)
        
        # Add operator user
        if db.query(User).filter(User.username == "operator1").first() is None:
            operator = User(
                username="operator1",
                email="operator@pcb.com",
                full_name="John Operator",
                role=UserRole.OPERATOR,
                department="Assembly",
                employee_id="EMP003",
                hashed_password=get_password_hash("operator123"),
                is_active=True
            )
            db.add(operator)
        
        # Add default machines
        if db.query(Machine).count() == 0:
            machines = [
                Machine(machine_code="SLD-001", machine_name="Soldering Station 1", machine_type="Soldering", location="Assembly Line 1", status=MachineStatus.AVAILABLE),
                Machine(machine_code="OPT-001", machine_name="Optical Inspection System", machine_type="Inspection", location="Quality Lab", status=MachineStatus.AVAILABLE),
                Machine(machine_code="XRY-001", machine_name="X-Ray Machine", machine_type="X-Ray", location="Quality Lab", status=MachineStatus.AVAILABLE),
                Machine(machine_code="TST-001", machine_name="Testing Station 1", machine_type="Testing", location="Test Bay", status=MachineStatus.AVAILABLE),
                Machine(machine_code="REP-001", machine_name="Repair Station", machine_type="Repair", location="Repair Bay", status=MachineStatus.AVAILABLE),
            ]
            db.add_all(machines)
        
        db.commit()
        print("✅ Default users and machines created")
        print("✅ Login credentials: admin/admin123, manager1/manager123, operator1/operator123")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()