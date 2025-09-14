import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, List, Star, ShoppingCart } from 'lucide-react';
import { VoiceSearch } from '../components/voice/VoiceSearch';
import { useStore } from '../store/useStore';
import { db } from '../lib/supabase';
import { Product, Category } from '../types';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/ui/Footer';

const ShopPage: React.FC = () => {
  const { language, colorTheme, addToCart } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);

  const translations = {
    en: {
      shop: 'Shop',
      searchPlaceholder: 'Search products...',
      voiceSearch: 'Voice Search',
      allCategories: 'All Categories',
      sortBy: 'Sort by',
      newest: 'Newest',
      priceAsc: 'Price: Low to High',
      priceDesc: 'Price: High to Low',
      rating: 'Rating',
      addToCart: 'Add to Cart',
      viewDetails: 'View Details',
      noProducts: 'No products found',
      noProductsDesc: 'Try adjusting your search or filter criteria',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      featured: 'Featured',
    },
    fr: {
      shop: 'Boutique',
      searchPlaceholder: 'Rechercher des produits...',
      voiceSearch: 'Recherche Vocale',
      allCategories: 'Toutes les Catégories',
      sortBy: 'Trier par',
      newest: 'Plus Récent',
      priceAsc: 'Prix: Croissant',
      priceDesc: 'Prix: Décroissant',
      rating: 'Note',
      addToCart: 'Ajouter au Panier',
      viewDetails: 'Voir Détails',
      noProducts: 'Aucun produit trouvé',
      noProductsDesc: 'Essayez d\'ajuster vos critères de recherche',
      inStock: 'En Stock',
      outOfStock: 'Rupture de Stock',
      featured: 'Vedette',
    }
  };

  const t = translations[language];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    setSearchParams(params);
  }, [searchTerm, selectedCategory, setSearchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load categories
      const { data: categoriesData } = await db.getCategories();
      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Load products
      const { data: productsData } = await db.getProducts();
      if (productsData) {
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error loading shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProducts = React.useMemo(() => {
    let filtered = products.filter(product => {
      const name = language === 'en' ? product.name : product.name_fr;
      const description = language === 'en' ? product.description : product.description_fr;
      const categoryName = product.category ? (language === 'en' ? product.category.name : product.category.name_fr) : '';
      
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priceAsc':
          return a.price - b.price;
        case 'priceDesc':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy, language]);

  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleVoiceSearch = (query: string) => {
    setSearchTerm(query);
    setShowVoiceSearch(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">{t.shop}</h1>
          
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVoiceSearch(true)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                title={t.voiceSearch}
              >
                🎤
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">{t.allCategories}</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {language === 'en' ? category.name : category.name_fr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="newest">{t.newest}</option>
                <option value="priceAsc">{t.priceAsc}</option>
                <option value="priceDesc">{t.priceDesc}</option>
                <option value="rating">{t.rating}</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-600 mb-2">{t.noProducts}</h3>
            <p className="text-gray-500">{t.noProductsDesc}</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-6"
          }>
            {filteredAndSortedProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer group ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                {/* Product Image */}
                <div className={`relative bg-gray-100 overflow-hidden ${
                  viewMode === 'list' ? 'w-48 h-48' : 'h-48'
                }`}>
                  <img
                    src={product.image_url}
                    alt={language === 'en' ? product.name : product.name_fr}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 space-y-1">
                    {product.is_featured && (
                      <span className="bg-orange-500 text-white px-2 py-1 text-xs font-bold rounded">
                        {t.featured}
                      </span>
                    )}
                    {(typeof product.discount_percentage === 'number' && product.discount_percentage > 0) && (
                      <span className="bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                        -{product.discount_percentage}%
                      </span>
                    )}
                  </div>

                  {/* Stock Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      product.stock > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock > 0 ? t.inStock : t.outOfStock}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {language === 'en' ? product.name : product.name_fr}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {language === 'en' ? product.description : product.description_fr}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-3">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{product.rating || 4.5}</span>
                    <span className="text-sm text-gray-400">({product.review_count || 127})</span>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      {typeof product.discount_percentage === 'number' && product.discount_percentage > 0 ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-green-600">
                            {Math.round(product.price * (1 - product.discount_percentage / 100)).toLocaleString()} FCFA
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {product.price.toLocaleString()} FCFA
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {product.price.toLocaleString()} FCFA
                        </span>
                      )}
                    </div>

                    <Button
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={product.stock === 0}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.addToCart}</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Search Modal */}
      {showVoiceSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <VoiceSearch
            onSearch={handleVoiceSearch}
            onClose={() => setShowVoiceSearch(false)}
            placeholder={t.searchPlaceholder}
          />
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ShopPage;