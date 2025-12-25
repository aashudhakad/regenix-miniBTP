import requests
import json
import sys
import time
from test_api_feedback import generate_test_landmarks

def validate_api_format(base_url):
    """
    Validates that all exercise endpoints produce responses according to API documentation format
    """
    exercises = ["squats", "pushups", "deadlifts", "lunges", "situps", "bicep_curls"]
    issues = []
    
    print("==================================================")
    print("    ReGenix API Format Validation                 ")
    print("==================================================")
    print(f"Testing API at: {base_url}")
    
    # Required fields according to API docs
    required_fields = [
        "counter", "repCount",  # Either is acceptable
        "stage",
        "feedback",
        "feedback_flags",
        "rep_score", 
        "score_label",
        "affected_joints",
        "affected_segments",
        "progress",
        "advanced_metrics"  # According to API docs example
    ]
    
    for exercise in exercises:
        print(f"\nTesting {exercise} endpoint...")
        
        # Generate test landmarks
        landmarks = generate_test_landmarks(exercise)
        
        # Setup the endpoint
        endpoint = f"{base_url}/landmarks/{exercise}"
        
        try:
            # Make API request
            response = requests.post(endpoint, json={"landmarks": landmarks})
            
            if response.status_code == 200:
                result = response.json()
                
                print(f"Status Code: {response.status_code}")
                
                # Check required fields
                for field in required_fields:
                    if field == "counter" or field == "repCount":
                        # Either counter or repCount should be present
                        if "counter" not in result and "repCount" not in result:
                            issues.append(f"{exercise}: Missing both 'counter' and 'repCount'")
                            print(f"❌ Missing field: counter/repCount")
                    elif field not in result:
                        issues.append(f"{exercise}: Missing '{field}'")
                        print(f"❌ Missing field: {field}")
                    else:
                        print(f"✅ Found field: {field}")
                
                # Check feedback format
                if "feedback" in result and "feedback_flags" in result:
                    if result["feedback"] == " | ".join(result["feedback_flags"]):
                        issues.append(f"{exercise}: Feedback is directly joined flags")
                        print("❌ Feedback format issue: is directly joined flags")
                    else:
                        print("✅ Feedback correctly formatted")
                
                # Print feedback example
                print(f"\nCurrent API Response Format:")
                print(f"  Counter: {result.get('counter') or result.get('repCount', 0)}")
                print(f"  Stage: {result.get('stage', 'N/A')}")
                print(f"  Feedback flags: {result.get('feedback_flags', [])}")
                print(f"  Feedback message: {result.get('feedback', 'N/A')}")
                print(f"  Progress: {result.get('progress', 'N/A')}")
            else:
                print(f"Error: Status Code {response.status_code}")
                print(response.text)
                issues.append(f"{exercise}: API returned status code {response.status_code}")
        
        except Exception as e:
            print(f"Error: {str(e)}")
            issues.append(f"{exercise}: Error - {str(e)}")
    
    print("\n==================================================")
    print("                 VALIDATION RESULTS              ")
    print("==================================================")
    
    if issues:
        print("\nIssues Found:")
        for issue in issues:
            print(f"❌ {issue}")
    else:
        print("✅ All API responses match the expected format!")
    
    print("\n==================================================")

if __name__ == "__main__":
    API_BASE_URL = "http://localhost:8000"  # Change to match your API URL
    if len(sys.argv) > 1:
        API_BASE_URL = sys.argv[1]
    
    try:
        response = requests.get(f"{API_BASE_URL}/status")
        if response.status_code == 200:
            print("API is running. Starting validation...\n")
            validate_api_format(API_BASE_URL)
        else:
            print(f"API status check failed with status code {response.status_code}")
            print("Please make sure the API is running at the specified URL.")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print(f"Could not connect to the API at {API_BASE_URL}")
        print("Please make sure the API is running and accessible.")
        sys.exit(1)
