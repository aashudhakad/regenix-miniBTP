import numpy as np
import time
from state import exercise_state
from feedback_config import DEADLIFT_CONFIG, DEADLIFT_METRICS, ADVANCED_FEEDBACK, FEEDBACK_TO_JOINTS
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

def calculate_bar_path_deviation(shoulder, hip, knee, ankle):
    """Calculate how far the bar (approximated at hip) deviates from mid-foot line"""
    hip = np.array(hip)
    ankle = np.array(ankle)
    
    # Ideal bar path should be straight down over mid-foot
    midfoot_x = ankle[0]  # Assume midfoot is at same x as ankle
    
    # Calculate deviation as horizontal distance from hip to midfoot line
    deviation = abs(hip[0] - midfoot_x)
    
    # Normalize by height (hip to ankle distance)
    height = abs(hip[1] - ankle[1]) 
    if height == 0:  # Avoid division by zero
        return 0
        
    normalized_deviation = deviation / height
    return normalized_deviation

def process_landmarks(landmarks, tolerance=0.0, session_id=None):
    """
    Process landmarks for deadlift form analysis with enhanced feedback and advanced metrics
    """
    back_angles = []
    hip_angles = []
    bar_path_deviations = []
    lumbar_curvatures = []  # New metric
    
    # Record timestamp for tempo analysis
    current_time = time.time()
    
    # Calculate back angle (neck to hips to knees)
    try:
        # Neck (upper back): use nose as a proxy if neck isn't reliable
        neck = [landmarks[0]['x'], landmarks[0]['y']]  # Use nose as a reference point
        
        # Mid hip point for better center of mass representation
        mid_hip = [(landmarks[23]['x'] + landmarks[24]['x'])/2, 
                   (landmarks[23]['y'] + landmarks[24]['y'])/2]
        
        # Mid knee point
        mid_knee = [(landmarks[25]['x'] + landmarks[26]['x'])/2, 
                    (landmarks[25]['y'] + landmarks[26]['y'])/2]
                    
        # Mid ankle point
        mid_ankle = [(landmarks[27]['x'] + landmarks[28]['x'])/2, 
                    (landmarks[27]['y'] + landmarks[28]['y'])/2]
        
        # Mid shoulder
        mid_shoulder = [(landmarks[11]['x'] + landmarks[12]['x'])/2,
                        (landmarks[11]['y'] + landmarks[12]['y'])/2]
        
        # Back angle is the angle from neck through hips to knees
        back_angle = calculate_angle(neck, mid_hip, mid_knee)
        back_angles.append(back_angle)
        
        # Hip angle (shoulder-hip-knee) for hip hinge depth
        hip_angle = calculate_angle(mid_shoulder, mid_hip, mid_knee)
        hip_angles.append(hip_angle)
        
        # Calculate bar path deviation (new metric)
        bar_deviation = calculate_bar_path_deviation(mid_shoulder, mid_hip, mid_knee, mid_ankle)
        bar_path_deviations.append(bar_deviation)
        
        # Approximate lumbar curve by finding mid-point deviation (simplified)
        # In a real implementation, you would use more spine points if available
        mid_back_y = (neck[1] + mid_hip[1]) / 2
        expected_mid_back_x = (neck[0] + mid_hip[0]) / 2
        
        # Use a mid-back landmark if available, or approximate
        if 7 in landmarks:  # If mid-back point is available
            actual_mid_back = [landmarks[7]['x'], landmarks[7]['y']]
        else:
            # Approximate mid-back position
            actual_mid_back = [expected_mid_back_x, mid_back_y]
            
        # Measure curve as horizontal deviation from straight line
        lumbar_deviation = abs(actual_mid_back[0] - expected_mid_back_x)
        height = abs(neck[1] - mid_hip[1])
        lumbar_curvature = (lumbar_deviation / height) * 100 if height > 0 else 0
        lumbar_curvatures.append(lumbar_curvature)
        
    except Exception as e:
        pass

    if not back_angles:
        return {"error": "Insufficient landmarks data."}

    # Average the angles and metrics
    avg_back_angle = sum(back_angles) / len(back_angles)
    avg_hip_angle = sum(hip_angles) / len(hip_angles) if hip_angles else 180
    avg_bar_deviation = sum(bar_path_deviations) / len(bar_path_deviations) if bar_path_deviations else 0
    avg_lumbar_curvature = sum(lumbar_curvatures) / len(lumbar_curvatures) if lumbar_curvatures else 0

    # Retrieve the current state
    state = exercise_state.get("deadlifts", {
        "repCount": 0, 
        "stage": "up", 
        "feedback": "N/A",
        "last_stage_time": current_time
    })
    
    stage = state.get("stage", "up")
    counter = state.get("repCount", 0)
    prev_counter = counter  # Track for new rep detection
    last_stage_time = state.get("last_stage_time", current_time)
    
    # Calculate phase timing
    phase_duration = current_time - last_stage_time

    # Deadlift detection logic
    if avg_back_angle > 160:  # Standing upright
        if stage == "down":
            stage = "up"
            counter += 1
            # Store concentric phase duration
            state["concentric_time"] = phase_duration
            last_stage_time = current_time
    elif avg_back_angle < DEADLIFT_CONFIG["HIP_HINGE_DEPTH_MIN"]:  # Bent position
        if stage == "up":
            stage = "down"
            # Store eccentric phase duration
            state["eccentric_time"] = phase_duration
            last_stage_time = current_time

    # Generate detailed feedback
    feedback_flags = []
    
    # Standard feedback
    # Check back angle safety - this is critical for deadlift
    if avg_back_angle < DEADLIFT_CONFIG["BACK_ANGLE_WARNING"]:
        feedback_flags.append("BACK_TOO_BENT")
    
    # Check hip hinge depth
    if stage == "down":
        if avg_hip_angle > DEADLIFT_CONFIG["HIP_HINGE_DEPTH_MAX"]:
            feedback_flags.append("NOT_DEEP_ENOUGH")
        elif avg_hip_angle < DEADLIFT_CONFIG["HIP_HINGE_DEPTH_MIN"] - 10:
            feedback_flags.append("TOO_DEEP")
    
    # Check if standing fully upright at the top
    if stage == "up" and avg_back_angle < DEADLIFT_CONFIG["BACK_ANGLE_MIN"]:
        feedback_flags.append("STAND_STRAIGHT")
    
    # Advanced metrics feedback
    if avg_bar_deviation > DEADLIFT_METRICS["BAR_PATH_MAX_DISTANCE"]:
        feedback_flags.append("DEADLIFT_BAR_PATH")
        
    if avg_lumbar_curvature > DEADLIFT_METRICS["LUMBAR_FLEXION_MAX"]:
        feedback_flags.append("DEADLIFT_LUMBAR_FLEXION")
    
    # Tempo feedback
    if "concentric_time" in state and state["concentric_time"] < DEADLIFT_METRICS["CONCENTRIC_TIME_OPTIMAL"] * 0.7:
        feedback_flags.append("DEADLIFT_TEMPO_FAST")
    
    # If no specific feedback issues, provide general positive feedback
    if not feedback_flags:
        feedback_flags.append("GOOD_FORM")

    # Calculate rep score
    rep_score, score_label = calculate_rep_score("deadlifts", feedback_flags)

    # Prepare informative feedback message using the configured feedback messages
    feedback_message = ""
    for flag in feedback_flags:
        if flag in DEADLIFT_CONFIG["FEEDBACK"]:
            feedback_message += DEADLIFT_CONFIG["FEEDBACK"][flag] + " "
        elif flag == "DEADLIFT_BAR_PATH":
            feedback_message += ADVANCED_FEEDBACK["DEADLIFT_BAR_PATH"] + " "
        elif flag == "DEADLIFT_LUMBAR_FLEXION":
            feedback_message += ADVANCED_FEEDBACK["DEADLIFT_LUMBAR_FLEXION"] + " "
        elif flag == "DEADLIFT_TEMPO_FAST":
            feedback_message += ADVANCED_FEEDBACK["DEADLIFT_TEMPO_FAST"] + " "
    
    feedback_message = feedback_message.strip()
    
    # Calculate exercise progress (0-1) for reference poses
    # Based on back angle: 0 = upright, 1 = bent
    progress = 0
    if avg_back_angle < 160:
        progress = min(1.0, (160 - avg_back_angle) / (160 - DEADLIFT_CONFIG["HIP_HINGE_DEPTH_MIN"]))

    # Prepare all metrics for session tracking
    advanced_metrics = {
        "back_angle": avg_back_angle,
        "hip_angle": avg_hip_angle,
        "bar_deviation": avg_bar_deviation,
        "lumbar_curvature": avg_lumbar_curvature,
        "concentric_time": state.get("concentric_time", 0),
        "eccentric_time": state.get("eccentric_time", 0),
    }
    
    # Log the rep if this is a new rep and we have a session ID
    if counter > prev_counter and session_id:
        try:
            from session_state import record_rep
            record_rep(session_id, "deadlifts", feedback_flags, advanced_metrics)
        except ImportError:
            # Session state module not available
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
                    affected_joints.extend([11, 12, 23, 24])  # Shoulders and hips for back
    
    # Remove duplicates
    affected_joints = list(set(affected_joints))
    
    # Create affected segments based on joints
    if 11 in affected_joints or 23 in affected_joints:  # Back issue - left side
        affected_segments.append(["left_shoulder", "left_hip"])
        
    if 12 in affected_joints or 24 in affected_joints:  # Back issue - right side
        affected_segments.append(["right_shoulder", "right_hip"])
        
    if 23 in affected_joints or 25 in affected_joints:  # Left hip or knee
        affected_segments.append(["left_hip", "left_knee"])
        
    if 24 in affected_joints or 26 in affected_joints:  # Right hip or knee
        affected_segments.append(["right_hip", "right_knee"])

    # Update state with both basic and advanced metrics
    new_state = {
        "repCount": counter,
        "stage": stage,
        "backAngle": avg_back_angle,
        "hipAngle": avg_hip_angle,
        "barDeviation": avg_bar_deviation,
        "lumbarCurvature": avg_lumbar_curvature,
        "last_stage_time": last_stage_time,
        "concentric_time": state.get("concentric_time", 0),
        "eccentric_time": state.get("eccentric_time", 0),
        "feedback": feedback_message.strip(),
        "feedback_flags": feedback_flags,
        "rep_score": rep_score,
        "score_label": score_label,
        "progress": progress,  # Add progress field
        "advanced_metrics": advanced_metrics,
        "affected_joints": affected_joints,
        "affected_segments": affected_segments
    }
    
    exercise_state["deadlifts"] = new_state
    return new_state