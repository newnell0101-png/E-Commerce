import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, Truck, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useStore } from '../store/useStore';
import { db } from '../lib/supabase';
import { Order } from '../types';
import { Button } from '../components/ui/Button';
import { LoadingScreen } from '../components/ui/LoadingScreen';

const OrdersPage: React.FC = () => {
  const { user, language, isAuthenticated } = useStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const translations = {
    en: {
      myOrders: 'My Orders',
      noOrders: 'No orders found',
      noOrdersDesc: 'You haven\'t placed any orders yet. Start shopping to see your orders here.',
      startShopping: 'Start Shopping',
      orderNumber: 'Order #',
      orderDate: 'Order Date',
      status: 'Status',
      total: 'Total',
      items: 'Items',
      viewDetails: 'View Details',
      orderDetails: 'Order Details',
      shippingAddress: 'Shipping Address',
      paymentMethod: 'Payment Method',
      orderItems: 'Order Items',
      quantity: 'Qty',
      price: 'Price',
      subtotal: 'Subtotal',
      processing: 'Processing',
      dispatched: 'Dispatched',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      cod: 'Cash on Delivery',
      momo: 'Mobile Money',
      orange: 'Orange Money',
      loginRequired: 'Please login to view your orders',
      close: 'Close',
    },
    fr: {
      myOrders: 'Mes Commandes',
      noOrders: 'Aucune commande trouvée',
      noOrdersDesc: 'Vous n\'avez pas encore passé de commande. Commencez vos achats pour voir vos commandes ici.',
      startShopping: 'Commencer les Achats',
      orderNumber: 'Commande #',
      orderDate: 'Date de Commande',
      status: 'Statut',
      total: 'Total',
      items: 'Articles',
      viewDetails: 'Voir Détails',
      orderDetails: 'Détails de la Commande',
      shippingAddress: 'Adresse de Livraison',
      paymentMethod: 'Mode de Paiement',
      orderItems: 'Articles de la Commande',
      quantity: 'Qté',
      price: 'Prix',
      subtotal: 'Sous-total',
      processing: 'En cours',
      dispatched: 'Expédié',
      delivered: 'Livré',
      cancelled: 'Annulé',
      cod: 'Paiement à la livraison',
      momo: 'Mobile Money',
      orange: 'Orange Money',
      loginRequired: 'Veuillez vous connecter pour voir vos commandes',
      close: 'Fermer',
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, isAuthenticated]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Try multiple approaches to get orders
      let ordersData = null;
      let orderItems: Record<string, any[]> = {};
      
      // First try: Get orders with items
      try {
        const { data, error } = await db.getUserOrders(user.id);
        if (data && !error) {
          ordersData = data;
        }
      } catch (err) {
        console.warn('Primary order fetch failed:', err);
      }
      
      // Fallback: Get basic orders
      if (!ordersData) {
        const { data: basicOrders } = await db.getBasicUserOrders(user.id);
        if (basicOrders) {
          ordersData = basicOrders;
          
          // Get order items separately
          for (const order of basicOrders) {
            try {
              const { data: items } = await db.getOrderItems(order.id);
              if (items) {
                orderItems[order.id] = items;
              }
            } catch (err) {
              console.warn(`Failed to fetch items for order ${order.id}:`, err);
            }
          }
        }
      }
      
      if (ordersData) {
        // Merge order items if fetched separately
        const processedOrders = ordersData.map(order => ({
          ...order,
          order_items: order.order_items || orderItems[order.id] || []
        }));
        
        setOrders(processedOrders);
      } else {
        console.error('Failed to fetch orders');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error in fetchOrders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh orders when component mounts or user changes
  useEffect(() => {
    const refreshOrders = () => {
      if (user && isAuthenticated()) {
        fetchOrders();
      }
    };

    // Initial load
    refreshOrders();

    // Listen for storage events (when orders are created in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'orderCreated') {
        refreshOrders();
        localStorage.removeItem('orderCreated'); // Clean up
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  // Auto-refresh orders every 30 seconds
  useEffect(() => {
    if (!isAuthenticated() || !user) return;

    const interval = setInterval(() => {
      fetchOrders();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, isAuthenticated]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'dispatched':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'dispatched':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cod':
        return t.cod;
      case 'momo':
        return t.momo;
      case 'orange':
        return t.orange;
      default:
        return method;
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.loginRequired}</h1>
          <Button onClick={() => navigate('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.myOrders}</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t.noOrders}</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{t.noOrdersDesc}</p>
            <Button onClick={() => navigate('/shop')}>
              {t.startShopping}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(order.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {t.orderNumber}{order.id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {t.orderDate}: {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {order.total.toLocaleString()} FCFA
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {t[order.status as keyof typeof t] || order.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {t.items}: {order.order_items?.length || 0} • {t.paymentMethod}: {getPaymentMethodText(order.payment_method)}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{t.viewDetails}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSelectedOrder(null)} />
              
              <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-96 overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{t.orderDetails}</h2>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{t.orderNumber}</h3>
                      <p className="text-gray-600">{selectedOrder.id}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{t.status}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {t[selectedOrder.status as keyof typeof t] || selectedOrder.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{t.shippingAddress}</h3>
                      <p className="text-gray-600">{selectedOrder.shipping_address}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{t.paymentMethod}</h3>
                      <p className="text-gray-600">{getPaymentMethodText(selectedOrder.payment_method)}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">{t.orderItems}</h3>
                    <div className="space-y-4">
                      {selectedOrder.order_items?.map(
                        (item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between py-4 border-b border-gray-200">
                          <div className="flex items-center space-x-4">
                            {item.product?.image_url && (
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {item.product?.name || item.product?.name_fr || 'Product'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {t.quantity}: {item.quantity}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {item.price.toLocaleString()} FCFA
                            </div>
                            <div className="text-sm text-gray-600">
                              {t.subtotal}: {(item.price * item.quantity).toLocaleString()} FCFA
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <span className="text-lg font-semibold text-gray-900">{t.total}:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {selectedOrder.total.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;