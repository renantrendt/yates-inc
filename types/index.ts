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
  mail_handle?: string;
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

// Message Types
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_mail: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface Conversation {
  id: string;
  subject: string;
  participants: string[]; // Array of employee IDs
  participant_names: string[];
  participant_mails: string[];
  last_message: string;
  last_message_at: string;
  unread_count: number;
  created_at: string;
  priority: 'normal' | 'high';
}

// Mail Context Types
export interface MailContextType {
  conversations: Conversation[];
  messages: Message[];
  unreadCount: number;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, senderId: string) => Promise<void>;
  createConversation: (subject: string, participantIds: string[], initialMessage: string, senderId: string, priority?: 'normal' | 'high') => Promise<string>;
  markAsRead: (conversationId: string, employeeId: string) => Promise<void>;
}



