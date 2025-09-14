export interface Product {
  specifications: any;
  id: string;
  name: string;
  name_fr: string;
  description: string;
  description_fr: string;
  price: number;
  category_id: string;
  image_url: string;
  gallery_images?: string[];
  model_url?: string;
  stock: number;
  active: boolean;
  is_featured?: boolean;
  discount_percentage?: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  sku?: string;
  weight?: number;
  dimensions?: string;
  tags?: string[];
  rating?: number;
  review_count?: number;
}

export interface Category {
  id: string;
  name: string;
  name_fr: string;
  description?: string;
  description_fr?: string;
  icon?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  user_email: string;
  order_items: any;
  id: string;
  user_id: string;
  status: 'processing' | 'dispatched' | 'delivered' | 'cancelled';
  total: number;
  payment_method: 'cod' | 'momo' | 'orange';
  shipping_address: string;
  phone: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface User {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  full_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  loyalty_points?: number;
  level?: string;
  last_login?: string;
  login_streak?: number;
  total_orders?: number;
  total_spent?: number;
}

export interface UserReward {
  id: string;
  user_id: string;
  type: 'daily_login' | 'first_purchase' | 'loyalty_points' | 'surprise_gift' | 'achievement';
  title: string;
  description: string;
  points: number;
  claimed: boolean;
  expires_at?: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  requirement_type: 'orders' | 'spending' | 'login_streak' | 'referrals';
  requirement_value: number;
}

export interface SurpriseEvent {
  id: string;
  title: string;
  description: string;
  type: 'flash_sale' | 'mystery_box' | 'spin_wheel' | 'daily_gift';
  active: boolean;
  start_date: string;
  end_date: string;
  config: any;
}

export type Language = 'en' | 'fr';
export type ViewMode = '3d' | '2d';
export type ColorTheme = 'blue' | 'green' | 'purple' | 'orange' | 'red';

export interface AppState {
  user: User | null;
  cart: CartItem[];
  language: Language;
  viewMode: ViewMode;
  colorTheme: ColorTheme;
  loading: boolean;
  rewards: UserReward[];
  achievements: Achievement[];
  surpriseEvents: SurpriseEvent[];
}