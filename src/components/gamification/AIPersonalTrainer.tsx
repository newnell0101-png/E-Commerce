import React, { useState, useEffect } from 'react';
import { Brain, Zap, Target, TrendingUp, Award, MessageCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface WorkoutPlan {
  id: string;
  name: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  exercises: Exercise[];
  aiRecommendation: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  equipment: string;
  tips: string;
}

interface AIPersonalTrainerProps {
  userProducts: any[];
  userLevel: string;
  onClose: () => void;
}

export const AIPersonalTrainer: React.FC<AIPersonalTrainerProps> = ({
  userProducts,
  userLevel,
  onClose
}) => {
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, type: 'user' | 'ai', message: string}>>([]);
  const [userInput, setUserInput] = useState('');

  // Generate AI workout plan based on user's equipment
  const generateWorkoutPlan = async () => {
    setIsGenerating(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const equipmentBased = userProducts.length > 0 ? userProducts : [
      { name: 'Bodyweight', category: 'Calisthenics' }
    ];

    const workoutPlan: WorkoutPlan = {
      id: crypto.randomUUID(),
      name: `Personalized ${userLevel} Workout`,
      difficulty: userLevel as any,
      duration: '45-60 minutes',
      exercises: generateExercises(equipmentBased),
      aiRecommendation: `Based on your ${userLevel.toLowerCase()} level and available equipment, this workout focuses on progressive overload and functional movements. The AI has optimized the rep ranges and rest periods for maximum results.`
    };

    setCurrentPlan(workoutPlan);
    setIsGenerating(false);
  };

  const generateExercises = (equipment: any[]): Exercise[] => {
    const baseExercises = [
      {
        name: 'Dynamic Warm-up',
        sets: 1,
        reps: '5-10 minutes',
        equipment: 'None',
        tips: 'Focus on mobility and activation of major muscle groups'
      },
      {
        name: 'Compound Movement',
        sets: 4,
        reps: '8-12',
        equipment: equipment[0]?.name || 'Bodyweight',
        tips: 'Maintain proper form throughout the movement'
      },
      {
        name: 'Isolation Exercise',
        sets: 3,
        reps: '12-15',
        equipment: equipment[1]?.name || 'Bodyweight',
        tips: 'Focus on mind-muscle connection'
      },
      {
        name: 'Core Finisher',
        sets: 3,
        reps: '30-60 seconds',
        equipment: 'None',
        tips: 'Engage your core throughout the entire movement'
      }
    ];

    return baseExercises;
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage = {
      id: crypto.randomUUID(),
      type: 'user' as const,
      message: userInput
    };

    setChatMessages(prev => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: crypto.randomUUID(),
        type: 'ai' as const,
        message: generateAIResponse(userInput)
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setUserInput('');
  };

  const generateAIResponse = (input: string): string => {
    const responses = [
      "Great question! Based on your current fitness level, I recommend focusing on progressive overload. Start with lighter weights and gradually increase as you build strength.",
      "That's a common concern! Form is more important than weight. I suggest recording yourself or working with a mirror to ensure proper technique.",
      "Excellent progress! Your consistency is paying off. Let's adjust your workout intensity to match your improving fitness level.",
      "Recovery is just as important as training. Make sure you're getting adequate sleep and nutrition to support your fitness goals.",
      "I've analyzed your workout pattern and suggest incorporating more variety to prevent plateaus. Would you like me to generate a new routine?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  useEffect(() => {
    // Initialize with welcome message
    setChatMessages([{
      id: crypto.randomUUID(),
      type: 'ai',
      message: `Hello! I'm your AI Personal Trainer. I've analyzed your equipment and fitness level. Ready to create a personalized workout plan for you?`
    }]);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">AI Personal Trainer</h2>
                <p className="text-purple-100">Powered by Advanced Fitness AI</p>
              </div>
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
          {/* Workout Plan Section */}
          <div className="flex-1 p-6 border-r">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Your Personalized Plan</h3>
            </div>

            {!currentPlan ? (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">Ready to Get Started?</h4>
                <p className="text-gray-600 mb-6">
                  Let me analyze your equipment and create a personalized workout plan
                </p>
                <Button
                  onClick={generateWorkoutPlan}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Plan...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Generate AI Workout Plan
                    </div>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">{currentPlan.name}</h4>
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {currentPlan.difficulty}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {currentPlan.duration}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{currentPlan.aiRecommendation}</p>
                </div>

                <div className="space-y-3">
                  {currentPlan.exercises.map((exercise, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium">{exercise.name}</h5>
                        <span className="text-sm text-purple-600 font-medium">
                          {exercise.sets} sets × {exercise.reps}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Equipment:</strong> {exercise.equipment}
                      </p>
                      <p className="text-sm text-gray-500">{exercise.tips}</p>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={generateWorkoutPlan}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                >
                  Generate New Plan
                </Button>
              </div>
            )}
          </div>

          {/* AI Chat Section */}
          <div className="w-80 flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Chat with AI Trainer</h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      message.type === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.message}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleChatSubmit} className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask your AI trainer..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Button
                  type="submit"
                  className="bg-purple-600 text-white px-4 py-2"
                >
                  Send
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};