// services/dashboardService.js
exports.calculateRecoveryPercentage = (sessions) => {
    // Dummy algorithm for calculating recovery percentage
    // In a real implementation, this would use actual recovery metrics
    
    if (sessions.length === 0) return 0;
    
    // For demo purposes, return a random value between 60-95%
    return Math.floor(Math.random() * 36) + 60;
  };
  
  exports.calculateAdherenceRate = (sessions, planner, startOfWeek) => {
    // Calculate how many planned exercises were actually completed
    
    if (!planner || !planner.plan || planner.plan.length === 0) {
      return 0;
    }
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    
    // Filter sessions to only include those from current week
    const currentWeekSessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startOfWeek && sessionDate < endOfWeek;
    });
    
    // Count completed exercises
    let completedExercises = 0;
    
    planner.plan.forEach(planItem => {
      const matchingSession = currentWeekSessions.find(session => 
        session.exercise === planItem.exercise
      );
      
      if (matchingSession) {
        completedExercises++;
      }
    });
    
    // Calculate adherence as percentage
    const adherenceRate = (completedExercises / planner.plan.length) * 100;
    
    return Math.round(adherenceRate);
  };