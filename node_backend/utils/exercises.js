// utils/exercises.js
// Predefined list of exercises with details
module.exports = [
  {
    id: 'squat',
    name: 'Squat',
    description: 'A compound, full-body exercise that trains primarily the muscles of the thighs, hips, and buttocks.',
    difficulty: 'medium',
    muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'lower back'],
    instructions: [
      'Stand with feet shoulder-width apart',
      'Keep your chest up and back straight',
      'Lower your body as if sitting in a chair',
      'Keep knees aligned with toes',
      'Return to standing position'
    ],
    imageUrl: '/images/exercises/squat.png'
  },
  {
    id: 'dumbbell curl',
    name: 'Dumbbell Curl',
    description: 'An isolation exercise that targets the biceps muscles.',
    difficulty: 'easy',
    muscleGroups: ['biceps', 'forearms'],
    instructions: [
      'Stand with feet shoulder-width apart',
      'Hold dumbbells at your sides with palms facing forward',
      'Curl the weights up to shoulder level',
      'Slowly lower the weights back down',
      'Keep elbows close to your body throughout'
    ],
    imageUrl: '/images/exercises/dumbbell-curl.png'
  },
  {
    id: 'lunges',
    name: 'Lunges',
    description: 'A unilateral exercise that works one leg at a time, improving balance and addressing strength imbalances.',
    difficulty: 'medium',
    muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
    instructions: [
      'Stand with feet hip-width apart',
      'Step forward with one leg',
      'Lower your body until both knees form 90-degree angles',
      'Push back up to starting position',
      'Repeat with the other leg'
    ],
    imageUrl: '/images/exercises/lunges.png'
  },
  {
    id: 'push ups',
    name: 'Push Ups',
    description: 'A classic bodyweight exercise that targets the chest, shoulders, triceps, and core.',
    difficulty: 'medium',
    muscleGroups: ['chest', 'shoulders', 'triceps', 'core'],
    instructions: [
      'Start in plank position with hands shoulder-width apart',
      'Keep your body in a straight line from head to heels',
      'Lower your body until your chest nearly touches the floor',
      'Push yourself back up to the starting position',
      'Keep core engaged throughout the movement'
    ],
    imageUrl: '/images/exercises/push-ups.png'
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    description: 'A compound exercise that targets multiple muscle groups, particularly in the posterior chain.',
    difficulty: 'hard',
    muscleGroups: ['lower back', 'glutes', 'hamstrings', 'traps', 'forearms'],
    instructions: [
      'Stand with feet hip-width apart, toes under the bar',
      'Bend at hips and knees to grip the bar',
      'Keep back straight and chest up',
      'Lift the bar by extending hips and knees',
      'Lower the bar by hinging at the hips and bending knees'
    ],
    imageUrl: '/images/exercises/deadlift.png'
  },
  {
    id: 'sit ups',
    name: 'Sit Ups',
    description: 'An abdominal exercise that strengthens the core muscles.',
    difficulty: 'easy',
    muscleGroups: ['abdominals', 'hip flexors', 'lower back'],
    instructions: [
      'Lie on your back with knees bent and feet flat on the floor',
      'Place hands behind your head or across chest',
      'Engage core and lift upper body toward knees',
      'Lower back down with control',
      'Avoid pulling on your neck with your hands'
    ],
    imageUrl: '/images/exercises/sit-ups.png'
  }
];
