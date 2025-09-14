import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Smartphone, Phone, MapPin, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';
import { db, supabase } from '../../lib/supabase';
import { paymentMethods, MobileMoneyProcessor, CODProcessor } from '../../utils/payments';

interface CheckoutFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function CheckoutForm({ onSuccess, onBack }: CheckoutFormProps) {
  const { user, cart, language, getCartTotal, clearCart } = useStore();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'info' | 'payment' | 'processing' | 'success'>('info');
  
  // Form data
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    notes: ''
  });
  
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'cod',
    phone: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(7);

  const translations = {
    en: {
      backToCart: 'Back to Cart',
      shippingInfo: 'Shipping Information',
      fullName: 'Full Name',
      phone: 'Phone Number',
      address: 'Delivery Address',
      notes: 'Special Instructions (Optional)',
      paymentMethod: 'Payment Method',
      paymentPhone: 'Mobile Money Phone Number',
      placeOrder: 'Place Order',
      processing: 'Processing Payment...',
      orderTotal: 'Order Total',
      phoneRequired: 'Phone number is required',
      addressRequired: 'Delivery address is required',
      nameRequired: 'Full name is required',
      invalidPhone: 'Please enter a valid phone number',
      paymentFailed: 'Payment failed. Please try again.',
      orderSuccess: 'Order placed successfully!',
      next: 'Continue',
      orderSummary: 'Order Summary',
      items: 'items',
      redirecting: 'Redirecting in',
      seconds: 'seconds...',
      tryAgain: 'Try Again',
      orderCreated: 'Your order has been created successfully!',
      thankYou: 'Thank you for your purchase!',
    },
    fr: {
      backToCart: 'Retour au panier',
      shippingInfo: 'Informations de livraison',
      fullName: 'Nom complet',
      phone: 'Numéro de téléphone',
      address: 'Adresse de livraison',
      notes: 'Instructions spéciales (Optionnel)',
      paymentMethod: 'Mode de paiement',
      paymentPhone: 'Numéro Mobile Money',
      placeOrder: 'Passer la commande',
      processing: 'Traitement du paiement...',
      orderTotal: 'Total de la commande',
      phoneRequired: 'Le numéro de téléphone est requis',
      addressRequired: 'L\'adresse de livraison est requise',
      nameRequired: 'Le nom complet est requis',
      invalidPhone: 'Veuillez saisir un numéro de téléphone valide',
      paymentFailed: 'Échec du paiement. Veuillez réessayer.',
      orderSuccess: 'Commande passée avec succès!',
      next: 'Continuer',
      orderSummary: 'Résumé de la commande',
      items: 'articles',
      redirecting: 'Redirection dans',
      seconds: 'secondes...',
      tryAgain: 'Réessayer',
      orderCreated: 'Votre commande a été créée avec succès!',
      thankYou: 'Merci pour votre achat!',
    }
  };

  const t = translations[language];

  // Countdown effect for success state
  useEffect(() => {
    if (currentStep === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (currentStep === 'success' && countdown === 0) {
      // Auto close after countdown
      handleSuccessComplete();
    }
  }, [currentStep, countdown]);

  const validateShippingInfo = () => {
    setError('');
    
    if (!shippingInfo.fullName.trim()) {
      setError(t.nameRequired);
      return false;
    }
    if (!shippingInfo.phone.trim()) {
      setError(t.phoneRequired);
      return false;
    }
    if (!shippingInfo.address.trim()) {
      setError(t.addressRequired);
      return false;
    }
    if (!shippingInfo.phone.match(/^(237)?[0-9]{8,9}$/)) {
      setError(t.invalidPhone);
      return false;
    }
    return true;
  };

  const processPayment = async () => {
    try {
      // Always refresh session before payment
      await supabase.auth.getSession();
      const total = getCartTotal();
      let result;
      if (paymentInfo.method === 'cod') {
        result = await CODProcessor.processCODOrder();
      } else if (paymentInfo.method === 'momo') {
        result = await MobileMoneyProcessor.processMTNPayment(
          total,
          paymentInfo.phone || shippingInfo.phone
        );
      } else if (paymentInfo.method === 'orange') {
        result = await MobileMoneyProcessor.processOrangePayment(
          total,
          paymentInfo.phone || shippingInfo.phone
        );
      }
      setPaymentResult(result);
      // Process the result immediately
      if (result?.success || paymentInfo.method === 'cod') {
        await createOrder(result);
      } else {
        setError(result && 'error' in result && result.error ? result.error : t.paymentFailed);
        setLoading(false);
        setCurrentStep('payment');
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      setError(error.message || t.paymentFailed);
      setLoading(false);
      setCurrentStep('payment');
    }
  };

  const createOrder = async (paymentResult: any) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Get current session to ensure we have proper auth context
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const orderData = {
        user_id: user.id,
        total: getCartTotal(),
        payment_method: paymentInfo.method,
        payment_transaction_id: paymentResult?.transactionId || paymentResult?.orderId || null,
        shipping_address: shippingInfo.address,
        phone: shippingInfo.phone,
        notes: shippingInfo.notes || null
      };

      console.log('Creating order with data:', orderData);

      const { data: order, error: orderError } = await db.createOrder(orderData);
      
      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(orderError.message || 'Failed to create order');
      }

      if (!order) {
        throw new Error('Order creation failed - no order returned');
      }

      console.log('Order created successfully:', order);

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));

      console.log('Creating order items:', orderItems);

      const { data: createdItems, error: itemsError } = await db.createOrderItems(orderItems);
      
      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        // Don't fail the entire order if items creation fails
        console.warn('Order items creation failed, but order was created successfully');
      }

      console.log('Order items created successfully:', createdItems);

      // Success - show success state
      setSuccess(t.orderSuccess);
      setLoading(false);
      setCurrentStep('success');
      setCountdown(7);
      
      // Trigger storage event for orders page refresh
      localStorage.setItem('orderCreated', Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'orderCreated',
        newValue: Date.now().toString()
      }));
      
    } catch (error: any) {
      console.error('Order creation error:', error);
      setError(error.message || 'Failed to create order');
      setLoading(false);
      setCurrentStep('payment');
    }
  };

  const handleSuccessComplete = () => {
    clearCart();
    onSuccess();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep === 'info') {
      if (!validateShippingInfo()) return;
      setCurrentStep('payment');
      setError('');
    } else if (currentStep === 'payment') {
      setLoading(true);
      setCurrentStep('processing');
      setError('');
      await processPayment();
    }
  };

  const handleRetry = () => {
    setError('');
    setPaymentResult(null);
    setCurrentStep('payment');
  };

  // Don't render anything if we don't have required data
  if (!user || cart.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack} 
          className="flex items-center"
          disabled={loading || currentStep === 'processing'}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToCart}
        </Button>
        
        <div className="text-right">
          <p className="text-sm text-gray-600">{t.orderTotal}</p>
          <p className="text-2xl font-bold text-green-600">
            {getCartTotal().toLocaleString()} FCFA
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
              <div>
                <p className="text-red-700 font-medium">Payment Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && currentStep === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <div>
                <p className="text-green-700 font-medium">{t.orderCreated}</p>
                <p className="text-green-600 text-sm">{t.thankYou}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Shipping Information */}
            {currentStep === 'info' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-green-600" />
                  {t.shippingInfo}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.fullName}
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.fullName}
                      onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.phone}
                    </label>
                    <input
                      type="tel"
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="237XXXXXXXX"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.address}
                    </label>
                    <textarea
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={3}
                      placeholder="Street address, city, region..."
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.notes}
                    </label>
                    <textarea
                      value={shippingInfo.notes}
                      onChange={(e) => setShippingInfo({...shippingInfo, notes: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={2}
                      placeholder="Special delivery instructions..."
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <Button type="submit" variant="primary" size="lg" className="w-full">
                    {t.next}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 'payment' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                  {t.paymentMethod}
                </h3>
                
                <div className="space-y-4 mb-6">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentInfo.method === method.type
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.type}
                        checked={paymentInfo.method === method.type}
                        onChange={(e) => setPaymentInfo({...paymentInfo, method: e.target.value})}
                        className="mr-4"
                      />
                      
                      <div className="flex items-center flex-1">
                        {method.type === 'cod' && <CreditCard className="w-6 h-6 mr-3 text-gray-600" />}
                        {method.type === 'momo' && <Smartphone className="w-6 h-6 mr-3 text-yellow-600" />}
                        {method.type === 'orange' && <Phone className="w-6 h-6 mr-3 text-orange-600" />}
                        
                        <div>
                          <span className="font-medium">
                            {language === 'en' ? method.name : method.name_fr}
                          </span>
                          {method.type === 'cod' && (
                            <p className="text-sm text-gray-500">Pay when your order is delivered</p>
                          )}
                          {(method.type === 'momo' || method.type === 'orange') && (
                            <p className="text-sm text-gray-500">DEMO MODE - No real charge</p>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Mobile Money Phone Input */}
                {(paymentInfo.method === 'momo' || paymentInfo.method === 'orange') && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.paymentPhone}
                    </label>
                    <input
                      type="tel"
                      value={paymentInfo.phone}
                      onChange={(e) => setPaymentInfo({...paymentInfo, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={shippingInfo.phone}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Leave empty to use shipping phone number
                    </p>
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="lg" 
                    onClick={() => setCurrentStep('info')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    className="flex-1"
                    loading={loading}
                    disabled={loading}
                  >
                    {t.placeOrder}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Processing */}
            {currentStep === 'processing' && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                <p className="text-xl font-medium text-gray-900 mb-2">{t.processing}</p>
                <p className="text-gray-600">Please wait while we process your payment...</p>
                
                {error && (
                  <div className="mt-6">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={handleRetry} variant="primary">
                      {t.tryAgain}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Success */}
            {currentStep === 'success' && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-green-600 mb-6">
                  <CheckCircle className="w-20 h-20 mx-auto" />
                </div>
                <h3 className="text-2xl font-semibold text-green-600 mb-4">{t.orderSuccess}</h3>
                {paymentResult?.transactionId && (
                  <p className="text-gray-600 mb-4">
                    Transaction ID: {paymentResult.transactionId}
                  </p>
                )}
                <p className="text-gray-600 mb-4">
                  {t.redirecting} {countdown} {t.seconds}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${((7 - countdown) / 7) * 100}%`
                    }}
                  ></div>
                </div>
                <Button onClick={handleSuccessComplete} variant="primary">
                  Continue Shopping
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-green-600" />
              {t.orderSummary}
            </h3>
            
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center space-x-3">
                  <img
                    src={item.product.image_url}
                    alt={language === 'en' ? item.product.name : item.product.name_fr}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900">
                      {language === 'en' ? item.product.name : item.product.name_fr}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {item.quantity} × {item.product.price.toLocaleString()} FCFA
                    </p>
                  </div>
                  <div className="font-medium text-gray-900">
                    {(item.product.price * item.quantity).toLocaleString()} FCFA
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal ({cart.length} {t.items}):</span>
                <span className="font-medium">{getCartTotal().toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">{getCartTotal().toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}