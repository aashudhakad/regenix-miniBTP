import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, CheckCircle, Clock, Play, Zap, Users } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import yashimg from '../../assets/yashimg.jpg';
import aayushimg from '../../assets/aayushimg.jpg';
import priyanshimg from '../../assets/priyanshimg.jpg';
import shreshthaimg from '../../assets/shreshthaimg.jpg'
import demo from '../../assets/demo short.mp4';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-dark-950 min-h-screen">
      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900 to-secondary-900 opacity-20"></div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Train Smarter with AI-Powered Exercise Guidance
            </h1>
            <p className="text-lg md:text-xl text-dark-200 mb-8">
              Perfect your workout form, prevent injuries, and boost your performance with intelligent feedback from ReGeniX.
            </p>

            {/* Only show login/register buttons when not authenticated */}
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/register">
                  <Button variant="primary" size="lg" icon={<ArrowRight />} iconPosition="right">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Log In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-dark-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Your Path to Injury-Free Workouts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-6 hover:border-primary-600 transition-all duration-300">
              <div className="bg-primary-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Activity className="text-primary-400 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
              <p className="text-dark-300">
                We respect your privacy — no video recordings are ever stored on our backend. Your workout data stays yours.
              </p>
            </div>
            <div className="card p-6 hover:border-secondary-600 transition-all duration-300">
              <div className="bg-secondary-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <CheckCircle className="text-secondary-400 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Feedback</h3>
              <p className="text-dark-300">
                Get instant form correction and posture suggestions while you train. Your virtual coach is always on.
              </p>
            </div>
            <div className="card p-6 hover:border-accent-600 transition-all duration-300">
              <div className="bg-accent-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Clock className="text-accent-400 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Guided Workouts</h3>
              <p className="text-dark-300">
                Follow along with clear visuals, and smart cues to improve technique and avoid common mistakes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6">
              See ReGeniX in Action
            </h2>
            <p className="text-dark-300 text-center mb-8">
              Discover how ReGeniX helps you train better with interactive tools and real-time support.
            </p>
            <div className="aspect-video bg-dark-800 rounded-xl border border-dark-700 flex items-center justify-center mb-8 overflow-hidden h-min">
                <video
                  src={demo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"/>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-dark-900 to-dark-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Zap className="mx-auto text-primary-500 mb-6" size={40} />
            <h2 className="text-3xl font-bold mb-6">
              Ready to Transform Your Training?
            </h2>
            <p className="text-dark-200 mb-8">
              Join ReGeniX to level up your workouts and prevent injuries. Start training smarter today.
            </p>

            {/* Only show the CTA button when not authenticated */}
            {!isAuthenticated && (
              <Link to="/register">
                <Button variant="primary" size="lg">
                  Start Your Form-Perfecting Journey
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Developers Section */}
      <section className="py-16 bg-dark-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Users className="mx-auto text-accent-500 mb-6" size={40} />
            <h2 className="text-3xl font-bold mb-8">Meet Our Team</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="p-4">
                <img
                  src={shreshthaimg}
                  alt="Shreshtha Garg"
                  className="w-24 h-24 rounded-full border-2 border-primary-500 mx-auto mb-4 object-cover"
                />
                <h3 className="text-lg font-semibold">Shreshtha Garg</h3>
                <p className="text-primary-400">MERN Developer</p>
              </div>

              <div className="p-4">
                <img
                  src={aayushimg}
                  alt="Aayush Dhakad"
                  className="w-24 h-24 rounded-full border-2 border-secondary-500 mx-auto mb-4 object-cover"
                />
                <h3 className="text-lg font-semibold">Aayush Dhakad</h3>
                <p className="text-secondary-400">MERN Developer</p>
              </div>

              <div className="p-4">
                <img
                  src={yashimg}
                  alt="Yash Rathore"
                  className="w-24 h-24 rounded-full border-2 border-accent-500 mx-auto mb-4 object-cover"
                />
                <h3 className="text-lg font-semibold">Yash Rathore</h3>
                <p className="text-accent-400">MERN Developer</p>
              </div>

              <div className="p-4">
                <img
                  src={priyanshimg}
                  alt="Priyansh Saxena"
                  className="w-24 h-24 rounded-full border-2 border-primary-500 mx-auto mb-4 object-cover"
                />
                <h3 className="text-lg font-semibold">Priyansh Saxena</h3>
                <p className="text-primary-400">AI/ML Engineer</p>
              </div>

            </div>

            <div className="mt-12">
              <p className="text-dark-300">
                ReGeniX - An AI-powered fitness companion that transforms your camera into a personal trainer - analyzing movement patterns in real-time, providing intelligent form correction, and gamifying your fitness journey with performance analytics.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;