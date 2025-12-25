// services/plannerService.js
exports.generateWeeklyPlan = (user) => {
    // Dummy algorithm for generating a weekly exercise plan
    // In a real implementation, this would be more sophisticated and personalized
    
    const exercises = ['squat', 'dumbbell curl', 'lunges', 'push ups', 'deadlift', 'sit ups'];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    const plan = [];
    
    // Generate 3-5 exercises per week
    const numberOfExercises = Math.floor(Math.random() * 3) + 3; // 3-5 exercises
    
    // Shuffle days to pick random days
    const shuffledDays = [...days].sort(() => 0.5 - Math.random());
    const selectedDays = shuffledDays.slice(0, numberOfExercises);
    
    // Assign random exercises to selected days
    selectedDays.forEach(day => {
      const randomExerciseIndex = Math.floor(Math.random() * exercises.length);
      const exercise = exercises[randomExerciseIndex];
      
      // Random duration between 10-30 minutes
      const duration = Math.floor(Math.random() * 21) + 10;
      
      // Random accuracy target between 70-90%
      const accuracyTarget = Math.floor(Math.random() * 21) + 70;
      
      plan.push({
        day,
        exercise,
        duration,
        accuracyTarget
      });
    });
    
    return plan;
  };
  