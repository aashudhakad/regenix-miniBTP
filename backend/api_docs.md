# ReGenix AI Backend API Documentation

## Overview

The AI Backend provides real-time pose analysis for exercise form evaluation. It accepts MediaPipe pose landmarks and returns detailed metrics and feedback with minimal latency. This backend focuses exclusively on biomechanical analysis, with no user or session persistence.

## Core Endpoints

### Process Exercise Landmarks

```
POST /landmarks/{exercise_name}?session_id={optional_session_id}&tolerance={optional_tolerance}
```

Analyzes a single frame of pose data for a specific exercise and returns detailed form analysis.

**Request Parameters:**
- `exercise_name` (path): One of: "squats", "pushups", "deadlifts", "lunges", "situps", "bicep_curls"
- `tolerance` (query, optional): Adjustment for detection sensitivity (default: 10)
- `session_id` (query, optional): For stateful analysis within a session (handled by MERN backend)

**Request Body:**
```json
{
  "landmarks": [
    {"x": 0.5, "y": 0.2, "z": 0.1, "visibility": 0.98},
    {"x": 0.52, "y": 0.22, "z": 0.05, "visibility": 0.97},
    // ... all 33 MediaPipe pose landmarks
  ]
}
```

**Response:**
```json
{
  "counter": 5,
  "stage": "down",
  "feedback": "Keep your knees aligned with your toes",
  "feedback_flags": ["knee_valgus", "good_depth"],
  "rep_score": 85,
  "score_label": "Good",
  "advanced_metrics": {
    "knee_angle": 95.2,
    "torso_angle": 45.6,
    "knee_valgus": 7.2,
    "knee_asymmetry": 3.1,
    "descent_time": 1.2,
    "concentric_time": 2.1
  },
  "affected_joints": [25, 26],
  "affected_segments": [["left_hip", "left_knee"], ["right_hip", "right_knee"]],
  "progress": 0.7,
  "processing_time_ms": 12.45
}
```

### Reset Exercise State

```
POST /reset/{exercise_name}
```

Resets the counter and state tracking for a specific exercise. Use when starting a new set.

**Request Parameters:**
- `exercise_name` (path): One of: "squats", "pushups", "deadlifts", "lunges", "situps", "bicep_curls"

**Response:**
```json
{
  "message": "Reset squats state successfully"
}
```

### Health Check

```
GET /status
```

Returns API health status and version information.

**Response:**
```json
{
  "status": "operational",
  "version": "1.0.0",
  "timestamp": 1713614159.23
}
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Detailed error message",
  "status_code": 400
}
```

Common errors:
- 400: Invalid landmarks or parameters
- 404: Exercise not found
- 500: Processing error

## Implementation Notes

1. The AI Backend maintains minimal state - just enough to track reps and movement stages
2. All user data persistence happens in the MERN backend
3. For optimal performance, send landmarks directly from frontend to AI backend
4. After session completion, collected metrics should be sent to MERN backend for storage
5. The red segment/joint highlighting feature is now fully implemented across all exercises.
