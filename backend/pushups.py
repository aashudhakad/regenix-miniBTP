import numpy as np
import mediapipe as mp
from state import exercise_state
from feedback_config import PUSHUP_CONFIG, FEEDBACK_TO_JOINTS, ADVANCED_FEEDBACK
from score_config import calculate_rep_score

def calculate_angle(a, b, c):
    a = np.array(a)  # First point (shoulder)
    b = np.array(b)  # Mid point (elbow)
    c = np.array(c)  # End point (wrist)
    
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    
    if angle > 180.0:
        angle = 360 - angle
    return angle

def check_body_alignment(shoulder, hip, ankle):
    """Check if body is in a straight line during pushup"""
    points = np.array([shoulder, hip, ankle])
    
    # Calculate the best-fit line through the points
    x = points[:, 0]
    y = points[:, 1]
    
    if len(set(x)) <= 1:  # Avoid division by zero if points are vertical
        return 0  # Perfect alignment
    
    # Calculate line of best fit
    coeffs = np.polyfit(x, y, 1)
    line_y = np.polyval(coeffs, x)
    
    # Calculate mean squared error as a measure of alignment
    mse = np.mean((y - line_y) ** 2)
    return mse  # Lower is better (closer to a straight line)

def process_landmarks(landmarks, tolerance, session_id=None):
    """
    Process landmarks for pushup form analysis with enhanced feedback
    """
    try:
        # Extract landmarks
        left_shoulder = [landmarks[11]['x'], landmarks[11]['y']]
        right_shoulder = [landmarks[12]['x'], landmarks[12]['y']]
        left_elbow = [landmarks[13]['x'], landmarks[13]['y']]
        right_elbow = [landmarks[14]['x'], landmarks[14]['y']]
        left_wrist = [landmarks[15]['x'], landmarks[15]['y']]
        right_wrist = [landmarks[16]['x'], landmarks[16]['y']]
        left_hip = [landmarks[23]['x'], landmarks[23]['y']]
        right_hip = [landmarks[24]['x'], landmarks[24]['y']]
        left_ankle = [landmarks[27]['x'], landmarks[27]['y']]
        right_ankle = [landmarks[28]['x'], landmarks[28]['y']]
    except Exception:
        return {"error": "Insufficient landmarks data."}
    
    # Calculate elbow angles
    left_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
    right_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
    avg_elbow_angle = (left_angle + right_angle) / 2
    
    # Calculate body alignment (shoulder-hip-ankle)
    mid_shoulder = [(left_shoulder[0] + right_shoulder[0])/2, (left_shoulder[1] + right_shoulder[1])/2]
    mid_hip = [(left_hip[0] + right_hip[0])/2, (left_hip[1] + right_hip[1])/2]
    mid_ankle = [(left_ankle[0] + right_ankle[0])/2, (left_ankle[1] + right_ankle[1])/2]
    
    alignment_score = check_body_alignment(mid_shoulder, mid_hip, mid_ankle)
    
    # Retrieve or initialize pushup state
    state = exercise_state.get("pushups", {"counter": 0, "stage": "up", "feedback": "N/A"})
    stage = state.get("stage", "up")
    counter = state.get("counter", 0)
    
    # Pushup counter logic
    if avg_elbow_angle > 150:  # Arms extended (up position)
        stage = "up"
    elif avg_elbow_angle < PUSHUP_CONFIG["ELBOW_ANGLE_MIN"] + 10 and stage == "up":  # Arms bent (down position)
        stage = "down"
        counter += 1
    
    # Generate detailed feedback
    feedback_flags = []
    
    # Check elbow angle (depth)
    if stage == "down":
        if avg_elbow_angle > PUSHUP_CONFIG["ELBOW_ANGLE_MAX"] + 10:
            feedback_flags.append("TOO_SHALLOW")
        elif avg_elbow_angle < PUSHUP_CONFIG["ELBOW_ANGLE_MIN"] - 5:
            feedback_flags.append("TOO_DEEP")
        else:
            feedback_flags.append("GOOD_DEPTH")
    
    # Check body alignment
    if alignment_score > PUSHUP_CONFIG["ALIGNMENT_THRESHOLD"]:
        # Determine if hips are too high or too low
        if mid_hip[1] < (mid_shoulder[1] + mid_ankle[1])/2:  # Y increases downward
            feedback_flags.append("HIPS_TOO_HIGH")
        else:
            feedback_flags.append("HIPS_TOO_LOW")
    
    # If no specific feedback issues, provide general positive feedback
    if not feedback_flags:
        feedback_flags.append("GOOD_FORM")

    # Calculate rep score
    rep_score, score_label = calculate_rep_score("pushups", feedback_flags)
    
    # Compile the feedback into a string using the configured feedback messages
    feedback_message = ""
    for flag in feedback_flags:
        if flag in PUSHUP_CONFIG["FEEDBACK"]:
            feedback_message += PUSHUP_CONFIG["FEEDBACK"][flag] + " "
        elif flag in ADVANCED_FEEDBACK:
            feedback_message += ADVANCED_FEEDBACK[flag] + " "
    
    feedback_message = feedback_message.strip()
    if not feedback_message:
        feedback_message = "Check your form"
    
    # Calculate exercise progress (0-1)
    # Based on elbow angle: 0 = straight arms, 1 = full bend
    progress = 0
    if avg_elbow_angle < 150:
        progress = min(1.0, (150 - avg_elbow_angle) / (150 - PUSHUP_CONFIG["ELBOW_ANGLE_OPTIMAL"]))

    # Log the rep if this is a new rep and we have a session ID
    if counter > state.get("counter", 0) and session_id:
        try:
            from session_state import record_rep
            metrics = {
                "elbow_angle": avg_elbow_angle,
                "alignment_score": alignment_score
            }
            record_rep(session_id, "pushups", feedback_flags, metrics)
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
                if group == "elbows":
                    affected_joints.extend([13, 14])  # Left and right elbow
                elif group == "shoulders":
                    affected_joints.extend([11, 12])  # Left and right shoulder
                elif group == "hips":
                    affected_joints.extend([23, 24])  # Left and right hip
                elif group == "back":
                    affected_joints.extend([11, 12, 23, 24])  # Shoulders and hips for back
    
    # Remove duplicates
    affected_joints = list(set(affected_joints))
    
    # Create affected segments based on joints
    if 11 in affected_joints or 13 in affected_joints:  # Left shoulder or elbow
        affected_segments.append(["left_shoulder", "left_elbow"])
        
    if 12 in affected_joints or 14 in affected_joints:  # Right shoulder or elbow
        affected_segments.append(["right_shoulder", "right_elbow"])
    
    if 11 in affected_joints or 23 in affected_joints:  # Left shoulder or hip
        affected_segments.append(["left_shoulder", "left_hip"])
        
    if 12 in affected_joints or 24 in affected_joints:  # Right shoulder or hip
        affected_segments.append(["right_shoulder", "right_hip"])
    
    if 23 in affected_joints or 24 in affected_joints:  # Both hips
        affected_segments.append(["left_hip", "right_hip"])
    
    # Advanced metrics
    advanced_metrics = {
        "elbow_angle": avg_elbow_angle,
        "alignment_score": alignment_score
    }

    new_state = {
        "counter": counter,
        "stage": stage,
        "elbowAngle": avg_elbow_angle,
        "bodyAlignment": alignment_score,
        "feedback": feedback_message,
        "feedback_flags": feedback_flags,
        "rep_score": rep_score,
        "score_label": score_label,
        "progress": progress,
        "affected_joints": affected_joints,
        "affected_segments": affected_segments,
        "advanced_metrics": advanced_metrics
    }
    
    exercise_state["pushups"] = new_state
    return new_state
