// Product Types
export interface Product {
  id: number;
  name: string;
  price: string;
  priceFloat: number;
  hoverText?: string;
  image: string;
  images?: string[]; // For carousel/gallery
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
  cartSubtotal: number;
  cartTax: number;
  cartTaxRate: number;
  cartTaxRateLabel: string;
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
  unread_for?: Record<string, number>; // Object with employee/client ID as key and unread count as value
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

// Paycheck Types
export interface EmployeePaycheck {
  id: string;
  employee_id: string;
  yates_balance: number;
  walters_balance: number;
  salary_amount: number;
  salary_currency: 'yates' | 'walters';
  days_until_paycheck: number;
  pay_interval: number;
  last_paycheck_date: string;
}

export interface PaycheckTaxInfo {
  originalAmount: number;
  taxRate: number;
  taxRateLabel: string;
  taxAmount: number;
  finalAmount: number;
  isAdded: boolean;
  isSubtracted: boolean;
}

export interface PaycheckContextType {
  paychecks: EmployeePaycheck[];
  currentUserPaycheck: EmployeePaycheck | null;
  loading: boolean;
  fetchPaychecks: () => Promise<void>;
  updateSalary: (employeeId: string, amount: number, currency: 'yates' | 'walters') => Promise<void>;
  processPaycheck: (employeeId: string) => Promise<void>;
  getPaycheckTaxInfo: (salaryAmount: number) => PaycheckTaxInfo;
}

// Stock Market Types
export interface StockPricePoint {
  timestamp: number;
  price: number;
}

export interface StockState {
  priceHistory: StockPricePoint[];
  currentPrice: number;
  ownedStocks: number;
  stockProfits: number; // Money earned from selling stocks (for premium purchases)
  lastPriceUpdate: number;
}

export interface StockContextType {
  stockState: StockState;
  currentPrice: number;
  priceHistory: StockPricePoint[];
  ownedStocks: number;
  stockProfits: number;
  buyStock: (quantity: number, gameSpendMoney: (amount: number) => boolean) => boolean;
  sellStock: (quantity: number) => boolean;
  spendStocks: (quantity: number) => boolean;
  canBuyStocks: (currentRockId: number, ownedPickaxeIds: number[]) => boolean;
}



