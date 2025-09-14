import { useState } from 'react';
import { Minus, Plus, Trash2, CreditCard, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';
import { CheckoutForm } from './CheckoutForm';
import AuthModal from '../auth/AuthModal';
import { Modal } from '../ui/Modal';

interface CartModalProps {
  onClose: () => void;
}

export default function CartModal({ onClose }: CartModalProps) {
  const { 
    cart, 
    language, 
    updateCartQuantity, 
    removeFromCart, 
    getCartTotal, 
    clearCart,
    isAuthenticated,
    user
  } = useStore();
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const translations = {
    en: {
      emptyCart: 'Your cart is empty',
      emptyCartMessage: 'Add some items to get started',
      quantity: 'Quantity',
      remove: 'Remove',
      subtotal: 'Subtotal',
      checkout: 'Proceed to Checkout',
      loginRequired: 'Please login to checkout',
      continueShopping: 'Continue Shopping',
      clearCart: 'Clear Cart',
      total: 'Total',
      items: 'items',
      processing: 'Processing...',
    },
    fr: {
      emptyCart: 'Votre panier est vide',
      emptyCartMessage: 'Ajoutez des articles pour commencer',
      quantity: 'Quantité',
      remove: 'Supprimer',
      subtotal: 'Sous-total',
      checkout: 'Passer la commande',
      loginRequired: 'Veuillez vous connecter pour commander',
      continueShopping: 'Continuer vos achats',
      clearCart: 'Vider le panier',
      total: 'Total',
      items: 'articles',
      processing: 'Traitement...',
    }
  };

  const t = translations[language];

  const handleCheckoutSuccess = () => {
    setIsProcessing(true);
    clearCart();
    setShowCheckout(false);
    
    // Close modal and navigate to orders page
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
      // Trigger a page navigation to orders
      window.location.hash = '#orders';
      window.location.href = '/orders';
    }, 1000);
  };

  // Show processing state
  if (isProcessing) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          {t.processing}
        </h3>
        <p className="text-gray-500">
          Redirecting to your orders...
        </p>
      </div>
    );
  }

  if (showCheckout) {
    // Ensure we have user and cart data before showing checkout
    if (!user || !isAuthenticated() || cart.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Unable to proceed with checkout</p>
          <Button onClick={() => setShowCheckout(false)}>
            Back to Cart
          </Button>
        </div>
      );
    }

    return (
      <CheckoutForm
        onSuccess={handleCheckoutSuccess}
        onBack={() => setShowCheckout(false)}
      />
    );
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-6">
          <ShoppingBag className="mx-auto h-16 w-16" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          {t.emptyCart}
        </h3>
        <p className="text-gray-500 mb-6">
          {t.emptyCartMessage}
        </p>
        <Button onClick={onClose} variant="primary">
          {t.continueShopping}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cart Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Shopping Cart ({cart.length} {t.items})
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-red-600 hover:text-red-700"
        >
          {t.clearCart}
        </Button>
      </div>

      {/* Cart Items */}
      <div className="space-y-4 mb-8 max-h-96 overflow-y-auto">
        {cart.map((item) => (
          <div key={item.product.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <img
              src={item.product.image_url}
              alt={language === 'en' ? item.product.name : item.product.name_fr}
              className="w-20 h-20 object-cover rounded-lg"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?w=400&h=400&fit=crop';
              }}
            />
            
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                {language === 'en' ? item.product.name : item.product.name_fr}
              </h4>
              <p className="text-green-600 font-medium">
                {item.product.price.toLocaleString()} FCFA
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en' ? item.product.description?.slice(0, 60) : item.product.description_fr?.slice(0, 60)}...
              </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                  className="p-2"
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                
                <span className="px-4 py-2 font-medium min-w-12 text-center">
                  {item.quantity}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                  className="p-2"
                  disabled={item.quantity >= item.product.stock}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromCart(item.product.id)}
                className="text-red-600 hover:text-red-700 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Item Total */}
            <div className="text-right">
              <div className="font-bold text-gray-900">
                {(item.product.price * item.quantity).toLocaleString()} FCFA
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xl font-semibold text-gray-900">
            {t.subtotal}
          </span>
          <span className="text-2xl font-bold text-green-600">
            {Math.round(getCartTotal()).toLocaleString()} FCFA
          </span>
        </div>

        <div className="space-y-3">
          {isAuthenticated() ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowCheckout(true)}
              className="w-full flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>{t.checkout}</span>
            </Button>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">{t.loginRequired}</p>
              <Button
                variant="primary"
                onClick={() => setShowAuth(true)}
                className="w-full"
              >
                Login to Checkout
              </Button>
            </div>
          )}
      {/* Auth Modal for login/signup */}
      <Modal isOpen={showAuth} onClose={() => setShowAuth(false)} title="Login or Sign Up">
        <AuthModal onClose={() => setShowAuth(false)} />
      </Modal>

          <Button
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="w-full"
          >
            {t.continueShopping}
          </Button>
        </div>
      </div>
    </div>
  );
}