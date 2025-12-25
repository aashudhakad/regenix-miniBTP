document.addEventListener("DOMContentLoaded", function() {
  // Get exercise name from URL
  const urlParams = new URLSearchParams(window.location.search);
  const exerciseName = urlParams.get('exercise');
  
  if (!exerciseName) {
    alert("No exercise specified!");
    window.location.href = "index.html";
    return;
  }

  // Update page title
  document.getElementById("exercise-title").textContent = 
    exerciseName.replace("_", " ").toUpperCase();

  // Setup variables
  const videoElement = document.getElementById('input-video');
  const canvasElement = document.getElementById('output-canvas');
  const canvasCtx = canvasElement.getContext('2d');
  
  const repCountElement = document.getElementById('rep-count');
  const stageStatusElement = document.getElementById('stage-status');
  const feedbackElement = document.getElementById('feedback');
  const lightingStatusElement = document.getElementById('lighting-status');
  const setCounterElement = document.getElementById('set-counter');
  const targetRepsElement = document.getElementById('target-reps');
  
  // Exercise parameters
  const totalSets = 3;
  const repsGoal = 10;
  let currentSet = 1;
  let currentReps = 0;

  // Fine-tuning parameters
  const BRIGHTNESS_THRESHOLD = 80;
  const CONTROLLED_MOVEMENT_THRESHOLD = 0.03;
  const VISIBILITY_THRESHOLD = 0.5;
  const REQUIRED_VISIBLE_RATIO = 0.75;

  // Previous landmarks for movement tracking
  let prevLandmarks = null;

  // Helper: compute average brightness
  function getAverageBrightness(video) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth || video.width;
    tempCanvas.height = video.videoHeight || video.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    let totalBrightness = 0;
    const count = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      totalBrightness += brightness;
    }
    return totalBrightness / count;
  }

  // Setup MediaPipe Pose
  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  pose.onResults((results) => {
    // Draw video frame
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // Draw pose skeleton if landmarks detected
    if (results.poseLandmarks) {
      // Draw connections first (bones)
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { 
        color: '#00FF00',  // Default green color
        lineWidth: 2 
      });
      
      // Check if we have feedback with affected segments
      if (latestFeedback && latestFeedback.affected_segments) {
        // Draw problematic segments in red
        for (const segment of latestFeedback.affected_segments) {
          const startJoint = getJointIndex(segment[0]);
          const endJoint = getJointIndex(segment[1]);
          
          if (startJoint !== -1 && endJoint !== -1) {
            // Draw this specific connection in red
            drawConnectors(
              canvasCtx, 
              results.poseLandmarks,
              [[startJoint, endJoint]],  // Just this connection
              { color: '#FF0000', lineWidth: 3 }  // Red and slightly thicker
            );
          }
        }
      }
      
      // Draw landmarks
      drawLandmarks(canvasCtx, results.poseLandmarks, { 
        color: '#FF0000',  // Default red for all points
        lineWidth: 1,
        fillColor: '#FFFFFF'  // White fill
      });
      
      // Re-color affected joints if available
      if (latestFeedback && latestFeedback.affected_joints) {
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
      
      // Rest of your code for sending landmarks and processing feedback
      // ...

      // Save the feedback for next frame's visualization
      fetch(`http://localhost:8000/landmarks/${exerciseName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landmarks: results.poseLandmarks })
      })
        .then(res => res.json())
        .then(data => {
          // Update UI with exercise data
          repCountElement.textContent = data.counter || data.repCount || 0;
          stageStatusElement.textContent = data.repState || data.stage || "N/A";
          feedbackElement.textContent = data.feedback || "N/A";
          
          // Store the affected joints/segments for visualization if available
          if (data.affected_joints || data.affected_segments) {
            latestFeedback = {
              affected_joints: data.affected_joints || [],
              affected_segments: data.affected_segments || []
            };
          }
          
          // Update current reps count
          currentReps = data.counter || data.repCount || 0;
          targetRepsElement.textContent = `${currentReps} / ${repsGoal}`;
          
          // Check if set is complete
          if (currentReps >= repsGoal && !setCompleteDialogShown) {
            setCompleteDialogShown = true; // Flag to prevent multiple alerts
            
            if (currentSet < totalSets) {
              // Show completion dialog for current set
              const message = `Set ${currentSet} completed! Click OK to start set ${currentSet + 1}.`;
              
              // Use setTimeout to prevent immediate execution
              setTimeout(() => {
                alert(message);
                
                // Only after the user clicks OK, update the set counter and reset reps
                currentSet++;
                setCounterElement.textContent = `${currentSet} / ${totalSets}`;
                
                // Critical fix: Reset the rep count in the backend
                resetExerciseState();
                
                // Reset the dialog shown flag after processing
                setCompleteDialogShown = false;
              }, 100);
            } else {
              // Final set completed
              setTimeout(() => {
                alert("Workout completed! Great job!");
                window.location.href = "index.html";
              }, 100);
            }
          }
        })
        .catch(err => {
          console.error('Error communicating with backend:', err);
          feedbackElement.textContent = "Connection error. Check backend server.";
        });
    }
  });

  // Setup camera
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      // Check lighting conditions
      const brightness = getAverageBrightness(videoElement);
      if (brightness < BRIGHTNESS_THRESHOLD) {
        lightingStatusElement.textContent = "Too Dark";
        feedbackElement.textContent = "Lighting is too dark. Please improve your lighting.";
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        return;
      } else {
        lightingStatusElement.textContent = "Good";
        await pose.send({ image: videoElement });
      }
    },
    width: 640,
    height: 480
  });

  // Start the camera
  camera.start()
    .then(() => {
      console.log("Camera started successfully");
    })
    .catch(err => {
      console.error("Error starting camera:", err);
      alert("Failed to start camera. Please check your camera permissions and reload.");
    });
});

// Helper function to convert joint names to MediaPipe indices
function getJointIndex(jointName) {
  const jointMap = {
    "nose": 0,
    "left_shoulder": 11,
    "right_shoulder": 12,
    "left_elbow": 13,
    "right_elbow": 14,
    "left_wrist": 15,
    "right_wrist": 16,
    "left_hip": 23,
    "right_hip": 24, 
    "left_knee": 25,
    "right_knee": 26,
    "left_ankle": 27,
    "right_ankle": 28
  };
  
  return jointMap[jointName] || -1;
}

// Initialize variable to store latest feedback
let latestFeedback = null;

// Add this global variable to track dialog state
let setCompleteDialogShown = false;

// Add this function to reset exercise state in the backend
function resetExerciseState() {
  fetch(`http://localhost:8000/reset/${exerciseName}`, {
    method: 'POST',
  }).catch(err => {
    console.error('Error resetting exercise state:', err);
  });
  
  // Also reset local counter
  currentReps = 0;
  targetRepsElement.textContent = `${currentReps} / ${repsGoal}`;
}
