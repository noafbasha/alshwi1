
import React, { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AgencyProvider, useAgency } from './context/AgencyContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import SalesPage from './components/SalesPage';
import PurchasesPage from './components/PurchasesPage';
import DebtsPage from './components/DebtsPage';
import SuppliersPage from './components/SuppliersPage';
import CustomersPage from './components/CustomersPage';
import ExpensesPage from './components/ExpensesPage';
import AiAssistant from './components/AiAssistant';
import SettingsPage from './components/SettingsPage';
import ReportsPage from './components/ReportsPage';
import ClosingPage from './components/ClosingPage';
import JournalPage from './components/JournalPage';
import InventoryPage from './components/InventoryPage';
import NotificationsCenter from './components/NotificationsCenter';
import Login from './components/Login';
import DeveloperPage from './components/DeveloperPage';
import ExchangePage from './components/ExchangePage';
import PinLock from './components/PinLock';

const GlobalLoader: React.FC = () => {
  const { isLoading } = useAgency();
  const [show, setShow] = useState(isLoading);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timer);
    } else {
      setShow(true);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[300] bg-white dark:bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-300 ${!isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
      <div className="mt-6 text-center">
        <p className="text-slate-400 font-bold text-sm tracking-widest animate-pulse">جاري تهيئة سجلات الوكالة...</p>
      </div>
    </div>
  );
};

const NavigationDock: React.FC = React.memo(() => {
  const location = useLocation();
  const { setIsAiOpen } = useAgency();
  
  const dockItems = useMemo(() => [
    { to: '/dashboard', icon: '🏠', label: 'الرئيسة' },
    { to: '/sales', icon: '💰', label: 'البيع' },
    { to: '/debts', icon: '👥', label: 'الديون' },
    { to: '/customers', icon: '📋', label: 'العملاء' },
    { to: '/expenses', icon: '💸', label: 'مصروف' },
  ], []);

  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/developer') return null;

  return (
    <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-4xl">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 px-2 md:px-10 py-3 md:py-6 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex items-center justify-between gap-0.5 transition-all">
        {dockItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <Link 
              key={item.to} 
              to={item.to} 
              className={`flex flex-col items-center flex-1 transition-all duration-300 group ${isActive ? 'scale-110 -translate-y-1.5' : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'}`}
            >
              <span className={`text-2xl md:text-4xl mb-1 transition-transform ${isActive ? 'drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]' : ''}`}>{item.icon}</span>
              <span className={`text-[10px] md:text-sm font-black uppercase tracking-tight text-center transition-all ${isActive ? 'text-emerald-600 dark:text-emerald-400 scale-105' : 'text-slate-500 dark:text-slate-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <button 
          onClick={() => setIsAiOpen(true)} 
          className="w-12 h-12 md:w-20 md:h-20 bg-emerald-600 hover:bg-emerald-50 text-white rounded-full flex items-center justify-center text-xl md:text-3xl shadow-xl shadow-emerald-600/30 animate-glow shrink-0 ml-2"
          title="المساعد الذكي"
        >🪄</button>
      </div>
    </div>
  );
});

const ProfileMenu: React.FC = () => {
  const { user, profile, appSettings, logout } = useAgency();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = useMemo(() => {
    return profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '👤';
  }, [profile?.full_name]);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 bg-slate-100 dark:bg-slate-800 rounded-xl md:rounded-2xl transition-all hover:bg-slate-200 dark:hover:bg-slate-700 group border border-transparent hover:border-emerald-500/20 shadow-sm"
      >
        <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-black text-sm md:text-lg shadow-inner group-hover:rotate-6 transition-transform">
          {initials}
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-[10px] md:text-xs font-black text-slate-800 dark:text-white leading-none mb-1">{profile?.full_name || 'مدير النظام'}</p>
          <div className="flex items-center gap-1">
             <p className="text-[8px] md:text-[9px] font-bold text-slate-400 truncate max-w-[60px]">{appSettings.agency.name || 'وكالة الشويع'}</p>
          </div>
        </div>
        <span className={`text-[8px] md:text-[10px] text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-56 md:w-64 bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-[110] animate-in zoom-in slide-in-from-top-2 duration-200 origin-top-left">
           <div className="p-4 border-b dark:border-slate-800 mb-2">
              <p className="text-sm font-black text-slate-800 dark:text-white">{profile?.full_name}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">{user?.email}</p>
           </div>
           <Link to="/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 w-full p-3 md:p-4 rounded-xl md:rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors">
              <span className="text-xl">⚙️</span> إعدادات الحساب
           </Link>
           <button onClick={logout} className="flex items-center gap-3 w-full p-3 md:p-4 rounded-xl md:rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 font-black transition-colors text-right">
              <span className="text-xl">🚪</span> تسجيل الخروج
           </button>
        </div>
      )}
    </div>
  );
};

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAgency();
  const hasCache = !!localStorage.getItem('agency_cache');

  if (isLoading && !hasCache) return <GlobalLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isAppLocked } = useAgency();
  const hasCache = !!localStorage.getItem('agency_cache');
  
  if (isLoading && !hasCache) return <GlobalLoader />;
  if (!user && !isLoading) return <Navigate to="/login" replace />;
  
  if (isAppLocked) return <PinLock />;
  
  return <>{children}</>;
};

const AppLayout: React.FC = () => {
  const { isAiOpen, notifications, appSettings, togglePrivacyMode, user, cloudStatus } = useAgency();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const toggleDarkMode = () => {
    const n = !isDarkMode;
    setIsDarkMode(n);
    if (n) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  };

  const isFullPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/developer';

  const cloudIndicator = useMemo(() => {
    switch(cloudStatus) {
      case 'connected': return { color: 'bg-emerald-500', text: 'مؤمن سحابياً' };
      case 'syncing': return { color: 'bg-blue-500 animate-pulse', text: 'جاري المزامنة...' };
      case 'offline': return { color: 'bg-amber-500 animate-pulse', text: 'يعمل أوفلاين' };
      case 'error': return { color: 'bg-red-500 animate-ping', text: 'خطأ في الربط' };
      default: return { color: 'bg-slate-400', text: 'غير معروف' };
    }
  }, [cloudStatus]);

  return (
    <div className={`min-h-screen flex flex-col bg-softBackground dark:bg-slate-950 font-['Tajawal'] transition-colors duration-300 relative overflow-x-hidden`}>
      <GlobalLoader />
      {!isFullPage && user && (
        <>
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b dark:border-slate-800 p-3 md:p-6 sticky top-0 z-50 transition-all">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <Link to="/dashboard" className="flex items-center gap-2 md:gap-4 group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-600 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-lg group-hover:scale-110 transition-transform relative">
                   🌿
                   <div className={`absolute -top-1 -right-1 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-2 border-white dark:border-slate-900 transition-colors ${cloudIndicator.color}`}></div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg md:text-xl font-black text-black dark:text-white leading-none">وكالة الشويع</h1>
                  <p className="text-[8px] md:text-[9px] font-bold text-green-600 uppercase tracking-widest mt-1">
                    {cloudIndicator.text}
                  </p>
                </div>
              </Link>
              
              <div className="flex gap-1.5 md:gap-2 items-center">
                <button onClick={togglePrivacyMode} className={`w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-lg transition-all ${appSettings.appearance.privacyMode ? 'bg-amber-100 text-amber-600 shadow-inner' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`} title="نمط الخصوصية">{appSettings.appearance.privacyMode ? '👁️‍ق' : '👁️'}</button>
                <button onClick={() => setIsNotifOpen(true)} className="relative w-9 h-9 md:w-10 md:h-10 bg-slate-100 dark:bg-slate-800 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-lg">🔔{unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] md:text-[9px] font-black w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">{unreadCount}</span>}</button>
                <button onClick={toggleDarkMode} className="w-9 h-9 md:w-10 md:h-10 bg-slate-100 dark:bg-slate-800 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-lg">{isDarkMode ? '☀️' : '🌙'}</button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <ProfileMenu />
              </div>
            </div>
          </header>

          <nav className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-[60px] md:top-[88px] z-40 border-b dark:border-slate-800 overflow-x-auto no-scrollbar">
            <div className="max-w-7xl mx-auto flex">
              <NavLink to="/inventory" label="🌿 المخازن" />
              <NavLink to="/purchases" label="📦 المشتريات" />
              <NavLink to="/suppliers" label="🚜 الموردين" />
              <NavLink to="/journal" label="📑 اليومية" />
              <NavLink to="/exchange" label="💱 العملات" />
              <NavLink to="/reports" label="📈 التقارير" />
              <NavLink to="/closing" label="🏁 الإغلاق" />
              <NavLink to="/settings" label="⚙️ الإعدادات" />
            </div>
          </nav>
        </>
      )}

      <main className={`flex-grow ${isFullPage ? '' : 'max-w-7xl mx-auto w-full p-3 md:p-4 mb-32 md:mb-40'}`}>
        <Suspense fallback={<div className="p-20 text-center font-black animate-pulse text-2xl">جاري المعالجة...</div>}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/developer" element={<DeveloperPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
            <Route path="/purchases" element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
            <Route path="/debts" element={<ProtectedRoute><DebtsPage /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute><SuppliersPage /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/closing" element={<ProtectedRoute><ClosingPage /></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
            <Route path="/exchange" element={<ProtectedRoute><ExchangePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </main>
      
      {!isFullPage && <NavigationDock />}
      {isAiOpen && <AiAssistant />}
      <NotificationsCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </div>
  );
};

const NavLink: React.FC<{ to: string; label: string }> = React.memo(({ to, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`px-4 md:px-6 py-4 md:py-5 text-lg md:text-2xl font-black transition-all border-b-2 whitespace-nowrap 
        ${isActive 
          ? 'text-emerald-700 dark:text-emerald-400 border-emerald-700 dark:border-emerald-400' 
          : 'text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-white'}`}
    >
      {label}
    </Link>
  );
});

const App: React.FC = () => {
  return (
    <HashRouter>
      <NotificationProvider>
          <AgencyProvider>
            <AppLayout />
          </AgencyProvider>
      </NotificationProvider>
    </HashRouter>
  );
};

export default App;
