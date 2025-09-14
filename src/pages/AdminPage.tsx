import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  BarChart3,
  Settings,
  Gift,
  Palette,
  LogOut,
  Save,
  X
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { db, auth, storage } from '../lib/supabase';
import { Product, User, Order, Category } from '../types';
import { Button } from '../components/ui/Button';
import { LoadingScreen } from '../components/ui/LoadingScreen';

const AdminPage: React.FC = () => {
  const { user, language, isAdmin, colorTheme, setColorTheme } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Form states
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form data
  const [productForm, setProductForm] = useState({
    name: '',
    name_fr: '',
    description: '',
    description_fr: '',
    price: '',
    category_id: '',
    image_url: '',
    stock: '',
    active: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    name_fr: '',
    description: '',
    description_fr: ''
  });
  
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    is_admin: false
  });

  // App settings
  const [appSettings, setAppSettings] = useState({
    siteName: 'CameroonMart',
    currency: 'FCFA',
    taxRate: 0,
    shippingFee: 0,
    freeShippingThreshold: 50000,
    maintenanceMode: false,
    allowGuestCheckout: true,
    maxCartItems: 50,
    sessionTimeout: 30, // minutes
  });

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    pendingOrders: 0,
  });

  const translations = {
    en: {
      adminDashboard: 'Admin Dashboard',
      dashboard: 'Dashboard',
      products: 'Products',
      users: 'Users',
      orders: 'Orders',
      categories: 'Categories',
      settings: 'Settings',
      totalProducts: 'Total Products',
      totalUsers: 'Total Users',
      totalOrders: 'Total Orders',
      totalRevenue: 'Total Revenue',
      activeProducts: 'Active Products',
      pendingOrders: 'Pending Orders',
      addProduct: 'Add Product',
      addCategory: 'Add Category',
      editProduct: 'Edit Product',
      editCategory: 'Edit Category',
      deleteProduct: 'Delete Product',
      name: 'Name',
      nameFr: 'Name (French)',
      description: 'Description',
      descriptionFr: 'Description (French)',
      email: 'Email',
      price: 'Price',
      stock: 'Stock',
      status: 'Status',
      actions: 'Actions',
      active: 'Active',
      inactive: 'Inactive',
      edit: 'Edit',
      delete: 'Delete',
      view: 'View',
      save: 'Save',
      cancel: 'Cancel',
      category: 'Category',
      imageUrl: 'Image URL',
      accessDenied: 'Access Denied',
      adminOnly: 'This page is only accessible to administrators.',
      loading: 'Loading...',
      noData: 'No data available',
      logout: 'Logout',
      themeSettings: 'Theme Settings',
      chooseTheme: 'Choose App Theme',
      confirmDelete: 'Are you sure you want to delete this item?',
      itemAdded: 'Item added successfully!',
      itemUpdated: 'Item updated successfully!',
      itemDeleted: 'Item deleted successfully!',
      addUser: 'Add User',
      editUser: 'Edit User',
      deleteUser: 'Delete User',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      isAdmin: 'Is Admin',
      fullName: 'Full Name',
      phone: 'Phone',
      appSettings: 'App Settings',
      siteName: 'Site Name',
      currency: 'Currency',
      taxRate: 'Tax Rate (%)',
      shippingFee: 'Shipping Fee',
      freeShippingThreshold: 'Free Shipping Threshold',
      maintenanceMode: 'Maintenance Mode',
      allowGuestCheckout: 'Allow Guest Checkout',
      maxCartItems: 'Max Cart Items',
      sessionTimeout: 'Session Timeout (minutes)',
      saveSettings: 'Save Settings',
      userManagement: 'User Management',
      systemSettings: 'System Settings',
    },
    fr: {
      adminDashboard: 'Tableau de Bord Admin',
      dashboard: 'Tableau de Bord',
      products: 'Produits',
      users: 'Utilisateurs',
      orders: 'Commandes',
      categories: 'Catégories',
      settings: 'Paramètres',
      totalProducts: 'Total Produits',
      totalUsers: 'Total Utilisateurs',
      totalOrders: 'Total Commandes',
      totalRevenue: 'Chiffre d\'Affaires Total',
      activeProducts: 'Produits Actifs',
      pendingOrders: 'Commandes en Attente',
      addProduct: 'Ajouter Produit',
      addCategory: 'Ajouter Catégorie',
      editProduct: 'Modifier Produit',
      editCategory: 'Modifier Catégorie',
      deleteProduct: 'Supprimer Produit',
      name: 'Nom',
      nameFr: 'Nom (Français)',
      description: 'Description',
      descriptionFr: 'Description (Français)',
      email: 'E-mail',
      price: 'Prix',
      stock: 'Stock',
      status: 'Statut',
      actions: 'Actions',
      active: 'Actif',
      inactive: 'Inactif',
      edit: 'Modifier',
      delete: 'Supprimer',
      view: 'Voir',
      save: 'Enregistrer',
      cancel: 'Annuler',
      category: 'Catégorie',
      imageUrl: 'URL de l\'image',
      accessDenied: 'Accès Refusé',
      adminOnly: 'Cette page n\'est accessible qu\'aux administrateurs.',
      loading: 'Chargement...',
      noData: 'Aucune donnée disponible',
      logout: 'Déconnexion',
      themeSettings: 'Paramètres du Thème',
      chooseTheme: 'Choisir le Thème de l\'App',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet élément?',
      itemAdded: 'Élément ajouté avec succès!',
      itemUpdated: 'Élément mis à jour avec succès!',
      itemDeleted: 'Élément supprimé avec succès!',
      addUser: 'Ajouter Utilisateur',
      editUser: 'Modifier Utilisateur',
      deleteUser: 'Supprimer Utilisateur',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      isAdmin: 'Est Admin',
      fullName: 'Nom complet',
      phone: 'Téléphone',
      appSettings: 'Paramètres de l\'application',
      siteName: 'Nom du site',
      currency: 'Devise',
      taxRate: 'Taux de taxe (%)',
      shippingFee: 'Frais de livraison',
      freeShippingThreshold: 'Seuil de livraison gratuite',
      maintenanceMode: 'Mode maintenance',
      allowGuestCheckout: 'Autoriser la commande invité',
      maxCartItems: 'Articles max. dans le panier',
      sessionTimeout: 'Expiration de session (minutes)',
      saveSettings: 'Enregistrer les paramètres',
      userManagement: 'Gestion des utilisateurs',
      systemSettings: 'Paramètres système',
    }
  };

  const t = translations[language];

  const themes = [
    { id: 'blue', name: 'Ocean Blue', name_fr: 'Bleu Océan', color: '#3b82f6' },
    { id: 'green', name: 'Forest Green', name_fr: 'Vert Forêt', color: '#10b981' },
    { id: 'purple', name: 'Royal Purple', name_fr: 'Violet Royal', color: '#8b5cf6' },
    { id: 'orange', name: 'Sunset Orange', name_fr: 'Orange Coucher', color: '#f59e0b' },
    { id: 'red', name: 'Crimson Red', name_fr: 'Rouge Cramoisi', color: '#ef4444' },
  ];

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      return;
    }
    loadAdminData();
  }, [isAdmin, navigate]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      const [productsRes, usersRes, ordersRes, categoriesRes] = await Promise.all([
        db.getAllProducts(),
        db.getAllUsers(),
        db.getAllOrders(),
        db.getCategories(),
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (usersRes.data) setUsers(usersRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);

      // Calculate stats
      const totalProducts = productsRes.data?.length || 0;
      const totalUsers = usersRes.data?.length || 0;
      const totalOrders = ordersRes.data?.length || 0;
      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + order.total, 0) || 0;
      const activeProducts = productsRes.data?.filter(p => p.active).length || 0;
      const pendingOrders = ordersRes.data?.filter(o => o.status === 'processing').length || 0;

      setStats({
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue,
        activeProducts,
        pendingOrders,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = productForm.image_url;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `product_${Date.now()}.${fileExt}`;
        const { data, error } = await storage.uploadFile('product-images', fileName, imageFile);
        if (error) throw error;
        const { data: urlData } = storage.getPublicUrl('product-images', fileName);
        imageUrl = urlData.publicUrl;
      }
      const productData = {
        ...productForm,
        image_url: imageUrl,
        price: parseInt(productForm.price),
        stock: parseInt(productForm.stock),
        id: `prod_${Date.now()}`
      };
      await db.createProduct(productData);
      alert(t.itemAdded);
      setShowAddProduct(false);
      setProductForm({
        name: '',
        name_fr: '',
        description: '',
        description_fr: '',
        price: '',
        category_id: '',
        image_url: '',
        stock: '',
        active: true
      });
      setImageFile(null);
      loadAdminData();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const categoryData = {
        ...categoryForm,
        id: categoryForm.id || `cat_${Date.now()}`
      };
      
      await db.createCategory(categoryData);
      alert(t.itemAdded);
      setShowAddCategory(false);
      setCategoryForm({
        id: '',
        name: '',
        name_fr: '',
        description: '',
        description_fr: ''
      });
      loadAdminData();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        await db.deleteProduct(productId);
        alert(t.itemDeleted);
        loadAdminData();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        await db.deleteCategory(categoryId);
        alert(t.itemDeleted);
        loadAdminData();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      await db.updateProduct(productId, { active: !currentStatus });
      loadAdminData();
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await db.updateOrderStatus(orderId, newStatus);
      loadAdminData();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real app, you'd use Supabase auth.admin.createUser
      // For demo purposes, we'll simulate user creation
      const newUser = {
        id: crypto.randomUUID(),
        email: userForm.email,
        full_name: userForm.full_name,
        phone: userForm.phone,
        is_admin: userForm.is_admin,
        created_at: new Date().toISOString()
      };
      
      alert(t.itemAdded);
      setShowAddUser(false);
      setUserForm({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        is_admin: false
      });
      loadAdminData();
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding user');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real app, you'd save these to database
      localStorage.setItem('appSettings', JSON.stringify(appSettings));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    }
  };

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t.accessDenied}</h1>
          <p className="text-gray-600 mb-4">{t.adminOnly}</p>
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

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">{t.adminDashboard}</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.logout}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: t.dashboard, icon: BarChart3 },
              { id: 'products', label: t.products, icon: Package },
              { id: 'categories', label: t.categories, icon: Gift },
              { id: 'users', label: t.users, icon: Users },
              { id: 'orders', label: t.orders, icon: ShoppingCart },
              { id: 'settings', label: t.themeSettings, icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title={t.totalProducts}
                value={stats.totalProducts}
                icon={Package}
                color="bg-blue-500"
              />
              <StatCard
                title={t.totalUsers}
                value={stats.totalUsers}
                icon={Users}
                color="bg-green-500"
              />
              <StatCard
                title={t.totalOrders}
                value={stats.totalOrders}
                icon={ShoppingCart}
                color="bg-purple-500"
              />
              <StatCard
                title={t.totalRevenue}
                value={`${stats.totalRevenue.toLocaleString()} FCFA`}
                icon={TrendingUp}
                color="bg-yellow-500"
              />
              <StatCard
                title={t.activeProducts}
                value={stats.activeProducts}
                icon={Eye}
                color="bg-indigo-500"
              />
              <StatCard
                title={t.pendingOrders}
                value={stats.pendingOrders}
                icon={Package}
                color="bg-red-500"
              />
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.user_email || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.total.toLocaleString()} FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{t.products}</h2>
              <Button 
                onClick={() => setShowAddProduct(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addProduct}</span>
              </Button>
            </div>

            {/* Add Product Modal */}
            {showAddProduct && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAddProduct(false)} />
                  <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold">{t.addProduct}</h3>
                      <button onClick={() => setShowAddProduct(false)}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t.name}</label>
                          <input
                            type="text"
                            value={productForm.name}
                            onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t.nameFr}</label>
                          <input
                            type="text"
                            value={productForm.name_fr}
                            onChange={(e) => setProductForm({...productForm, name_fr: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
                          <textarea
                            value={productForm.description}
                            onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            rows={3}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t.descriptionFr}</label>
                          <textarea
                            value={productForm.description_fr}
                            onChange={(e) => setProductForm({...productForm, description_fr: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            rows={3}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t.price}</label>
                          <input
                            type="number"
                            value={productForm.price}
                            onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t.stock}</label>
                          <input
                            type="number"
                            value={productForm.stock}
                            onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t.category}</label>
                          <select
                            value={productForm.category_id}
                            onChange={(e) => setProductForm({...productForm, category_id: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            required
                          >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {language === 'en' ? cat.name : cat.name_fr}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.imageUrl}</label>
                        <input
                          type="url"
                          value={productForm.image_url}
                          onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          placeholder="https://example.com/image.jpg"
                          required
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowAddProduct(false)}>
                          {t.cancel}
                        </Button>
                        <Button type="submit">
                          {t.save}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.name}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.price}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.stock}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.status}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.image_url}
                              alt={product.name}
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.category?.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.price.toLocaleString()} FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleProductStatus(product.id, product.active)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.active ? (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                {t.active}
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                {t.inactive}
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-indigo-600 hover:text-indigo-900">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{t.categories}</h2>
              <Button 
                onClick={() => setShowAddCategory(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addCategory}</span>
              </Button>
            </div>

            {/* Add Category Modal */}
            {showAddCategory && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAddCategory(false)} />
                  <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold">{t.addCategory}</h3>
                      <button onClick={() => setShowAddCategory(false)}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <form onSubmit={handleAddCategory} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category ID</label>
                        <input
                          type="text"
                          value={categoryForm.id}
                          onChange={(e) => setCategoryForm({...categoryForm, id: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          placeholder="electronics"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t.name}</label>
                          <input
                            type="text"
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t.nameFr}</label>
                          <input
                            type="text"
                            value={categoryForm.name_fr}
                            onChange={(e) => setCategoryForm({...categoryForm, name_fr: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
                          <textarea
                            value={categoryForm.description}
                            onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t.descriptionFr}</label>
                          <textarea
                            value={categoryForm.description_fr}
                            onChange={(e) => setCategoryForm({...categoryForm, description_fr: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            rows={3}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowAddCategory(false)}>
                          {t.cancel}
                        </Button>
                        <Button type="submit">
                          {t.save}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div key={category.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {language === 'en' ? category.name : category.name_fr}
                    </h3>
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {language === 'en' ? category.description : category.description_fr}
                  </p>
                  <div className="mt-4 text-xs text-gray-500">
                    ID: {category.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{t.userManagement}</h2>
              <Button 
                onClick={() => setShowAddUser(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addUser}</span>
              </Button>
            </div>

            {/* Add User Modal */}
            {showAddUser && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAddUser(false)} />
                  <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold">{t.addUser}</h3>
                      <button onClick={() => setShowAddUser(false)}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <form onSubmit={handleAddUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
                        <input
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
                        <input
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          required
                          minLength={6}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.fullName}</label>
                        <input
                          type="text"
                          value={userForm.full_name}
                          onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
                        <input
                          type="tel"
                          value={userForm.phone}
                          onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isAdmin"
                          checked={userForm.is_admin}
                          onChange={(e) => setUserForm({...userForm, is_admin: e.target.checked})}
                          className="mr-2"
                        />
                        <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700">{t.isAdmin}</label>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowAddUser(false)}>
                          {t.cancel}
                        </Button>
                        <Button type="submit">
                          {t.save}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.email}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.is_admin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.total_orders || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t.orders}</h2>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.user_email || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.total.toLocaleString()} FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="text-xs font-medium rounded-full px-2 py-1 border-0 bg-gray-100"
                          >
                            <option value="processing">Processing</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t.themeSettings}</h2>
            
            {/* Theme Settings */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Palette className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900">{t.themeSettings}</h3>
              </div>
              
              <p className="text-gray-600 mb-6">{t.chooseTheme}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setColorTheme(theme.id as any)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      colorTheme === theme.id
                        ? 'border-gray-900 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-full h-12 rounded-lg mb-3"
                      style={{ backgroundColor: theme.color }}
                    />
                    <div className="text-sm font-medium text-gray-900">
                      {language === 'en' ? theme.name : theme.name_fr}
                    </div>
                    {colorTheme === theme.id && (
                      <div className="mt-2 text-xs text-green-600 font-medium">
                        ✓ Active
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* App Settings */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Settings className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900">{t.settings}</h3>
              </div>
              
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.siteName}</label>
                    <input
                      type="text"
                      value={appSettings.siteName}
                      onChange={(e) => setAppSettings({...appSettings, siteName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.currency}</label>
                    <input
                      type="text"
                      value={appSettings.currency}
                      onChange={(e) => setAppSettings({...appSettings, currency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.taxRate}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={appSettings.taxRate}
                      onChange={(e) => setAppSettings({...appSettings, taxRate: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.shippingFee}</label>
                    <input
                      type="number"
                      value={appSettings.shippingFee}
                      onChange={(e) => setAppSettings({...appSettings, shippingFee: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.freeShippingThreshold}</label>
                    <input
                      type="number"
                      value={appSettings.freeShippingThreshold}
                      onChange={(e) => setAppSettings({...appSettings, freeShippingThreshold: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.maxCartItems}</label>
                    <input
                      type="number"
                      value={appSettings.maxCartItems}
                      onChange={(e) => setAppSettings({...appSettings, maxCartItems: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={appSettings.maintenanceMode}
                      onChange={(e) => setAppSettings({...appSettings, maintenanceMode: e.target.checked})}
                      className="mr-3"
                    />
                    <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700">{t.maintenanceMode}</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowGuestCheckout"
                      checked={appSettings.allowGuestCheckout}
                      onChange={(e) => setAppSettings({...appSettings, allowGuestCheckout: e.target.checked})}
                      className="mr-3"
                    />
                    <label htmlFor="allowGuestCheckout" className="text-sm font-medium text-gray-700">{t.allowGuestCheckout}</label>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button type="submit" className="w-full md:w-auto">
                    {t.settings}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;