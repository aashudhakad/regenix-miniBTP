"""
API Router for Session Management
------------------------------
Provides endpoints for managing exercise sessions
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import time
from datetime import datetime

from session_state import (
    start_session, end_session, get_session, record_rep
)

router = APIRouter(prefix="/session", tags=["session"])

# Data models
class SessionRequest(BaseModel):
    user_id: Optional[str] = None
    exercise_type: Optional[str] = None

class RecordRepRequest(BaseModel):
    exercise: str
    feedback_flags: List[str]
    metrics: Optional[Dict[str, Any]] = None

@router.post("/start")
async def api_start_session(request: SessionRequest):
    session_id = start_session(request.user_id, request.exercise_type)
    return {"session_id": session_id, "start_time": datetime.now().isoformat()}

@router.post("/{session_id}/record")
async def api_record_rep(session_id: str, request: RecordRepRequest):
    rep_data = record_rep(
        session_id, 
        request.exercise, 
        request.feedback_flags, 
        request.metrics
    )
    if "error" in rep_data:
        raise HTTPException(status_code=404, detail=rep_data["error"])
    return rep_data

@router.get("/{session_id}")
async def api_get_session(session_id: str):
    session = get_session(session_id)
    if "error" in session:
        raise HTTPException(status_code=404, detail=session["error"])
    return session

@router.post("/{session_id}/end")
async def api_end_session(session_id: str, background_tasks: BackgroundTasks):
    # Use background tasks to avoid blocking while saving session data
    def end_session_task(sid):
        summary = end_session(sid)
        return summary
        
    background_tasks.add_task(end_session_task, session_id)
    return {"message": f"Ending session {session_id}"}

@router.get("/{session_id}/summary")
async def api_get_session_summary(session_id: str):
    session = get_session(session_id)
    if "error" in session:
        raise HTTPException(status_code=404, detail=session["error"])
        
    # Create a summary if session exists
    if not session.get("completed"):
        return {
            "session_id": session["session_id"],
            "status": "in_progress",
            "metrics": session["metrics"]
        }
    else:
        # Return the completed summary
        return {
            "session_id": session["session_id"],
            "status": "completed",
            "start_time": session["start_time"],
            "end_time": session["end_time"],
            "duration_seconds": session["duration_seconds"],
            "total_reps": session["metrics"]["total_reps"],
            "average_score": session["metrics"]["average_score"],
            "exercises": session["metrics"]["exercises"]
        }

@router.get("/{session_id}/report")
async def api_get_session_report(session_id: str):
    """
    Get a comprehensive report for an entire session including all exercises.
    
    Returns:
        - Overall session metrics
        - Exercise-by-exercise breakdown
        - Common issues and improvements
    """
    session = get_session(session_id)
    if "error" in session:
        raise HTTPException(status_code=404, detail=session["error"])
    
    # Generate comprehensive report
    report = generate_session_report(session)
    return report

@router.get("/{session_id}/exercise/{exercise_name}/report")
async def api_get_exercise_report(session_id: str, exercise_name: str):
    """
    Get a detailed report for a specific exercise within a session.
    
    Returns:
        - Exercise-specific metrics
        - Rep-by-rep breakdown
        - Form analysis and improvement suggestions
    """
    session = get_session(session_id)
    if "error" in session:
        raise HTTPException(status_code=404, detail=session["error"])
    
    # Check if exercise exists in this session
    exercises = session["metrics"].get("exercises", {})
    if exercise_name not in exercises:
        raise HTTPException(status_code=404, detail=f"Exercise '{exercise_name}' not found in this session")
    
    # Generate detailed exercise report
    report = generate_exercise_report(session, exercise_name)
    return report

@router.get("/{session_id}/exercises")
async def api_get_session_exercises(session_id: str):
    """
    Get a list of all exercises performed in a session with basic metrics.
    """
    session = get_session(session_id)
    if "error" in session:
        raise HTTPException(status_code=404, detail=session["error"])
    
    exercises = session["metrics"].get("exercises", {})
    exercise_data = {}
    
    for exercise_name, data in exercises.items():
        exercise_data[exercise_name] = {
            "reps": data.get("reps", 0),
            "average_score": data.get("average_score", 0),
            "common_issues": get_top_issues(data.get("feedback_counts", {}), 3)
        }
    
    return {
        "session_id": session_id,
        "total_reps": session["metrics"].get("total_reps", 0),
        "exercises": exercise_data
    }

@router.get("/{session_id}/reps")
async def api_get_session_reps(session_id: str):
    """
    Get detailed data for all reps across all exercises in the session.
    """
    session = get_session(session_id)
    if "error" in session:
        raise HTTPException(status_code=404, detail=session["error"])
    
    # Return the full rep log for this session
    return {
        "session_id": session_id,
        "rep_count": len(session.get("rep_log", [])),
        "reps": session.get("rep_log", [])
    }

@router.get("/{session_id}/exercise/{exercise_name}/reps")
async def api_get_exercise_reps(session_id: str, exercise_name: str):
    """
    Get detailed data for all reps of a specific exercise.
    """
    session = get_session(session_id)
    if "error" in session:
        raise HTTPException(status_code=404, detail=session["error"])
    
    # Filter rep log for the specified exercise
    rep_log = session.get("rep_log", [])
    exercise_reps = [rep for rep in rep_log if rep.get("exercise") == exercise_name]
    
    return {
        "session_id": session_id,
        "exercise": exercise_name,
        "rep_count": len(exercise_reps),
        "reps": exercise_reps
    }

# Helper functions for generating reports

def generate_session_report(session):
    """Generate a comprehensive report for a session"""
    total_reps = session["metrics"].get("total_reps", 0)
    avg_score = session["metrics"].get("average_score", 0)
    
    exercises = session["metrics"].get("exercises", {})
    exercise_reports = {}
    
    # Compile overall stats and insights
    common_issues = {}
    
    for exercise_name, data in exercises.items():
        # Collect stats for this exercise
        exercise_reports[exercise_name] = {
            "reps": data.get("reps", 0),
            "average_score": data.get("average_score", 0),
            "common_issues": get_top_issues(data.get("feedback_counts", {}), 3)
        }
        
        # Add to common issues
        for issue, count in data.get("feedback_counts", {}).items():
            if issue not in ["GOOD_FORM", "GOOD_CURL", "GOOD_DEPTH"]:
                if issue not in common_issues:
                    common_issues[issue] = 0
                common_issues[issue] += count
    
    # Parse start and end time
    start_time = session.get("start_time", "")
    end_time = session.get("end_time", "")
    duration = session.get("duration_seconds", 0)
    
    # Generate improvement suggestions
    improvements = generate_improvement_suggestions(common_issues)
    
    return {
        "session_id": session["session_id"],
        "user_id": session.get("user_id"),
        "start_time": start_time,
        "end_time": end_time,
        "duration_seconds": duration,
        "summary": {
            "total_reps": total_reps,
            "average_score": avg_score,
            "total_exercises": len(exercises),
            "performance_rating": get_performance_rating(avg_score)
        },
        "exercises": exercise_reports,
        "common_issues": get_top_issues(common_issues, 5),
        "improvement_suggestions": improvements
    }

def generate_exercise_report(session, exercise_name):
    """Generate a detailed report for a specific exercise"""
    exercises = session["metrics"].get("exercises", {})
    if exercise_name not in exercises:
        return {"error": f"Exercise '{exercise_name}' not found"}
    
    exercise_data = exercises[exercise_name]
    
    # Get rep-by-rep data
    rep_log = session.get("rep_log", [])
    exercise_reps = [rep for rep in rep_log if rep.get("exercise") == exercise_name]
    
    # Analyze progress over time
    rep_scores = [rep.get("score", 0) for rep in exercise_reps]
    trend = "improving" if is_improving(rep_scores) else "consistent"
    if len(rep_scores) >= 3 and rep_scores[-1] < sum(rep_scores[:-1]) / len(rep_scores[:-1]):
        trend = "declining"
    
    # Generate form analysis
    form_issues = {}
    for rep in exercise_reps:
        for flag in rep.get("feedback_flags", []):
            if flag not in ["GOOD_FORM", "GOOD_CURL", "GOOD_DEPTH"]:
                if flag not in form_issues:
                    form_issues[flag] = 0
                form_issues[flag] += 1
    
    # Analyze metrics
    metrics_analysis = {}
    if exercise_reps and exercise_reps[0].get("metrics"):
        first_rep = exercise_reps[0]
        metric_keys = first_rep.get("metrics", {}).keys()
        
        for key in metric_keys:
            values = [rep.get("metrics", {}).get(key, 0) for rep in exercise_reps if key in rep.get("metrics", {})]
            if values:
                metrics_analysis[key] = {
                    "average": sum(values) / len(values),
                    "min": min(values),
                    "max": max(values)
                }
    
    # Generate improvement suggestions specific to this exercise
    improvements = generate_exercise_improvement_suggestions(exercise_name, form_issues)
    
    return {
        "session_id": session["session_id"],
        "exercise": exercise_name,
        "summary": {
            "reps": exercise_data.get("reps", 0),
            "average_score": exercise_data.get("average_score", 0),
            "performance_rating": get_performance_rating(exercise_data.get("average_score", 0)),
            "trend": trend
        },
        "reps_breakdown": [{
            "rep_number": i+1,
            "score": rep.get("score", 0),
            "timestamp": rep.get("timestamp", ""),
            "feedback": rep.get("feedback_flags", []),
            "metrics": rep.get("metrics", {})
        } for i, rep in enumerate(exercise_reps)],
        "form_analysis": {
            "common_issues": get_top_issues(form_issues, 3),
            "metrics_analysis": metrics_analysis
        },
        "improvement_suggestions": improvements
    }

def get_top_issues(issues_dict, limit=3):
    """Extract the top N issues from a dictionary of issue counts"""
    return sorted(
        [(k, v) for k, v in issues_dict.items() if k not in ["GOOD_FORM", "GOOD_CURL", "GOOD_DEPTH"]],
        key=lambda x: x[1],
        reverse=True
    )[:limit]

def get_performance_rating(score):
    """Convert a numeric score to a descriptive rating"""
    if score >= 90:
        return "Excellent"
    elif score >= 80:
        return "Very Good"
    elif score >= 70:
        return "Good"
    elif score >= 60:
        return "Satisfactory"
    elif score >= 50:
        return "Needs Improvement"
    else:
        return "Poor"

def is_improving(scores):
    """Determine if scores show an improving trend"""
    if len(scores) < 3:
        return True
    
    # Simple approach: is the last score better than the average of previous scores?
    prev_avg = sum(scores[:-1]) / len(scores[:-1])
    return scores[-1] > prev_avg

def generate_improvement_suggestions(issues):
    """Generate specific improvement suggestions based on common issues"""
    suggestions = []
    
    # Map issues to specific suggestions
    issue_to_suggestion = {
        "DEPTH_TOO_SHALLOW": "Focus on achieving proper depth in your squats. Try using a mirror or having a friend check your form.",
        "KNEES_TOO_FORWARD": "Keep your weight in your heels during squats and avoid letting your knees extend past your toes.",
        "BACK_TOO_BENT": "Maintain a neutral spine posture during exercises. Consider core strengthening exercises to help maintain proper posture.",
        "INCOMPLETE_CURL": "Complete the full range of motion in bicep curls, bringing the weight all the way up to your shoulder.",
        "INCOMPLETE_EXTENSION": "Fully extend your arms at the bottom of each bicep curl for maximum benefit.",
        "USING_MOMENTUM": "Focus on controlled movements rather than using momentum. Try reducing the weight if necessary.",
        "SHOULDER_SWINGING": "Keep your shoulders stable during arm exercises. Consider practicing with lighter weights to master the form.",
        "TOO_SHALLOW": "Increase your range of motion to get maximum benefit from the exercise.",
        "HIPS_TOO_HIGH": "Keep your body in a straight line during pushups by engaging your core muscles.",
        "HIPS_TOO_LOW": "Prevent sagging in plank or pushup positions by strengthening your core.",
        "KNEE_TOO_FORWARD": "In lunges, ensure your knee stays aligned with your ankle to prevent strain.",
        "TORSO_LEANING": "Keep your torso upright during lunges by engaging your core muscles.",
        "NOT_HIGH_ENOUGH": "Increase your range of motion to fully engage the target muscles.",
        "PULLING_NECK": "Avoid strain by not pulling on your neck during situps. Focus on using your abdominal muscles.",
    }
    
    # Add general suggestions first
    suggestions.append("Maintain consistent practice for better muscle memory and form.")
    suggestions.append("Consider recording your exercises to self-assess your form.")
    
    # Add specific suggestions based on issues
    for issue in issues:
        if issue in issue_to_suggestion and issue_to_suggestion[issue] not in suggestions:
            suggestions.append(issue_to_suggestion[issue])
    
    # Add a maximum of 5 suggestions
    return suggestions[:5]

def generate_exercise_improvement_suggestions(exercise_name, issues):
    """Generate exercise-specific improvement suggestions"""
    suggestions = []
    
    # Exercise-specific general suggestions
    exercise_suggestions = {
        "squats": [
            "Practice squats with proper form before adding heavy weights.",
            "Focus on keeping your chest up throughout the movement."
        ],
        "deadlifts": [
            "Maintain a neutral spine throughout the deadlift motion.",
            "Start with lighter weights to master hip hinge movement pattern."
        ],
        "lunges": [
            "Keep your front knee tracking in line with your second toe.",
            "Maintain an upright posture throughout the lunge."
        ],
        "pushups": [
            "Keep your body in a straight line from head to heels.",
            "Focus on controlled movement rather than speed."
        ],
        "situps": [
            "Engage your core throughout the entire movement.",
            "Avoid pulling on your neck by keeping your hands light on your head."
        ],
        "bicep_curls": [
            "Focus on controlled movements rather than heavy weights.",
            "Keep your upper arms stationary throughout the curl."
        ]
    }
    
    # Add exercise-specific suggestions
    if exercise_name in exercise_suggestions:
        suggestions.extend(exercise_suggestions[exercise_name])
    
    # Add issue-specific suggestions using the general function
    issue_suggestions = generate_improvement_suggestions(issues)
    for suggestion in issue_suggestions:
        if suggestion not in suggestions:
            suggestions.append(suggestion)
    
    return suggestions[:5]  # Limit to 5 suggestions
