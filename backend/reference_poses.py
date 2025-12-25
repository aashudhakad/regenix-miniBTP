"""
Reference Pose System
-------------------
Provides reference poses and calibration for skeletal overlays.
"""
import numpy as np
from pathlib import Path
import json

# Key angle parameters for each exercise at different phases
# Format: [start_angle, end_angle, mid_phase_ratio]
REFERENCE_ANGLES = {
    "squats": {
        # Joint angles at different phases (in degrees)
        "knee": [170, 90, 0.5],        # Hip-knee-ankle angle
        "hip": [175, 100, 0.5],        # Shoulder-hip-knee angle
        "back": [90, 65, 0.5],         # Vertical to back angle
    },
    "deadlifts": {
        "back": [90, 60, 0.4],         # Vertical to back angle
        "hip": [175, 110, 0.4],        # Shoulder-hip-knee angle
        "knee": [175, 140, 0.5],       # Hip-knee-ankle angle
    },
    "pushups": {
        "elbow": [160, 90, 0.6],       # Shoulder-elbow-wrist angle
        "shoulder": [40, 0, 0.4],      # Elbow-shoulder-hip angle
        "body": [180, 180, 0.5],       # Straight body alignment
    },
    "lunges": {
        "front_knee": [170, 90, 0.5],  # Front leg hip-knee-ankle
        "rear_knee": [170, 80, 0.5],   # Rear leg hip-knee-ankle
        "torso": [90, 90, 0.5],        # Vertical torso
    },
    "situps": {
        "torso": [0, 70, 0.3],         # Floor to torso angle
        "hip": [170, 105, 0.6],        # Shoulder-hip-knee angle
    },
    "bicep_curls": {
        "elbow": [165, 45, 0.5],       # Shoulder-elbow-wrist angle
        "shoulder": [10, 10, 0.5],     # Minimal shoulder movement
    }
}

# T-pose reference skeleton (normalized coordinates)
# This represents key points in a standard T-pose that we'll use for calibration
T_POSE_REFERENCE = {
    # Head
    "nose": [0.5, 0.1],
    # Torso
    "left_shoulder": [0.35, 0.22],
    "right_shoulder": [0.65, 0.22],
    "left_hip": [0.45, 0.45],
    "right_hip": [0.55, 0.45],
    # Arms
    "left_elbow": [0.2, 0.22],
    "right_elbow": [0.8, 0.22],
    "left_wrist": [0.05, 0.22],
    "right_wrist": [0.95, 0.22],
    # Legs
    "left_knee": [0.45, 0.7],
    "right_knee": [0.55, 0.7],
    "left_ankle": [0.45, 0.9],
    "right_ankle": [0.55, 0.9]
}

# MediaPipe landmark indices mapping
LANDMARK_INDICES = {
    "nose": 0,
    "left_shoulder": 11,
    "right_shoulder": 12,
    "left_elbow": 13,
    "right_elbow": 14,
    "left_wrist": 15,
    "right_wrist": 16,
    "left_hip": 23,
    "right_hip": 24,
    "left_knee": 25,
    "right_knee": 26,
    "left_ankle": 27,
    "right_ankle": 28
}

def interpolate_angle(start_angle, end_angle, progress, mid_ratio=0.5):
    """
    Interpolate between two angles with easing function.
    
    Args:
        start_angle: Starting angle in degrees
        end_angle: Ending angle in degrees
        progress: Progress from 0.0 to 1.0
        mid_ratio: Controls the steepness of the easing curve
    
    Returns:
        Interpolated angle
    """
    # Use a sigmoid-like easing function for natural movement
    if progress < mid_ratio:
        # Scale to [0, 1] within first half
        t = progress / mid_ratio
        # Ease-in function
        factor = t * t * (3.0 - 2.0 * t)
    else:
        # Scale to [0, 1] within second half
        t = (progress - mid_ratio) / (1.0 - mid_ratio)
        # Ease-out function
        factor = 1.0 - (1.0 - t) * (1.0 - t)
    
    return start_angle + (end_angle - start_angle) * factor

def calculate_reference_angles(exercise, progress):
    """
    Calculate reference joint angles for a given exercise at specific progress point.
    
    Args:
        exercise: Exercise type string
        progress: Progress from 0.0 (start) to 1.0 (end)
    
    Returns:
        Dictionary of joint angles
    """
    if exercise not in REFERENCE_ANGLES:
        return {}
    
    angles = {}
    for joint, params in REFERENCE_ANGLES[exercise].items():
        start_angle, end_angle, mid_ratio = params
        angles[joint] = interpolate_angle(start_angle, end_angle, progress, mid_ratio)
    
    return angles

def calibrate_user_skeleton(landmarks):
    """
    Calibrate skeleton based on user's proportions from T-pose.
    
    Args:
        landmarks: List of MediaPipe pose landmarks
        
    Returns:
        Dictionary with calibration data
    """
    # Extract key landmarks
    user_keypoints = {}
    for name, idx in LANDMARK_INDICES.items():
        if idx < len(landmarks) and landmarks[idx]:
            user_keypoints[name] = [landmarks[idx].get('x', 0), landmarks[idx].get('y', 0)]
    
    # Calculate limb lengths
    limb_lengths = {
        "torso": distance(user_keypoints.get("left_shoulder"), user_keypoints.get("left_hip")),
        "upper_arm": distance(user_keypoints.get("left_shoulder"), user_keypoints.get("left_elbow")),
        "lower_arm": distance(user_keypoints.get("left_elbow"), user_keypoints.get("left_wrist")),
        "upper_leg": distance(user_keypoints.get("left_hip"), user_keypoints.get("left_knee")),
        "lower_leg": distance(user_keypoints.get("left_knee"), user_keypoints.get("left_ankle"))
    }
    
    # Calculate central points
    mid_shoulder = midpoint(user_keypoints.get("left_shoulder"), user_keypoints.get("right_shoulder"))
    mid_hip = midpoint(user_keypoints.get("left_hip"), user_keypoints.get("right_hip"))
    
    # Calculate body scaling factor relative to a "standard" skeleton
    scaling_factor = limb_lengths["torso"] * 2  # Normalize to torso height
    
    return {
        "limb_lengths": limb_lengths,
        "mid_shoulder": mid_shoulder,
        "mid_hip": mid_hip,
        "scaling_factor": scaling_factor,
        "keypoints": user_keypoints
    }

def get_reference_skeleton(exercise, progress, calibration=None):
    """
    Get reference skeleton for overlay based on exercise, phase, and calibration.
    
    Args:
        exercise: Exercise type
        progress: Exercise progress (0.0 to 1.0)
        calibration: Optional calibration data from calibrate_user_skeleton
        
    Returns:
        List of [x,y] coordinates for landmarks to use as overlay
    """
    # Get reference angles
    angles = calculate_reference_angles(exercise, progress)
    
    # Start with T-pose and adjust
    skeleton = dict(T_POSE_REFERENCE)
    
    # Apply exercise-specific adjustments based on angles
    if exercise == "squats":
        adjust_squat_skeleton(skeleton, angles, progress)
    elif exercise == "deadlifts":
        adjust_deadlift_skeleton(skeleton, angles, progress)
    elif exercise == "pushups":
        adjust_pushup_skeleton(skeleton, angles, progress)
    elif exercise == "lunges":
        adjust_lunge_skeleton(skeleton, angles, progress)
    elif exercise == "situps":
        adjust_situp_skeleton(skeleton, angles, progress)
    elif exercise == "bicep_curls":
        adjust_bicep_curl_skeleton(skeleton, angles, progress)
    
    # Apply user calibration if provided
    if calibration:
        skeleton = apply_calibration(skeleton, calibration)
    
    # Convert to list format expected by frontend
    reference_landmarks = [None] * 33  # MediaPipe has 33 landmarks
    for name, idx in LANDMARK_INDICES.items():
        if name in skeleton:
            reference_landmarks[idx] = {
                "x": skeleton[name][0],
                "y": skeleton[name][1],
                "z": 0  # We're in 2D
            }
    
    return reference_landmarks

# Helper functions

def distance(p1, p2):
    """Calculate Euclidean distance between two points"""
    if not p1 or not p2:
        return 0
    return np.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)

def midpoint(p1, p2):
    """Calculate midpoint between two points"""
    if not p1 or not p2:
        return [0, 0]
    return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]

def rotate_point(point, pivot, angle_deg):
    """Rotate a point around a pivot by given angle in degrees"""
    angle_rad = np.radians(angle_deg)
    s, c = np.sin(angle_rad), np.cos(angle_rad)
    
    # Translate to origin
    x, y = point[0] - pivot[0], point[1] - pivot[1]
    
    # Rotate
    x_new = x * c - y * s
    y_new = x * s + y * c
    
    # Translate back
    return [x_new + pivot[0], y_new + pivot[1]]

def apply_calibration(skeleton, calibration):
    """Apply user calibration to reference skeleton"""
    # This would be a more complex implementation with proper scaling
    # For now, returning the original skeleton
    return skeleton

# Exercise-specific skeleton adjusters (simplified implementations)

def adjust_squat_skeleton(skeleton, angles, progress):
    """Adjust skeleton for squat position"""
    # Bend at knees and hips
    knee_angle = angles.get("knee", 170)
    hip_angle = angles.get("hip", 175)
    
    # Lower the body based on knee bend
    drop_amount = (170 - knee_angle) / 80 * 0.3  # Max drop of 0.3 units
    for part in ["nose", "left_shoulder", "right_shoulder", "left_hip", "right_hip"]:
        if part in skeleton:
            skeleton[part][1] += drop_amount
    
    # Bend knees
    left_knee_pos = skeleton["left_knee"]
    right_knee_pos = skeleton["right_knee"]
    skeleton["left_ankle"] = [left_knee_pos[0], left_knee_pos[1] + 0.2]
    skeleton["right_ankle"] = [right_knee_pos[0], right_knee_pos[1] + 0.2]
    
    # Forward lean based on hip angle
    lean_angle = 90 - (175 - hip_angle) * 0.5  # Convert hip angle to forward lean
    # Apply forward lean to upper body...
    # (simplified - would need proper rotation of all upper body joints)
    
    return skeleton

# Similarly implement other exercise adjusters
def adjust_deadlift_skeleton(skeleton, angles, progress):
    """Adjust skeleton for deadlift position"""
    # Simplified implementation - similar principle to squat
    return skeleton

def adjust_pushup_skeleton(skeleton, angles, progress):
    """Adjust skeleton for pushup position"""
    # Simplified implementation
    return skeleton

def adjust_lunge_skeleton(skeleton, angles, progress):
    """Adjust skeleton for lunge position"""
    # Simplified implementation
    return skeleton

def adjust_situp_skeleton(skeleton, angles, progress):
    """Adjust skeleton for situp position"""
    # Simplified implementation
    return skeleton

def adjust_bicep_curl_skeleton(skeleton, angles, progress):
    """Adjust skeleton for bicep curl position"""
    # Simplified implementation
    # Bend elbow based on curl progress
    elbow_angle = angles.get("elbow", 165)
    
    # Adjust left arm
    left_shoulder = skeleton["left_shoulder"]
    left_elbow = skeleton["left_elbow"]
    # Rotate wrist around elbow by elbow_angle
    skeleton["left_wrist"] = rotate_point([left_elbow[0] - 0.15, left_elbow[1]], 
                                         left_elbow, 180 - elbow_angle)
    
    # Adjust right arm (mirror of left)
    right_shoulder = skeleton["right_shoulder"]
    right_elbow = skeleton["right_elbow"]
    skeleton["right_wrist"] = rotate_point([right_elbow[0] + 0.15, right_elbow[1]],
                                          right_elbow, elbow_angle - 180)
    
    return skeleton
