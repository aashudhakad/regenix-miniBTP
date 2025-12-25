"""
API Router for Reference Poses
---------------------------
Provides endpoints for reference skeleton generation
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
import json

from reference_poses import (
    calibrate_user_skeleton, get_reference_skeleton, 
    calculate_reference_angles
)

router = APIRouter(prefix="/reference", tags=["reference"])

# Data models
class CalibrationRequest(BaseModel):
    landmarks: List[Dict[str, Any]]

class ReferenceRequest(BaseModel):
    exercise: str
    progress: float
    calibration_id: Optional[str] = None

# Simple in-memory cache for calibrations
calibration_cache = {}

@router.post("/calibrate")
async def api_calibrate(request: CalibrationRequest):
    """Calibrate the reference skeleton to the user's proportions"""
    calibration_data = calibrate_user_skeleton(request.landmarks)
    
    # Generate ID and cache
    import uuid
    calibration_id = str(uuid.uuid4())
    calibration_cache[calibration_id] = calibration_data
    
    return {"calibration_id": calibration_id}

@router.get("/skeleton/{exercise}")
async def api_get_reference_skeleton(
    exercise: str, 
    progress: float = 0.0,
    calibration_id: Optional[str] = None
):
    """Get reference skeleton for the specified exercise and progress"""
    # Get calibration if specified
    calibration = None
    if calibration_id and calibration_id in calibration_cache:
        calibration = calibration_cache[calibration_id]
    
    # Generate reference skeleton
    try:
        reference = get_reference_skeleton(exercise, progress, calibration)
        return {
            "exercise": exercise,
            "progress": progress,
            "reference_skeleton": reference
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error generating reference: {str(e)}")

@router.get("/angles/{exercise}")
async def api_get_reference_angles(exercise: str, progress: float = 0.0):
    """Get reference joint angles for the specified exercise and progress"""
    try:
        angles = calculate_reference_angles(exercise, progress)
        return {
            "exercise": exercise,
            "progress": progress,
            "angles": angles
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error calculating angles: {str(e)}")
