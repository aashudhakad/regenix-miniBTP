import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin`}>
        <div className="h-full w-full border-4 border-t-primary-500 border-r-transparent border-b-primary-300 border-l-transparent rounded-full"></div>
      </div>
    </div>
  );
};

export const FullPageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-dark-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-8 shadow-xl border border-dark-700">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-dark-200 text-center">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;