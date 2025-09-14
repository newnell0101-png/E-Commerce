import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Camera } from 'lucide-react';
import { Button } from '../ui/Button';

interface Exercise {
  name: string;
  duration: number;
  instructions: string[];
  tips: string;
}

interface VirtualFitnessCoachProps {
  onClose: () => void;
}

export const VirtualFitnessCoach: React.FC<VirtualFitnessCoachProps> = ({ onClose }) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [reps, setReps] = useState(0);
  const [isFormAnalysisActive, setIsFormAnalysisActive] = useState(false);

  const exercises: Exercise[] = [
    {
      name: "Push-ups",
      duration: 30,
      instructions: [
        "Start in plank position",
        "Lower your body until chest nearly touches floor",
        "Push back up to starting position",
        "Keep your core engaged throughout"
      ],
      tips: "Focus on controlled movement rather than speed"
    },
    {
      name: "Squats",
      duration: 30,
      instructions: [
        "Stand with feet shoulder-width apart",
        "Lower your body as if sitting back into a chair",
        "Keep your chest up and knees behind toes",
        "Return to starting position"
      ],
      tips: "Imagine sitting back into an invisible chair"
    },
    {
      name: "Plank",
      duration: 30,
      instructions: [
        "Start in push-up position",
        "Hold your body in straight line",
        "Engage your core muscles",
        "Breathe steadily"
      ],
      tips: "Don't let your hips sag or pike up"
    },
    {
      name: "Jumping Jacks",
      duration: 30,
      instructions: [
        "Start with feet together, arms at sides",
        "Jump while spreading legs shoulder-width apart",
        "Simultaneously raise arms overhead",
        "Jump back to starting position"
      ],
      tips: "Land softly on the balls of your feet"
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      if (isResting) {
        // Rest period over, move to next exercise
        setIsResting(false);
        setCurrentExercise(prev => (prev + 1) % exercises.length);
        setTimeRemaining(exercises[currentExercise].duration);
        if (!isMuted) {
          // Play start sound
          playSound('start');
        }
      } else {
        // Exercise complete, start rest
        setIsResting(true);
        setTimeRemaining(10); // 10 second rest
        if (!isMuted) {
          playSound('rest');
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining, isResting, currentExercise, isMuted]);

  const playSound = (type: 'start' | 'rest' | 'complete') => {
    // In a real app, you'd play actual audio files
    console.log(`Playing ${type} sound`);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeRemaining(exercises[currentExercise].duration);
    setIsResting(false);
    setReps(0);
  };

  const nextExercise = () => {
    setCurrentExercise(prev => (prev + 1) % exercises.length);
    setTimeRemaining(exercises[(currentExercise + 1) % exercises.length].duration);
    setIsActive(false);
    setIsResting(false);
    setReps(0);
  };

  const incrementReps = () => {
    setReps(prev => prev + 1);
  };

  const toggleFormAnalysis = () => {
    setIsFormAnalysisActive(!isFormAnalysisActive);
  };

  const currentEx = exercises[currentExercise];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Virtual Fitness Coach</h2>
              <p className="text-green-100">Real-time form analysis & guidance</p>
            </div>
            <Button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Video/Animation Section */}
          <div className="flex-1 bg-gray-900 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              {isFormAnalysisActive ? (
                <div className="text-center text-white">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-green-400" />
                  <p className="text-lg mb-2">Form Analysis Active</p>
                  <p className="text-sm text-gray-300">AI is analyzing your form in real-time</p>
                  <div className="mt-4 p-4 bg-green-600/20 rounded-lg">
                    <p className="text-green-400 font-semibold">✓ Good form detected!</p>
                    <p className="text-sm">Keep your back straight</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-white">
                  <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-4xl font-bold">{currentExercise + 1}</span>
                  </div>
                  <p className="text-lg">Exercise Demonstration</p>
                  <p className="text-sm text-gray-300">Enable camera for form analysis</p>
                </div>
              )}
            </div>

            {/* Timer Overlay */}
            <div className="absolute top-4 left-4 bg-black/50 rounded-lg p-4 text-white">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm">
                  {isResting ? 'Rest Time' : currentEx.name}
                </div>
              </div>
            </div>

            {/* Rep Counter */}
            <div className="absolute top-4 right-4 bg-black/50 rounded-lg p-4 text-white">
              <div className="text-center">
                <div className="text-2xl font-bold">{reps}</div>
                <div className="text-sm">Reps</div>
                <Button
                  onClick={incrementReps}
                  className="mt-2 bg-green-600 text-white text-xs px-2 py-1"
                >
                  +1
                </Button>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <Button
                onClick={toggleTimer}
                className={`${isActive ? 'bg-red-600' : 'bg-green-600'} text-white p-3 rounded-full`}
              >
                {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <Button
                onClick={resetTimer}
                className="bg-gray-600 text-white p-3 rounded-full"
              >
                <RotateCcw className="w-6 h-6" />
              </Button>
              <Button
                onClick={() => setIsMuted(!isMuted)}
                className="bg-gray-600 text-white p-3 rounded-full"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </Button>
              <Button
                onClick={toggleFormAnalysis}
                className={`${isFormAnalysisActive ? 'bg-green-600' : 'bg-gray-600'} text-white p-3 rounded-full`}
              >
                <Camera className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Exercise Info Section */}
          <div className="w-80 p-6 bg-gray-50">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">{currentEx.name}</h3>
              <div className="flex gap-2 mb-4">
                {exercises.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index === currentExercise ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-green-600">Instructions:</h4>
                <ol className="space-y-1 text-sm">
                  {currentEx.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-green-600 font-semibold">{index + 1}.</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-semibold mb-1 text-blue-600">💡 Pro Tip:</h4>
                <p className="text-sm text-blue-800">{currentEx.tips}</p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={nextExercise}
                  className="w-full bg-green-600 text-white"
                >
                  Next Exercise
                </Button>
                
                {isFormAnalysisActive && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-green-600 mb-2">AI Form Analysis</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Posture: Excellent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Speed: Slow down slightly</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Range of Motion: Good</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};