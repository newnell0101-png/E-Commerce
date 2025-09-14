/*
# 3D E-Commerce Cameroon Database Schema

This schema creates all the necessary tables and security policies for a complete e-commerce application.

## Tables Created:
1. Categories - Product categories with multilingual support
2. Products - Products with 3D model support
3. Orders - Customer orders with status tracking
4. Order Items - Individual items within orders

## Security:
- Row Level Security (RLS) enabled on all tables
- Policies for authenticated users to manage their data
- Admin-only policies for product management
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description TEXT,
  description_fr TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  model_url TEXT, -- 3D model file URL
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'dispatched', 'delivered', 'cancelled')),
  total INTEGER NOT NULL CHECK (total > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'momo', 'orange')),
  payment_transaction_id TEXT,
  shipping_address TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price INTEGER NOT NULL CHECK (price > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Categories: Public read access
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  USING (true);

-- Categories: Admin only write access
CREATE POLICY "Admin can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Products: Public read access for active products
CREATE POLICY "Active products are publicly readable"
  ON products FOR SELECT
  USING (active = true);

-- Products: Admin can see all products
CREATE POLICY "Admin can view all products"
  ON products FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Products: Admin only write access
CREATE POLICY "Admin can manage products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admin can update products"
  ON products FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admin can delete products"
  ON products FOR DELETE
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Orders: Users can only see their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Orders: Users can create their own orders
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Orders: Admin can see all orders
CREATE POLICY "Admin can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Orders: Admin can update order status
CREATE POLICY "Admin can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Order Items: Users can see items from their orders
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Order Items: Users can create items for their orders
CREATE POLICY "Users can create own order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Order Items: Admin can see all order items
CREATE POLICY "Admin can view all order items"
  ON order_items FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Profiles: Users can see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Profiles: Admin can see all profiles
CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, is_admin)
  VALUES (
    NEW.id, 
    NEW.email,
    -- Make first user admin, or check for demo admin email
    (SELECT COUNT(*) FROM profiles) = 0 OR NEW.email = 'admin@demo.com'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();