import requests
import json
import time
import numpy as np
import matplotlib.pyplot as plt
from tqdm import tqdm

def generate_test_landmarks(exercise):
    """
    Generate a set of test landmarks that will trigger various feedback responses.
    Each exercise has a different optimal form and different potential issues.
    """
    # Create a basic template for landmarks (will be modified based on exercise)
    landmarks = []
    
    # Generate 33 landmarks (MediaPipe format)
    for i in range(33):
        landmarks.append({
            "x": 0.5,  # Center of frame horizontally
            "y": 0.5,  # Center of frame vertically
            "z": 0.0,
            "visibility": 0.98
        })
    
    # Adjust key landmarks based on exercise and scenario we want to test
    if exercise == "squats":
        # Set up a squat with knees caving inward
        landmarks[23]["y"] = 0.7  # Left hip
        landmarks[24]["y"] = 0.7  # Right hip
        landmarks[25]["x"] = 0.45  # Left knee (moved inward)
        landmarks[25]["y"] = 0.85
        landmarks[26]["x"] = 0.55  # Right knee (moved inward)
        landmarks[26]["y"] = 0.85
        landmarks[27]["x"] = 0.4  # Left ankle
        landmarks[27]["y"] = 0.95
        landmarks[28]["x"] = 0.6  # Right ankle
        landmarks[28]["y"] = 0.95
    
    elif exercise == "lunges":
        # Forward lunge with knee too far forward
        landmarks[23]["y"] = 0.6  # Left hip
        landmarks[24]["y"] = 0.6  # Right hip
        landmarks[25]["x"] = 0.6  # Left knee (forward)
        landmarks[25]["y"] = 0.8
        landmarks[26]["x"] = 0.4  # Right knee
        landmarks[26]["y"] = 0.7
        landmarks[27]["x"] = 0.5  # Left ankle
        landmarks[27]["y"] = 0.95
        landmarks[28]["x"] = 0.3  # Right ankle
        landmarks[28]["y"] = 0.9
    
    elif exercise == "deadlifts":
        # Deadlift with rounded back
        landmarks[11]["y"] = 0.4  # Left shoulder
        landmarks[12]["y"] = 0.4  # Right shoulder
        landmarks[23]["y"] = 0.7  # Left hip
        landmarks[24]["y"] = 0.7  # Right hip
        landmarks[25]["y"] = 0.85  # Left knee
        landmarks[26]["y"] = 0.85  # Right knee
        landmarks[0]["x"] = 0.48  # Nose (for back curvature)
        landmarks[0]["y"] = 0.3
    
    elif exercise == "pushups":
        # Pushup with sagging hips
        landmarks[11]["y"] = 0.6  # Left shoulder
        landmarks[12]["y"] = 0.6  # Right shoulder
        landmarks[23]["y"] = 0.65  # Left hip (sagging)
        landmarks[24]["y"] = 0.65  # Right hip (sagging)
    
    elif exercise == "situps":
        # Situp with neck strain
        landmarks[0]["y"] = 0.2  # Nose
        landmarks[11]["y"] = 0.4  # Left shoulder
        landmarks[12]["y"] = 0.4  # Right shoulder
        landmarks[23]["y"] = 0.7  # Left hip
        landmarks[24]["y"] = 0.7  # Right hip
    
    elif exercise == "bicep_curls":
        # Bicep curl with incomplete curl
        landmarks[11]["y"] = 0.3  # Left shoulder
        landmarks[12]["y"] = 0.3  # Right shoulder
        landmarks[13]["y"] = 0.5  # Left elbow
        landmarks[14]["y"] = 0.5  # Right elbow
        landmarks[15]["y"] = 0.7  # Left wrist (not curled fully)
        landmarks[16]["y"] = 0.7  # Right wrist
    
    return landmarks

def test_exercise_api(base_url, exercise_name):
    """Test a specific exercise endpoint and print the feedback results"""
    
    print(f"\nTesting {exercise_name} endpoint...")
    
    # Generate test landmarks for this exercise
    landmarks = generate_test_landmarks(exercise_name)
    
    # Setup the endpoint
    endpoint = f"{base_url}/landmarks/{exercise_name}"
    
    try:
        # Make API request
        response = requests.post(endpoint, json={"landmarks": landmarks})
        
        # Check for successful response
        if response.status_code == 200:
            result = response.json()
            
            # Print feedback results
            print(f"Status Code: {response.status_code}")
            print(f"Counter: {result.get('counter') or result.get('repCount', 0)}")
            print(f"Stage: {result.get('stage', 'N/A')}")
            print(f"Feedback Flags: {result.get('feedback_flags', [])}")
            print(f"Feedback Message: {result.get('feedback', 'N/A')}")
            print(f"Rep Score: {result.get('rep_score', 0)}")
            print(f"Score Label: {result.get('score_label', 'N/A')}")
            
            # Check if affected joints are properly included
            affected_joints = result.get('affected_joints', [])
            affected_segments = result.get('affected_segments', [])
            print(f"Affected Joints: {affected_joints}")
            print(f"Affected Segments: {affected_segments}")
            
            # Verify that feedback is correctly derived from flags
            feedback_flags = result.get('feedback_flags', [])
            feedback_message = result.get('feedback', '')
            
            # Simple validation - feedback message should not be the same as joined flags
            joined_flags = " | ".join(feedback_flags)
            if joined_flags == feedback_message:
                print("❌ ERROR: Feedback message appears to be directly joined flags")
            else:
                print("✅ Feedback message correctly formatted")
            
            return result
        else:
            print(f"Error: Status Code {response.status_code}")
            print(response.text)
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}")
        return None

def test_all_exercises(base_url):
    """Test all exercise endpoints and summarize results"""
    
    exercises = ["squats", "pushups", "deadlifts", "lunges", "situps", "bicep_curls"]
    results = {}
    
    print("==================================================")
    print("    ReGenix API Feedback Test                     ")
    print("==================================================")
    print(f"Testing API at: {base_url}")
    
    for exercise in exercises:
        result = test_exercise_api(base_url, exercise)
        results[exercise] = result
        print("--------------------------------------------------")
    
    # Summary results
    print("\n==================================================")
    print("                 SUMMARY RESULTS                   ")
    print("==================================================")
    
    success_count = sum(1 for r in results.values() if r is not None)
    print(f"Tested {len(exercises)} exercises: {success_count} successful, {len(exercises) - success_count} failed")
    
    feedback_format_issues = 0
    for exercise, result in results.items():
        if result:
            feedback_flags = result.get('feedback_flags', [])
            feedback_message = result.get('feedback', '')
            joined_flags = " | ".join(feedback_flags)
            
            if joined_flags == feedback_message:
                feedback_format_issues += 1
                print(f"❌ {exercise}: Feedback issue - message is same as joined flags")
    
    if feedback_format_issues == 0:
        print("✅ All exercises have properly formatted feedback messages")
    else:
        print(f"❌ Found {feedback_format_issues} exercises with improperly formatted feedback")
    
    print("\n==================================================")

if __name__ == "__main__":
    API_BASE_URL = "http://localhost:8000"  # Change to match your API URL
    
    # Test status endpoint first to make sure API is running
    try:
        response = requests.get(f"{API_BASE_URL}/status")
        if response.status_code == 200:
            print("API is running. Starting tests...\n")
        else:
            print(f"API status check failed with status code {response.status_code}")
            print("Please make sure the API is running at the specified URL.")
            exit(1)
    except requests.exceptions.ConnectionError:
        print(f"Could not connect to the API at {API_BASE_URL}")
        print("Please make sure the API is running and accessible.")
        exit(1)
    
    test_all_exercises(API_BASE_URL)
