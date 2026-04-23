import os
import uuid
import shutil
from datetime import datetime
from fastapi import UploadFile, HTTPException, status
from pathlib import Path
from ..config import settings

class FileUploadHandler:
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(exist_ok=True, parents=True)
    
    def validate_file(self, file: UploadFile):
        # Check file size
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        
        if size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB"
            )
        
        # Check file extension
        ext = Path(file.filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        
        return ext
    
    async def save_file(self, file: UploadFile, board_id: str) -> str:
        """Save uploaded file and return relative path"""
        ext = self.validate_file(file)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"{board_id}_{timestamp}_{unique_id}{ext}"
        
        # Create board-specific directory
        board_dir = self.upload_dir / board_id.lower()
        board_dir.mkdir(exist_ok=True, parents=True)
        
        # Full path for saving
        file_path = board_dir / filename
        
        # Save file
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file: {str(e)}"
            )
        
        # Return relative path for database storage (using forward slashes for URL)
        relative_path = f"uploads/{board_id.lower()}/{filename}"
        return relative_path.replace("\\", "/")
    
    def delete_file(self, file_path: str) -> bool:
        try:
            full_path = Path(settings.UPLOAD_DIR) / file_path.replace("uploads/", "")
            if full_path.exists():
                full_path.unlink()
            return True
        except Exception:
            return False

upload_handler = FileUploadHandler()