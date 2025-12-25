import numpy as np
from state import exercise_state
from feedback_config import BICEP_CURL_CONFIG, FEEDBACK_TO_JOINTS, JOINT_INDEX_MAP

def calculate_angle(a, b, c):
    """
    Calculate the angle (in degrees) at point b given three points a, b, and c.
    """
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

def detect_shoulder_movement(current_shoulder, previous_shoulder):
    """
    Detect if there is significant shoulder movement between frames,
    which could indicate using momentum or swinging.
    """
    if previous_shoulder is None:
        return 0
    
    # Calculate displacement
    displacement = np.sqrt((current_shoulder[0] - previous_shoulder[0])**2 + 
                          (current_shoulder[1] - previous_shoulder[1])**2)
    return displacement

def process_landmarks(landmarks, tolerance=0.0, session_id=None):
    """
    Process landmarks for bicep curl form analysis with enhanced feedback
    
    Args:
        landmarks: Dictionary of landmark positions
        tolerance: Tolerance threshold
        session_id: Optional session ID for logging
        
    Returns:
        Dictionary with processing results and feedback
    """
    elbow_angles = []
    shoulder_positions = []
    
    # Calculate left arm angle and get shoulder position
    try:
        left_shoulder = [landmarks[11]['x'], landmarks[11]['y']]
        left_elbow = [landmarks[13]['x'], landmarks[13]['y']]
        left_wrist = [landmarks[15]['x'], landmarks[15]['y']]
        
        left_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
        elbow_angles.append(left_angle)
        shoulder_positions.append(left_shoulder)
    except KeyError:
        pass

    # Calculate right arm angle and get shoulder position
    try:
        right_shoulder = [landmarks[12]['x'], landmarks[12]['y']]
        right_elbow = [landmarks[14]['x'], landmarks[14]['y']]
        right_wrist = [landmarks[16]['x'], landmarks[16]['y']]
        
        right_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
        elbow_angles.append(right_angle)
        shoulder_positions.append(right_shoulder)
    except KeyError:
        pass

    if not elbow_angles:
        return {"error": "Insufficient landmarks data."}

    # Average the elbow angles
    avg_elbow_angle = sum(elbow_angles) / len(elbow_angles)
    
    # Retrieve the current state for bicep_curls
    state = exercise_state.get("bicep_curls", {
        "repCount": 0,
        "stage": "down",
        "feedback": "N/A",
        "prev_shoulders": None
    })
    
    stage = state.get("stage", "down")
    counter = state.get("repCount", 0)
    prev_counter = counter  # Store previous counter to detect new reps
    prev_shoulders = state.get("prev_shoulders", None)
    
    # Calculate shoulder movement if we have previous data
    shoulder_movement = 0
    if prev_shoulders and len(prev_shoulders) == len(shoulder_positions):
        movements = [detect_shoulder_movement(curr, prev) 
                    for curr, prev in zip(shoulder_positions, prev_shoulders)]
        shoulder_movement = max(movements) if movements else 0

    # Bicep curl detection logic
    if avg_elbow_angle > BICEP_CURL_CONFIG["ELBOW_EXTENSION_MIN"]:  # Arm extended (down)
        stage = "down"
    elif avg_elbow_angle < BICEP_CURL_CONFIG["ELBOW_ANGLE_MAX"] + 10 and stage == "down":  # Arm flexed (up)
        stage = "up"
        counter += 1

    # Generate detailed feedback
    feedback_flags = []
    
    # Check curl completeness
    if stage == "up" and avg_elbow_angle > BICEP_CURL_CONFIG["ELBOW_ANGLE_MAX"]:
        feedback_flags.append("INCOMPLETE_CURL")
    elif stage == "down" and avg_elbow_angle < BICEP_CURL_CONFIG["ELBOW_EXTENSION_MIN"] - 10:
        feedback_flags.append("INCOMPLETE_EXTENSION")
    
    # Check for excessive shoulder movement (swinging)
    if shoulder_movement > BICEP_CURL_CONFIG["SHOULDER_MOVEMENT_THRESHOLD"]:
        # Distinguish between general momentum and shoulder swinging
        if avg_elbow_angle > 90 and avg_elbow_angle < 150:  # Mid-range of motion
            feedback_flags.append("USING_MOMENTUM")
        else:
            feedback_flags.append("SHOULDER_SWINGING")
    
    # If no specific feedback issues, provide general positive feedback
    if not feedback_flags and (stage == "up" or (stage == "down" and avg_elbow_angle > 150)):
        feedback_flags.append("GOOD_CURL")

    # Compile the feedback into a string using the configured feedback messages
    feedback_message = ""
    for flag in feedback_flags:
        if flag in BICEP_CURL_CONFIG["FEEDBACK"]:
            feedback_message += BICEP_CURL_CONFIG["FEEDBACK"][flag] + " "
    
    feedback_message = feedback_message.strip()
    
    # Calculate exercise progress (0-1) for reference poses
    # Based on elbow angle: 0 = straight arm, 1 = full bend
    progress = 0
    if avg_elbow_angle < BICEP_CURL_CONFIG["ELBOW_EXTENSION_MIN"]:
        progress = min(1.0, (BICEP_CURL_CONFIG["ELBOW_EXTENSION_MIN"] - avg_elbow_angle) / 
                     (BICEP_CURL_CONFIG["ELBOW_EXTENSION_MIN"] - BICEP_CURL_CONFIG["ELBOW_ANGLE_MIN"]))

    # Log the rep if it's a new rep and session_id exists
    if counter > prev_counter and session_id:
        try:
            from session_state import record_rep
            metrics = {
                "elbow_angle": avg_elbow_angle,
                "shoulder_movement": shoulder_movement
            }
            record_rep(session_id, "bicep_curls", feedback_flags, metrics)
        except ImportError:
            # Session state module not available, continue without logging
            pass

    # For now, simple scoring without advanced computation
    rep_score = 100 if "GOOD_CURL" in feedback_flags else 70
    score_label = "Perfect!" if rep_score == 100 else "Good"

    # When creating the response, add affected joints information
    affected_joints = []
    affected_segments = []
    
    # Identify affected joints based on feedback flags
    for flag in feedback_flags:
        if flag in FEEDBACK_TO_JOINTS:
            # Get joint groups affected by this feedback
            joint_groups = FEEDBACK_TO_JOINTS[flag]
            for group in joint_groups:
                # Add all joints in these groups to the affected list
                if group in ["elbows"]:
                    affected_joints.extend([13, 14])  # Left and right elbow indices
                elif group in ["shoulders"]:
                    affected_joints.extend([11, 12])  # Left and right shoulder indices
                # Add other mappings as needed
    
    # Add unique affected joints
    affected_joints = list(set(affected_joints))
    
    # Add segments affected by these joints
    if 11 in affected_joints or 13 in affected_joints:  # Left shoulder or elbow
        affected_segments.append(["left_shoulder", "left_elbow"])
    if 13 in affected_joints or 15 in affected_joints:  # Left elbow or wrist
        affected_segments.append(["left_elbow", "left_wrist"])
    if 12 in affected_joints or 14 in affected_joints:  # Right shoulder or elbow
        affected_segments.append(["right_shoulder", "right_elbow"])
    if 14 in affected_joints or 16 in affected_joints:  # Right elbow or wrist
        affected_segments.append(["right_elbow", "right_wrist"])

    # Create advanced metrics dictionary
    advanced_metrics = {
        "elbow_angle": avg_elbow_angle,
        "shoulder_movement": shoulder_movement
    }

    new_state = {
        "repCount": counter,
        "stage": stage,
        "feedback": feedback_message,
        "feedback_flags": feedback_flags,
        "avg_angle": avg_elbow_angle,
        "shoulder_movement": shoulder_movement,
        "prev_shoulders": shoulder_positions,  # Store for next frame comparison
        "rep_score": rep_score,
        "score_label": score_label,
        "progress": progress,
        "affected_joints": affected_joints,
        "affected_segments": affected_segments,
        "advanced_metrics": advanced_metrics  # Add advanced metrics
    }
    
    exercise_state["bicep_curls"] = new_state
    return new_state