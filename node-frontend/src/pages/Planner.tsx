import React, { useState } from 'react';
import { Info, Play, Clock } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';

interface Exercise {
  id: string;
  name: string;
  description: string;
  steps: string[];
  duration: number;
  intensity: 'Low' | 'Medium' | 'High';
  targetArea: string;
  videoUrl: string;
  demoVideos: string[];
}

const ExerciseCatalog: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  // Sample exercises data
  const exercises: Exercise[] = [
    {
      id: 'ex-1',
      name: 'Deadlift',
      url: 'deadlifts',
      description: 'A compound exercise that strengthens the posterior chain.',
      steps: [
        'Stand with feet hip-width apart, with a barbell or dumbbells in front of you.',
        'Bend at the hips and knees to lower down and grab the weight.',
        'Keep your back straight and core engaged as you lift by extending your hips and knees.',
        'Return the weight to the ground with control by hinging at the hips.'
      ],
      duration: 15,
      intensity: 'High',
      targetArea: 'Lower Back, Glutes, Hamstrings',
      videoUrl: '/../../assets/male-Barbell-barbell-deadlift-front.mp4',
      demoVideos: [
        '/../../assets/male-Barbell-barbell-deadlift-front.mp4',
        '/../../assets/male-Barbell-barbell-deadlift-side.mp4'
      ]
    },
    {
      id: 'ex-2',
      name: 'Bicep Curls',
      url: 'bicep_curls',
      description: 'An isolation exercise that targets the biceps muscles.',
      steps: [
        'Stand up straight with a dumbbell in each hand at arm’s length.',
        'Raise one dumbbell and twist your forearm until it is vertical and your palm faces the shoulder.',
        'Lower to original position and repeat with opposite arm.',
        'Keep elbows close to your torso throughout the movement.'
      ],
      duration: 8,
      intensity: 'Low',
      targetArea: 'Biceps',
      videoUrl: '/../../assets/male-Dumbbells-dumbbell-curl-front.mp4',
      demoVideos: [
        '/../../assets/male-Dumbbells-dumbbell-curl-front.mp4',
        '/../../assets/male-Dumbbells-dumbbell-curl-side.mp4'
      ]
    },
    {
      id: 'ex-3',
      name: 'Squats',
      url: 'squats',
      description: 'A compound exercise that targets multiple muscle groups in the lower body.',
      steps: [
        'Stand with feet shoulder-width apart.',
        'Bend your knees and lower your hips as if sitting in a chair.',
        'Keep your chest up and knees tracking over your toes.',
        'Return to standing position by pushing through your heels.'
      ],
      duration: 12,
      intensity: 'Medium',
      targetArea: 'Quadriceps, Hamstrings, Glutes',
      videoUrl: '/../../assets/male-Bodyweight-bodyweight-squat-front.mp4',
      demoVideos: [
        '/../../assets/male-Bodyweight-bodyweight-squat-front.mp4',
        '/../../assets/male-Bodyweight-bodyweight-squat-side.mp4'
      ]
    },
    {
      id: 'ex-4',
      name: 'Push Ups',
      url: 'pushups',
      description: 'A classic exercise that targets the chest, shoulders, and triceps.',
      steps: [
        'Start in a plank position with hands slightly wider than shoulder-width apart.',
        'Lower your body until your chest nearly touches the floor.',
        'Push yourself back up to the starting position.',
        'Keep your body in a straight line throughout the movement.'
      ],
      duration: 10,
      intensity: 'Medium',
      targetArea: 'Chest, Shoulders, Triceps',
      videoUrl: '/../../assets/male-Bodyweight-push-up-front.mp4',
      demoVideos: [
        '/../../assets/male-Bodyweight-push-up-front.mp4',
        '/../../assets/male-Bodyweight-push-up-side.mp4'
      ]
    },
    {
      id: 'ex-5',
      name: 'Sit Ups',
      url: 'situps',
      description: 'An exercise that strengthens the abdominal muscles and hip flexors.',
      steps: [
        'Lie on your back with knees bent and feet flat on the floor.',
        'Place your hands behind your head or across your chest.',
        'Engage your core and lift your upper body toward your knees.',
        'Lower back down with control and repeat.'
      ],
      duration: 8,
      intensity: 'Medium',
      targetArea: 'Abdominals',
      videoUrl: '/../../assets/male-Bodyweight-situp-front.mp4',
      demoVideos: [
        '/../../assets/male-Bodyweight-situp-front.mp4',
        '/../../assets/male-Bodyweight-situp-side.mp4'
      ]
    },
    {
      id: 'ex-6',
      name: 'Lunges',
      url: 'lunges',
      description: 'A unilateral exercise that improves balance and strengthens leg muscles.',
      steps: [
        'Stand upright with feet hip-width apart.',
        'Step forward with one leg and lower your hips until both knees are bent at 90 degrees.',
        'Push back up to the starting position.',
        'Repeat with the other leg.'
      ],
      duration: 10,
      intensity: 'Medium',
      targetArea: 'Quadriceps, Hamstrings, Glutes',
      videoUrl: '/../../assets/male-Bodyweight-forward-lunges-front.mp4',
      demoVideos: [
        '/../../assets/male-Bodyweight-forward-lunges-front.mp4',
        '/../../assets/male-Bodyweight-forward-lunges-side.mp4'
      ]
    }
    
    
  ];
  

  const openExerciseDetails = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setModalOpen(true);
  };

  const handleStartExercise = (exercise: Exercise) => {
    navigate(`/exercise?exercise=${exercise.url}`, { replace: false });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Exercise Catalog</h1>
        <p className="text-dark-300">
          Browse our collection of exercises to help you achieve your fitness goals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className="border border-dark-700 rounded-lg overflow-hidden hover:border-primary-600 transition-all duration-200 flex flex-col"
          >
            <div className="p-4 border-b border-dark-700">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-medium">{exercise.name}</h3>
                <div className="flex items-center text-dark-300 text-sm">
                  <Clock size={14} className="mr-1" />
                  <span>{exercise.duration} min</span>
                </div>
              </div>
            </div>

            {/* Video demonstration area */}
            <div className="w-full aspect-video bg-dark-800 overflow-hidden relative">
              <video
                src={exercise.videoUrl}
                autoPlay
                muted
                loop
                className="w-full h-full object-cover"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="p-4 flex-grow">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-0">

                {/* Ghost Button in Fixed Position */}
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Info size={16} />}
                    className="p-1"
                    onClick={() => openExerciseDetails(exercise)}
                  />
                </div>

                {/* Intensity and Target Area in same row */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${exercise.intensity === 'Low'
                      ? 'bg-success-900/30 text-success-400'
                      : exercise.intensity === 'Medium'
                        ? 'bg-warning-900/30 text-warning-400'
                        : 'bg-error-900/30 text-error-400'
                      }`}
                  >
                    {exercise.intensity}
                  </span>
                  <span className="px-2 py-1 bg-dark-700 rounded-full text-xs">
                    {exercise.targetArea}
                  </span>
                </div>

              </div>
            </div>


            <div className="p-2 border-t border-dark-700 flex justify-center space-x-4">
              <Button
                variant="primary"
                size="sm"
                icon={<Play size={24} />}
                iconPosition="left"
                onClick={() => handleStartExercise(exercise)}
              >
                Start
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Exercise Details Modal - With extra wide content */}
      {selectedExercise && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={selectedExercise.name}
          size="xl" // Add this prop to your Modal component
          footer={
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          }
        >
          {/* Use styling to make the content wider */}
          <div className="space-y-6 w-full max-w-screen-lg mx-auto">
            {/* Demo videos in modal - larger and with better spacing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedExercise.demoVideos.map((videoUrl, index) => (
                <div key={index} className="rounded-lg overflow-hidden bg-dark-800">
                  <video
                    src={videoUrl}
                    autoPlay
                    muted
                    loop
                    className="w-full h-full aspect-video object-cover"
                  >
                    Your browser does not support the video tag.
                  </video>
                  <div className="p-2 text-center text-sm text-dark-300">
                    {index === 0 ? 'Front View' : 'Side View'}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-medium text-dark-300 mb-2">Description</h4>
              <p>{selectedExercise.description}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-dark-300 mb-2">How to perform</h4>
              <ol className="list-decimal pl-4 space-y-2">
                {selectedExercise.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium text-dark-300 mb-1">Duration</h4>
                <p className="flex items-center">
                  <Clock size={16} className="mr-2 text-primary-400" />
                  {selectedExercise.duration} minutes
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-dark-300 mb-1">Intensity</h4>
                <p className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${selectedExercise.intensity === 'Low' ? 'bg-success-900/30 text-success-400' :
                  selectedExercise.intensity === 'Medium' ? 'bg-warning-900/30 text-warning-400' :
                    'bg-error-900/30 text-error-400'
                  }`}>
                  {selectedExercise.intensity}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-dark-300 mb-1">Target Area</h4>
                <p>{selectedExercise.targetArea}</p>
              </div>
            </div>

            <div className="pt-4">
              <Button
                variant="primary"
                className="w-full"
                icon={<Play />}
                iconPosition="left"
                onClick={() => {
                  setModalOpen(false);
                  handleStartExercise(selectedExercise);
                }}
              >
                Start Exercise
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExerciseCatalog;