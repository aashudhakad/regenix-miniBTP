import numpy as np
from state import exercise_state
from feedback_config import LUNGE_CONFIG, FEEDBACK_TO_JOINTS
from score_config import calculate_rep_score

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

def calculate_knee_projection(hip, knee, ankle):
    """Calculate how far knee extends beyond toes (normalized by limb length)"""
    # Convert to numpy arrays for vector math
    hip = np.array(hip)
    knee = np.array(knee)
    ankle = np.array(ankle)
    
    # Get the ankle-to-knee vector direction
    ankle_knee_vector = knee - ankle
    ankle_knee_length = np.linalg.norm(ankle_knee_vector)
    if ankle_knee_length == 0:  # Avoid division by zero
        return 0
    
    # Project the knee point onto the vertical line from ankle
    projection = ankle_knee_vector[0] / ankle_knee_length  # Normalized horizontal component
    
    return projection  # Positive means knee is forward of ankle

def calculate_torso_angle(shoulder, hip):
    """Calculate torso angle from vertical (0° is perfectly upright, 180° is inverted)"""
    # Calculate the angle between the torso and the vertical axis
    vertical_vector = np.array([0, -1])  # Upward vertical vector
    torso_vector = np.array([shoulder[0] - hip[0], shoulder[1] - hip[1]])
    
    # Normalize the torso vector
    torso_length = np.linalg.norm(torso_vector)
    if torso_length == 0:  # Avoid division by zero
        return 180
    torso_vector = torso_vector / torso_length
    
    # Calculate angle using dot product
    dot_product = np.dot(vertical_vector, torso_vector)
    angle = np.arccos(np.clip(dot_product, -1.0, 1.0)) * 180.0 / np.pi
    
    # Convert to the 0-180 range where 180 is perfectly upright
    return 180 - angle

def process_landmarks(landmarks, tolerance, session_id=None):
    """
    Process landmarks for lunge form analysis with enhanced feedback
    
    Args:
        landmarks: Dictionary of landmark positions
        tolerance: Tolerance threshold
        session_id: Optional session ID for logging
        
    Returns:
        Dictionary with processing results and feedback
    """
    knee_angles = []
    knee_projections = []
    torso_angles = []
    
    # Extract left side landmarks
    try:
        left_shoulder = [landmarks[11]['x'], landmarks[11]['y']]
        left_hip = [landmarks[23]['x'], landmarks[23]['y']]
        left_knee = [landmarks[25]['x'], landmarks[25]['y']]
        left_ankle = [landmarks[27]['x'], landmarks[27]['y']]
        
        left_angle = calculate_angle(left_hip, left_knee, left_ankle)
        left_projection = calculate_knee_projection(left_hip, left_knee, left_ankle)
        left_torso_angle = calculate_torso_angle(left_shoulder, left_hip)
        
        knee_angles.append(left_angle)
        knee_projections.append(left_projection)
        torso_angles.append(left_torso_angle)
    except Exception:
        pass
    
    # Extract right side landmarks
    try:
        right_shoulder = [landmarks[12]['x'], landmarks[12]['y']]
        right_hip = [landmarks[24]['x'], landmarks[24]['y']]
        right_knee = [landmarks[26]['x'], landmarks[26]['y']]
        right_ankle = [landmarks[28]['x'], landmarks[28]['y']]
        
        right_angle = calculate_angle(right_hip, right_knee, right_ankle)
        right_projection = calculate_knee_projection(right_hip, right_knee, right_ankle)
        right_torso_angle = calculate_torso_angle(right_shoulder, right_hip)
        
        knee_angles.append(right_angle)
        knee_projections.append(right_projection)
        torso_angles.append(right_torso_angle)
    except Exception:
        pass

    if not knee_angles:
        return {"error": "Insufficient landmarks data."}

    # Calculate averages
    avg_knee_angle = min(knee_angles)  # Use minimum (the most bent knee)
    avg_knee_projection = max(knee_projections)  # Use maximum (worst case)
    avg_torso_angle = sum(torso_angles) / len(torso_angles)
    
    # Retrieve the current state for lunges
    state = exercise_state.get("lunges", {"counter": 0, "stage": "up", "feedback": "N/A"})
    stage = state.get("stage", "up")
    counter = state.get("counter", 0)
    prev_counter = state.get("counter", 0)  # Store previous counter to detect rep completion

    # Lunge detection logic
    if min(knee_angles) > 150:  # Both legs relatively straight
        stage = "up"
    elif min(knee_angles) < LUNGE_CONFIG["FRONT_KNEE_ANGLE_MIN"] + 5 and stage == "up":
        stage = "down"
        counter += 1

    # Generate detailed feedback
    feedback_flags = []
    
    # Check knee position relative to toes
    if avg_knee_projection > LUNGE_CONFIG["KNEE_OVER_TOE_THRESHOLD"]:
        feedback_flags.append("KNEE_TOO_FORWARD")
    
    # Check lunge depth
    if stage == "down":
        if avg_knee_angle > LUNGE_CONFIG["FRONT_KNEE_ANGLE_MAX"] + 10:
            feedback_flags.append("NOT_DEEP_ENOUGH")
        elif avg_knee_angle < LUNGE_CONFIG["FRONT_KNEE_ANGLE_MIN"] - 5:
            feedback_flags.append("TOO_DEEP")
    
    # Check torso position
    if avg_torso_angle < LUNGE_CONFIG["TORSO_UPRIGHT_MIN"] - 10:
        feedback_flags.append("TORSO_LEANING")
    
    # If no specific feedback issues, provide general positive feedback
    if not feedback_flags:
        feedback_flags.append("GOOD_FORM")

    # Calculate rep score
    rep_score, score_label = calculate_rep_score("lunges", feedback_flags)
    
    # Compile the feedback into a string using the configured feedback messages
    feedback_message = ""
    for flag in feedback_flags:
        if flag in LUNGE_CONFIG["FEEDBACK"]:
            feedback_message += LUNGE_CONFIG["FEEDBACK"][flag] + " "
    
    feedback_message = feedback_message.strip()

    # Calculate exercise progress (0-1) for reference poses
    # Based on knee angle: 0 = straight leg, 1 = full bend
    progress = 0
    if avg_knee_angle < 150:
        progress = min(1.0, (150 - avg_knee_angle) / (150 - LUNGE_CONFIG["FRONT_KNEE_ANGLE_OPTIMAL"]))
    
    # Log the rep if this is a new rep and we have a session ID
    if counter > prev_counter and session_id:
        from session_state import record_rep
        metrics = {
            "knee_angle": avg_knee_angle,
            "knee_projection": avg_knee_projection,
            "torso_angle": avg_torso_angle
        }
        record_rep(session_id, "lunges", feedback_flags, metrics)
    
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
                elif group == "back":
                    affected_joints.extend([11, 12, 23, 24])  # Shoulders and hips for back
    
    # Remove duplicates
    affected_joints = list(set(affected_joints))
    
    # Create affected segments based on joints
    if 25 in affected_joints or 27 in affected_joints:  # Left knee or ankle
        affected_segments.append(["left_knee", "left_ankle"])
        
    if 26 in affected_joints or 28 in affected_joints:  # Right knee or ankle
        affected_segments.append(["right_knee", "right_ankle"])
        
    if 11 in affected_joints or 23 in affected_joints:  # Back issue - left side
        affected_segments.append(["left_shoulder", "left_hip"])
        
    if 12 in affected_joints or 24 in affected_joints:  # Back issue - right side
        affected_segments.append(["right_shoulder", "right_hip"])

    # Create advanced metrics dictionary
    advanced_metrics = {
        "knee_angle": avg_knee_angle,
        "knee_projection": avg_knee_projection,
        "torso_angle": avg_torso_angle
    }

    # Update state with metrics for potential future use
    new_state = {
        "counter": counter,
        "stage": stage,
        "kneeAngle": avg_knee_angle,
        "kneeProjection": avg_knee_projection,
        "torsoAngle": avg_torso_angle,
        "feedback": feedback_message,
        "feedback_flags": feedback_flags,
        "rep_score": rep_score,
        "score_label": score_label,
        "progress": progress,
        "affected_joints": affected_joints,
        "affected_segments": affected_segments,
        "advanced_metrics": advanced_metrics  # Add advanced metrics
    }
    
    exercise_state["lunges"] = new_state
    return new_state
