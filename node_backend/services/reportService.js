// services/reportService.js
exports.calculateSpiderData = (sessions) => {
  // Dummy algorithm for generating spider chart data
  // In a real implementation, this would be more sophisticated
  
  // Initialize metrics
  const metrics = {
    strength: 0,
    flexibility: 0,
    endurance: 0,
    balance: 0,
    coordination: 0
  };
  
  if (sessions.length === 0) {
    return metrics;
  }
  
  // Map exercises to primary attributes they develop
  const exerciseAttributes = {
    'squat': ['strength', 'balance'],
    'dumbbell curl': ['strength'],
    'lunges': ['balance', 'coordination'],
    'push ups': ['strength', 'endurance'],
    'deadlift': ['strength', 'coordination'],
    'sit ups': ['endurance', 'flexibility']
  };
  
  // Calculate scores based on sessions
  sessions.forEach(session => {
    const attributes = exerciseAttributes[session.exercise] || [];
    const score = (session.accuracyScore / 100) * (session.duration / 10);
    
    attributes.forEach(attribute => {
      if (metrics.hasOwnProperty(attribute)) {
        metrics[attribute] += score;
      }
    });
  });
  
  // Normalize scores (0-100)
  const maxPossibleScore = 10; // Arbitrary scale
  Object.keys(metrics).forEach(key => {
    metrics[key] = Math.min(Math.round((metrics[key] / maxPossibleScore) * 100), 100);
  });
  
  return metrics;
};
