# ReGenix Frontend Technical Documentation

This comprehensive technical documentation outlines how the ReGenix frontend processes MediaPipe pose data, communicates with the AI backend, and renders feedback to users. This guide is intended for React developers who need to rebuild the frontend while maintaining backend compatibility.

## Table of Contents

1. Application Overview
2. Frontend Architecture
3. MediaPipe Integration
4. Frontend Processing Requirements
5. Backend Communication Protocol
6. Data Visualization
7. Exercise-Specific Considerations
8. User Flow & State Management
9. Implementation Checklist

## 1. Application Overview

ReGenix is an AI-powered exercise tracking application that:
- Uses camera input to track user movements during exercises
- Processes pose data in real-time
- Provides immediate feedback on form and technique
- Counts repetitions automatically
- Tracks sets and overall progress

The application supports 6 exercise types:
- Bicep curls
- Deadlifts
- Lunges
- Push-ups
- Sit-ups
- Squats

## 2. Frontend Architecture

The frontend consists of three main pages:
- **Landing Page**: Exercise selection
- **User Details**: Optional profile information collection
- **Exercise Page**: Live exercise tracking with camera feed and feedback

Key data flows:
1. Camera feed → MediaPipe processing → Pose landmarks
2. Pose landmarks → AI backend → Feedback data
3. Feedback data → UI updates and skeleton visualization

## 3. MediaPipe Integration

### Required Dependencies

```javascript
// MediaPipe libraries
import { Camera } from '@mediapipe/camera_utils';
import { Pose } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
```

### Pose Configuration

```javascript
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,         // Balance between performance and accuracy
  smoothLandmarks: true,      // Temporal filtering for stability
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});
```

### Camera Setup

```javascript
const camera = new Camera(videoElement, {
  onFrame: async () => {
    // Process each video frame through MediaPipe
    await pose.send({image: videoElement});
  },
  width: 640,
  height: 480
});

camera.start();
```

## 4. Frontend Processing Requirements

The frontend must perform several preprocessing steps before sending data to the backend:

### 4.1 Quality Control Checks

#### Lighting Analysis
```javascript
function getAverageBrightness(video) {
  // Create temporary canvas to analyze video frame
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = video.videoWidth || video.width;
  tempCanvas.height = video.videoHeight || video.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  // Draw current frame to canvas
  tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
  
  // Get image data
  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const data = imageData.data;
  
  // Calculate weighted brightness (human perception formula)
  let totalBrightness = 0;
  const count = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    totalBrightness += brightness;
  }
  
  return totalBrightness / count;
}

// Usage
const brightness = getAverageBrightness(videoElement);
if (brightness < BRIGHTNESS_THRESHOLD) {  // Threshold = 80
  // Alert about poor lighting conditions
}
```

#### Visibility Check
```javascript
// Check if enough landmarks are visible
const visibleLandmarks = results.poseLandmarks.filter(
  landmark => landmark.visibility > VISIBILITY_THRESHOLD  // Threshold = 0.5
);

if (visibleLandmarks.length / results.poseLandmarks.length < REQUIRED_VISIBLE_RATIO) {  // Ratio = 0.75
  // Skip processing this frame - not enough landmarks visible
  return;
}
```

#### Movement Speed Check
```javascript
// Check for controlled movement (avoid analyzing fast motion)
if (prevLandmarks) {
  let totalMovement = 0;
  for (let i = 0; i < results.poseLandmarks.length; i++) {
    const curr = results.poseLandmarks[i];
    const prev = prevLandmarks[i];
    totalMovement += Math.sqrt(
      Math.pow(curr.x - prev.x, 2) + 
      Math.pow(curr.y - prev.y, 2)
    );
  }
  const avgMovement = totalMovement / results.poseLandmarks.length;
  
  // Skip if movement is too fast
  if (avgMovement > CONTROLLED_MOVEMENT_THRESHOLD) {  // Threshold = 0.03
    prevLandmarks = [...results.poseLandmarks];
    return;
  }
}

// Store landmarks for next frame comparison
prevLandmarks = [...results.poseLandmarks];
```

### 4.2 Joint Index Mapping

The frontend needs to map between joint names (used by backend) and MediaPipe landmark indices:

```javascript
function getJointIndex(jointName) {
  const jointMap = {
    "nose": 0,
    "left_eye_inner": 1,
    "left_eye": 2, 
    "left_eye_outer": 3,
    "right_eye_inner": 4,
    "right_eye": 5,
    "right_eye_outer": 6,
    "left_ear": 7,
    "right_ear": 8,
    "mouth_left": 9,
    "mouth_right": 10,
    "left_shoulder": 11,
    "right_shoulder": 12,
    "left_elbow": 13,
    "right_elbow": 14,
    "left_wrist": 15,
    "right_wrist": 16,
    "left_pinky": 17,
    "right_pinky": 18,
    "left_index": 19,
    "right_index": 20,
    "left_thumb": 21,
    "right_thumb": 22,
    "left_hip": 23,
    "right_hip": 24,
    "left_knee": 25,
    "right_knee": 26,
    "left_ankle": 27,
    "right_ankle": 28,
    "left_heel": 29,
    "right_heel": 30,
    "left_foot_index": 31,
    "right_foot_index": 32
  };
  
  return jointMap[jointName] !== undefined ? jointMap[jointName] : -1;
}
```

## 5. Backend Communication Protocol

### 5.1 Sending Landmark Data

The frontend must send the pose landmarks in this exact format:

```javascript
fetch(`http://localhost:8000/landmarks/${exerciseName}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    landmarks: results.poseLandmarks
    // Each landmark has {x, y, z, visibility} properties
  })
})
```

### 5.2 Backend Response Format

The backend returns a JSON object with the following structure:

```javascript
{
  // Basic tracking
  "counter": 5,                // Number of completed reps
  "stage": "down",             // Current exercise stage
  
  // Feedback
  "feedback": "Keep your knees aligned with your toes",  // Human-readable feedback
  "feedback_flags": ["knee_valgus", "good_depth"],       // Coded feedback flags
  
  // Scoring
  "rep_score": 85,             // Quality score (0-100)
  "score_label": "Good",       // Text label for score
  
  // Technical data
  "advanced_metrics": {        // Exercise-specific measurements
    "knee_angle": 95.2,
    "torso_angle": 45.6,
    "asymmetry_index": 0.15
  },
  
  // Visualization guidance  
  "affected_joints": ["left_knee", "right_knee"],
  "affected_segments": [["left_hip", "left_knee"], ["right_hip", "right_knee"]]
}
```

### 5.3 Resetting Exercise State

When completing a set, the frontend must reset the backend state:

```javascript
function resetExerciseState() {
  fetch(`http://localhost:8000/reset/${exerciseName}`, {
    method: 'POST'
  });
}
```

## 6. Data Visualization

### 6.1 Canvas Setup

```javascript
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');
```

### 6.2 Drawing the Pose Skeleton

```javascript
// Draw connections first (bones)
drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { 
  color: '#00FF00',  // Default green color
  lineWidth: 2 
});

// Draw landmarks (joints)
drawLandmarks(canvasCtx, results.poseLandmarks, {
  color: '#FFFFFF',
  lineWidth: 1
});
```

### 6.3 Highlighting Problem Areas

```javascript
// Highlight problem joints
if (latestFeedback.affected_joints) {
  for (const jointIndex of latestFeedback.affected_joints) {
    if (jointIndex < results.poseLandmarks.length) {
      // Draw this joint as a larger red dot
      const landmark = results.poseLandmarks[jointIndex];
      canvasCtx.fillStyle = '#FF0000';  // Red
      canvasCtx.strokeStyle = '#FFFFFF'; // White outline
      canvasCtx.lineWidth = 2;
      
      canvasCtx.beginPath();
      canvasCtx.arc(
        landmark.x * canvasElement.width, 
        landmark.y * canvasElement.height, 
        8,  // Larger radius
        0, 2 * Math.PI);
      canvasCtx.fill();
      canvasCtx.stroke();
    }
  }
}

// Highlight problem segments
if (latestFeedback.affected_segments) {
  for (const segment of latestFeedback.affected_segments) {
    const startJoint = getJointIndex(segment[0]);
    const endJoint = getJointIndex(segment[1]);
    
    if (startJoint !== -1 && endJoint !== -1) {
      drawConnectors(
        canvasCtx, 
        results.poseLandmarks,
        [[startJoint, endJoint]],  // Just this connection
        { color: '#FF0000', lineWidth: 3 }  // Red and slightly thicker
      );
    }
  }
}
```

> **Implementation Note:** All exercise modules (squats, pushups, deadlifts, lunges, situps, bicep_curls) now consistently implement the `affected_joints` and `affected_segments` arrays in their response. This ensures that problematic body parts are highlighted in red across all exercise types, providing consistent visual feedback to users. The backend automatically maps feedback flags to the appropriate joints and segments for each exercise type using the shared mapping system.

### 6.4 Updating Stats Display

```javascript
// Update UI with exercise data
repCountElement.textContent = data.counter || data.repCount || 0;
stageStatusElement.textContent = data.repState || data.stage || "N/A";
feedbackElement.textContent = data.feedback || "N/A";
```

## 7. Exercise-Specific Considerations

While landmark processing occurs in the backend, the frontend must understand the biomechanical metrics for each exercise to properly visualize feedback and guide users. This section details key metrics and their calculations.

### 7.1 Squats

| Metric | Description | Key Landmarks | Calculation Method | Good Form Range | Visualization |
|--------|-------------|---------------|-------------------|----------------|--------------|
| **Knee Alignment** | Distance between knees relative to hip width | 23-24 (hips), 25-26 (knees) | `kneeDistance / hipDistance` ratio | 0.9-1.1 | Highlight knees in red when outside range |
| **Hip Depth** | Vertical position of hips relative to knees | 23-24 (hips), 25-26 (knees) | Hip Y-coordinate compared to knee Y-coordinate | Hips should descend to at least knee level | Horizontal guide line at proper depth |
| **Back Angle** | Torso inclination from vertical | 11-12 (shoulders), 23-24 (hips) | Angle between torso line and vertical axis | 70-90° | Angular indicator on torso |
| **Weight Distribution** | Balance between left/right sides | 29-30 (heels), 31-32 (feet) | Y-position difference between left/right landmarks | <5% difference | Left/right pressure indicators |
| **Knee Projection** | Forward knee position relative to toes | 25-26 (knees), 31-32 (feet) | X-coordinate comparison | Knees should not project beyond toes | Vertical alignment guide |

**Common Feedback Flags:**
- `knee_valgus`: "Keep knees aligned with toes"
- `insufficient_depth`: "Lower hips to parallel"
- `excessive_forward_lean`: "Keep chest up"
- `knees_too_forward`: "Push hips back more"

```javascript
// Example knee alignment calculation
function calculateKneeAlignment(landmarks) {
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  
  const hipDistance = Math.sqrt(
    Math.pow(rightHip.x - leftHip.x, 2) + 
    Math.pow(rightHip.y - leftHip.y, 2)
  );
  
  const kneeDistance = Math.sqrt(
    Math.pow(rightKnee.x - leftKnee.x, 2) + 
    Math.pow(rightKnee.y - leftKnee.y, 2)
  );
  
  return kneeDistance / hipDistance;
}
```

### 7.2 Push-ups

| Metric | Description | Key Landmarks | Calculation Method | Good Form Range | Visualization |
|--------|-------------|---------------|-------------------|----------------|--------------|
| **Elbow Angle** | Angle at elbow joint during bottom position | 11-12 (shoulders), 13-14 (elbows), 15-16 (wrists) | Angle between upper and lower arm vectors | 85-100° at bottom | Arc indicator at elbow |
| **Body Alignment** | Straightness from shoulders to ankles | 11-12 (shoulders), 23-24 (hips), 27-28 (ankles) | Deviation from straight line | <10° deviation | Body alignment guide |
| **Hip Position** | Hip elevation/depression relative to body line | 23-24 (hips), 11-12 (shoulders), 27-28 (ankles) | Perpendicular distance from hips to shoulder-ankle line | <5% deviation | Hip position indicator |
| **Neck Position** | Alignment of neck with spine | 0 (nose), 11-12 (shoulders) | Angle between neck and torso | 160-180° (neutral) | Neck alignment guide |
| **Range of Motion** | Vertical distance traveled by shoulders | 11-12 (shoulders) | Y-coordinate change between top and bottom positions | >15% of arm length | Depth guideline |

**Common Feedback Flags:**
- `insufficient_depth`: "Lower chest closer to ground"
- `hip_sag`: "Keep your core engaged to maintain straight body"
- `hip_pike`: "Lower your hips to maintain straight body line"
- `neck_strain`: "Keep your neck neutral, look at the floor"

```javascript
// Example body alignment check
function checkBodyAlignment(landmarks) {
  const shoulders = midpoint(landmarks[11], landmarks[12]);
  const hips = midpoint(landmarks[23], landmarks[24]);
  const ankles = midpoint(landmarks[27], landmarks[28]);
  
  // Calculate deviation from straight line
  const deviation = perpendicularDistance(
    shoulders, ankles, hips
  );
  
  return deviation / distance(shoulders, ankles);
}
```

### 7.3 Deadlifts

| Metric | Description | Key Landmarks | Calculation Method | Good Form Range | Visualization |
|--------|-------------|---------------|-------------------|----------------|--------------|
| **Back Angle** | Torso inclination during initial pull | 11-12 (shoulders), 23-24 (hips) | Angle between torso and horizontal plane | 25-45° at start | Angular indicator on torso |
| **Hip Hinge** | Ratio of hip bend to knee bend | Hip angle vs. knee angle | Ratio of angles at hips and knees | Hip angle change should exceed knee angle change | Indicator showing primary joint action |
| **Knee Position** | Knee position relative to ankles and bar path | 25-26 (knees), 27-28 (ankles) | X-coordinate comparison | Knees should align vertically with ankles at start | Vertical alignment guide |
| **Shoulder Alignment** | Shoulders in relation to bar | 11-12 (shoulders), wrists (15-16) | Horizontal offset | Shoulders should be slightly ahead of bar at start | Bar path indicator |
| **Bar Path** | Vertical path of the bar (approximated by wrists) | 15-16 (wrists) | X-coordinate deviation during lift | <3% horizontal deviation | Vertical path guide |

**Common Feedback Flags:**
- `rounded_back`: "Maintain neutral spine"
- `insufficient_hip_hinge`: "Initiate movement by pushing hips back"
- `shoulders_behind_bar`: "Position shoulders over or slightly ahead of bar"
- `knees_caving`: "Press knees outward"

```javascript
// Example hip hinge calculation
function calculateHipHinge(currentLandmarks, startingLandmarks) {
  const currentHipAngle = calculateJointAngle(
    currentLandmarks[11], // shoulder
    currentLandmarks[23], // hip
    currentLandmarks[25]  // knee
  );
  
  const currentKneeAngle = calculateJointAngle(
    currentLandmarks[23], // hip
    currentLandmarks[25], // knee
    currentLandmarks[27]  // ankle
  );
  
  const startingHipAngle = calculateJointAngle(
    startingLandmarks[11],
    startingLandmarks[23],
    startingLandmarks[25]
  );
  
  const startingKneeAngle = calculateJointAngle(
    startingLandmarks[23],
    startingLandmarks[25],
    startingLandmarks[27]
  );
  
  const hipAngleChange = Math.abs(currentHipAngle - startingHipAngle);
  const kneeAngleChange = Math.abs(currentKneeAngle - startingKneeAngle);
  
  return hipAngleChange / kneeAngleChange;
}
```

### 7.4 Lunges

| Metric | Description | Key Landmarks | Calculation Method | Good Form Range | Visualization |
|--------|-------------|---------------|-------------------|----------------|--------------|
| **Knee Alignment** | Front knee position relative to ankle and toe | 25/26 (knee), 27/28 (ankle), 31/32 (foot) | Knee projection beyond ankle point | <15% beyond toe | Vertical alignment guide |
| **Torso Position** | Vertical alignment of trunk | 11-12 (shoulders), 23-24 (hips) | Angle from vertical | 80-90° (near vertical) | Torso alignment guide |
| **Hip Alignment** | Lateral tilt of hips | 23-24 (hips) | Y-coordinate difference between left/right hips | <5% difference | Horizontal hip level indicator |
| **Step Length** | Distance between feet | 31-32 (feet) | X-coordinate difference | 1.3-1.8× shoulder width | Step length guide |
| **Balance** | Weight distribution and stability | 23-24 (hips), movement variance | Standard deviation of position over time | <3% position variance | Stability indicator |

**Common Feedback Flags:**
- `knee_past_toe`: "Ensure front knee stays above ankle"
- `hip_drop`: "Keep hips level throughout movement"
- `trunk_lean`: "Maintain upright torso"
- `step_too_short`: "Take a longer step"
- `step_too_long`: "Reduce step length for better control"

```javascript
// Example knee alignment check for lunges
function checkKneeAlignment(landmarks, activeLeg) {
  const kneeIdx = activeLeg === 'left' ? 25 : 26;
  const ankleIdx = activeLeg === 'left' ? 27 : 28;
  const toeIdx = activeLeg === 'left' ? 31 : 32;
  
  const knee = landmarks[kneeIdx];
  const ankle = landmarks[ankleIdx];
  const toe = landmarks[toeIdx];
  
  // Calculate if knee projects beyond toe
  const kneeProjection = (knee.x - ankle.x) / (toe.x - ankle.x);
  
  return kneeProjection;
}
```

### 7.5 Sit-ups

| Metric | Description | Key Landmarks | Calculation Method | Good Form Range | Visualization |
|--------|-------------|---------------|-------------------|----------------|--------------|
| **Neck Position** | Alignment and strain on neck | 0-7-8 (head/ears), 11-12 (shoulders) | Distance and angle between head and chest | Head should be naturally aligned, not pulled forward | Neck alignment guide |
| **Hip Flexion** | Angle at hip joint | 11-12 (shoulders), 23-24 (hips), 25-26 (knees) | Angle between torso and thighs | Up to 45° at top position | Arc indicator at hip |
| **Shoulder Position** | Shoulders' range of motion | 11-12 (shoulders), height from ground | Y-coordinate change from start | Should rise >30% of torso length | Range indicator |
| **Lower Back Engagement** | Lumbar curve or pressure | 23-24 (hips), spinal approximation | Curve estimation between mid-back and hips | Maintain contact with ground | Contact point indicator |
| **Range of Motion** | Upper body elevation angle | 11-12 (shoulders), 23-24 (hips), horizontal | Angle between torso and horizontal | 30-45° at top of movement | Angular guide |

**Common Feedback Flags:**
- `neck_strain`: "Keep chin tucked slightly, don't pull on your neck"
- `incomplete_range`: "Continue upward until shoulder blades clear the floor"
- `excessive_momentum`: "Slow down for better muscle engagement"
- `lower_back_arch`: "Keep lower back pressed into floor"

```javascript
// Example neck position check
function checkNeckPosition(landmarks) {
  const nose = landmarks[0];
  const leftEar = landmarks[7];
  const rightEar = landmarks[8];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  
  // Calculate midpoints
  const earMidpoint = midpoint(leftEar, rightEar);
  const shoulderMidpoint = midpoint(leftShoulder, rightShoulder);
  
  // Forward head position is when nose projects too far forward of ear-shoulder line
  const earShoulderAngle = calculateAngle(earMidpoint, shoulderMidpoint);
  const noseProjection = perpendicularDistance(earMidpoint, shoulderMidpoint, nose);
  
  return { earShoulderAngle, noseProjection };
}
```

### 7.6 Bicep Curls

| Metric | Description | Key Landmarks | Calculation Method | Good Form Range | Visualization |
|--------|-------------|---------------|-------------------|----------------|--------------|
| **Elbow Stability** | Elbow position relative to torso | 13-14 (elbows), 11-12 (shoulders), 23-24 (hips) | Distance from elbow to torso centerline | <10% of arm length deviation | Elbow tracking path |
| **Wrist Position** | Wrist alignment with forearm | 13-14 (elbows), 15-16 (wrists) | Angle between wrist and forearm | 170-190° (neutral) | Wrist alignment indicator |
| **Shoulder Movement** | Shoulder stability during curl | 11-12 (shoulders), vertical movement | Y-coordinate variance | <5% movement | Shoulder stability zone |
| **Range of Motion** | Full extension and flexion of elbow | 13-14 (elbows) angle | Angle between upper arm and forearm | 40-50° (top), 160-170° (bottom) | Angular ROM indicator |
| **Symmetry** | Balance between left and right arms | 13-14 (elbows), 15-16 (wrists) | Sync of movement patterns between sides | <10% difference in timing and angles | Symmetry balance indicator |

**Common Feedback Flags:**
- `elbow_drift`: "Keep elbows close to your sides"
- `incomplete_extension`: "Fully extend arms at bottom"
- `shoulder_compensation`: "Keep shoulders stable and down"
- `wrist_curl`: "Maintain neutral wrist position"
- `asymmetrical_movement`: "Balance effort between both arms"

```javascript
// Example elbow stability check
function checkElbowStability(landmarks) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  
  // Calculate torso centerline
  const shoulderMidpoint = midpoint(leftShoulder, rightShoulder);
  const hipMidpoint = midpoint(leftHip, rightHip);
  
  // Find perpendicular distance from elbows to centerline
  const leftElbowDeviation = perpendicularDistance(shoulderMidpoint, hipMidpoint, leftElbow);
  const rightElbowDeviation = perpendicularDistance(shoulderMidpoint, hipMidpoint, rightElbow);
  
  // Normalize by arm length
  const leftArmLength = distance(leftShoulder, leftElbow);
  const rightArmLength = distance(rightShoulder, rightElbow);
  
  return {
    leftElbowStability: leftElbowDeviation / leftArmLength,
    rightElbowStability: rightElbowDeviation / rightArmLength
  };
}
```

### 7.7 Helper Geometric Functions

```javascript
// Calculate midpoint between two landmarks
function midpoint(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    z: (p1.z + p2.z) / 2
  };
}

// Calculate distance between two landmarks
function distance(p1, p2) {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2) +
    Math.pow(p2.z - p1.z, 2)
  );
}

// Calculate angle between three points in degrees
function calculateAngle(a, b, c) {
  const ab = {
    x: b.x - a.x,
    y: b.y - a.y
  };
  const bc = {
    x: c.x - b.x,
    y: c.y - b.y
  };
  
  const dotProduct = (ab.x * bc.x) + (ab.y * bc.y);
  const abMagnitude = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const bcMagnitude = Math.sqrt(bc.x * bc.x + bc.y * bc.y);
  
  const angleRadians = Math.acos(dotProduct / (abMagnitude * bcMagnitude));
  return angleRadians * (180 / Math.PI);
}

// Calculate perpendicular distance from point to line
function perpendicularDistance(lineStart, lineEnd, point) {
  const lineLength = distance(lineStart, lineEnd);
  
  const area = Math.abs(
    0.5 * (
      (lineStart.x * lineEnd.y - lineEnd.x * lineStart.y) +
      (lineEnd.x * point.y - point.x * lineEnd.y) +
      (point.x * lineStart.y - lineStart.x * point.y)
    )
  );
  
  return (2 * area) / lineLength;
}
```


## 8. User Flow & State Management

### 8.1 Exercise Parameters

```javascript
const totalSets = 3;      // Default sets per exercise
const repsGoal = 10;      // Default reps per set
let currentSet = 1;
let currentReps = 0;
```

### 8.2 Set Completion Logic

```javascript
// Check if set is complete
if (currentReps >= repsGoal) {
  // Notify user
  alert(`Set ${currentSet} complete! Great job!`);
  
  // Move to next set or finish workout
  currentSet++;
  if (currentSet <= totalSets) {
    setCounterElement.textContent = `${currentSet} / ${totalSets}`;
    currentReps = 0;
    
    // Reset exercise state on backend
    resetExerciseState();
  } else {
    alert("Workout complete! Great job!");
    window.location.href = "index.html";  // Return to home
  }
}
```

### 8.3 User Profile Data Storage

```javascript
// Store user details in localStorage
const userData = {
  name: document.getElementById("name").value,
  age: document.getElementById("age").value,
  height: document.getElementById("height").value,
  weight: document.getElementById("weight").value,
  goalWeight: document.getElementById("goalWeight").value,
  fitnessGoal: document.getElementById("fitnessGoal").value
};

localStorage.setItem("userDetails", JSON.stringify(userData));
```

## 9. Implementation Checklist

To successfully port this application to React while maintaining compatibility with the Python AI backend:

- [ ] Set up MediaPipe libraries in React
- [ ] Implement camera access with permissions handling
- [ ] Create pose detection pipeline
- [ ] Implement all quality checks (lighting, visibility, movement)
- [ ] Create canvas rendering with skeleton overlay
- [ ] Implement backend communication for landmark processing
- [ ] Create UI components for exercise stats
- [ ] Implement joint/segment highlighting based on feedback
- [ ] Handle exercise selection, set tracking, and completion
- [ ] Implement user profile storage
- [ ] Add error handling and connection status indicators

## Additional Considerations

### Performance Optimization

- Consider using React's `useRef` for canvas and video elements
- Implement `requestAnimationFrame` for smooth rendering
- Use memoization for intensive calculations
- Consider Web Workers for brightness and movement calculations

### Accessibility

- Provide alternative text-based feedback for visually impaired users
- Ensure keyboard navigation is possible
- Add audio cues for rep counting and form feedback

### Cross-Browser Compatibility

- Test MediaPipe compatibility across browsers
- Provide fallbacks for browsers without camera support
- Handle different camera resolutions and aspect ratios

By following this documentation, a React developer should be able to successfully rebuild the ReGenix frontend while maintaining full compatibility with the Python AI backend.
