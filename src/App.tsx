import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { Header } from './components/ui/Header';
import { Modal } from './components/ui/Modal';
import { useStore } from './store/useStore';
import { auth, db } from './lib/supabase';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { RewardNotification } from './components/gamification/RewardNotification';
import { SurpriseModal } from './components/gamification/SurpriseModal';
import { AdminChatSystem } from './components/chat/AdminChatSystem';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AuthModal = lazy(() => import('./components/auth/AuthModal'));
const CartModal = lazy(() => import('./components/cart/CartModal'));

function App() {
  const { 
    setUser, 
    setLoading, 
    setRewards, 
    setSurpriseEvents,
    getUnclaimedRewards,
    isAuthenticated,
    isAdmin,
    user
  } = useStore();
  
  const [showAuth, setShowAuth] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showSurprise, setShowSurprise] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setLoading(true);
    
    try {
      // Get initial session
      const { data: { session } } = await auth.getSession();
      
      if (session?.user) {
        await loadUserData(session.user.id);
      }

      // Listen for auth changes
      const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user.id);
          setShowAuth(false);
          
          // Check for daily login reward
          await checkDailyLoginReward(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setRewards([]);
        }
      });

      // Load surprise events
      await loadSurpriseEvents();

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      // For demo users, create a mock profile if it doesn't exist
      let { data: profile, error } = await db.getProfile(userId);
      
      if (error || !profile) {
        // Create a demo profile for demo users
        const demoProfile = {
          id: userId,
          email: userId.includes('admin') ? 'admin@demo.com' : 'user@demo.com',
          is_admin: userId.includes('admin'),
          full_name: userId.includes('admin') ? 'Demo Admin' : 'Demo User',
          phone: '+237123456789',
          loyalty_points: 150,
          level: 'Bronze',
          created_at: new Date().toISOString()
        };
        profile = demoProfile;
      }
      
      setUser(profile);
      
      // Load user rewards
      try {
        const { data: rewards } = await db.getUserRewards(userId);
        if (rewards && rewards.length > 0) {
          setRewards(rewards);
        }
      } catch (rewardError) {
        console.warn('Could not load rewards:', rewardError);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkDailyLoginReward = async (userId: string) => {
    try {
      const today = new Date().toDateString();
      const { data: existingReward } = await db.getUserRewards(userId);
      
      const todayReward = existingReward?.find(
        reward => reward.type === 'daily_login' && 
        new Date(reward.created_at).toDateString() === today
      );

      if (!todayReward) {
        const reward = {
          user_id: userId,
          type: 'daily_login',
          title: 'Daily Login Bonus!',
          description: 'Welcome back! Here are your daily points.',
          points: 50,
          claimed: false,
        };

        await db.createReward(reward);
        
        // Show surprise modal for daily reward
        setTimeout(() => setShowSurprise(true), 2000);
      }
    } catch (error) {
      console.error('Error checking daily login reward:', error);
    }
  };

  const loadSurpriseEvents = async () => {
    try {
      const { data: events } = await db.getActiveSurpriseEvents();
      if (events) {
        setSurpriseEvents(events);
      }
    } catch (error) {
      console.error('Error loading surprise events:', error);
    }
  };

  const handleAuthClick = async () => {
    if (isAuthenticated()) {
      await auth.signOut();
      setUser(null);
    } else {
      setShowAuth(true);
    }
  };

  // If user is admin, show only admin dashboard
  if (isAdmin() && user) {
    return (
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header
            onCartClick={() => setShowCart(true)}
            onAuthClick={handleAuthClick}
          />
          <Suspense fallback={<LoadingScreen />}>
            <AdminPage />
          </Suspense>
        </div>
      </Router>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header
            onCartClick={() => setShowCart(true)}
            onAuthClick={handleAuthClick}
          />

          <main className="flex-1">
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/orders" element={<OrdersPage />} />
              </Routes>
            </Suspense>
          </main>

          {/* Reward Notifications */}
          {getUnclaimedRewards().map(reward => (
            <RewardNotification
              key={reward.id}
              reward={reward}
              onClaim={() => db.claimReward(reward.id)}
            />
          ))}

          {/* Modals */}
          <Suspense fallback={null}>
            {showAuth && (
              <Modal
                isOpen={showAuth}
                onClose={() => setShowAuth(false)}
                title="Welcome to CameroonMart"
                size="md"
              >
                <AuthModal onClose={() => setShowAuth(false)} />
              </Modal>
            )}

            {showCart && (
              <Modal
                isOpen={showCart}
                onClose={() => setShowCart(false)}
                title="Shopping Cart"
                size="xl"
              >
                <CartModal onClose={() => setShowCart(false)} />
              </Modal>
            )}

            {showSurprise && (
              <SurpriseModal
                isOpen={showSurprise}
                onClose={() => setShowSurprise(false)}
              />
            )}

            {/* Chat System */}
            {(isAuthenticated() || isAdmin()) && (
              <AdminChatSystem
                isMinimized={chatMinimized}
                onToggleMinimize={() => setChatMinimized(!chatMinimized)}
                onClose={() => setShowChat(false)}
              />
            )}
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;