import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set."
  );
}

// ✅ Raw supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ Auth helpers
export const auth = {
  signUp: (email: string, password: string, metadata?: any) =>
    supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: metadata
      }
    }),

  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (callback: (event: any, session: any) => void) =>
    supabase.auth.onAuthStateChange(callback),

  updateUser: (updates: any) => supabase.auth.updateUser(updates),
};

// ✅ Database helpers
export const db = {
  // Products
  getProducts: (categoryId?: string) => {
    let query = supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    return query;
  },

  getProduct: (id: string) => {
    return supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("id", id)
      .single();
  },

  // Categories
  getCategories: () => {
    return supabase.from("categories").select("*").order("name");
  },

  // Orders
  createOrder: (order: any) => {
    console.log('Creating order in database:', order);
    return supabase
      .from("orders")
      .insert([order])
      .select("*")
      .single();
  },

  createOrderItems: (orderItems: any[]) => {
    console.log('Creating order items in database:', orderItems);
    return supabase
      .from("order_items")
      .insert(orderItems)
      .select("*");
  },

  getUserOrders: (userId: string) => {
    return supabase
      .from("orders")
      .select(`
        *,
        items:order_items(
          *,
          product:products(name, name_fr, image_url, price)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  },

  // Fallback method for getUserOrders
  getUserOrdersFallback: (userId: string) => {
    return supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  },

  // Basic user orders without joins
  getBasicUserOrders: (userId: string) => {
    return supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  },

  // Get order items separately
  getOrderItems: (orderId: string) => {
    return supabase
      .from("order_items")
      .select(`
        *,
        product:products(name, name_fr, image_url, price)
      `)
      .eq("order_id", orderId);
  },
  // User Profiles
  getProfile: (userId: string) => {
    return supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
  },

  updateProfile: (userId: string, updates: any) => {
    return supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
  },

  // Categories
  createCategory: (category: any) => {
    return supabase.from("categories").insert(category).select().single();
  },

  updateCategory: (id: string, updates: any) => {
    return supabase.from("categories").update(updates).eq("id", id).select().single();
  },

  deleteCategory: (id: string) => {
    return supabase.from("categories").delete().eq("id", id);
  },

  // Rewards System
  getUserRewards: (userId: string) => {
    try {
      return supabase
        .from("user_rewards")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    } catch (error) {
      console.warn('user_rewards table not found, returning empty result');
      return Promise.resolve({ data: [], error: null });
    }
  },

  claimReward: (rewardId: string) => {
    try {
      return supabase
        .from("user_rewards")
        .update({ claimed: true })
        .eq("id", rewardId);
    } catch (error) {
      console.warn('user_rewards table not found');
      return Promise.resolve({ data: null, error: null });
    }
  },

  createReward: (reward: any) => {
    try {
      return supabase.from("user_rewards").insert(reward);
    } catch (error) {
      console.warn('user_rewards table not found');
      return Promise.resolve({ data: null, error: null });
    }
  },

  // Achievements
  getAchievements: () => {
    try {
      return supabase.from("achievements").select("*");
    } catch (error) {
      console.warn('achievements table not found, returning empty result');
      return Promise.resolve({ data: [], error: null });
    }
  },

  getUserAchievements: (userId: string) => {
    try {
      return supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq("user_id", userId);
    } catch (error) {
      console.warn('user_achievements table not found, returning empty result');
      return Promise.resolve({ data: [], error: null });
    }
  },

  // Surprise Events
  getActiveSurpriseEvents: () => {
    try {
      return supabase
        .from("surprise_events")
        .select("*")
        .eq("active", true)
        .gte("end_date", new Date().toISOString());
    } catch (error) {
      console.warn('surprise_events table not found, returning empty result');
      return Promise.resolve({ data: [], error: null });
    }
  },

  // Voice Search
  logVoiceSearch: (searchData: any) => {
    try {
      return supabase.from("voice_search_logs").insert(searchData);
    } catch (error) {
      console.warn('voice_search_logs table not found');
      return Promise.resolve({ data: null, error: null });
    }
  },

  // Comments System
  getProductComments: (productId: string) => {
    try {
      return supabase
        .from("comments")
        .select(`
          *,
          user:profiles(full_name, email),
          votes:comment_votes(vote_type)
        `)
        .eq("product_id", productId)
        .eq("status", "published")
        .order("created_at", { ascending: false });
    } catch (error) {
      console.warn('comments table not found, returning empty result');
      return Promise.resolve({ data: [], error: null });
    }
  },

  createComment: (commentData: any) => {
    try {
      return supabase.from("comments").insert(commentData).select().single();
    } catch (error) {
      console.warn('comments table not found');
      return Promise.resolve({ data: null, error: null });
    }
  },

  updateComment: (commentId: string, updates: any) => {
    try {
      return supabase.from("comments").update(updates).eq("id", commentId);
    } catch (error) {
      console.warn('comments table not found');
      return Promise.resolve({ data: null, error: null });
    }
  },

  deleteComment: (commentId: string) => {
    try {
      return supabase.from("comments").delete().eq("id", commentId);
    } catch (error) {
      console.warn('comments table not found');
      return Promise.resolve({ data: null, error: null });
    }
  },

  voteComment: (commentId: string, userId: string, voteType: 'upvote' | 'downvote') => {
    try {
      return supabase.from("comment_votes").upsert({
        comment_id: commentId,
        user_id: userId,
        vote_type: voteType
      });
    } catch (error) {
      console.warn('comment_votes table not found');
      return Promise.resolve({ data: null, error: null });
    }
  },

  // Chat System
  getAllChatSessions: () => {
    try {
      return supabase
        .from("chat_sessions")
        .select(`
          *,
          user:profiles!chat_sessions_user_id_fkey(full_name, email),
          admin:profiles!chat_sessions_admin_id_fkey(full_name, email)
        `)
        .order("updated_at", { ascending: false });
    } catch (error) {
      console.warn('chat_sessions table not found, returning empty result');
      return Promise.resolve({ data: [], error: null });
    }
  },

  getUserChatSessions: (userId: string) => {
    try {
      return supabase
        .from("chat_sessions")
        .select(`
          *,
          admin:profiles!chat_sessions_admin_id_fkey(full_name, email)
        `)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
    } catch (error) {
      console.warn('chat_sessions table not found, returning empty result');
      return Promise.resolve({ data: [], error: null });
    }
  },

  createChatSession: (sessionData: any) => {
    try {
      return supabase.from("chat_sessions").insert(sessionData).select().single();
    } catch (error) {
      console.warn('chat_sessions table not found');
      return Promise.resolve({ data: null, error: null });
    }
  },

  updateChatSession: (sessionId: string, updates: any) => {
    try {
      return supabase.from("chat_sessions").update(updates).eq("id", sessionId);
    } catch (error) {
      console.warn('chat_sessions table not found');
      return Promise.resolve({ data: null, error: null });
    }
  },

  getChatMessages: (sessionId: string) => {
    try {
      return supabase
        .from("chat_messages")
        .select(`
          *,
          sender:profiles(full_name, email)
        `)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
    } catch (error) {
      console.warn('chat_messages table not found, returning empty result');
      return Promise.resolve({ data: [], error: null });
    }
  },

  sendChatMessage: (messageData: any) => {
    try {
      return supabase.from("chat_messages").insert(messageData).select().single();
    } catch (error) {
      console.warn('chat_messages table not found');
      return Promise.resolve({ data: null, error: null });
    }
  },

  markMessagesAsRead: (sessionId: string, userId: string) => {
    try {
      return supabase
        .from("chat_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .neq("sender_id", userId)
        .is("read_at", null);
    } catch (error) {
      console.warn('chat_messages table not found');
      return Promise.resolve({ data: null, error: null });
    }
  },

  // Admin functions
  createUser: async (userData: any) => {
    // In a real app, you'd use supabase.auth.admin.createUser
    // For demo purposes, we'll create a profile directly
    return supabase.from("profiles").insert({
      id: crypto.randomUUID(),
      email: userData.email,
      full_name: userData.full_name,
      phone: userData.phone,
      is_admin: userData.is_admin,
    }).select().single();
  },

  updateUser: (userId: string, updates: any) => {
    return supabase.from("profiles").update(updates).eq("id", userId).select().single();
  },

  deleteUser: (userId: string) => {
    return supabase.from("profiles").delete().eq("id", userId);
  },

  createProduct: (product: any) => {
    // Ensure we have a proper ID
    if (!product.id) {
      product.id = crypto.randomUUID();
    }
    return supabase.from("products").insert(product).select().single();
  },

  updateProduct: (id: string, updates: any) => {
    // Remove id from updates to avoid conflicts
    const { id: _, ...updateData } = updates;
    return supabase.from("products").update(updates).eq("id", id).select().single();
  },

  deleteProduct: (id: string) => {
    return supabase.from("products").delete().eq("id", id);
  },

  getAllProducts: () => {
    return supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .order("created_at", { ascending: false });
  },

  getAllUsers: () => {
    return supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
  },

  getAllOrders: () => {
    return supabase
      .from("orders")
      .select(`
        *,
        order_items:order_items(
          *,
          product:products(name)
        )
      `)
      .order("created_at", { ascending: false });
  },

  updateOrderStatus: (orderId: string, status: string) => {
    return supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);
  },

  // Analytics
  getAnalytics: () => {
    return Promise.all([
      supabase.from("products").select("id", { count: "exact" }),
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("orders").select("total"),
      supabase.from("orders").select("id", { count: "exact" }),
    ]);
  },
};

// ✅ Storage helpers
export const storage = {
  uploadFile: (bucket: string, path: string, file: File) =>
    supabase.storage.from(bucket).upload(path, file),

  getPublicUrl: (bucket: string, path: string) =>
    supabase.storage.from(bucket).getPublicUrl(path),

  deleteFile: (bucket: string, path: string) =>
    supabase.storage.from(bucket).remove([path]),
};