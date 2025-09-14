import React, { useState, useEffect } from 'react';
import { Gift, X, Star, Zap, Trophy, Calendar } from 'lucide-react';
import { UserReward } from '../../types';
import { Button } from '../ui/Button';

interface RewardNotificationProps {
  reward: UserReward;
  onClaim: () => void;
}

export function RewardNotification({ reward, onClaim }: RewardNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Show notification after a delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      setIsAnimating(true);
    }, 1000);

    // Auto-hide after 10 seconds if not claimed
    const hideTimer = setTimeout(() => {
      handleClose();
    }, 11000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleClaim = () => {
    onClaim();
    handleClose();
  };

  if (!isVisible) return null;

  const getRewardIcon = () => {
    switch (reward.type) {
      case 'daily_login':
        return <Calendar className="w-6 h-6 text-yellow-400" />;
      case 'surprise_gift':
        return <Gift className="w-6 h-6 text-purple-400" />;
      case 'achievement':
        return <Trophy className="w-6 h-6 text-blue-400" />;
      case 'loyalty_points':
        return <Star className="w-6 h-6 text-green-400" />;
      case 'first_purchase':
        return <Zap className="w-6 h-6 text-orange-400" />;
      default:
        return <Gift className="w-6 h-6 text-green-400" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className={`
        bg-white rounded-lg shadow-2xl border-l-4 border-green-500 p-6 max-w-sm
        transform transition-all duration-300 ease-out
        ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full animate-bounce">
              {getRewardIcon()}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{reward.title}</h3>
              <p className="text-sm text-gray-600">{reward.description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-green-600">+{reward.points}</span>
            <span className="text-sm text-gray-500">points</span>
          </div>
          
          <Button
            onClick={handleClaim}
            size="sm"
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200"
          >
            Claim Reward
          </Button>
        </div>

        {/* Progress bar animation */}
        <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full animate-pulse" style={{
            animation: 'progress 10s linear forwards'
          }}></div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}