import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Import from MediaPipe libraries
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Camera } from "@mediapipe/camera_utils";
import { POSE_CONNECTIONS } from "@mediapipe/pose";

// Joint mapping
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

// Types for landmarks and feedback
interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface FeedbackData {
  affected_joints?: string[];
  affected_segments?: [string, string][];
  feedback_flags?: string[];
  rep_score?: number;
  score_label?: string;
  advanced_metrics?: Record<string, number>;
  counter?: number;
  repCount?: number;
  repState?: string;
  stage?: string;
  feedback?: string;
}

// Session data management interface
interface SessionLog {
  counter: number;
  stage: string;
  feedback: string;
  feedbackFlags: string[];
  repScore: number;
  scoreLabel: string;
  advancedMetrics: Record<string, number>;
  affectedJoints: string[];
  affectedSegments: [string, string][];
  timestamp: Date;
}

const Exercise: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exerciseName = searchParams.get("exercise") || "test_exercise";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [repCount, setRepCount] = useState<number>(0);
  const [stage, setStage] = useState<string>("N/A");
  const [feedback, setFeedback] = useState<string>("Waiting for camera...");
  const [lighting, setLighting] = useState<string>("Checking...");
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [latestFeedback, setLatestFeedback] = useState<FeedbackData | null>(null);
  const [cameraReady, setCameraReady] = useState<boolean>(false);

  // State for visibility and movement tracking
  const [visibilityStatus, setVisibilityStatus] = useState<string>("Checking...");
  const [movementStatus, setMovementStatus] = useState<string>("Checking...");

  // Session management
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null); // Added ref for sessionId
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const sessionLogsRef = useRef<SessionLog[]>([]); // Added ref for sessionLogs
  const [isSendingLogs, setIsSendingLogs] = useState<boolean>(false);
  const userId = localStorage.getItem("userId") || "guest"; // Get the user ID from localStorage or use "guest"
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const latestFeedbackRef = useRef<{
    affected_joints: string[];
    affected_segments: [string, string][];
  }>({ affected_joints: [], affected_segments: [] });

  // Exercise Parameters
  const totalSets = 3;
  const repsGoal = 10;
  const BRIGHTNESS_THRESHOLD = 80;
  const VISIBILITY_THRESHOLD = 0.5;
  const REQUIRED_VISIBLE_RATIO = 0.75;
  const CONTROLLED_MOVEMENT_THRESHOLD = 0.03;

  // References for tracking
  const prevLandmarksRef = useRef<Landmark[]>([]);
  const setCompleteDialogShown = useRef<boolean>(false);
  const cameraRef = useRef<any>(null);
  const poseRef = useRef<any>(null);
  const startingLandmarksRef = useRef<Landmark[]>([]);
  const repCountRef = useRef<number>(0); // Add ref to track repCount
  const isSendingLogsRef = useRef<boolean>(false); // Added ref for isSendingLogs
  // at the top of your component, alongside other refs:
  const currentSetRef = useRef<number>(1);
  useEffect(() => {
    currentSetRef.current = currentSet;
  }, [currentSet]);


  // Helper functions
  const getJointIndex = (jointName: string): number => {
    return jointMap[jointName as keyof typeof jointMap] ?? -1;
  };

  const getAverageBrightness = (video: HTMLVideoElement): number => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth || 1;
    tempCanvas.height = video.videoHeight || 1;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return 0;

    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    const { data } = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      totalBrightness += brightness;
    }
    return totalBrightness / (data.length / 4);
  };

  // Add abort controller reference at the component level
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create a new session when component mounts
  useEffect(() => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const createSession = async () => {
      try {
        setSessionStartTime(new Date());

        const exerciseConversion: { [key: string]: string } = {
          'bicep_curl': 'bicep_curls',
          'squat': 'squats',
          'pushup': 'pushups',
          'deadlift': 'deadlifts',
          'lunge': 'lunges',
          'situp': 'situps'
        };

        const normalizedExercise = exerciseName.toLowerCase().replace(/ /g, "_");
        const exerciseType = exerciseConversion[normalizedExercise] || normalizedExercise;

        console.log("Creating session for exercise:", exerciseType);

        const response = await fetch("http://localhost:5000/api/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            userId,
            exercise: exerciseType,
            totalSets,
            targetReps: repsGoal
          }),
          signal: abortController.signal // Add abort signal
        });

        if (!response.ok) throw new Error("Failed to create session");

        const data = await response.json();
        if (data.success && data.data._id && !abortController.signal.aborted) {
          setSessionId(data.data._id);
          sessionIdRef.current = data.data._id; // Set the ref value
          console.log("Created session with ID:", data.data._id);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error creating session:", error);
        }
      }
    };

    createSession();

    // Cleanup function
    return () => {
      // Abort any pending requests
      abortControllerRef.current?.abort();

      if (sessionIdRef.current && sessionLogsRef.current.length > 0) {
        console.log("Component unmounting, saving final logs...");
        saveLogs().then(() => {
          completeSession();
        });
      }
    };
  }, [exerciseName]); // Keep exerciseName in dependency array

  // Update refs when state changes
  useEffect(() => {
    sessionLogsRef.current = sessionLogs;
  }, [sessionLogs]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    isSendingLogsRef.current = isSendingLogs;
  }, [isSendingLogs]);

  // Function to save session logs to the backend
  const saveLogs = async (): Promise<void> => {
    const currentSessionId = sessionIdRef.current;
    const currentLogs = [...sessionLogsRef.current]; // Make a copy to avoid race conditions

    console.log(`Checking if logs need to be saved - sessionId exists: ${!!currentSessionId}, logs count: ${currentLogs.length}, isSending: ${isSendingLogsRef.current}`);

    if (!currentSessionId || currentLogs.length === 0 || isSendingLogsRef.current) {
      console.log("Skipping log save: conditions not met");
      return;
    }

    try {
      setIsSendingLogs(true);
      isSendingLogsRef.current = true;

      console.log(`Saving ${currentLogs.length} logs for set ${currentSet}, repCount: ${repCountRef.current}, sessionId: ${currentSessionId}`);

      const response = await fetch(`http://localhost:5000/api/sessions/${currentSessionId}/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          setNumber: currentSetRef.current,
          repCount: repCountRef.current, // Use ref value for latest count
          logs: currentLogs
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save logs: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Saved logs successfully:", data);

      // Clear logs after saving
      setSessionLogs([]);
    } catch (error) {
      console.error("Error saving logs:", error);
    } finally {
      setIsSendingLogs(false);
      isSendingLogsRef.current = false;
    }
  };

  // Function to mark session as complete
  const completeSession = async (): Promise<void> => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) {
      console.log("No session ID available, cannot complete session");
      return;
    }

    try {
      console.log(`Completing session ${currentSessionId}`);

      // Calculate duration in seconds
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - sessionStartTime.getTime()) / 1000);

      // Calculate average form score
      const allScores = sessionLogsRef.current.map(log => log.repScore).filter(score => !!score);
      const accuracyScore = allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0;

      console.log(`Completing session with duration: ${duration}s, accuracy: ${accuracyScore}`);

      await fetch(`http://localhost:5000/api/sessions/${currentSessionId}/complete`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ duration, accuracyScore })
      });

      console.log("Session completed successfully");
    } catch (error) {
      console.error("Error completing session:", error);
    }
  };

  // Reset the exercise state
  // Replaces your existing resetExerciseState
  const resetExerciseState = async (): Promise<void> => {
    try {
      console.log("Resetting exercise state for new set");

      // Stop old camera
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }

      // Zero out both state and ref
      setRepCount(0);
      repCountRef.current = 0;
      setStage("N/A");
      setFeedback("Starting new set...");
      setLatestFeedback(null);
      startingLandmarksRef.current = [];

      // Let React flush the above
      await new Promise(resolve => setTimeout(resolve, 500));

      // Restart camera
      if (videoRef.current && poseRef.current) {
        console.log("Restarting camera for new set");
        const newCam = new Camera(videoRef.current, {
          onFrame: async () => {
            await poseRef.current.send({ image: videoRef.current! });
          },
          width: 640,
          height: 480,
        });
        await newCam.start();
        cameraRef.current = newCam;
        console.log("Camera restarted");
      }
    } catch (err) {
      console.error("Reset error:", err);
      setFeedback("Error resetting for new set. Please reload.");
    }
  };


  // Setup MediaPipe Pose
  useEffect(() => {
    if (!exerciseName) {
      alert("No exercise specified!");
      navigate("/planner");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      console.error("Video or canvas element not found");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Canvas context not available");
      return;
    }

    // Update page title
    document.title = `ReGenix - ${exerciseName.replace("_", " ").toUpperCase()}`;

    // Initialize MediaPipe Pose
    const setupPose = async () => {
      try {
        // Wait for the Pose class to be available
        if (typeof window.Pose !== 'function') {
          console.log("Waiting for MediaPipe Pose to load...");
          setFeedback("Loading pose detection...");
          setTimeout(setupPose, 500);
          return;
        }

        console.log("Creating Pose instance");
        setFeedback("Initializing pose detection...");

        const pose = new window.Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        pose.onResults((results: any) => {
          // Ensure canvas context is still valid
          const currentCtx = canvas.getContext("2d");
          if (!currentCtx) return;

          currentCtx.save();
          currentCtx.clearRect(0, 0, canvas.width, canvas.height);
          currentCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

          if (results.poseLandmarks) {
            // Check visibility
            const visibleLandmarks = results.poseLandmarks.filter(
              (landmark: Landmark) => landmark.visibility && landmark.visibility > VISIBILITY_THRESHOLD
            );

            const visibilityRatio = visibleLandmarks.length / results.poseLandmarks.length;
            setVisibilityStatus(
              visibilityRatio >= REQUIRED_VISIBLE_RATIO
                ? "Good"
                : "Poor - Please ensure your full body is visible"
            );

            // Check movement speed
            if (prevLandmarksRef.current.length > 0) {
              let totalMovement = 0;
              for (let i = 0; i < results.poseLandmarks.length; i++) {
                const curr = results.poseLandmarks[i];
                const prev = prevLandmarksRef.current[i];
                if (curr && prev) {
                  totalMovement += Math.sqrt(
                    Math.pow(curr.x - prev.x, 2) +
                    Math.pow(curr.y - prev.y, 2)
                  );
                }
              }
              const avgMovement = totalMovement / results.poseLandmarks.length;

              setMovementStatus(
                avgMovement <= CONTROLLED_MOVEMENT_THRESHOLD
                  ? "Good"
                  : "Too Fast - Please move more slowly for accurate tracking"
              );

              // Skip processing if movement is too fast
              if (avgMovement > CONTROLLED_MOVEMENT_THRESHOLD) {
                prevLandmarksRef.current = [...results.poseLandmarks];
                currentCtx.restore();
                return;
              }
            }

            // Store landmarks for next comparison
            prevLandmarksRef.current = [...results.poseLandmarks];

            // Store starting landmarks for exercises that need it (like deadlifts)
            if (startingLandmarksRef.current.length === 0) {
              startingLandmarksRef.current = [...results.poseLandmarks];
            }

            // Draw connections first (bones)
            drawConnectors(currentCtx, results.poseLandmarks, POSE_CONNECTIONS, {
              color: "#00FF00",  // Default green color
              lineWidth: 2
            });
            // 2a) Highlight bad segments in red
            latestFeedbackRef.current.affected_segments.forEach(([start, end]) => {
              const s = getJointIndex(start), e = getJointIndex(end);
              if (s !== -1 && e !== -1) {
                drawConnectors(ctx, results.poseLandmarks, [[s, e]], {
                  color: "#FF0000", lineWidth: 4
                });
              }
            });


            // Highlight problem segments if feedback available
            if (latestFeedback?.affected_segments) {
              latestFeedback.affected_segments.forEach(([start, end]) => {
                const startJoint = getJointIndex(start);
                const endJoint = getJointIndex(end);
                if (startJoint !== -1 && endJoint !== -1) {
                  drawConnectors(currentCtx, results.poseLandmarks, [[startJoint, endJoint]], {
                    color: "#FF0000",  // Red for problem areas
                    lineWidth: 3,
                  });
                }
              });
            }

            // Draw landmarks (joints)
            drawLandmarks(currentCtx, results.poseLandmarks, {
              color: "#FF0000",  // Default red color
              lineWidth: 1,
              fillColor: "#FFFFFF"  // White fill
            });
            // 2b) Highlight bad joints as big red dots
            latestFeedbackRef.current.affected_joints.forEach(idx => {
              const lm = results.poseLandmarks[idx];
              if (lm) {
                ctx.fillStyle = "#FF0000";
                ctx.beginPath();
                ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 8, 0, 2 * Math.PI);
                ctx.fill();
              }
            });


            // Highlight problem joints if feedback available
            if (latestFeedback?.affected_joints) {
              latestFeedback.affected_joints.forEach((jointName) => {
                const jointIndex = getJointIndex(jointName);
                if (jointIndex !== -1) {
                  const landmark = results.poseLandmarks[jointIndex];
                  if (landmark) {
                    currentCtx.fillStyle = "#FF0000";  // Red
                    currentCtx.strokeStyle = "#FFFFFF";  // White outline
                    currentCtx.lineWidth = 2;
                    currentCtx.beginPath();
                    currentCtx.arc(
                      landmark.x * canvas.width,
                      landmark.y * canvas.height,
                      8,  // Larger radius for emphasis
                      0, 2 * Math.PI
                    );
                    currentCtx.fill();
                    currentCtx.stroke();
                  }
                }
              });
            }
            const exerciseConversion: Record<string, string> = {
              bicep_curl: 'bicep_curls',
              squat: 'squats',
              pushup: 'pushups',
              deadlift: 'deadlifts',
              lunge: 'lunges',
              situp: 'situps'
            };
            // Only send landmarks to backend if visibility is good and set is not complete
            if (visibilityRatio >= REQUIRED_VISIBLE_RATIO && !setCompleteDialogShown.current) {
              const apiExerciseName = exerciseConversion[exerciseName] || exerciseName;
              fetch(`http://localhost:8000/landmarks/${apiExerciseName}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  landmarks: results.poseLandmarks,
                  setNumber: currentSetRef.current       // ← tell the backend which set we're on
                }),
              })
                .then(res => {
                  // console.log("Raw response:", res.json); // 👈 Logs the full Response object
                  return res.json(); // Still return the parsed JSON for next `.then`
                })
                // Inside the onResults callback where feedback data is processed
                .then((data: FeedbackData) => {
                  if (setCompleteDialogShown.current) {
                    console.log("Ignoring pose data during set transition");
                    return; // Skip processing during reset
                  }
                  // Get current rep count value
                  let currentReps = data.counter ?? data.repCount ?? 0;

                  // Enforce rep count limit (don't exceed repsGoal)
                  if (currentReps > repsGoal) {
                    currentReps = repsGoal;
                  }

                  // Update both state and ref
                  setRepCount(currentReps);
                  repCountRef.current = currentReps;

                  setStage(data.repState ?? data.stage ?? "N/A");
                  setFeedback(data.feedback ?? "N/A");
                  // console.log(`Stage: ${data.repState ?? data.stage ?? "N/A"}`);
                  // console.log(`Feedback: ${data.feedback ?? "N/A"}`);
                  // console.log('Feedback flags:', data.feedback_flags ?? []);
                  // In your pose.onResults callback where you process the response:
                  const metrics = data.advanced_metrics || {};
                  // Convert all metric values to numbers
                  const sanitizedMetrics = Object.fromEntries(
                    Object.entries(metrics).map(([k, v]) => [k, typeof v === 'number' ? v : 0])
                  );
                  setLatestFeedback({
                    affected_joints: data.affected_joints ?? [],
                    affected_segments: data.affected_segments ?? [],
                    feedback_flags: data.feedback_flags ?? [],
                    rep_score: data.rep_score ?? 0,
                    score_label: data.score_label ?? "",
                    advanced_metrics: sanitizedMetrics ?? {}
                  });
                  latestFeedbackRef.current = {
                    affected_joints: data.affected_joints ?? [],
                    affected_segments: data.affected_segments ?? []
                  };


                  // Store logs for session tracking
                  const currentSessionId = sessionIdRef.current;
                  if (currentSessionId && data) {
                    // Create session log entry
                    const logEntry: SessionLog = {
                      counter: currentReps,
                      stage: data.repState ?? data.stage ?? "N/A",
                      feedback: data.feedback ?? "N/A",
                      feedbackFlags: data.feedback_flags ?? [],
                      repScore: data.rep_score ?? 0,
                      scoreLabel: data.score_label ?? "",
                      advancedMetrics: data.advanced_metrics ?? {},
                      affectedJoints: data.affected_joints ?? [],
                      affectedSegments: data.affected_segments ?? [],
                      timestamp: new Date()
                    };

                    // Update session logs using functional update
                    // In your pose.onResults callback:
setSessionLogs(prevLogs => {
  const newLogs = [...prevLogs, logEntry];
  sessionLogsRef.current = newLogs; // Keep ref in sync
  return newLogs;
});

                    // Log for debugging
                    console.log(`Rep ${currentReps}, Stage: ${data.repState ?? data.stage ?? "N/A"}, Score: ${data.rep_score ?? 0}`);
                  }

                  // Check if set is complete when reps exactly meet goal
                  if (currentReps >= repsGoal && !setCompleteDialogShown.current) {
                    console.log(`Rep goal reached: ${currentReps}/${repsGoal}, completing set ${currentSet}`);

                    // Set the flag early to prevent multiple triggers from rapid landmark processing
                    setCompleteDialogShown.current = true;

                    // Only call handleSetCompletion once when goal is reached
                    // Use setTimeout with longer delay and double-check the flag
                    setTimeout(() => {
                      // Extra safety check to make sure we don't trigger completion logic again
                      // if something else already started the process
                      if (setCompleteDialogShown.current) {
                        console.log("Starting set completion process...");
                        handleSetCompletion();
                      }
                    }, 1000); // Longer delay to ensure UI updates and state is stable
                  }
                })
                .catch(err => {
                  console.error("Backend error:", err);
                  setFeedback("Connection error. Check backend server.");
                });
            }
          }

          currentCtx.restore();
        });

        // Store pose reference
        poseRef.current = pose;
        console.log("Pose setup complete");

        // Now setup the camera
        setupCamera();
      } catch (error) {
        console.error("Error setting up MediaPipe Pose:", error);
        setFeedback("Failed to initialize pose detection. Please reload.");
      }
    };

    // Setup camera
    const setupCamera = async () => {
      const abortController = new AbortController();
      try {
        console.log("Setting up camera");
        setFeedback("Initializing camera...");

        if (!video || !poseRef.current) {
          console.error("Video element or Pose not available");
          return;
        }

        // Request camera permissions explicitly
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: false
          });
          // Stop the stream immediately to avoid conflicts with Camera utility
          stream.getTracks().forEach(track => track.stop());
          console.log("Camera permission granted");
        } catch (error) {
          console.error("Camera permission denied:", error);
          setFeedback("Camera permission denied. Please allow camera access and reload.");
          return;
        }

        // Create Camera instance
        const camera = new Camera(video, {
          onFrame: async () => {
            // Only proceed if camera is ready and video dimensions are available
            if (video.videoWidth && video.videoHeight) {
              setCameraReady(true);

              const brightness = getAverageBrightness(video);
              if (brightness < BRIGHTNESS_THRESHOLD) {
                setLighting("Too Dark");
                setFeedback("Lighting is too dark. Please improve your lighting.");

                const ctx = canvas.getContext("2d");
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
              } else {
                setLighting("Good");
                if (poseRef.current) {
                  await poseRef.current.send({ image: video });
                }
              }
            }
          },
          width: 640,
          height: 480,
        });

        // Start camera with error handling
        console.log("Starting camera");
        if (abortController.signal.aborted) return;
        camera.start()
          .then(() => {
            console.log("Camera started successfully");
            setFeedback("Camera started. Please stand back to ensure your full body is visible.");
            cameraRef.current = camera;
          })
          .catch((err: Error) => {
            if (!abortController.signal.aborted) {
              console.error("Camera error:", err);
            }
            console.error("Error starting camera:", err);
            setFeedback("Failed to start camera. Please check permissions and reload.");
          });
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Camera error:", error);
        }
        console.error("Camera setup error:", error);
        setFeedback("Camera setup failed. Please reload the page.");
      }
      return () => {
        abortController.abort();
      };
    };

    // Start the setup process
    setupPose();

    // Cleanup function
    return () => {
      console.log("Cleaning up camera and pose");
      const cleanup = async () => {
        // Stop camera first
        if (cameraRef.current) {
          await cameraRef.current.stop().catch(() => {});
        }
    
        // Then save logs if needed
        const currentSessionId = sessionIdRef.current;
        const logsToSave = sessionLogsRef.current;
        
        if (currentSessionId && logsToSave.length > 0) {
          console.log(`Cleanup: Saving ${logsToSave.length} remaining logs`);
          await saveLogs();
          await completeSession();
        }
      };
    
      cleanup().catch(console.error);
    };
  }, [exerciseName, navigate, repsGoal, totalSets]);

  // Set up auto-saving of logs every 10 seconds
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      const currentSessionId = sessionIdRef.current;
      const logsCount = sessionLogsRef.current.length;
  
      if (currentSessionId && logsCount > 0) {
        console.log("Auto-saving logs...");
        await saveLogs();
        
        // Force update logs ref after save
        setSessionLogs([]);
      }
    }, 8000); // Reduced to 8 seconds
  
    return () => clearInterval(saveInterval);
  }, []); // Empty dependency array since we're using refs

  // Add this function to explicitly reset the backend counter
  const resetBackendCounter = async (): Promise<void> => {
    const exerciseConversion: Record<string, string> = {
      bicep_curl: 'bicep_curls',
      squat: 'squats',
      pushup: 'pushups',
      deadlift: 'deadlifts',
      lunge: 'lunges',
      situp: 'situps'
    };

    const apiExerciseName = exerciseConversion[exerciseName] || exerciseName;

    console.log(`Resetting backend counter for ${apiExerciseName}`);

    try {
      const response = await fetch(`http://localhost:8000/reset/${apiExerciseName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const result = await response.json();
      console.log("Backend counter reset result:", result);
    } catch (error) {
      console.error("Failed to reset backend counter:", error);
    }
  };

  // Extracted set completion handler to its own function for clarity
  // Replaces your existing handleSetCompletion
  // Revised handleSetCompletion function
  const handleSetCompletion = async (): Promise<void> => {
    try {
      console.log(`Set ${currentSetRef.current} completed. Saving logs...`);
      setCompleteDialogShown.current = true;
  
      // 1) Force save any remaining logs for this set
      await saveLogs();
  
      const nextSet = currentSetRef.current + 1;
      if (nextSet <= totalSets) {
        console.log(`Advancing to set ${nextSet}/${totalSets}`);
  
        // 2) Stop camera BEFORE any state changes
        if (cameraRef.current) {
          await cameraRef.current.stop();
          cameraRef.current = null;
        }
  
        // 3) Reset backend counter
        await resetBackendCounter();
  
        // 4) Update state using functional updates to avoid race conditions
        setCurrentSet(prev => nextSet);
        currentSetRef.current = nextSet;
        
        // 5) Reset reps using callback form
        setRepCount(0);
        repCountRef.current = 0;
  
        // 6) Delay log reset until after camera restart
        setTimeout(() => {
          setSessionLogs([]);
        }, 500);
  
        // 7) Restart camera with fresh state
        await resetExerciseState();
  
        // 8) Reset completion flag AFTER restart
        setCompleteDialogShown.current = false;
      } else {
        // For final set completion
        console.log("All sets done - final save");
        await saveLogs();
        await completeSession();
        
        // Navigate AFTER ensuring save is complete
        navigate(`/sessions/${sessionIdRef.current}`);
      }
    } catch (error) {
      console.error("Set completion error:", error);
    }
  };



  // Function to get exercise-specific metrics for display
  const getAdvancedMetrics = () => {
    if (!latestFeedback?.advanced_metrics) return null;

    const metrics = latestFeedback.advanced_metrics;
    const metricRows = Object.entries(metrics).map(([key, value]) => {
      // Safely handle non-number values
      const formattedValue = typeof value === 'number'
        ? value.toFixed(1)
        : 'N/A';

      return (
        <p key={key} className="text-dark-300 flex justify-between items-center">
          <span className="capitalize font-medium">{key.replace(/_/g, " ")}:</span>
          <span className="text-right font-mono">{formattedValue}</span>
        </p>
      );
    });

    return metricRows.length > 0 ? (
      <div className="bg-dark-800 rounded-lg border border-dark-700 p-3 shadow-md">
        <h3 className="text-lg font-semibold text-primary-400 mb-2">Advanced Metrics</h3>
        <div className="space-y-1">
          {metricRows}
        </div>
      </div>
    ) : null;
  };

  return (
    <div className="bg-dark-950 min-h-screen text-white">
      <header className="bg-dark-900 border-b border-dark-800 py-3 px-6 sticky top-0 z-10">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <h1 className="text-2xl font-bold text-center md:text-left">
            <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              {exerciseName ? exerciseName.replace("_", " ").toUpperCase() : "Exercise"}
            </span>
          </h1>
          <button
            className="flex items-center gap-2 px-3 py-1 rounded-md bg-dark-800 hover:bg-dark-700 transition-colors duration-200 text-dark-200"
            onClick={() => {
              // Save any remaining logs before navigating away
              if (sessionId && sessionLogs.length > 0) {
                saveLogs().then(() => {
                  completeSession().then(() => {
                    navigate(`/sessions/${sessionIdRef.current}`);
                  });
                });
              } else {
                navigate(`/sessions/${sessionIdRef.current}`);
              }
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-3">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left side - Video */}
          <div className="lg:w-2/3">
            <div className="relative bg-dark-800 rounded-lg border border-dark-700 overflow-hidden shadow-lg">
              <video
                ref={videoRef}
                className="hidden"
                playsInline
                autoPlay
                muted
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="w-full object-cover"
                style={{ aspectRatio: "4/3" }}
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm">
                  <div className="text-center px-6 py-4 rounded-lg bg-dark-800/90 max-w-md">
                    <div className="animate-pulse mb-3 w-8 h-8 mx-auto rounded-full bg-primary-700/50"></div>
                    <p className="text-lg text-dark-200">{feedback}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Stats and Controls */}
          <div className="lg:w-1/3 space-y-3">
            {/* Exercise Progress - Top stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary-900/20 rounded-lg border border-primary-700/30 p-3 flex flex-col items-center">
                <div className="text-3xl font-bold text-primary-400">{repCount}</div>
                <div className="text-xs text-dark-300">Rep Count</div>
              </div>
              <div className="bg-secondary-900/20 rounded-lg border border-secondary-700/30 p-3 flex flex-col items-center">
                <div className="text-lg font-bold text-secondary-400">{stage}</div>
                <div className="text-xs text-dark-300">Current Stage</div>
              </div>
              <div className="bg-accent-900/20 rounded-lg border border-accent-700/30 p-3 flex flex-col items-center col-span-2">
                <div className="text-lg font-bold text-accent-400">Set {currentSet} / {totalSets}</div>
                <div className="text-xs text-dark-300 text-center">{repCount} of {repsGoal} reps completed</div>
              </div>
            </div>

            {/* Feedback Box */}
            <div className="bg-dark-800 rounded-lg border border-dark-700 p-3 shadow-md">
              <h3 className="text-lg font-semibold text-primary-400 mb-1">Feedback</h3>
              <p className="text-dark-200 text-sm">{feedback}</p>
            </div>

            {/* Status Grid - Now in a grid of 4 instead of 2x2 */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-dark-800 rounded-lg border border-dark-700 p-2">
                <h3 className="text-xs font-medium text-dark-300">Lighting</h3>
                <p className={`text-sm font-medium ${lighting === "Good" ? "text-success-400" : "text-warning-400"}`}>
                  {lighting}
                </p>
              </div>
              <div className="bg-dark-800 rounded-lg border border-dark-700 p-2">
                <h3 className="text-xs font-medium text-dark-300">Visibility</h3>
                <p className={`text-sm font-medium ${visibilityStatus.includes("Good") ? "text-success-400" : "text-warning-400"}`}>
                  {visibilityStatus.includes("Good") ? "Good" : "Poor"}
                </p>
              </div>
              <div className="bg-dark-800 rounded-lg border border-dark-700 p-2">
                <h3 className="text-xs font-medium text-dark-300">Movement</h3>
                <p className={`text-sm font-medium ${movementStatus.includes("Good") ? "text-success-400" : "text-warning-400"}`}>
                  {movementStatus.includes("Good") ? "Good" : "Too Fast"}
                </p>
              </div>

              {latestFeedback?.rep_score ? (
                <div className="bg-dark-800 rounded-lg border border-dark-700 p-2">
                  <h3 className="text-xs font-medium text-dark-300">Form Score</h3>
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-primary-400">{latestFeedback.rep_score.toFixed(1)}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-dark-800 rounded-lg border border-dark-700 p-2">
                  <h3 className="text-xs font-medium text-dark-300">Form Score</h3>
                  <div className="text-sm font-medium text-dark-400">N/A</div>
                </div>
              )}
            </div>

            {/* Session Status - Temporarily disabled
  {sessionId && (
    <div className="bg-dark-800 rounded-lg border border-primary-700/30 p-3 shadow-md">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-primary-400 mb-1">Session Status</h3>
        {isSendingLogs && (
          <div className="animate-pulse w-4 h-4 rounded-full bg-primary-400"></div>
        )}
      </div>
      <div className="text-dark-300 text-sm">
        <p>Session ID: <span className="font-mono text-xs text-dark-400">{sessionId.substring(0, 8)}...</span></p>
        <p>Collected data points: {sessionLogs.length}</p>
      </div>
    </div>
  )}
*/}

            {/* Advanced Metrics */}
            {getAdvancedMetrics()}
          </div>
        </div>
      </main>
    </div>
  );
};

// Add TypeScript interface for Window object to include MediaPipe's Pose
declare global {
  interface Window {
    Pose: any;
  }
}

export default Exercise;