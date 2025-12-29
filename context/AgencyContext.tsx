
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, getSafeErrorMessage, uploadReceipt } from '../supabase';
import { useNotify } from './NotificationContext';
import { 
  Customer, Sale, ExchangeRate, Debt, PaymentStatus, Expense, 
  Supplier, Purchase, SupplierDebt, AppSettings,
  Currency, AppNotification, Voucher, VoucherType, DailyClosing, NotificationPriority, AiProvider, BackupFrequency, UserRole, AuditLog, AiDialect,
  APP_SIGNATURE, SocialSettings
} from '../types';

interface UserProfile { id: string; full_name: string; agency_name: string; settings?: AppSettings; role?: UserRole; email?: string; }

interface AgencyContextType {
  customers: Customer[]; suppliers: Supplier[]; sales: Sale[]; purchases: Purchase[]; vouchers: Voucher[]; expenses: Expense[];
  expenseCategories: string[]; qatTypes: string[]; rates: ExchangeRate; rateHistory: ExchangeRate[]; debts: Debt[]; supplierDebts: SupplierDebt[];
  inventory: Record<string, number>; user: any; setUser: (user: any) => void; profile: UserProfile | null;
  isLoading: boolean; isCloudSyncing: boolean; cloudStatus: 'connected' | 'syncing' | 'offline' | 'error';
  addSale: (sale: Sale, file?: File) => Promise<void>; deleteSale: (id: string) => Promise<void>;
  addPurchase: (purchase: Purchase, file?: File) => Promise<void>; deletePurchase: (id: string) => Promise<void>;
  addExpense: (expense: Expense, file?: File) => Promise<void>; deleteExpense: (id: string) => Promise<void>;
  recordVoucher: (entityId: string, entityType: 'customer' | 'supplier', amount: number, type: 'payment' | 'receipt', currency: Currency | string, notes?: string, file?: File) => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>; updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>; deleteCustomer: (id: string) => Promise<void>;
  addSupplier: (supplier: Supplier) => Promise<void>; updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>; deleteSupplier: (id: string) => Promise<void>;
  addQatType: (name: string) => Promise<void>; deleteQatType: (name: string) => Promise<void>;
  updateRates: (rates: ExchangeRate) => Promise<void>; updateAppSettings: (settings: AppSettings) => Promise<void>;
  logout: () => void; isAiOpen: boolean; setIsAiOpen: (open: boolean) => void;
  notifications: AppNotification[]; markNotificationAsRead: (id: string) => Promise<void>;
  exportData: () => void; importData: (json: string) => Promise<void>; resetSystem: () => Promise<void>;
  appSettings: AppSettings;
  team: UserProfile[];
  auditLogs: AuditLog[];
  can: (action: string) => boolean;
  logActivity: (action: string, details: string) => Promise<void>;
  socialSettings: SocialSettings;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  deleteVoucher: (id: string) => Promise<void>;
  deleteExpenseCategory: (name: string) => Promise<void>;
  addExpenseCategory: (name: string) => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  isAppLocked: boolean;
  lockApp: () => void;
  unlockApp: (pin: string) => boolean;
  togglePrivacyMode: () => void;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export const DEFAULT_APP_SETTINGS: AppSettings = {
  agency: { name: 'وكالة الشويع للقات', phone: '', address: '', managerName: '', headerText: 'فاتورة رسمية معتمدة', footerText: 'شكراً لثقتكم بنا' },
  sales: { defaultCurrency: Currency.YER, autoThermalPrint: true, roundingEnabled: true, allowReturns: true, taxEnabled: false, taxRate: 0, showEmployeeName: true },
  inventory: { lowStockThreshold: 5, autoUpdateOnPurchase: true, allowNegativeStock: false, categoryDefaults: 'برعي, بردوني' },
  debts: { defaultCreditLimit: 500000, agingDaysRed: 30, agingDaysAmber: 15, autoReminderEnabled: true, autoReminderThreshold: 100000 },
  appearance: { theme: 'system', privacyMode: false, fontSize: 'medium', compactTable: false },
  security: { appLockEnabled: false, appLockPin: '', autoLockOnExit: true },
  ai: { dialect: AiDialect.Sanaani, autoAnalyzeDaily: true, voiceGender: 'male' },
  integrations: { whatsappEnabled: true, telegramEnabled: false, aiProvider: AiProvider.Gemini, backupFrequency: BackupFrequency.None }
};

export const AgencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notify } = useNotify();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'syncing' | 'offline' | 'error'>('connected');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [qatTypes, setQatTypes] = useState<string[]>([]);
  const [rates, setRates] = useState<ExchangeRate>({ SAR: 430, OMR: 425, date: new Date().toLocaleDateString('en-CA') });
  const [rateHistory, setRateHistory] = useState<ExchangeRate[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [team, setTeam] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isAppLocked, setIsAppLocked] = useState(false);

  const socialSettings: SocialSettings = useMemo(() => ({
    ...appSettings.integrations,
    notifications: {
      stockThreshold: appSettings.inventory.lowStockThreshold
    }
  }), [appSettings.integrations, appSettings.inventory.lowStockThreshold]);

  const lockApp = useCallback(() => setIsAppLocked(true), []);
  
  const unlockApp = useCallback((pin: string) => {
    if (!appSettings.security.appLockEnabled || pin === appSettings.security.appLockPin) {
      setIsAppLocked(false);
      return true;
    }
    return false;
  }, [appSettings.security]);

  const togglePrivacyMode = useCallback(() => {
    const newSettings = { 
      ...appSettings, 
      appearance: { ...appSettings.appearance, privacyMode: !appSettings.appearance.privacyMode } 
    };
    updateAppSettings(newSettings);
  }, [appSettings]);

  const logActivity = async (action: string, details: string) => {
    if (!user) return;
    try {
      const log: any = { user_id: user.id, user_name: profile?.full_name || user.email, action, details };
      await supabase.from('audit_logs').insert([log]);
      setAuditLogs(prev => [{ id: Math.random().toString(), userId: user.id, userName: profile?.full_name || 'System', action, details, timestamp: new Date().toISOString() }, ...prev].slice(0, 100));
    } catch (e) {}
  };

  const can = (action: string) => {
    if (!profile) return false;
    if (profile.role === UserRole.Admin) return true;
    if (action === 'view_reports' && profile.role === UserRole.Accountant) return true;
    if (action === 'make_sale') return true;
    return false;
  };

  const inventory = useMemo(() => {
    return qatTypes.reduce((acc, type) => {
      const tin = purchases.filter(p => p.qatType === type && !p.isReturn).reduce((s, p) => s + (p.quantity || 0), 0) +
                  sales.filter(s => s.qatType === type && s.isReturn).reduce((s, s1) => s + (s1.quantity || 0), 0);
      const tout = sales.filter(s => s.qatType === type && !s.isReturn).reduce((s, s1) => s + (s1.quantity || 0), 0) +
                   purchases.filter(p => p.qatType === type && p.isReturn).reduce((s, p) => s + (p.quantity || 0), 0);
      acc[type] = Math.max(0, tin - tout);
      return acc;
    }, {} as Record<string, number>);
  }, [qatTypes, purchases, sales]);

  const debts = useMemo(() => {
    return customers.map(c => {
      const cSales = sales.filter(s => s.customerId === c.id && s.status === PaymentStatus.Credit);
      const cVouchers = vouchers.filter(v => v.entityId === c.id && v.entityType === 'customer');
      const balances: Record<string, number> = { YER: (c.openingBalanceCurrency === Currency.YER ? c.openingBalance || 0 : 0), SAR: (c.openingBalanceCurrency === Currency.SAR ? c.openingBalance || 0 : 0), OMR: (c.openingBalanceCurrency === Currency.OMR ? c.openingBalance || 0 : 0) };
      cSales.forEach(s => { const m = s.isReturn ? -1 : 1; balances[s.currency] = (balances[s.currency] || 0) + (s.total * m); });
      cVouchers.forEach(v => { const m = v.type === VoucherType.Receipt ? -1 : 1; balances[v.currency] = (balances[v.currency] || 0) + (v.amount * m); });
      return { customerId: c.id, customerName: c.name, balances, lastActivityDate: c.openingBalanceDate || new Date().toISOString() };
    });
  }, [customers, sales, vouchers]);

  const supplierDebts = useMemo(() => {
    return suppliers.map(s => {
      const sPurchases = purchases.filter(p => p.supplierId === s.id && p.status === PaymentStatus.Credit);
      const sVouchers = vouchers.filter(v => v.entityId === s.id && v.entityType === 'supplier');
      const balances: Record<string, number> = { YER: (s.openingBalanceCurrency === Currency.YER ? s.openingBalance || 0 : 0), SAR: (s.openingBalanceCurrency === Currency.SAR ? s.openingBalance || 0 : 0), OMR: (s.openingBalanceCurrency === Currency.OMR ? s.openingBalance || 0 : 0) };
      sPurchases.forEach(p => { const m = p.isReturn ? -1 : 1; balances[p.currency] = (balances[p.currency] || 0) + (p.totalCost * m); });
      sVouchers.forEach(v => { const m = v.type === VoucherType.Payment ? -1 : 1; balances[v.currency] = (balances[v.currency] || 0) + (v.amount * m); });
      return { supplierId: s.id, supplierName: s.name, balances, lastActivityDate: s.openingBalanceDate || new Date().toISOString() };
    });
  }, [suppliers, purchases, vouchers]);

  const fetchData = useCallback(async (userId: string, isSilent = false) => {
    if (!userId) return;
    if (!isSilent) { setIsCloudSyncing(true); setCloudStatus('syncing'); }
    try {
      const [
        {data: cust}, {data: supp}, {data: sls}, {data: pur}, {data: vch}, {data: exp}, {data: exr}, {data: prof}, {data: qat}, {data: excat}, {data: notif}, {data: teamMembers}, {data: logs}
      ] = await Promise.all([
        supabase.from('customers').select('*').eq('user_id', userId).order('name'),
        supabase.from('suppliers').select('*').eq('user_id', userId).order('name'),
        supabase.from('sales').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),
        supabase.from('purchases').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),
        supabase.from('vouchers').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('exchange_rates').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('qat_types').select('name').eq('user_id', userId),
        supabase.from('expense_categories').select('name').eq('user_id', userId),
        supabase.from('app_notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('*').eq('agency_name', appSettings.agency.name).limit(50),
        supabase.from('audit_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
      ]);
      
      if (cust) setCustomers(cust.map((c:any) => ({...c, openingBalance: c.opening_balance, openingBalanceDate: c.opening_balance_date, openingBalanceCurrency: c.opening_balance_currency || Currency.YER, openingBalanceNotes: c.opening_balance_notes})));
      if (supp) setSuppliers(supp.map((s:any) => ({...s, openingBalance: s.opening_balance, openingBalanceDate: s.opening_balance_date, openingBalanceCurrency: s.opening_balance_currency || Currency.YER, openingBalanceNotes: s.opening_balance_notes})));
      if (sls) setSales(sls.map((i:any) => ({ ...i, id:i.id, date:i.created_at, quantity: Number(i.quantity), unitPrice:Number(i.unit_price), total:Number(i.total), customerName:i.customer_name, customerId:i.customer_id, qatType:i.qat_type, isReturn:i.is_return, receiptUrl: i.receipt_url })));
      if (pur) setPurchases(pur.map((i:any) => ({ ...i, id:i.id, date:i.created_at, supplierName:i.supplier_name, supplierId:i.supplier_id, qat_type:i.qat_type, quantity: Number(i.quantity), costPrice:Number(i.cost_price), totalCost:Number(i.total_cost), isReturn:i.is_return, receiptUrl: i.receipt_url })));
      if (vch) setVouchers(vch.map((i:any) => ({...i, id:i.id, date:i.created_at, entityId:i.entity_id, entityName:i.entity_name, entityType:i.entity_type, amount:Number(i.amount), receiptUrl: i.receipt_url})));
      if (exp) setExpenses(exp.map((i:any) => ({...i, id:i.id, date:i.created_at, amount:Number(i.amount), receiptUrl: i.receipt_url})));
      if (exr && exr.length) { const h = exr.map((r:any) => ({ SAR: Number(r.sar_rate), OMR: Number(r.omr_rate), date: new Date(r.created_at).toLocaleDateString('en-CA') })); setRateHistory(h); setRates(h[0]); }
      if (prof) { setProfile(prof); if (prof.settings) setAppSettings({...DEFAULT_APP_SETTINGS, ...prof.settings}); }
      if (qat) setQatTypes(qat.map((q:any) => q.name));
      if (excat) setExpenseCategories(excat.map((e:any) => e.name));
      if (notif) setNotifications(notif.map((n:any) => ({ id: n.id, title: n.title, message: n.message, timestamp: n.created_at, isRead: n.is_read, type: n.type, priority: n.priority, metadata: n.metadata })));
      if (teamMembers) setTeam(teamMembers);
      if (logs) setAuditLogs(logs.map((l:any) => ({ id: l.id, userId: l.user_id, userName: l.user_name, action: l.action, details: l.details, timestamp: l.created_at })));
      
      setCloudStatus('connected');
    } catch (e) { setCloudStatus('error'); } 
    finally { setIsCloudSyncing(false); setIsLoading(false); }
  }, [appSettings.agency.name]);

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) { setUser(session.user); fetchData(session.user.id); } 
      else { setUser(null); setProfile(null); setIsLoading(false); }
    });
  }, [fetchData]);

  const updateAppSettings = async (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    if (user) {
      setIsCloudSyncing(true);
      try {
        const { error } = await supabase.from('profiles').update({ settings: newSettings }).eq('id', user.id);
        if (error) throw error;
        await logActivity('تحديث الإعدادات', 'تم تغيير تفضيلات المنظومة');
        setCloudStatus('connected');
      } catch (e) { setCloudStatus('error'); throw e; } 
      finally { setIsCloudSyncing(false); }
    }
  };

  const addSale = async (sale: Sale, file?: File) => {
    if (!user) return;
    try {
      setIsCloudSyncing(true);
      let receiptUrl;
      if (file) receiptUrl = await uploadReceipt(user.id, file, 'sales');
      const { error } = await supabase.from('sales').insert([{ user_id: user.id, customer_name: sale.customerName, customer_id: sale.customerId || null, qat_type: sale.qatType, quantity: sale.quantity, unit_price: sale.unitPrice, total: sale.total, currency: sale.currency, status: sale.status, is_return: sale.isReturn, receipt_url: receiptUrl || null }]);
      if (error) throw error;
      await logActivity('عملية بيع', `بيع ${sale.quantity} ${sale.qatType} للعميل ${sale.customerName}`);
      fetchData(user.id, true);
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); } 
    finally { setIsCloudSyncing(false); }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const { error } = await supabase.from('customers').update({
        name: updates.name,
        phone: updates.phone,
        address: updates.address,
        opening_balance: updates.openingBalance,
        opening_balance_currency: updates.openingBalanceCurrency,
        opening_balance_date: updates.openingBalanceDate,
        opening_balance_notes: updates.openingBalanceNotes
      }).eq('id', id);
      if (error) throw error;
      fetchData(user.id, true);
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      fetchData(user.id, true);
      notify('تم حذف العميل', 'success');
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const addSupplier = async (supplier: Supplier) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('suppliers').insert([{
        user_id: user.id,
        name: supplier.name,
        phone: supplier.phone,
        category: supplier.category,
        opening_balance: supplier.openingBalance || 0,
        opening_balance_currency: Currency.YER,
        opening_balance_date: supplier.openingBalanceDate || new Date().toISOString()
      }]);
      if (error) throw error;
      fetchData(user.id, true);
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      const { error } = await supabase.from('suppliers').update({
        name: updates.name,
        phone: updates.phone,
        category: updates.category,
        opening_balance: updates.openingBalance,
        opening_balance_currency: updates.opening_balance_currency,
        opening_balance_date: updates.openingBalanceDate
      }).eq('id', id);
      if (error) throw error;
      fetchData(user.id, true);
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
      fetchData(user.id, true);
      notify('تم حذف المورد', 'success');
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const addQatType = async (name: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('qat_types').insert([{ user_id: user.id, name }]);
      if (error) throw error;
      fetchData(user.id, true);
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const deleteQatType = async (name: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('qat_types').delete().eq('user_id', user.id).eq('name', name);
      if (error) throw error;
      fetchData(user.id, true);
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const updateRates = async (newRates: ExchangeRate) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('exchange_rates').insert([{
        user_id: user.id,
        sar_rate: newRates.SAR,
        omr_rate: newRates.OMR
      }]);
      if (error) throw error;
      await logActivity('تحديث الصرف', `سعر جديد: SAR=${newRates.SAR}, OMR=${newRates.OMR}`);
      fetchData(user.id, true);
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const recordVoucher = async (entityId: string, entityType: 'customer' | 'supplier', amount: number, type: 'payment' | 'receipt', currency: Currency | string, notes?: string, file?: File) => {
    if (!user) return;
    try {
      setIsCloudSyncing(true);
      let receiptUrl;
      if (file) receiptUrl = await uploadReceipt(user.id, file, 'vouchers');
      
      const entity = entityType === 'customer' 
        ? customers.find(c => c.id === entityId)
        : suppliers.find(s => s.id === entityId);

      const { error } = await supabase.from('vouchers').insert([{
        user_id: user.id,
        entity_id: entityId,
        entity_type: entityType,
        entity_name: entity?.name || 'غير معروف',
        amount,
        type: type === 'receipt' ? VoucherType.Receipt : VoucherType.Payment,
        currency,
        notes,
        receipt_url: receiptUrl || null
      }]);
      if (error) throw error;
      await logActivity('سند مالي', `سند ${type} بمبلغ ${amount} ${currency} لـ ${entity?.name}`);
      fetchData(user.id, true);
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
    finally { setIsCloudSyncing(false); }
  };

  const deleteVoucher = async (id: string) => {
    try {
      const { error } = await supabase.from('vouchers').delete().eq('id', id);
      if (error) throw error;
      fetchData(user.id, true);
      notify('تم حذف السند', 'success');
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const addExpense = async (expense: Expense, file?: File) => {
    if (!user) return;
    try {
      setIsCloudSyncing(true);
      let receiptUrl;
      if (file) receiptUrl = await uploadReceipt(user.id, file, 'expenses');
      const { error } = await supabase.from('expenses').insert([{
        user_id: user.id,
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency,
        description: expense.description,
        is_recurring: expense.isRecurring,
        frequency: expense.frequency,
        receipt_url: receiptUrl || null
      }]);
      if (error) throw error;
      fetchData(user.id, true);
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
    finally { setIsCloudSyncing(false); }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      fetchData(user.id, true);
      notify('تم حذف المصروف', 'success');
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const addPurchase = async (purchase: Purchase, file?: File) => {
    if (!user) return;
    try {
      setIsCloudSyncing(true);
      let receiptUrl;
      if (file) receiptUrl = await uploadReceipt(user.id, file, 'purchases');
      const { error } = await supabase.from('purchases').insert([{
        user_id: user.id,
        supplier_id: purchase.supplierId,
        supplier_name: purchase.supplierName,
        qat_type: purchase.qatType,
        quantity: purchase.quantity,
        cost_price: purchase.costPrice,
        total_cost: purchase.totalCost,
        currency: purchase.currency,
        status: purchase.status,
        is_return: purchase.isReturn,
        receipt_url: receiptUrl || null
      }]);
      if (error) throw error;
      fetchData(user.id, true);
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
    finally { setIsCloudSyncing(false); }
  };

  const deletePurchase = async (id: string) => {
    try {
      const { error } = await supabase.from('purchases').delete().eq('id', id);
      if (error) throw error;
      fetchData(user.id, true);
      notify('تم حذف التوريد', 'success');
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await supabase.from('app_notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {}
  };

  const removeNotification = async (id: string) => {
    try {
      await supabase.from('app_notifications').delete().eq('id', id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {}
  };

  const clearNotifications = async () => {
    if (!user) return;
    try {
      await supabase.from('app_notifications').delete().eq('user_id', user.id);
      setNotifications([]);
    } catch (e) {}
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
      if (error) throw error;
      fetchData(user.id, true);
      notify('تم تحديث صلاحية الموظف', 'success');
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const addExpenseCategory = async (name: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('expense_categories').insert([{ user_id: user.id, name }]);
      if (error) throw error;
      fetchData(user.id, true);
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const deleteExpenseCategory = async (name: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('expense_categories').delete().eq('user_id', user.id).eq('name', name);
      if (error) throw error;
      fetchData(user.id, true);
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const addCustomer = async (customer: Customer) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('customers').insert([{ user_id: user.id, name: customer.name, phone: customer.phone, opening_balance: customer.openingBalance || 0, opening_balance_currency: customer.openingBalanceCurrency || Currency.YER, opening_balance_date: customer.openingBalanceDate || new Date().toISOString(), opening_balance_notes: customer.openingBalanceNotes || '' }]);
      if (error) throw error;
      await logActivity('إضافة عميل', `إضافة العميل الجديد: ${customer.name}`);
      fetchData(user.id, true);
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  const deleteSale = async (id: string) => { 
    try { 
      const { error } = await supabase.from('sales').delete().eq('id', id); 
      if (error) throw error; 
      await logActivity('حذف مبيع', `حذف العملية رقم ${id}`);
      fetchData(user.id, true); 
      notify('تم حذف عملية البيع', 'success'); 
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); } 
  };

  const exportData = useCallback(() => {
    const data = {
      signature: APP_SIGNATURE,
      version: '3.1',
      exportedAt: new Date().toISOString(),
      data: { customers, suppliers, sales, purchases, vouchers, expenses, qatTypes, appSettings, rates }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shuway_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    notify('تم تصدير نسخة احتياطية بنجاح', 'success');
  }, [customers, suppliers, sales, purchases, vouchers, expenses, qatTypes, appSettings, rates]);

  const resetSystem = async () => {
    if (!user) return;
    if (!window.confirm('سيتم حذف كافة البيانات! هل أنت متأكد؟')) return;
    try {
      await Promise.all([
        supabase.from('sales').delete().eq('user_id', user.id),
        supabase.from('purchases').delete().eq('user_id', user.id),
        supabase.from('vouchers').delete().eq('user_id', user.id),
        supabase.from('expenses').delete().eq('user_id', user.id),
        supabase.from('customers').delete().eq('user_id', user.id),
        supabase.from('suppliers').delete().eq('user_id', user.id)
      ]);
      fetchData(user.id, true);
      notify('تم تصفير النظام بنجاح', 'success');
    } catch (err) { notify(getSafeErrorMessage(err), 'error'); }
  };

  useEffect(() => {
    if (user && appSettings.security.appLockEnabled) {
      lockApp();
    }
  }, [user, appSettings.security.appLockEnabled, lockApp]);

  return (
    <AgencyContext.Provider value={{ 
      customers, suppliers, sales, purchases, vouchers, expenses, expenseCategories, qatTypes, rates, rateHistory, debts, supplierDebts, inventory,
      user, setUser, profile, isLoading, isCloudSyncing, cloudStatus, addSale, deleteSale, addPurchase, deletePurchase, addExpense, deleteExpense,
      recordVoucher, addCustomer, updateCustomer, deleteCustomer, addSupplier, updateSupplier, deleteSupplier, addQatType, deleteQatType,
      updateRates, updateAppSettings, appSettings, logout: () => { supabase.auth.signOut(); setUser(null); }, isAiOpen, setIsAiOpen, 
      notifications, markNotificationAsRead, removeNotification, clearNotifications, exportData, importData: async()=>{}, resetSystem,
      team, auditLogs, can, logActivity, socialSettings, updateUserRole, deleteVoucher, deleteExpenseCategory, addExpenseCategory,
      isAppLocked, lockApp, unlockApp, togglePrivacyMode
    }}>
      {children}
    </AgencyContext.Provider>
  );
};

export const useAgency = () => useContext(AgencyContext)!;
