# 🤖 ReGeniX Backend

**Developer:** [Shreshtha Garg](https://github.com/Shreshtha-Garg)  
**Stack:** Node.js, Express.js, MongoDB  
**Purpose:** An AI-powered fitness companion that transforms your camera into a personal trainer - analyzing movement patterns in real-time, providing intelligent form correction, and gamifying your fitness journey with performance analytics.

---

## 💪 About ReGeniX

ReGeniX revolutionizes home workouts by bringing professional-grade form analysis to your personal space. The system processes camera input to create a digital skeleton overlay, comparing your movements against ideal form patterns. Unlike conventional fitness apps, ReGeniX doesn't just count reps—it evaluates the quality of each movement, helping prevent injuries and maximize workout effectiveness.

With real-time visual feedback, the experience feels like having an attentive personal trainer by your side, guiding you through perfect execution while respecting your privacy (no video is ever stored).

---

## 📂 Folder Structure
```text
regenix-backend/
├── config/             # Database connection (MongoDB via Mongoose)
│   └── db.js
├── controllers/        # Business logic for APIs
│   ├── authController.js
│   ├── sessionController.js
│   └── dashboardController.js
├── middleware/         # Auth, token validation, error handling
│   ├── auth.js
│   ├── verifyToken.js
│   └── errorHandler.js
├── models/             # Mongoose schemas
│   ├── User.js
│   ├── Session.js
│   └── SessionLog.js
├── routes/             # Express routes
│   ├── authRoutes.js
│   ├── sessionRoutes.js
│   └── dashboardRoutes.js
├── .env.example        # Environment variable template
├── app.js              # Express app setup
└── package.json
```

---

## 🌐 API Endpoints
All routes are prefixed with `/api`.

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint    | Description                   |
| ------ | ----------- | ----------------------------- |
| POST   | `/register` | Register a new user           |
| POST   | `/login`    | User login & JWT issuance     |
| GET    | `/profile`  | Get authenticated user profile|
| PUT    | `/edit`     | Update user profile           |
| GET    | `/me`       | Get user from token           |

### 🏋️ Training Sessions (`/api/sessions`)
| Method | Endpoint                   | Description                              |
| ------ | -------------------------- | ---------------------------------------- |
| POST   | `/`                        | Start a session                          |
| GET    | `/user-sessions`           | List all user sessions                   |
| GET    | `/history`                 | Completed session history                |
| GET    | `/:sessionId`              | Session details + logs                   |
| GET    | `/:sessionId/summary`      | Session performance summary              |
| POST   | `/:sessionId/logs`         | Submit form-analysis logs                |
| PUT    | `/:sessionId/complete`     | Complete session & calculate score       |

### 📊 Dashboard Analytics (`/api/dashboard`)
| Method | Endpoint                   | Description                              |
| ------ | -------------------------- | ---------------------------------------- |
| GET    | `/user/:userId/summary`    | User workout overview                    |

---

## 🛡️ Middleware Highlights
- **auth.js** — JWT verification, user loading, error response  
- **verifyToken.js** — Lightweight token check for `/me`   
- **errorHandler.js** — Centralized error formatting (stack trace in dev)

---

## 🔐 Security & Privacy
- **JWT Authentication** with expiration control  
- **Password hashing** via bcrypt before saving  
- **No camera feed storage** on backend — user privacy ensured  
- **Production-safe errors**: hide stack in production

---

## ✅ Key Strengths
- **Clean Modular Structure**: Clear separation of config, controllers, models, routes  
- **RESTful API Design**: Intuitive, predictable endpoints  
- **Robust Access Control**: Auth middleware & ownership checks  
- **Fine‑grained Analytics**: Detailed logs, aggregated session scoring  
- **Scalable & Maintainable**: Ready for new features, easy to extend

---

## 🚀 Future Roadmap
- **Report Generation**: PDF/CSV exports of workouts & progress  
- **Expanded Exercise Library**: More movements with tailored feedback  
- **Personalized Workout Planner**: AI‑driven plans based on history  
- **Model Retraining**: Improve form detection accuracy over time  
- **Notifications & Reminders**: In‑app and email alerts  
- **Social Features**: Leaderboards, progress sharing, community challenges
- **Custom Workout Programs**: Create and share custom workout programs
- **Integration with Wearables**: Combine form analysis with biometric data

---

## 👩‍💻 Maintainer
**Shreshtha Garg** — Backend Engineer - ReGeniX