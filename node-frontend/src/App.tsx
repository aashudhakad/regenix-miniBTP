import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Planner from './pages/Planner';
import Record from './pages/Record';
import Profile from './pages/Profile';
import Report from './pages/Report';
import Exercise from './pages/Exercise';
// import Sessions from './pages/Sessions'; 
import SessionSummary from './pages/SessionSummary';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-dark-950 text-dark-50">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/record" element={<Record />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/report" element={<Report />} />
              <Route path="/exercise" element={<Exercise />} />
              {/* <Route path="/sessions" element={<Sessions />} /> */}
              <Route path="/sessions/:sessionId" element={<SessionSummary />} />
              
              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;