import requests
import json
import sys
import time
from tabulate import tabulate
from test_api_feedback import generate_test_landmarks

def check_consistency(base_url):
    """
    Test all exercise endpoints and verify response format consistency
    """
    exercises = ["squats", "pushups", "deadlifts", "lunges", "situps", "bicep_curls"]
    results = {}
    issues = []
    
    print("==================================================")
    print("    ReGenix API Consistency Test                  ")
    print("==================================================")
    print(f"Testing API at: {base_url}")
    
    # Expected fields based on API documentation
    required_fields = [
        "counter", "repCount",  # counter can be named either way
        "stage", 
        "feedback",
        "feedback_flags",
        "rep_score",
        "score_label",
        "affected_joints",
        "affected_segments",
        "progress"
    ]
    
    # Track which fields are present in each exercise response
    field_presence = {exercise: {} for exercise in exercises}
    
    # Test each exercise endpoint
    for exercise in exercises:
        print(f"\nTesting {exercise} endpoint...")
        
        # Generate test landmarks
        landmarks = generate_test_landmarks(exercise)
        
        # Setup the endpoint
        endpoint = f"{base_url}/landmarks/{exercise}"
        
        try:
            # Make API request
            start_time = time.time()
            response = requests.post(endpoint, json={"landmarks": landmarks})
            end_time = time.time()
            processing_time = (end_time - start_time) * 1000  # ms
            
            # Check for successful response
            if response.status_code == 200:
                result = response.json()
                results[exercise] = result
                
                # Check for required fields
                for field in required_fields:
                    if field in ["counter", "repCount"]:
                        # Either counter or repCount should be present
                        has_counter = "counter" in result
                        has_rep_count = "repCount" in result
                        field_presence[exercise][field] = has_counter or has_rep_count
                        if not field_presence[exercise][field]:
                            issues.append(f"{exercise}: Missing both 'counter' and 'repCount'")
                    else:
                        field_presence[exercise][field] = field in result
                        if not field_presence[exercise][field]:
                            issues.append(f"{exercise}: Missing '{field}'")
                
                # Check feedback format
                if "feedback" in result and "feedback_flags" in result:
                    feedback_msg = result["feedback"]
                    flags = result.get("feedback_flags", [])
                    
                    # Check if feedback is just joined flags
                    joined_flags = " | ".join(flags)
                    if joined_flags == feedback_msg:
                        issues.append(f"{exercise}: Feedback message appears to be directly joined flags")
                
                # Check affected_joints and affected_segments format
                if "affected_joints" in result:
                    if not isinstance(result["affected_joints"], list):
                        issues.append(f"{exercise}: affected_joints is not a list")
                
                if "affected_segments" in result:
                    if not isinstance(result["affected_segments"], list):
                        issues.append(f"{exercise}: affected_segments is not a list")
                    elif len(result["affected_segments"]) > 0:
                        segment = result["affected_segments"][0]
                        if not isinstance(segment, list) or len(segment) != 2:
                            issues.append(f"{exercise}: affected_segments doesn't follow [['joint1', 'joint2'], ...] format")
                
                print(f"Status Code: {response.status_code}")
                print(f"Processing Time: {processing_time:.2f} ms")
                
            else:
                print(f"Error: Status Code {response.status_code}")
                print(response.text)
                issues.append(f"{exercise}: API returned status code {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"Request Error: {e}")
            issues.append(f"{exercise}: Request error - {str(e)}")
    
    # Print consistency check table
    headers = ["Field"] + exercises
    rows = []
    
    for field in required_fields:
        if field in ["counter", "repCount"]:
            # Special handling for counter/repCount
            row = ["counter/repCount"]
        else:
            row = [field]
        
        for exercise in exercises:
            if field in ["counter", "repCount"]:
                # Either is acceptable
                value = field_presence[exercise].get("counter", False) or field_presence[exercise].get("repCount", False)
            else:
                value = field_presence[exercise].get(field, False)
            
            row.append("✅" if value else "❌")
        
        rows.append(row)
    
    print("\n==================================================")
    print("                CONSISTENCY REPORT                ")
    print("==================================================")
    print(tabulate(rows, headers=headers, tablefmt="grid"))
    
    # Print issues
    if issues:
        print("\nIssues Found:")
        for issue in issues:
            print(f"❌ {issue}")
    else:
        print("\n✅ No consistency issues found")
    
    # Return the results for potential further analysis
    return results, field_presence, issues

if __name__ == "__main__":
    API_BASE_URL = "http://localhost:8000"  # Change to match your API URL
    if len(sys.argv) > 1:
        API_BASE_URL = sys.argv[1]
    
    try:
        response = requests.get(f"{API_BASE_URL}/status")
        if response.status_code == 200:
            print("API is running. Starting tests...\n")
            check_consistency(API_BASE_URL)
        else:
            print(f"API status check failed with status code {response.status_code}")
            print("Please make sure the API is running at the specified URL.")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print(f"Could not connect to the API at {API_BASE_URL}")
        print("Please make sure the API is running and accessible.")
        sys.exit(1)
