import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Star,
  Trophy,
  BarChart3,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';

const SessionSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { sessionId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessionSummary = async () => {
      try {
        setLoading(true);
        // Fetch session summary data from API
        const response = await api.get(`/api/sessions/${sessionId}/summary`);

        if (response.data && response.data.success) {
          setSummary(response.data.data);
        } else {
          throw new Error('Invalid response format');
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch session summary:', err);
        setError('Failed to load session summary. Please try again later.');
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionSummary();
    }
  }, [sessionId]);

  // Format duration properly based on length
  const formatDuration = (durationInSeconds) => {
    if (!durationInSeconds) return 'N/A';

    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Format date nicely
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get score color based on the score value
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-success-500';
    if (score >= 70) return 'text-primary-400';
    if (score >= 50) return 'text-warning-500';
    return 'text-error-400';
  };

  // Get label for the feedback
  const getFeedbackLabel = (feedback) => {
    const labels = {
      'GOOD_CURL': 'Good form',
      'INCOMPLETE_CURL': 'Incomplete movement',
      'SHOULDER_SWINGING': 'Shoulder swinging',
      'TOO_FAST': 'Moving too fast',
      'ELBOW_NOT_FIXED': 'Elbow not fixed'
    };

    return labels[feedback] || feedback.replace(/_/g, ' ').toLowerCase();
  };

  // Format exercise name for display
  const formatExerciseName = (name) => {
    return name.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-400 mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Session Summary</h1>
          <p className="text-dark-300">
            Review your performance and progress
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/record')}>
          Back to History
        </Button>
      </div>

      {summary && (
        <>
          {/* Session Overview Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center">
                  <Trophy size={24} className="text-primary-400 mr-3" />
                  <h2 className="text-xl font-bold">
                    {formatExerciseName(summary.session.exercise)} Session
                  </h2>
                </div>
                <div className="mt-2 md:mt-0 flex items-center">
                  <Calendar size={16} className="text-dark-400 mr-2" />
                  <span className="text-dark-300">
                    {formatDate(summary.session.startTime)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Overall Score */}
                <div className="bg-dark-800 rounded-lg p-4 text-center">
                  <div className="text-dark-300 mb-1">Overall Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(summary.overallScore)}`}>
                    {summary.overallScore}%
                  </div>
                  <div className="text-sm mt-1">{summary.scoreLabel}</div>
                </div>

                {/* Duration */}
                <div className="bg-dark-800 rounded-lg p-4 text-center">
                  <div className="text-dark-300 mb-1">Duration</div>
                  <div className="text-3xl font-bold">
                    {formatDuration(summary.session.duration)}
                  </div>
                  <div className="text-sm mt-1 flex items-center justify-center">
                    <Clock size={14} className="mr-1" />
                    <span>
                      {formatTime(summary.session.startTime)} - {formatTime(summary.session.endTime || new Date())}
                    </span>
                  </div>
                </div>

                {/* Sets Completed */}
                <div className="bg-dark-800 rounded-lg p-4 text-center">
                  <div className="text-dark-300 mb-1">Sets Completed</div>
                  <div className="text-3xl font-bold">
                    {summary.completedSets}/{summary.totalSets}
                  </div>
                  <div className="text-sm mt-1">
                    {summary.session.completed ? 'All sets completed' : 'Session in progress'}
                  </div>
                </div>

                {/* Status */}
                <div className="bg-dark-800 rounded-lg p-4 text-center">
                  <div className="text-dark-300 mb-1">Status</div>
                  <div className="flex justify-center">
                    {summary.session.completed ? (
                      <div className="flex items-center text-success-500">
                        <CheckCircle size={24} className="mr-2" />
                        <span className="text-xl font-bold">Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-warning-500">
                        <AlertTriangle size={24} className="mr-2" />
                        <span className="text-xl font-bold">In Progress</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm mt-1">
                    {summary.session.targetReps} reps per set
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Set Details */}
          <h2 className="text-xl font-bold mb-4">Set Details</h2>
          <div className="space-y-4 mb-8">
            {summary.setStats && summary.setStats.length > 0 ? (
              summary.setStats.map((set, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-primary-400 rounded-full w-8 h-8 flex items-center justify-center text-dark-900 font-bold mr-3">
                          {set.setNumber}
                        </div>
                        <h3 className="font-bold">Set {set.setNumber}</h3>
                      </div>
                      <div className="mt-2 md:mt-0 flex items-center">
                        <span className="text-dark-300 mr-2">Repetitions:</span>
                        <span className="font-medium">{set.repCount}/{summary.session.targetReps}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center mb-3">
                          <BarChart3 size={16} className="text-primary-400 mr-2" />
                          <span className="text-dark-300">Average Score</span>
                        </div>
                        <div className="bg-dark-800 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className={`text-2xl font-bold ${getScoreColor(set.averageScore)}`}>
                              {set.averageScore}%
                            </div>
                            <div className="text-sm text-dark-300">
                              {set.averageScore >= 90 ? 'Excellent' :
                                set.averageScore >= 75 ? 'Good' :
                                  set.averageScore >= 60 ? 'Fair' : 'Needs Improvement'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center mb-3">
                          <Check size={16} className="text-primary-400 mr-2" />
                          <span className="text-dark-300">Common Feedback</span>
                        </div>
                        {set.commonFeedback && set.commonFeedback.length > 0 ? (
                          <div className="bg-dark-800 rounded-lg p-4">
                            <ul className="space-y-2">
                              {set.commonFeedback.map((feedback, i) => (
                                <li key={i} className="flex items-center">
                                  {
                                    (
                                      feedback === "Good bicep curl form" ||
                                      feedback === "Good squat form" ||
                                      feedback === "Good deadlift form" ||
                                      feedback === "Good pushup form" ||
                                      feedback === "Good lunge form" ||
                                      feedback === "Good situp form"
                                    ) ? (
                                      <CheckCircle size={14} className="text-success-500 mr-2 flex-shrink-0" />
                                    ) : (
                                      <AlertTriangle size={14} className="text-warning-500 mr-2 flex-shrink-0" />
                                    )
                                  }
                                  <span>{feedback}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="bg-dark-800 rounded-lg p-4 text-dark-300">
                            No feedback recorded for this set
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-dark-300">No set data available for this session</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row justify-between gap-4 mt-8">
            <Button
              variant="outline"
              onClick={() => navigate('/record')}
            >
              Back to History
            </Button>

            <div className="flex gap-3">
              {/* <Button 
                variant="secondary"
                onClick={() => navigate('/plan')}
              >
                Go to Planner
              </Button> */}
              <Button
                variant="primary"
                onClick={() => navigate('/planner')}
              >
                Start New Session
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SessionSummary;