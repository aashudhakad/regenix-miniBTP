"""
API Launcher for ReGenix Exercise Analysis

This script runs the FastAPI application directly without needing to use the uvicorn
command, which can help avoid module import issues.
"""

import uvicorn
import os
import sys

# Instead of modifying sys.path, run from the current directory
if __name__ == "__main__":
    print("Starting ReGenix Exercise Analysis API...")
    print("Access the API at http://localhost:8000")
    print("Access the API documentation at http://localhost:8000/docs")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
