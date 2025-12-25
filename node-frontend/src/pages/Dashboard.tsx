import React, { useEffect, useState } from 'react';
import { ArrowRight, Award, Calendar, Clock, TrendingUp, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card, { CardContent, CardHeader } from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface DashboardData {
  overview: {
    totalSessions: number;
    totalTimeSpent: number;
    averageSessionDuration: number;
    mostPerformedExercise: string | null;
  };
  exerciseDistribution: {
    exercise: string;
    count: number;
  }[];
}

// Define all possible exercise types that can be performed in the app
const ALL_EXERCISE_TYPES = [
  'bicep_curls',
  'deadlifts',
  'squats',
  'push_ups',
  'lunges',
  'situps'
];

const MOCK_DATA: DashboardData = {
  overview: {
    totalSessions: 5,
    totalTimeSpent: 7,
    averageSessionDuration: 1,
    mostPerformedExercise: "bicep_curls"
  },
  exerciseDistribution: [
    { exercise: "bicep_curls", count: 6 },
    { exercise: "deadlifts", count: 1 }
  ]
};

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, isInitialized } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [useMock, setUseMock] = useState(true); // Set to true by default for testing

  useEffect(() => {
    if (!isInitialized || authLoading) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');

      try {
        // Get user data from either context or localStorage
        const storedUser = localStorage.getItem('user');
        const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);

        if (!isAuthenticated || !currentUser) {
          throw new Error('Please log in to view your dashboard');
        }

        // Handle both id and _id formats
        const userId = currentUser.id || currentUser._id;
        if (!userId) {
          throw new Error('User identification failed');
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await axios.get(
          `http://localhost:5000/api/dashboard/user/${userId}/summary`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setData(response.data);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);

        // Handle different error types
        if (err.response) {
          if (err.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setError('Session expired. Please log in again.');
          } else {
            setError(err.response.data.message || 'Server error');
          }
        } else if (err.request) {
          setError('Network error - please check your connection');
        } else {
          setError(err.message || 'Failed to load dashboard data');
        }

        // Fallback to mock data if enabled
        if (useMock) {
          setData(MOCK_DATA);
          setError('');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, isAuthenticated, authLoading, isInitialized, useMock]);

  // Show loading state until auth is initialized
  if (!isInitialized || authLoading || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show error state
  if (error && !useMock) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-400 mb-4">{error}</p>
          <div className="flex justify-center gap-4">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button
              variant="secondary"
              onClick={() => setUseMock(true)}
            >
              Use Demo Data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare exercise data for visualization
  const exerciseCounts: Record<string, number> = {};

  // Initialize counts for ALL exercise types to 0
  ALL_EXERCISE_TYPES.forEach(type => {
    exerciseCounts[type] = 0;
  });

  // Update counts from API data
  data?.exerciseDistribution?.forEach(item => {
    // Only update if it's in our predefined list
    if (ALL_EXERCISE_TYPES.includes(item.exercise)) {
      exerciseCounts[item.exercise] = item.count;
    }
  });

  const maxCount = Math.max(...Object.values(exerciseCounts), 1);

  // Format exercise name for display
  const formatExerciseName = (name: string) => {
    return name.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Calculate bar heights explicitly
  const calculateBarHeight = (count: number) => {
    if (count === 0) return 4; // Minimum height for zero values
    const percentage = (count / maxCount) * 100;
    return Math.max(Math.round(percentage), 4); // Ensure minimum height
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {(user?.name || 'User').toUpperCase()}
          </h1>
          <p className="text-dark-300">
            Keep up with your training progress!
          </p>
        </div>
        <div>
          <Link to="/planner">
            <Button variant="primary">
              Go To Exercises
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-primary-900/50 to-primary-800/30 border-primary-700/30">
          <CardContent className="flex items-center">
            <div className="mr-4 bg-primary-800/50 p-3 rounded-full">
              <Clock className="text-primary-300" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{data?.overview?.totalTimeSpent || 0} min</h3>
              <p className="text-dark-300 text-sm">Total Time Spent</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary-900/50 to-secondary-800/30 border-secondary-700/30">
          <CardContent className="flex items-center">
            <div className="mr-4 bg-secondary-800/50 p-3 rounded-full">
              <TrendingUp className="text-secondary-300" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{data?.overview?.totalSessions || 0}</h3>
              <p className="text-dark-300 text-sm">Total Sessions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent-900/50 to-accent-800/30 border-accent-700/30">
          <CardContent className="flex items-center">
            <div className="mr-4 bg-accent-800/50 p-3 rounded-full">
              <Award className="text-accent-300" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{data?.overview?.averageSessionDuration || 0} min</h3>
              <p className="text-dark-300 text-sm">Avg Session Duration</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {data?.overview?.mostPerformedExercise && (
        <Card className="mb-8">
          <CardContent className="flex items-center">
            <div className="mr-4 bg-primary-800/50 p-3 rounded-full">
              <Award className="text-primary-300" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Most Performed Exercise</h3>
              <p className="text-dark-300">{formatExerciseName(data.overview.mostPerformedExercise)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Different Exercises Performed</h2>
          </CardHeader>
          <CardContent>
            {/* Responsive chart implementation */}
            <div className="relative mt-6">
              {/* Y-axis labels */}
              <div className="absolute -top-6 left-0 right-0 flex justify-between px-4">
                {Object.entries(exerciseCounts).map(([exercise, count], index) => (
                  <div key={`count-${index}`} className="text-center">
                    <span className="text-xs font-medium text-primary-400">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Chart area with responsive bars */}
              <div className="flex justify-between items-end h-40 mb-8">
                {Object.entries(exerciseCounts).map(([exercise, count], index) => {
                  const barHeightPx = count === 0 ? 4 : Math.max((count / maxCount) * 140, 4);
                  
                  return (
                    <div key={`bar-${index}`} className="flex flex-col items-center">
                      {/* Use fixed pixel widths for different screen sizes to ensure proper scaling */}
                      <div 
                        className="bg-primary-500 rounded-t"
                        style={{
                          height: `${barHeightPx}px`,
                          width: 'calc(min(2rem, 8vw))'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              
              {/* X-axis with vertical exercise names on small screens */}
              <div className="flex justify-between border-t border-dark-700 pt-2">
                {Object.entries(exerciseCounts).map(([exercise, count], index) => (
                  <div key={`name-${index}`} className="text-center px-1">
                    {/* Horizontal text on large screens */}
                    <span className="text-xs text-dark-400 hidden md:block">
                      {formatExerciseName(exercise).split(' ')[0]}
                    </span>
                    
                    {/* Vertical text on small screens */}
                    <span 
                      className="text-xs text-dark-400 block md:hidden" 
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        maxHeight: '60px',
                        minHeight: '40px'
                      }}
                    >
                      {formatExerciseName(exercise).split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 flex justify-center">
              <Link to="/record">
                <Button variant="outline" size="sm" icon={<Calendar />} iconPosition="left">
                  View All Sessions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/planner">
                <Card className="hover:border-secondary-600 transition-all duration-200 h-full">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <Calendar size={32} className="text-secondary-500 mb-3" />
                    <h3 className="font-medium">Exercises</h3>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/record">
                <Card className="hover:border-accent-600 transition-all duration-200 h-full">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <Clock size={32} className="text-accent-500 mb-3" />
                    <h3 className="font-medium">Session History</h3>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/profile">
                <Card className="hover:border-dark-500 transition-all duration-200 h-full">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <User size={32} className="text-dark-300 mb-3" />
                    <h3 className="font-medium">Profile</h3>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;