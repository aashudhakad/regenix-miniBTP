import numpy as np
from state import exercise_state
from feedback_config import SITUP_CONFIG, FEEDBACK_TO_JOINTS, ADVANCED_FEEDBACK
from score_config import calculate_rep_score

def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
         angle = 360 - angle
    return angle

def check_neck_strain(nose, neck, shoulder):
    """
    Check if there's excessive neck strain by measuring the angle between
    nose, neck, and shoulders
    """
    if not nose or not neck or not shoulder:
        return False
        
    neck_angle = calculate_angle(nose, neck, shoulder)
    # If neck is too flexed (looking down too much), it might indicate strain
    return neck_angle < 150

def process_landmarks(landmarks, tolerance, session_id=None):
    """
    Process landmarks for situp form analysis with enhanced feedback
    """
    hip_angles = []
    neck_strain_detected = False
    
    # Extract left side landmarks for hip angle calculation
    try:
        left_shoulder = [landmarks[11]['x'], landmarks[11]['y']]
        left_hip = [landmarks[23]['x'], landmarks[23]['y']]
        left_knee = [landmarks[25]['x'], landmarks[25]['y']]
        
        left_hip_angle = calculate_angle(left_shoulder, left_hip, left_knee)
        hip_angles.append(left_hip_angle)
        
        # Check for neck strain
        nose = [landmarks[0]['x'], landmarks[0]['y']]
        neck = [(landmarks[11]['x'] + landmarks[12]['x'])/2, 
                (landmarks[11]['y'] + landmarks[12]['y'])/2 - 0.05]  # Estimate neck position
        mid_shoulder = [(landmarks[11]['x'] + landmarks[12]['x'])/2,
                       (landmarks[11]['y'] + landmarks[12]['y'])/2]
        
        if check_neck_strain(nose, neck, mid_shoulder):
            neck_strain_detected = True
    except Exception:
        pass
    
    # Extract right side landmarks for hip angle calculation
    try:
        right_shoulder = [landmarks[12]['x'], landmarks[12]['y']]
        right_hip = [landmarks[24]['x'], landmarks[24]['y']]
        right_knee = [landmarks[26]['x'], landmarks[26]['y']]
        
        right_hip_angle = calculate_angle(right_shoulder, right_hip, right_knee)
        hip_angles.append(right_hip_angle)
    except Exception:
        pass

    if not hip_angles:
        return {"error": "Insufficient landmarks data."}

    # Average the hip angles
    avg_hip_angle = sum(hip_angles) / len(hip_angles)
    
    # Retrieve current state for sit-ups
    state = exercise_state.get("situps", {"counter": 0, "stage": "up", "feedback": "N/A"})
    stage = state.get("stage", "up")
    counter = state.get("counter", 0)

    # Sit-up detection logic
    if avg_hip_angle > 160:  # Lying flat
        stage = "down"
    elif avg_hip_angle < 120 and stage == "down":  # Sitting up
        stage = "up"
        counter += 1

    # Generate detailed feedback
    feedback_flags = []
    
    # Check sit-up height
    if stage == "up":
        if avg_hip_angle > SITUP_CONFIG["HIP_ANGLE_MAX"] + 10:
            feedback_flags.append("NOT_HIGH_ENOUGH")
        elif avg_hip_angle < SITUP_CONFIG["HIP_ANGLE_MIN"] - 5:
            feedback_flags.append("TOO_HIGH")
    
    # Check for neck strain
    if neck_strain_detected:
        feedback_flags.append("PULLING_NECK")
    
    # If no specific feedback issues, provide general positive feedback
    if not feedback_flags:
        feedback_flags.append("GOOD_FORM")

    # Calculate rep score
    rep_score, score_label = calculate_rep_score("situps", feedback_flags)

    # Compile the feedback into a string using the configured feedback messages
    feedback_message = ""
    for flag in feedback_flags:
        if flag in SITUP_CONFIG["FEEDBACK"]:
            feedback_message += SITUP_CONFIG["FEEDBACK"][flag] + " "
        elif flag in ADVANCED_FEEDBACK:
            feedback_message += ADVANCED_FEEDBACK[flag] + " "
    
    feedback_message = feedback_message.strip()
    
    # Calculate exercise progress (0-1)
    # Based on hip angle: 0 = lying flat, 1 = full situp
    progress = 0
    if avg_hip_angle < 160:
        progress = min(1.0, (160 - avg_hip_angle) / (160 - SITUP_CONFIG["HIP_ANGLE_OPTIMAL"]))

    # Log the rep if this is a new rep and we have a session ID
    if counter > state.get("counter", 0) and session_id:
        try:
            from session_state import record_rep
            metrics = {
                "hip_angle": avg_hip_angle,
                "neck_strain": neck_strain_detected
            }
            record_rep(session_id, "situps", feedback_flags, metrics)
        except ImportError:
            # Session state module not available, continue without logging
            pass

    # Create affected joints and segments arrays for visualization
    affected_joints = []
    affected_segments = []
    
    # Map feedback flags to affected joints
    for flag in feedback_flags:
        if flag in FEEDBACK_TO_JOINTS:
            joint_groups = FEEDBACK_TO_JOINTS[flag]
            for group in joint_groups:
                if group == "knees":
                    affected_joints.extend([25, 26])  # Left and right knee
                elif group == "hips":
                    affected_joints.extend([23, 24])  # Left and right hip
                elif group == "back":
                    # No direct point for back, use shoulders and hips
                    affected_joints.extend([11, 12, 23, 24])
                elif group == "shoulders":
                    affected_joints.extend([11, 12])  # Left and right shoulder
                
    # Remove duplicates
    affected_joints = list(set(affected_joints))
    
    # Create affected segments based on joints
    if 0 in affected_joints or 11 in affected_joints or 12 in affected_joints:  # Nose or shoulders
        affected_segments.append(["nose", "left_shoulder"])
        affected_segments.append(["nose", "right_shoulder"])
    
    if 11 in affected_joints or 23 in affected_joints:  # Left shoulder or hip
        affected_segments.append(["left_shoulder", "left_hip"])
    
    if 12 in affected_joints or 24 in affected_joints:  # Right shoulder or hip
        affected_segments.append(["right_shoulder", "right_hip"])
    
    if 23 in affected_joints or 25 in affected_joints:  # Left hip or knee
        affected_segments.append(["left_hip", "left_knee"])
        
    if 24 in affected_joints or 26 in affected_joints:  # Right hip or knee
        affected_segments.append(["right_hip", "right_knee"])
        
    # Advanced metrics
    advanced_metrics = {
        "hip_angle": avg_hip_angle,
        "neck_strain": neck_strain_detected
    }

    new_state = {
        "counter": counter,
        "stage": stage,
        "hipAngle": avg_hip_angle,
        "neckStrain": neck_strain_detected,
        "feedback": feedback_message,
        "rep_score": rep_score,
        "score_label": score_label,
        "feedback_flags": feedback_flags,
        "affected_joints": affected_joints,
        "affected_segments": affected_segments,
        "progress": progress,  # Add the progress field
        "advanced_metrics": advanced_metrics
    }
    
    exercise_state["situps"] = new_state
    return new_state
