"""
Scoring Configuration
--------------------
Defines weights and scoring rules for exercise form evaluation.
"""
import math

# Penalty weights for different types of form issues
# Higher weight = more severe issue
PENALTY_WEIGHTS = {
    # Squat penalties
    "DEPTH_TOO_SHALLOW": 2.0,      # Not squatting deep enough
    "KNEES_TOO_FORWARD": 1.5,      # Knees tracking too far forward
    "BACK_TOO_BENT": 2.5,          # Excessive forward lean
    
    # Deadlift penalties
    "BACK_TOO_BENT": 3.0,          # Rounded back (most severe - injury risk)
    "NOT_DEEP_ENOUGH": 1.5,        # Not hinging enough at hips
    "TOO_DEEP": 1.0,               # Going too low
    "STAND_STRAIGHT": 1.0,         # Not standing fully upright at top
    
    # Pushup penalties
    "TOO_SHALLOW": 1.5,            # Not going low enough
    "TOO_DEEP": 1.0,               # Going too low (shoulder risk)
    "HIPS_TOO_HIGH": 2.0,          # Pike position (not engaging chest)
    "HIPS_TOO_LOW": 2.0,           # Sagging (core not engaged)
    
    # Lunge penalties
    "KNEE_TOO_FORWARD": 2.0,       # Front knee past toes (injury risk)
    "NOT_DEEP_ENOUGH": 1.5,        # Not deep enough lunge
    "TOO_DEEP": 1.0,               # Too deep (knee strain)
    "TORSO_LEANING": 1.5,          # Not keeping torso upright
    
    # Situp penalties
    "NOT_HIGH_ENOUGH": 1.5,        # Not coming up high enough
    "TOO_HIGH": 1.0,               # Straining too high
    "PULLING_NECK": 2.5,           # Pulling on neck (injury risk)
    
    # Bicep curl penalties
    "INCOMPLETE_CURL": 1.5,        # Not curling fully up
    "INCOMPLETE_EXTENSION": 1.0,   # Not extending fully down
    "USING_MOMENTUM": 2.0,         # Using momentum/swinging
    "SHOULDER_SWINGING": 2.5,      # Excessive shoulder movement
}

# Maximum possible penalty per rep (sum of worst-case penalties)
MAX_POSSIBLE_PENALTY = {
    "squats": 6.0,        # DEPTH_TOO_SHALLOW + KNEES_TOO_FORWARD + BACK_TOO_BENT
    "deadlifts": 5.5,     # BACK_TOO_BENT + NOT_DEEP_ENOUGH + STAND_STRAIGHT
    "pushups": 5.0,       # TOO_SHALLOW + HIPS_TOO_HIGH + HIPS_TOO_LOW
    "lunges": 6.0,        # KNEE_TOO_FORWARD + NOT_DEEP_ENOUGH + TORSO_LEANING + TOO_DEEP
    "situps": 5.0,        # NOT_HIGH_ENOUGH + PULLING_NECK + TOO_HIGH
    "bicep_curls": 7.0,   # INCOMPLETE_CURL + INCOMPLETE_EXTENSION + USING_MOMENTUM + SHOULDER_SWINGING
}

# Difficulty scaling for different exercises (higher = more forgiving scoring)
DIFFICULTY_SCALING = {
    "squats": 1.0,
    "deadlifts": 0.9,     # Slightly more forgiving (technique complex)
    "pushups": 1.0, 
    "lunges": 1.1,        # Slightly less forgiving (simpler movement)
    "situps": 1.0,
    "bicep_curls": 1.0,
}

# Score labels and thresholds
SCORE_LABELS = [
    (95, "Perfect!"),
    (85, "Excellent"),
    (70, "Good"),
    (50, "Adequate"),
    (30, "Needs Work"),
    (0, "Poor Form")
]

def calculate_rep_score(exercise, feedback_flags):
    """
    Calculate a score (0-100) based on feedback flags.
    
    Args:
        exercise: String name of the exercise
        feedback_flags: List of feedback flag strings
    
    Returns:
        score: Integer 0-100
        label: Text label for the score
    """
    if "GOOD_FORM" in feedback_flags or "GOOD_CURL" in feedback_flags or "GOOD_DEPTH" in feedback_flags:
        return 100, "Perfect!"
        
    # Sum up penalties
    total_penalty = 0
    for flag in feedback_flags:
        if flag in PENALTY_WEIGHTS:
            total_penalty += PENALTY_WEIGHTS[flag]
    
    # Get max possible penalty and scaling for this exercise
    max_penalty = MAX_POSSIBLE_PENALTY.get(exercise, 5.0)
    scaling = DIFFICULTY_SCALING.get(exercise, 1.0)
    
    # Calculate normalized score (0-1)
    normalized_score = max(0.0, 1.0 - (total_penalty / max_penalty) * scaling)
    
    # Convert to 0-100 scale
    score = int(normalized_score * 100)
    
    # Find appropriate label
    label = "Poor Form"  # Default
    for threshold, label_text in SCORE_LABELS:
        if score >= threshold:
            label = label_text
            break
            
    return score, label

def get_score_color(score):
    """Returns an RGB hex color based on score (green for high, red for low)"""
    if score >= 85:
        return "#4CAF50"  # Green
    elif score >= 70:
        return "#8BC34A"  # Light Green
    elif score >= 50:
        return "#FFEB3B"  # Yellow
    elif score >= 30:
        return "#FF9800"  # Orange
    else:
        return "#F44336"  # Red
