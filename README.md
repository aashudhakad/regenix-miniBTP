# ReGenix-Rehabilitation-App

ReGenix is an AI‑powered exercise tracking application using MediaPipe Pose Detection and FastAPI to deliver real‑time form analysis, rep counting, and detailed session reports.  

-------------------------------------------------------------------------------

## 🚀 Key Features

- Real‑time skeleton overlay with color‑coded joint feedback  
- Automated rep counting and stage tracking for 6 exercises  
- Research‑backed posture metrics and advanced form analysis  
- Session management: start, record, end, and detailed reports  
- Per‑rep scoring, common issues summary, and improvement suggestions  
- Simple HTML/CSS/JS frontend; modular Python backend  

-------------------------------------------------------------------------------

## 📁 Repository Structure

```
ReGenix-Rehabilitation-App/
├── backend/                  
│   ├── bicep_curls.py        # Bicep curl analysis
│   ├── deadlifts.py          # Deadlift analysis
│   ├── lunges.py             # Lunge analysis
│   ├── pushups.py            # Push‑up analysis
│   ├── situps.py             # Sit‑up analysis
│   ├── squats.py             # Squat analysis
│   ├── feedback_config.py    # Thresholds & messages
│   ├── score_config.py       # Scoring logic
│   ├── reference_poses.py    # Reference skeleton generator
│   ├── session_state.py      # In‑memory session tracking
│   ├── routers/              
│   │   ├── session_router.py # Session API & reports
│   │   └── reference_router.py # Reference pose API
│   ├── state.py              # Exercise state wrapper
│   ├── main.py               # FastAPI entry point
│   └── run_api.py            # Uvicorn launcher
│
├── frontend/                 
│   ├── index.html            # Exercise selection
│   ├── exercise.html         # Live exercise page
│   ├── user-details.html     # Collect user info
│   ├── public/               
│   │   └── ...               
│   ├── css/styles.css        # Styles
│   └── js/                   
│       ├── main.js           # Navigation & prompts
│       ├── exercise.js       # Pose capture & overlay
│       └── user-details.js   # User form logic
│
└── README.md                 # Project documentation
```

-------------------------------------------------------------------------------

## 🛠️ Installation

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend

Serve `frontend/` via any static server:

```bash
cd frontend
python -m http.server 8080
```

-------------------------------------------------------------------------------

## ▶️ Running the System

1. **Start the API**  
   ```bash
   cd backend
   python run_api.py
   ```
   - FastAPI docs → http://localhost:8000/docs  

2. **Open Frontend**  
   Navigate to http://localhost:8080/index.html  

-------------------------------------------------------------------------------

## 🖥️ Frontend Flow

- On first visit, prompt for user details (optional).  
- Select exercise; opens `exercise.html?exercise=<name>`.  
- Live video feed processed via MediaPipe → landmarks sent to backend.  
- Skeleton overlay drawn green; problematic segments/joints flash red.  
- UI boxes show reps, stage, feedback, set & target, lighting, score color.

-------------------------------------------------------------------------------

## 🔗 Backend Endpoints

### Landmarks Processing

```
POST /landmarks/{exercise_name}?session_id=<id>
Body: { "landmarks": [ {x,y,z}, … ] }
```
- Returns per‑frame analysis: repCount, stage, feedback, rep_score, advanced_metrics, affected_joints/segments.

### State Reset

```
POST /reset/{exercise_name}
```
- Resets rep counter & form state for next set.

### Session Management

```
POST   /session/start         → { session_id, start_time }
POST   /session/{id}/record   → record rep data
POST   /session/{id}/end      → end session
GET    /session/{id}/summary  → basic summary
GET    /session/{id}/report   → comprehensive report
GET    /session/{id}/exercises→ per‑exercise summary
GET    /session/{id}/reps     → full rep log + score stats
GET    /session/{id}/exercise/{name}/report
GET    /session/{id}/exercise/{name}/reps
```

-------------------------------------------------------------------------------

## 📊 Session Report Highlights

- **Overall summary**: total reps, avg. score, duration, performance rating.  
- **Exercise breakdown**: reps, avg. score, top issues.  
- **Rep‑by‑rep**: individual score, timestamp, feedback flags, per‑rep metrics.  
- **Form analysis**: common issues chart, metrics trends.  
- **Improvement suggestions**: general & exercise‑specific tips.

-------------------------------------------------------------------------------

## 🔬 Research‑Backed Metrics

Each exercise uses core and advanced metrics:

- **Squats**: knee angle, torso angle, valgus, asymmetry, descent/ascent timing.  
- **Deadlifts**: back & hip angles, lumbar flexion, bar path deviation, tempo.  
- **Push‑ups**: elbow angle, trunk alignment, hip sag/peak detection.  
- **Lunges**: knee projection, depth, torso lean, balance proxies.  
- **Sit‑ups**: hip flexion, neck angle, velocity/jerk estimates.  
- **Bicep Curls**: ROM, shoulder drift, path straightness, angular velocity.

-------------------------------------------------------------------------------

## 🙌 Contribution

- Fork the repo & submit PRs  
- Add new exercises via modular pattern  
- Improve UI/UX or metrics  

-------------------------------------------------------------------------------

