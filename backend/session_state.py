"""
Session State Management
----------------------
Tracks exercise sessions, logs rep data, and computes aggregate scores.
"""
import time
import uuid
import json
from datetime import datetime
from pathlib import Path
import threading
from score_config import calculate_rep_score

# Global dictionary to store session data in memory
active_sessions = {}

# Thread lock to prevent race conditions when updating session data
session_lock = threading.Lock()

# Directory for storing session logs
LOGS_DIR = Path("session_logs")
LOGS_DIR.mkdir(exist_ok=True)

def generate_session_id():
    """Generate a unique session ID"""
    return str(uuid.uuid4())

def start_session(user_id=None, exercise_type=None):
    """
    Start a new exercise tracking session.
    
    Args:
        user_id: Optional user identifier
        exercise_type: Optional exercise type
        
    Returns:
        session_id: Unique session identifier
    """
    session_id = generate_session_id()
    
    session_data = {
        "session_id": session_id,
        "user_id": user_id,
        "exercise_type": exercise_type,
        "start_time": datetime.now().isoformat(),
        "rep_log": [],
        "completed": False,
        "metrics": {
            "total_reps": 0,
            "total_score": 0,
            "average_score": 0,
            "exercises": {}
        }
    }
    
    with session_lock:
        active_sessions[session_id] = session_data
    
    return session_id

def record_rep(session_id, exercise, feedback_flags, metrics=None):
    """
    Record data for a single rep in a session.
    
    Args:
        session_id: Session identifier
        exercise: Exercise type
        feedback_flags: List of feedback flags from the exercise
        metrics: Optional dict of additional metrics (angles, positions, etc.)
        
    Returns:
        rep_data: Dictionary with rep information including score
    """
    if session_id not in active_sessions:
        return {"error": "Invalid session ID"}
    
    # Calculate score based on feedback
    score, label = calculate_rep_score(exercise, feedback_flags)
    
    # Create rep record
    timestamp = datetime.now().isoformat()
    rep_data = {
        "timestamp": timestamp,
        "exercise": exercise,
        "feedback_flags": feedback_flags,
        "score": score,
        "score_label": label,
        "metrics": metrics or {}
    }
    
    # Update session data
    with session_lock:
        session = active_sessions[session_id]
        session["rep_log"].append(rep_data)
        
        # Update aggregated metrics
        session["metrics"]["total_reps"] += 1
        session["metrics"]["total_score"] += score
        session["metrics"]["average_score"] = (
            session["metrics"]["total_score"] / session["metrics"]["total_reps"]
        )
        
        # Per exercise metrics
        if exercise not in session["metrics"]["exercises"]:
            session["metrics"]["exercises"][exercise] = {
                "reps": 0,
                "total_score": 0,
                "average_score": 0,
                "feedback_counts": {}
            }
        
        exercise_metrics = session["metrics"]["exercises"][exercise]
        exercise_metrics["reps"] += 1
        exercise_metrics["total_score"] += score
        exercise_metrics["average_score"] = (
            exercise_metrics["total_score"] / exercise_metrics["reps"]
        )
        
        # Count feedback occurrences
        for flag in feedback_flags:
            if flag not in exercise_metrics["feedback_counts"]:
                exercise_metrics["feedback_counts"][flag] = 0
            exercise_metrics["feedback_counts"][flag] += 1
    
    return rep_data

def end_session(session_id):
    """
    End a session and save data to disk.
    
    Args:
        session_id: Session identifier
        
    Returns:
        session_summary: Dictionary with session summary data
    """
    if session_id not in active_sessions:
        return {"error": "Invalid session ID"}
    
    with session_lock:
        session = active_sessions[session_id]
        session["end_time"] = datetime.now().isoformat()
        session["completed"] = True
        
        # Calculate duration
        start = datetime.fromisoformat(session["start_time"])
        end = datetime.fromisoformat(session["end_time"])
        duration_sec = (end - start).total_seconds()
        session["duration_seconds"] = duration_sec
        
        # Create summary
        summary = {
            "session_id": session["session_id"],
            "user_id": session["user_id"],
            "start_time": session["start_time"],
            "end_time": session["end_time"],
            "duration_seconds": duration_sec,
            "total_reps": session["metrics"]["total_reps"],
            "average_score": session["metrics"]["average_score"],
            "exercises": {}
        }
        
        # Add exercise summaries
        for ex_name, ex_data in session["metrics"]["exercises"].items():
            summary["exercises"][ex_name] = {
                "reps": ex_data["reps"],
                "average_score": ex_data["average_score"],
                "most_common_issues": sorted(
                    [(k, v) for k, v in ex_data["feedback_counts"].items() 
                     if k not in ["GOOD_FORM", "GOOD_CURL", "GOOD_DEPTH"]],
                    key=lambda x: x[1],
                    reverse=True
                )[:3]  # Top 3 issues
            }
        
        # Save to file
        filename = f"{LOGS_DIR}/{session_id}.json"
        with open(filename, "w") as f:
            json.dump(session, f, indent=2)
            
        # Optionally remove from memory to save RAM
        # del active_sessions[session_id]
        
    return summary

def get_session(session_id):
    """Retrieve session data"""
    if session_id in active_sessions:
        return active_sessions[session_id]
    
    # Try to load from disk if not in memory
    filename = f"{LOGS_DIR}/{session_id}.json"
    try:
        with open(filename, "r") as f:
            return json.load(f)
    except:
        return {"error": "Session not found"}
