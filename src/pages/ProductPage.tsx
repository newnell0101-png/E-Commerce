import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Heart, Share2, ShoppingCart, Truck, Shield, RefreshCw, MessageCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { db, supabase } from '../lib/supabase';
import { Product } from '../types';
import { Button } from '../components/ui/Button';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { CommentSection } from '../components/comments/CommentSection';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, addToCart, user, isAuthenticated } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const translations = {
    en: {
      backToShop: 'Back to Shop',
      addToCart: 'Add to Cart',
      addToWishlist: 'Add to Wishlist',
      removeFromWishlist: 'Remove from Wishlist',
      share: 'Share',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      quantity: 'Quantity',
      description: 'Description',
      specifications: 'Specifications',
      reviews: 'Reviews',
      relatedProducts: 'Related Products',
      fastDelivery: 'Fast Delivery',
      securePayment: 'Secure Payment',
      qualityGuarantee: 'Quality Guarantee',
      support: '24/7 Support',
      loginToWishlist: 'Login to add to wishlist',
      productNotFound: 'Product not found',
      total: 'Total',
    },
    fr: {
      backToShop: 'Retour à la boutique',
      addToCart: 'Ajouter au panier',
      addToWishlist: 'Ajouter aux favoris',
      removeFromWishlist: 'Retirer des favoris',
      share: 'Partager',
      inStock: 'En stock',
      outOfStock: 'Rupture de stock',
      quantity: 'Quantité',
      description: 'Description',
      specifications: 'Caractéristiques',
      reviews: 'Avis',
      relatedProducts: 'Produits similaires',
      fastDelivery: 'Livraison rapide',
      securePayment: 'Paiement sécurisé',
      qualityGuarantee: 'Garantie qualité',
      support: 'Support 24/7',
      loginToWishlist: 'Connectez-vous pour ajouter aux favoris',
      productNotFound: 'Produit non trouvé',
      total: 'Total',
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const { data, error } = await db.getProduct(productId);
      
      if (error) {
        console.error('Error fetching product:', error);
        navigate('/shop');
        return;
      }

      if (data) {
        setProduct(data);
      } else {
        navigate('/shop');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated()) {
      alert(t.loginToWishlist);
      return;
    }

    if (!product || !user) return;

    try {
      if (isWishlisted) {
        // Remove from wishlist
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        setIsWishlisted(false);
      } else {
        // Add to wishlist
        await supabase
          .from('wishlist')
          .insert([{ user_id: user.id, product_id: product.id }]);
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: language === 'en' ? product.name : product.name_fr,
          text: language === 'en' ? product.description : product.description_fr,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.productNotFound}</h1>
          <Button onClick={() => navigate('/shop')}>
            {t.backToShop}
          </Button>
        </div>
      </div>
    );
  }

  const name = language === 'en' ? product.name : product.name_fr;
  const description = language === 'en' ? product.description : product.description_fr;
  const images = product.gallery_images || [product.image_url];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/shop')}
          className="mb-6 flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToShop}</span>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
              <img
                src={images[selectedImage]}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-green-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{name}</h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating || 4.5)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    {product.rating || 4.5} ({product.review_count || 127} reviews)
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold text-green-600">
                  {product.price.toLocaleString()} FCFA
                </span>
                
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.stock > 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.stock > 0 ? `${product.stock} ${t.inStock}` : t.outOfStock}
                </span>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-200">
              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">{t.fastDelivery}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">{t.securePayment}</span>
              </div>
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">{t.qualityGuarantee}</span>
              </div>
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">{t.support}</span>
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium">{t.quantity}:</span>
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-4 bg-green-50 rounded-lg px-4">
                <span className="font-medium">{t.total}:</span>
                <span className="text-2xl font-bold text-green-600">
                  {(product.price * quantity).toLocaleString()} FCFA
                </span>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{t.addToCart}</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleWishlistToggle}
                  className="flex items-center space-x-2"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                  <span>{isWishlisted ? t.removeFromWishlist : t.addToWishlist}</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleShare}
                  className="flex items-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{t.share}</span>
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">{t.description}</h3>
              <p className="text-gray-700 leading-relaxed">{description}</p>
            </div>

            {/* Specifications */}
            {product.specifications && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">{t.specifications}</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-1 gap-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <dt className="font-medium text-gray-700">{key}:</dt>
                        <dd className="text-gray-900">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-12">
          <CommentSection productId={id!} allowRating={true} />
        </div>
      </div>
    </div>
  );
};

export default ProductPage;