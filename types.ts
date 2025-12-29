
export enum Currency {
  YER = 'YER',
  SAR = 'SAR',
  OMR = 'OMR'
}

export enum PaymentStatus {
  Cash = 'نقدي',
  Credit = 'آجل'
}

export enum VoucherType {
  Receipt = 'سند قبض',
  Payment = 'سند دفع'
}

export enum RecurrenceFrequency {
  None = 'بدون تكرار',
  Daily = 'يومياً',
  Weekly = 'أسبوعياً',
  Monthly = 'شهرياً',
  Yearly = 'سنوياً'
}

export enum BackupFrequency {
  None = 'إيقاف التلقائي',
  TwelveHours = 'كل 12 ساعة',
  Daily = 'يومياً',
  Weekly = 'أسبوعياً',
  Monthly = 'شهرياً'
}

export enum AiProvider {
  Gemini = 'Google Gemini',
  OpenAI = 'OpenAI GPT-4',
  DeepSeek = 'DeepSeek AI'
}

export enum UserRole {
  Admin = 'admin',
  Accountant = 'accountant',
  Salesperson = 'salesperson'
}

export enum AiDialect {
  Sanaani = 'صنعاني',
  Adeni = 'عدني',
  Hadrami = 'حضرمي',
  Formal = 'فصحى مهذبة'
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ip?: string;
}

export interface AppSettings {
  agency: {
    name: string;
    phone: string;
    address: string;
    managerName: string;
    logoUrl?: string;
    headerText?: string;
    footerText?: string;
  };
  sales: {
    defaultCurrency: Currency;
    autoThermalPrint: boolean;
    roundingEnabled: boolean;
    allowReturns: boolean;
    taxEnabled: boolean;
    taxRate: number;
    showEmployeeName: boolean;
  };
  inventory: {
    lowStockThreshold: number;
    autoUpdateOnPurchase: boolean;
    allowNegativeStock: boolean;
    categoryDefaults: string;
  };
  debts: {
    defaultCreditLimit: number;
    agingDaysRed: number;
    agingDaysAmber: number;
    autoReminderEnabled: boolean;
    autoReminderThreshold: number;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    privacyMode: boolean;
    fontSize: 'small' | 'medium' | 'large';
    compactTable: boolean;
  };
  security: {
    appLockEnabled: boolean;
    appLockPin: string;
    autoLockOnExit: boolean;
  };
  ai: {
    dialect: AiDialect;
    autoAnalyzeDaily: boolean;
    voiceGender: 'male' | 'female';
  };
  integrations: {
    whatsappEnabled: boolean;
    telegramEnabled: boolean;
    telegramBotToken?: string;
    telegramChatId?: string;
    aiProvider: AiProvider;
    backupFrequency: BackupFrequency;
    openaiKey?: string;
    deepseekKey?: string;
    gmailEnabled?: boolean;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'stock' | 'debt' | 'rate' | 'system' | 'reminder';
  priority: NotificationPriority;
  metadata?: any;
}

export enum NotificationPriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low'
}

export const APP_SIGNATURE = "SHUWAY_SMART_SYSTEM_V3";

export enum QatType {
  Burai = 'برعي',
  Bardoni = 'بردوني',
  Hamiri = 'حميري',
  Yafai = 'يافعي',
  Adani = 'عدني'
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  openingBalance?: number;
  openingBalanceCurrency?: Currency;
  openingBalanceDate?: string;
  openingBalanceNotes?: string;
}

export interface Sale {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  qatType: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: Currency;
  status: PaymentStatus;
  notes?: string;
  isReturn?: boolean;
  receiptUrl?: string;
}

export interface ExchangeRate {
  SAR: number;
  OMR: number;
  date: string;
}

export interface Debt {
  customerId: string;
  customerName: string;
  balances: Record<Currency | string, number>;
  lastActivityDate: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  currency: Currency;
  description: string;
  isRecurring?: boolean;
  frequency?: RecurrenceFrequency;
  receiptUrl?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  category: string;
  address?: string;
  openingBalance?: number;
  openingBalanceCurrency?: Currency;
  openingBalanceDate?: string;
  openingBalanceNotes?: string;
}

export interface Purchase {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  qatType: string;
  quantity: number;
  costPrice: number;
  totalCost: number;
  currency: Currency;
  status: PaymentStatus;
  notes?: string;
  isReturn?: boolean;
  receiptUrl?: string;
}

export interface SupplierDebt {
  supplierId: string;
  supplierName: string;
  balances: Record<Currency | string, number>;
  lastActivityDate: string;
}

export interface Voucher {
  id: string;
  date: string;
  entityId: string;
  entityName: string;
  entityType: 'customer' | 'supplier';
  amount: number;
  currency: Currency | string;
  type: VoucherType;
  notes?: string;
  receiptUrl?: string;
}

export interface DailyClosing {
  id?: string;
  date: string;
  expected_cash: number;
  actual_cash: number;
  difference: number;
  total_sales: number;
  total_expenses: number;
  is_finalized: boolean;
}

export const PAYMENT_TYPE_MARKER = "PAYMENT_MARKER";

export interface SocialSettings {
  whatsappEnabled: boolean;
  telegramEnabled: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  aiProvider: AiProvider;
  openaiKey?: string;
  deepseekKey?: string;
  gmailEnabled?: boolean;
  notifications?: {
    stockThreshold: number;
  };
}

export enum ExpenseCategory {
  Wastage = 'توالف وهالك'
}
