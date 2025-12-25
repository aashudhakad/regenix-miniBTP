

import React, { useEffect, useState } from 'react';
import { Calendar, Check, ChevronDown, Clock, Search, Star, Trophy, BarChart3, CheckCircle, AlertTriangle } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface SessionRecord {
  id: string;
  exercise: string;
  startTime: string;
  completed: boolean;
  duration: number | null;
  score: number;
  scoreLabel: string;
  progress: string;
  // Additional fields from session details API
  exercises?: {
    name: string;
    completed: boolean;
    accuracy?: number;
  }[];
  notes?: string;
  painLevel?: number;
}

const Record: React.FC = () => {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'thisWeek' | 'lastMonth'>('all');
  const [sessionDetails, setSessionDetails] = useState<{ [key: string]: any }>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessionLogs = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/sessions/history');

        if (response.data && response.data.success) {
          setSessions(response.data.data);
        } else {
          throw new Error('Invalid response format');
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch session logs:', err);
        setError('Failed to load session history. Please try again later.');
        setLoading(false);
      }
    };

    fetchSessionLogs();
  }, []);

  const toggleExpand = async (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);

      // Only fetch details if we don't have them already
      if (!sessionDetails[sessionId]) {
        try {
          const response = await api.get(`/api/sessions/${sessionId}/summary`);

          if (response.data && response.data.success) {
            // Transform the data to match our component's expected format
            const details = {
              exercises: response.data.data.session.exercise ?
                [{
                  name: response.data.data.session.exercise,
                  completed: response.data.data.session.completed,
                  accuracy: response.data.data.overallScore
                }] : [],
              notes: response.data.data.session.notes || '',
              painLevel: response.data.data.session.painLevel || undefined,
              setStats: response.data.data.setStats || []
            };

            setSessionDetails(prevDetails => ({
              ...prevDetails,
              [sessionId]: details
            }));
          }
        } catch (err) {
          console.error('Failed to fetch session details:', err);
          // Show a smaller error within the expanded section
          setSessionDetails(prevDetails => ({
            ...prevDetails,
            [sessionId]: { error: 'Failed to load details' }
          }));
        }
      }
    }
  };

  const filterSessions = () => {
    if (!sessions.length) return [];

    let filteredSessions = [...sessions];

    // Apply date filter
    if (filter === 'thisWeek') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filteredSessions = filteredSessions.filter(
        session => new Date(session.startTime) >= oneWeekAgo
      );
    } else if (filter === 'lastMonth') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      filteredSessions = filteredSessions.filter(
        session => new Date(session.startTime) >= oneMonthAgo
      );
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredSessions = filteredSessions.filter(session =>
        session.exercise.toLowerCase().includes(term) ||
        (sessionDetails[session.id]?.notes &&
          sessionDetails[session.id].notes.toLowerCase().includes(term))
      );
    }

    return filteredSessions;
  };

  const calculateCompletionRate = (session: SessionRecord) => {
    if (session.progress) {
      const [completed, total] = session.progress.split('/');
      const completedNum = parseInt(completed);
      const totalNum = parseInt(total);
      if (!isNaN(completedNum) && !isNaN(totalNum) && totalNum > 0) {
        return Math.round((completedNum / totalNum) * 100);
      }
    }
    return session.completed ? 100 : 0;
  };

  // Format duration properly based on length
  const formatDuration = (durationInSeconds: number | null): string => {
    if (durationInSeconds === null) return 'In progress';

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

  // Format exercise name for display
  const formatExerciseName = (name: string) => {
    return name.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get score color based on the score value
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success-500';
    if (score >= 70) return 'text-primary-400';
    if (score >= 50) return 'text-warning-500';
    return 'text-error-400';
  };

  // Get label for the feedback
  const getFeedbackLabel = (feedback: string) => {
    const labels: { [key: string]: string } = {
      'GOOD_CURL': 'Good form',
      'INCOMPLETE_CURL': 'Incomplete movement',
      'SHOULDER_SWINGING': 'Shoulder swinging',
      'TOO_FAST': 'Moving too fast',
      'ELBOW_NOT_FIXED': 'Elbow not fixed',
      'INCOMPLETE_EXTENSION': 'Incomplete extension'
    };

    return labels[feedback] || feedback.replace(/_/g, ' ').toLowerCase();
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

  const filteredSessions = filterSessions();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Session History</h1>
          <p className="text-dark-300">
            Track your training progress over time
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-dark-400" />
          </div>
          <input
            type="text"
            placeholder="Search exercises or notes..."
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <select
            className="input bg-dark-800 appearance-none pr-10"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}
          >
            <option value="all">All Sessions</option>
            <option value="thisWeek">This Week</option>
            <option value="lastMonth">Last Month</option>
          </select>
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="mx-auto mb-4 text-dark-400" size={48} />
            <h3 className="text-xl font-semibold mb-2">No Sessions Found</h3>
            <p className="text-dark-300 max-w-md mx-auto">
              {searchTerm || filter !== 'all'
                ? "No sessions match your current filters. Try adjusting your search or filter criteria."
                : "You haven't completed any rehabilitation sessions yet. Start a session from your planner."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="overflow-visible">
              <CardHeader>
                <div
                  className="cursor-pointer w-full"
                  onClick={() => toggleExpand(session.id)}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <div className="flex items-start flex-1">
                      <Calendar size={20} className="text-primary-400 mr-3 mt-1 flex-shrink-0" />
                      <div className="w-full">
                        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                          <h3 className="font-medium text-dark-300">
                            {new Date(session.startTime).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h3>
                          <h3 className="font-bold">{formatExerciseName(session.exercise)}</h3>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-dark-300">
                          <Clock size={14} className="mr-1" />
                          <span>{formatDuration(session.duration)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-2 md:mt-0">
                      <div className="text-right">
                        <div className="text-sm text-dark-300">Completion</div>
                        <div className="font-medium">{calculateCompletionRate(session)}%</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-dark-300">Score</div>
                        <div className={`font-medium ${getScoreColor(session.score)}`}>{session.score}%</div>
                      </div>

                      <ChevronDown
                        size={20}
                        className={`transform transition-transform duration-200 ${expandedSession === session.id ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedSession === session.id && (
                <CardContent className="pt-0 border-t border-dark-700">
                  {sessionDetails[session.id] ? (
                    sessionDetails[session.id].error ? (
                      <div className="text-error-400 text-center py-4">
                        {sessionDetails[session.id].error}
                      </div>
                    ) : (
                      <div className="w-full mt-4">
                        <h3 className="text-lg font-bold mb-4 px-2">Exercise Details</h3>
                        <div className="w-full p-3 bg-dark-800 rounded-md mb-6">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              {session.completed ? (
                                <CheckCircle size={16} className="text-success-500 mr-3" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-dark-400 mr-3" />
                              )}
                              <span>{formatExerciseName(session.exercise)}</span>
                            </div>
                            <div>
                              <span className="text-dark-300 mr-1">Score:</span>
                              <span className={getScoreColor(session.score)}>{session.score}%</span>
                            </div>
                          </div>
                        </div>

                        <h3 className="text-lg font-bold mb-4 px-2">Sets</h3>
                        {sessionDetails[session.id].setStats &&
                          sessionDetails[session.id].setStats.length > 0 && (
                            <div className="space-y-4 mb-6">
                              {sessionDetails[session.id].setStats.map((set, i) => (
                                <div key={i} className="p-4 bg-dark-700 rounded-md">
                                  <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center">
                                      <div className="bg-primary-400 rounded-full w-8 h-8 flex items-center justify-center text-dark-900 font-bold mr-3">
                                        {set.setNumber}
                                      </div>
                                      <span className="font-medium text-lg">Set {set.setNumber}</span>
                                    </div>
                                    <span className="text-md text-dark-300">{set.repCount} reps</span>
                                  </div>
                                  {set.averageScore > 0 && (
                                    <div className="mb-3">
                                      <span className="text-md text-dark-300">Average Score: </span>
                                      <span className={`font-medium ${getScoreColor(set.averageScore)}`}>{set.averageScore}%</span>
                                    </div>
                                  )}
                                  {set.commonFeedback && set.commonFeedback.length > 0 && (
                                    <div>
                                      <span className="text-md font-medium mb-2 block">Feedback:</span>
                                      <div className="mt-2 space-y-2">
                                        {set.commonFeedback.map((feedback: string, idx: number) => (
                                          <div key={idx} className="flex items-center">
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
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                        <div className="flex justify-between items-start">
                          {sessionDetails[session.id].painLevel !== undefined && (
                            <div className="mb-4 mr-6">
                              <h4 className="font-medium mb-2">Pain Level</h4>
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <Star
                                    key={level}
                                    size={20}
                                    className={`${level <= sessionDetails[session.id].painLevel!
                                      ? 'text-warning-500 fill-warning-500'
                                      : 'text-dark-600'
                                      } mr-1`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {sessionDetails[session.id].notes && (
                            <div className="flex-1">
                              <h4 className="font-medium mb-2">Notes</h4>
                              <div className="p-3 bg-dark-800 rounded-md">
                                <p className="text-dark-200">{sessionDetails[session.id].notes}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end mt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/sessions/${session.id}`)}
                          >
                            View Full Details
                          </Button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="py-8 flex justify-center">
                      <LoadingSpinner size="md" />
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Record;