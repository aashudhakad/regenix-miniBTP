import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, Cell } from 'recharts';
import { Calendar, Download, TrendingUp, Check } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

interface RadarData {
  subject: string;
  value: number;
  fullMark: number;
}

interface ProgressData {
  date: string;
  value: number;
}

interface SessionData {
  day: string;
  duration: number;
}

interface ReportData {
  radar: RadarData[];
  progress: ProgressData[];
  sessions: SessionData[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

const Report: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        // Mock data for demonstration
        const mockRadarData = [
          { subject: 'Flexibility', value: 80, fullMark: 100 },
          { subject: 'Strength', value: 65, fullMark: 100 },
          { subject: 'Endurance', value: 90, fullMark: 100 },
          { subject: 'Range of Motion', value: 70, fullMark: 100 },
          { subject: 'Pain Management', value: 85, fullMark: 100 },
        ];
        
        // Generate progress data
        const mockProgressData = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90));
        
        const dataPoints = timeframe === 'week' ? 7 : timeframe === 'month' ? 10 : 12;
        const increment = (timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90) / dataPoints;
        
        let progressValue = 30;
        
        for (let i = 0; i <= dataPoints; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(currentDate.getDate() + (i * increment));
          progressValue += Math.floor(Math.random() * 5) + 2;
          progressValue = Math.min(progressValue, 100);
          
          mockProgressData.push({
            date: currentDate.toISOString(),
            value: progressValue
          });
        }
        
        // Generate session data
        const mockSessionData = [];
        const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        for (let i = 0; i < 7; i++) {
          const hasSessions = Math.random() > 0.3;
          mockSessionData.push({
            day: daysOfWeek[i],
            duration: hasSessions ? Math.floor(Math.random() * 30) + 15 : 0
          });
        }
        
        setData({
          radar: mockRadarData,
          progress: mockProgressData,
          sessions: mockSessionData,
          strengths: [
            'Excellent progress in endurance training',
            'Good adherence to daily stretching routine',
            'Consistent improvement in pain management'
          ],
          weaknesses: [
            'Strength exercises need more attention',
            'Range of motion in external rotation still limited'
          ],
          recommendations: [
            'Increase resistance in rotator cuff exercises',
            'Add 2 additional strength training sessions per week',
            'Continue with current stretching regimen',
            'Consider adding aquatic therapy for resistance training'
          ]
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch report data:', err);
        setError('Failed to load report data. Please try again later.');
        setLoading(false);
      }
    };

    fetchReportData();
  }, [timeframe]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (timeframe === 'week') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (timeframe === 'month') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
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
          <h1 className="text-3xl font-bold mb-2">Rehabilitation Report</h1>
          <p className="text-dark-300">
            Comprehensive analysis of your rehabilitation progress
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={timeframe === 'week' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setTimeframe('week')}
          >
            Week
          </Button>
          <Button 
            variant={timeframe === 'month' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setTimeframe('month')}
          >
            Month
          </Button>
          <Button 
            variant={timeframe === 'quarter' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setTimeframe('quarter')}
          >
            Quarter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recovery Dimensions</h2>
            <Button variant="ghost" size="sm" icon={<Download size={18} />} iconPosition="left">
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="80%" data={data?.radar}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fill: '#64748b' }}
                    stroke="#475569"
                  />
                  <Radar
                    name="Current"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Progress Chart */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recovery Progress</h2>
            <span className="text-sm text-dark-300">
              {data?.progress && data.progress.length > 0 ? (
                <>
                  {formatDate(data.progress[0].date)} - {formatDate(data.progress[data.progress.length - 1].date)}
                </>
              ) : ''}
            </span>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data?.progress}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    stroke="#475569"
                  />
                  <YAxis 
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    stroke="#475569"
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Recovery']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.375rem' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#38bdf8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Sessions */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Weekly Sessions</h2>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.sessions}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    stroke="#475569"
                  />
                  <YAxis 
                    unit="m"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    stroke="#475569"
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} minutes`, 'Duration']}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.375rem' }}
                  />
                  <Bar dataKey="duration" radius={[4, 4, 0, 0]}>
                    {data?.sessions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.duration > 0 ? '#0ea5e9' : '#334155'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Strengths & Weaknesses */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-success-400">Strengths</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data?.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <div className="bg-success-900/30 p-1 rounded-full mr-3 mt-0.5">
                    <Check size={12} className="text-success-400" />
                  </div>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardHeader className="mt-6 border-t border-dark-700">
            <h2 className="text-xl font-semibold text-warning-400">Areas to Improve</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data?.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <div className="bg-warning-900/30 p-1 rounded-full mr-3 mt-0.5">
                    <TrendingUp size={12} className="text-warning-400" />
                  </div>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Recommendations</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {data?.recommendations.map((recommendation, index) => (
                <li key={index} className="p-3 bg-dark-700 rounded-md">
                  {recommendation}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Button variant="outline" className="w-full" icon={<Calendar />} iconPosition="left">
                Update Planner with Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Full Report</h2>
          <Button variant="primary" size="sm" icon={<Download />} iconPosition="left">
            Download PDF Report
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-dark-300 mb-4">
            Your comprehensive rehabilitation report contains detailed analysis of your progress, comparisons to baseline measurements, and personalized recommendations for your continued recovery.
          </p>
          <p className="text-dark-300">
            Share this report with your healthcare provider to discuss your rehabilitation journey and adjust your treatment plan as needed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Report;