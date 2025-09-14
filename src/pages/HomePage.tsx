import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Star, Gift, TrendingUp, Users, ShoppingBag, Brain, Video } from 'lucide-react';
import { useStore } from '../store/useStore';
import { db } from '../lib/supabase';
import { Product, Category } from '../types';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/ui/Footer';
import { AIPersonalTrainer } from '../components/gamification/AIPersonalTrainer';
import { VirtualFitnessCoach } from '../components/gamification/VirtualFitnessCoach';

const HomePage: React.FC = () => {
  const { language, colorTheme, isAuthenticated, user } = useStore();
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAITrainer, setShowAITrainer] = useState(false);
  const [showVirtualCoach, setShowVirtualCoach] = useState(false);

  const translations = {
    en: {
      welcome: 'Discover Amazing Products',
      subtitle: 'Shop the best selection in Cameroon with fast delivery',
      shopNow: 'Shop Now',
      learnMore: 'Learn More',
      whyChoose: 'Why Choose CameroonMart?',
      whySubtitle: 'Discover our innovative features that make your shopping smarter',
      aiRecommendations: 'AI Recommendations',
      aiDesc: 'Our AI learns your preferences to suggest the best products for you',
      socialShopping: 'Social Shopping',
      socialDesc: 'Share your purchases, create group lists, and shop together',
      arTryOn: 'AR Try-On',
      arDesc: 'Virtually try products before buying with augmented reality',
      categories: 'Categories',
      categoriesDesc: 'Explore our carefully curated categories for all your needs',
      featuredProducts: 'Featured Products',
      featuredDesc: 'Our best deals handpicked just for you',
      viewAll: 'View All',
      products: '3+ Products',
      orders: '1250+ Orders',
      customers: '5600+ Customers',
      loginForRewards: 'Login to unlock exclusive rewards and surprises!',
      memberBenefits: 'Member Benefits',
    },
    fr: {
      welcome: 'Découvrez des Produits Incroyables',
      subtitle: 'Achetez la meilleure sélection au Cameroun avec livraison rapide',
      shopNow: 'Acheter Maintenant',
      learnMore: 'En Savoir Plus',
      whyChoose: 'Pourquoi Choisir CameroonMart?',
      whySubtitle: 'Découvrez nos fonctionnalités innovantes qui rendent vos achats plus intelligents',
      aiRecommendations: 'Recommandations IA',
      aiDesc: 'Notre IA apprend vos préférences pour suggérer les meilleurs produits',
      socialShopping: 'Shopping Social',
      socialDesc: 'Partagez vos achats, créez des listes de groupe et achetez ensemble',
      arTryOn: 'Essayage AR',
      arDesc: 'Essayez virtuellement les produits avant d\'acheter avec la réalité augmentée',
      categories: 'Catégories',
      categoriesDesc: 'Explorez nos catégories soigneusement sélectionnées pour tous vos besoins',
      featuredProducts: 'Produits Vedettes',
      featuredDesc: 'Nos meilleures offres sélectionnées juste pour vous',
      viewAll: 'Voir Tout',
      products: '3+ Produits',
      orders: '1250+ Commandes',
      customers: '5600+ Clients',
      loginForRewards: 'Connectez-vous pour débloquer des récompenses exclusives!',
      memberBenefits: 'Avantages Membres',
    }
  };

  const t = translations[language];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load categories
      const { data: categoriesData } = await db.getCategories();
      if (categoriesData) {
        setCategories(categoriesData.slice(0, 5));
      }

      // Load featured products
      const { data: productsData } = await db.getProducts();
      if (productsData) {
        const featured = productsData.filter(p => p.is_featured || p.discount_percentage > 0);
        setFeaturedProducts(featured.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading homepage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getThemeColors = () => {
    const themes = {
      blue: { primary: 'bg-blue-600', secondary: 'bg-blue-50', text: 'text-blue-600' },
      green: { primary: 'bg-green-600', secondary: 'bg-green-50', text: 'text-green-600' },
      purple: { primary: 'bg-purple-600', secondary: 'bg-purple-50', text: 'text-purple-600' },
      orange: { primary: 'bg-orange-600', secondary: 'bg-orange-50', text: 'text-orange-600' },
      red: { primary: 'bg-red-600', secondary: 'bg-red-50', text: 'text-red-600' },
    };
    return themes[colorTheme];
  };

  const themeColors = getThemeColors();

        {/* AI Features Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">🚀 New AI-Powered Features!</h2>
              <p className="text-sm text-purple-100">Get personalized workouts and real-time form analysis</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowAITrainer(true)}
                className="bg-white/20 hover:bg-white/30 text-white flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                AI Trainer
              </Button>
              <Button
                onClick={() => setShowVirtualCoach(true)}
                className="bg-white/20 hover:bg-white/30 text-white flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                Virtual Coach
              </Button>
            </div>
          </div>
        </div>

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              {t.welcome}
            </h1>
            <p className="text-xl md:text-2xl mb-8 animate-fade-in-up max-w-3xl mx-auto">
              {t.subtitle}
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-12 animate-fade-in-up">
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-6 py-3">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="font-semibold">{t.products}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-6 py-3">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="font-semibold">{t.orders}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-6 py-3">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="font-semibold">{t.customers}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/shop')}
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {t.shopNow}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-green-600 font-semibold px-8 py-4 text-lg"
              >
                {t.learnMore}
              </Button>
            </div>

            {/* Member Benefits Banner */}
            {!isAuthenticated() && (
              <div className="mt-12 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 rounded-lg p-6 max-w-2xl mx-auto animate-bounce-slow">
                <div className="flex items-center justify-center space-x-3">
                  <Gift className="w-6 h-6" />
                  <span className="font-bold text-lg">{t.loginForRewards}</span>
                  <Zap className="w-6 h-6" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.whyChoose}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.whySubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-blue-50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.aiRecommendations}</h3>
              <p className="text-gray-600">{t.aiDesc}</p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-purple-50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.socialShopping}</h3>
              <p className="text-gray-600">{t.socialDesc}</p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-orange-50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.arTryOn}</h3>
              <p className="text-gray-600">{t.arDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.categories}</h2>
            <p className="text-xl text-gray-600">{t.categoriesDesc}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => navigate(`/shop?category=${category.id}`)}
                className="bg-white rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group"
              >
                <div className={`w-16 h-16 ${themeColors.secondary} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <div className={`w-8 h-8 ${themeColors.primary} rounded`}></div>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                  {language === 'en' ? category.name : category.name_fr}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-16">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.featuredProducts}</h2>
              <p className="text-xl text-gray-600">{t.featuredDesc}</p>
            </div>
            <Button
              onClick={() => navigate('/shop')}
              variant="ghost"
              className={`${themeColors.text} hover:bg-green-50`}
            >
              {t.viewAll} →
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group"
              >
                {(product.discount_percentage ?? 0) > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
                    -{product.discount_percentage ?? 0}%
                  </div>
                )}
                
                <div className="relative h-64 bg-gray-100 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={language === 'en' ? product.name : product.name_fr}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                
                <div className="p-6">
                  <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                    {language === 'en' ? product.name : product.name_fr}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {language === 'en' ? product.description : product.description_fr}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      {(product.discount_percentage ?? 0) > 0 ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-green-600">
                            {Math.round(product.price * (1 - (product.discount_percentage ?? 0) / 100)).toLocaleString()} FCFA
                          </span>
                          <span className="text-lg text-gray-500 line-through">
                            {product.price.toLocaleString()} FCFA
                          </span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-gray-900">
                          {product.price.toLocaleString()} FCFA
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">4.8</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      {showAITrainer && (
        <AIPersonalTrainer
          userProducts={featuredProducts.filter(p => p.category_id === 'cat_sports')}
          userLevel="Intermediate"
          onClose={() => setShowAITrainer(false)}
        />
      )}
      {showVirtualCoach && (
        <VirtualFitnessCoach onClose={() => setShowVirtualCoach(false)} />
      )}
    </div>
  );
};

export default HomePage;