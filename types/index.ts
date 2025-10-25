// Product Types
export interface Product {
  id: number;
  name: string;
  price: string;
  priceFloat: number;
  hoverText?: string;
  image: string;
  isCustom?: boolean;
  hasAddToCart?: boolean;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

// Employee Types
export interface Employee {
  id: string;
  name: string;
  password: string;
  role: string;
  bio?: string;
}

// Task Types
export interface Task {
  id: string;
  task_name: string;
  description?: string;
  assigned_to_id: string;
  assigned_to_name: string;
  progress_percentage: number;
  due_date: string;
  created_by_id: string;
  created_at: string;
}

// Auth Context Types
export interface AuthContextType {
  employee: Employee | null;
  login: (id: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoggedIn: boolean;
}

// Cart Context Types
export interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

