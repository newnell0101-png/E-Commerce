import { useState, useEffect } from 'react';
import { Star, Clock, Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { db } from '../../lib/supabase';
import type { Product } from '../../types';

interface FeaturedSectionProps {
  onProductClick: (product: Product) => void;
}

export function FeaturedSection({ onProductClick }: FeaturedSectionProps) {
  const { language, colorTheme } = useStore();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]); // <-- Fix: start with empty array
  const [currentSlide, setCurrentSlide] = useState(0);

  const translations = {
    en: {
      featuredProducts: 'Featured Products',
      specialOffers: 'Special Offers & Promotions',
      limitedTime: 'Limited Time',
      save: 'Save',
      viewDetails: 'View Details',
      hotDeal: 'Hot Deal',
      trending: 'Trending',
      newArrival: 'New Arrival',
    },
    fr: {
      featuredProducts: 'Produits Vedettes',
      specialOffers: 'Offres Spéciales et Promotions',
      limitedTime: 'Temps Limité',
      save: 'Économisez',
      viewDetails: 'Voir Détails',
      hotDeal: 'Offre Chaude',
      trending: 'Tendance',
      newArrival: 'Nouveauté',
    }
  };

  const t = translations[language];

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.max(1, featuredProducts.length));
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  const loadFeaturedProducts = async () => {
    try {
      const { data } = await db.getProducts();
      if (data && data.length > 0) {
        const featured = data.filter(product => product.is_featured || product.discount_percentage > 0);
        if (featured.length > 0) {
          setFeaturedProducts(featured.slice(0, 4));
        }
      }
    } catch (error) {
      console.warn('Error loading featured products, using mock data:', error);
    }
  };

  const getThemeColors = () => {
    const themes = {
      blue: { primary: 'bg-blue-600', secondary: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
      green: { primary: 'bg-green-600', secondary: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
      purple: { primary: 'bg-purple-600', secondary: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
      orange: { primary: 'bg-orange-600', secondary: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
      red: { primary: 'bg-red-600', secondary: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
    };
    return themes[colorTheme];
  };

  const themeColors = getThemeColors();

  if (featuredProducts.length === 0) return null;

  return (
    <section className={`py-16 ${themeColors.secondary}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Star className={`w-8 h-8 ${themeColors.text} mr-2`} />
            <h2 className="text-4xl font-bold text-gray-900">
              {t.featuredProducts}
            </h2>
            <Star className={`w-8 h-8 ${themeColors.text} ml-2`} />
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.specialOffers}
          </p>
        </div>

        {/* Animated Hero Carousel */}
        <div className="relative mb-12 overflow-hidden rounded-2xl shadow-2xl">
          <div 
            className="flex transition-transform duration-1000 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {featuredProducts.map((product, index) => (
              <div key={product.id} className="w-full flex-shrink-0 relative">
                <div className={`${themeColors.primary} text-white p-12 min-h-96 flex items-center`}>
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center space-x-4">
                      <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-semibold flex items-center animate-bounce-slow">
                        <Zap className="w-4 h-4 mr-2" />
                        {t.hotDeal}
                      </span>
                      {(product.discount_percentage ?? 0) > 0 && (
                        <span className="bg-red-500 px-4 py-2 rounded-full text-sm font-semibold flex items-center animate-pulse-slow">
                          <Clock className="w-4 h-4 mr-2" />
                          {t.limitedTime}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-5xl font-bold leading-tight">
                      {language === 'en' ? product.name : product.name_fr}
                    </h3>
                    
                    <p className="text-xl opacity-90 max-w-lg">
                      {language === 'en' ? product.description : product.description_fr}
                    </p>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl font-bold">
                        {(product.discount_percentage ?? 0) > 0 ? (
                          <>
                            <span className="line-through opacity-60 text-xl mr-2">
                              {product.price.toLocaleString()} FCFA
                            </span>
                            <span>
                              {Math.round(product.price * (1 - (product.discount_percentage ?? 0) / 100)).toLocaleString()} FCFA
                            </span>
                          </>
                        ) : (
                          <span>{product.price.toLocaleString()} FCFA</span>
                        )}
                      </div>
                      
                      {(product.discount_percentage ?? 0) > 0 && (
                        <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                          {t.save} {product.discount_percentage}%
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => onProductClick(product)}
                      className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                    >
                      {t.viewDetails}
                    </button>
                  </div>
                  
                  <div className="flex-1 flex justify-center items-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white bg-opacity-20 rounded-full blur-3xl transform scale-150 animate-ping-slow"></div>
                      <img
                        src={product.image_url}
                        alt={language === 'en' ? product.name : product.name_fr}
                        className="relative z-10 w-80 h-80 object-cover rounded-2xl shadow-2xl transform hover:scale-110 transition-all duration-700 animate-float"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Slide Indicators */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {featuredProducts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  currentSlide === index 
                    ? 'bg-white scale-125 animate-pulse' 
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Featured Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.slice(0, 6).map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-4 hover:scale-105 cursor-pointer group animate-fade-in-up"
              onClick={() => onProductClick(product)}
            >
              <div className="relative overflow-hidden">
                <img
                  src={product.image_url}
                  alt={language === 'en' ? product.name : product.name_fr}
                  className="w-full h-48 object-cover group-hover:scale-125 transition-transform duration-1000"
                />
                
                { (product.discount_percentage ?? 0) > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-bounce-slow">
                    -{product.discount_percentage}%
                  </div>
                )}
                
                <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-2 py-1 rounded-full animate-float">
                  <Star className={`w-4 h-4 ${themeColors.text}`} />
                </div>
              </div>
              
              <div className="p-6">
                <h4 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {language === 'en' ? product.name : product.name_fr}
                </h4>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {language === 'en' ? product.description : product.description_fr}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    {(product.discount_percentage ?? 0) > 0 ? (
                      <>
                        <span className="text-lg font-bold text-green-600 animate-pulse-slow">
                          {Math.round(product.price * (1 - (product.discount_percentage ?? 0) / 100)).toLocaleString()} FCFA
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {product.price.toLocaleString()} FCFA
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        {product.price.toLocaleString()} FCFA
                      </span>
                    )}
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${themeColors.secondary} ${themeColors.text} animate-bounce-slow`}>
                    {t.trending}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}