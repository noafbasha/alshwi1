
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgency } from '../context/AgencyContext';
import { useStats } from '../hooks/useStats';
import { askBusinessAssistant } from '../services/geminiService';

const SalesChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data, 1000);
  const height = 60;
  const width = 300;
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - (d / max) * height
  }));
  
  const d = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaD = `${d} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width="100%" height="80" viewBox={`0 0 ${width} ${height}`} className="overflow-visible mt-4" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGradient)" />
      <path d={d} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#10b981" className="animate-pulse" />
      ))}
    </svg>
  );
};

const QuickActionButton = React.memo(({ label, icon, color, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`${color} text-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col items-center justify-center gap-2 md:gap-4 transition-all hover:scale-105 active:scale-95 shadow-xl group h-full`}
  >
    <span className="text-2xl md:text-5xl group-hover:rotate-12 transition-transform">{icon}</span>
    <span className="text-[10px] md:text-lg font-black whitespace-nowrap">{label}</span>
  </button>
));

const GlobalSearch: React.FC = () => {
  const { customers, suppliers, qatTypes } = useAgency();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  const appPages = [
    { name: 'المبيعات والبيع', path: '/sales', icon: '💰' },
    { name: 'المشتريات والتوريد', path: '/purchases', icon: '📦' },
    { name: 'الديون والتحصيل', path: '/debts', icon: '👥' },
    { name: 'إدارة العملاء', path: '/customers', icon: '📋' },
    { name: 'إدارة الموردين', path: '/suppliers', icon: '🚜' },
    { name: 'سجل اليومية العامة', path: '/journal', icon: '📑' },
    { name: 'أسعار الصرف والعملات', path: '/exchange', icon: '💱' },
    { name: 'المخزن والجرد', path: '/inventory', icon: '🌿' },
    { name: 'التقارير والإحصائيات', path: '/reports', icon: '📈' },
    { name: 'إغلاق الوردية', path: '/closing', icon: '🏁' },
    { name: 'الإعدادات والربط', path: '/settings', icon: '⚙️' },
  ];

  const results = useMemo(() => {
    if (!query.trim()) return { pages: [], customers: [], suppliers: [], items: [] };
    const q = query.toLowerCase();
    return {
      pages: appPages.filter(p => p.name.includes(q)),
      customers: customers.filter(c => c.name.includes(q)).slice(0, 5),
      suppliers: suppliers.filter(s => s.name.includes(q)).slice(0, 5),
      items: qatTypes.filter(t => t.includes(q))
    };
  }, [query, customers, suppliers, qatTypes]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (path: string, state?: any) => {
    navigate(path, { state });
    setQuery('');
    setIsOpen(false);
  };

  const hasResults = results.pages.length > 0 || results.customers.length > 0 || results.suppliers.length > 0 || results.items.length > 0;

  return (
    <div className="relative w-full max-w-4xl mx-auto z-[60]" ref={searchRef}>
      <div className={`flex items-center gap-4 p-2 md:p-3 bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border-2 transition-all duration-300 ${isOpen ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-100 dark:border-slate-800'}`}>
        <span className="text-2xl md:text-3xl mr-4 opacity-40">🔍</span>
        <input 
          type="text"
          placeholder="ابحث عن عميل، مورد، صنف، أو صفحة داخل النظام..."
          className="flex-grow bg-transparent outline-none font-black text-sm md:text-xl dark:text-white placeholder:opacity-30 placeholder:font-bold"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button onClick={() => setQuery('')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="text-slate-400">✕</span>
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="max-h-[70vh] overflow-y-auto no-scrollbar p-4 space-y-6">
            
            {/* Pages Section */}
            {results.pages.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">الصفحات والتبويبات</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {results.pages.map(p => (
                    <button key={p.path} onClick={() => handleSelect(p.path)} className="flex items-center gap-3 p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-2xl transition-all group text-right">
                       <span className="text-2xl group-hover:scale-125 transition-transform">{p.icon}</span>
                       <span className="font-black text-slate-700 dark:text-slate-200">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customers Section */}
            {results.customers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">العملاء</h4>
                <div className="space-y-1">
                  {results.customers.map(c => (
                    <button key={c.id} onClick={() => handleSelect('/customers', { customerId: c.id })} className="w-full flex justify-between items-center p-4 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-2xl transition-all text-right group">
                       <div className="flex items-center gap-3">
                          <span className="text-xl">👤</span>
                          <span className="font-black text-slate-700 dark:text-slate-200">{c.name}</span>
                       </div>
                       <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">عرض الحساب ➔</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suppliers Section */}
            {results.suppliers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">الموردين</h4>
                <div className="space-y-1">
                  {results.suppliers.map(s => (
                    <button key={s.id} onClick={() => handleSelect('/suppliers', { supplierId: s.id })} className="w-full flex justify-between items-center p-4 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-2xl transition-all text-right group">
                       <div className="flex items-center gap-3">
                          <span className="text-xl">🚜</span>
                          <span className="font-black text-slate-700 dark:text-slate-200">{s.name}</span>
                       </div>
                       <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">التزامات المورد ➔</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Items Section */}
            {results.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">الأصناف والمواد</h4>
                <div className="flex flex-wrap gap-2 px-2">
                  {results.items.map(t => (
                    <button key={t} onClick={() => handleSelect('/inventory')} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white rounded-xl font-black transition-all">
                       🌿 {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!hasResults && (
              <div className="p-12 text-center space-y-4">
                 <span className="text-6xl block">🔎</span>
                 <p className="font-black text-slate-400">عذراً مدير، لم أجد ما تبحث عنه..</p>
                 <button onClick={() => setQuery('')} className="text-emerald-600 font-black underline">عرض كافة السجلات</button>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-800 text-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">تلميح: يمكنك البحث عن أي شيء في الوكالة من هنا</p>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { appSettings } = useAgency();
  const stats = useStats();
  const navigate = useNavigate();
  const [marketInsight, setMarketInsight] = useState<string>("أهلاً بك يا مدير، اضغط للتحديث جاري تحليل أداء الوردية 🌿");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const isPrivacy = appSettings.appearance.privacyMode;

  const fetchInsight = useCallback(async () => {
    setIsAnalyzing(true);
    setMarketInsight("جاري تحليل البيانات اللحظية... 🔎");
    try {
      const prompt = `بصفتك مستشار مالي، حلل: مبيعات ${stats.todaySales} ر.ي، سيولة ${stats.liquidityRatio}%. قدم نصيحة تجارية ذكية لصاحب وكالة قات في اليمن.`;
      const result = await askBusinessAssistant(prompt, { stats });
      setMarketInsight(result.text);
    } catch (e) {
      setMarketInsight("المعذرة مدير، تعذر الاتصال بالمستشار.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [stats]);

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-20 px-2 md:px-0">
      
      {/* Global Search Header */}
      <section className="pt-4 md:pt-8 text-center space-y-6 md:space-y-10 relative">
         <div className="space-y-2">
            <h2 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">ماذا تريد أن تنجز اليوم؟</h2>
            <p className="text-slate-400 font-bold text-xs md:text-lg">استخدم محرك البحث الذكي للوصول لأي عميل أو بيان مالي</p>
         </div>
         <GlobalSearch />
      </section>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h3 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white px-2 flex items-center gap-2">
           <span className="w-2 h-8 bg-emerald-600 rounded-full"></span>
           الوصول السريع
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
           <QuickActionButton label="قبض مالي" icon="📥" color="bg-emerald-600 shadow-emerald-200" onClick={() => navigate('/customers', { state: { openVoucher: true, type: 'receipt' } })} />
           <QuickActionButton label="كشف عميل" icon="📋" color="bg-slate-800" onClick={() => navigate('/customers')} />
           <QuickActionButton label="صرف لمورد" icon="📤" color="bg-blue-600" onClick={() => navigate('/suppliers', { state: { openVoucher: true, type: 'payment' } })} />
           <QuickActionButton label="تسجيل مصروف" icon="🧾" color="bg-rose-600" onClick={() => navigate('/expenses', { state: { showAdd: true } })} />
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <div className="lg:col-span-2 relative overflow-hidden bg-slate-900 rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-12 text-white shadow-2xl group transition-all hover:bg-slate-950 border border-white/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-transparent"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between h-full gap-8">
            <div className="space-y-4 md:space-y-6 text-center md:text-right flex-1">
              <span className="bg-emerald-500/20 px-4 py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">Live Sales Pulse</span>
              <h2 className={`text-4xl md:text-8xl font-black tracking-tighter ${isPrivacy ? 'privacy-blur' : ''}`}>
                {stats.todaySales.toLocaleString()} <span className="text-sm md:text-2xl font-normal opacity-50 italic">ر.ي</span>
              </h2>
              <p className="text-xs md:text-xl text-slate-400 font-bold">إجمالي مبيعات وردية اليوم</p>
              <div className="pt-2 md:pt-6">
                <SalesChart data={stats.salesTrend} />
                <div className="flex justify-between text-[8px] md:text-[10px] font-black text-slate-500 uppercase mt-4 tracking-[0.2em]">
                   <span>قبل أسبوع</span>
                   <span>اليوم الحالي</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between items-center lg:items-end gap-6">
              <div className="bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 text-center w-full lg:w-56 shadow-inner">
                 <div className="text-[8px] md:text-[10px] font-black opacity-50 uppercase mb-3 tracking-widest">الأكثر طلباً اليوم</div>
                 <div className="text-2xl md:text-5xl mb-2">🌿</div>
                 <div className="text-lg md:text-2xl font-black text-green-400 truncate px-2">{stats.topProduct.name}</div>
                 <div className={`text-[10px] md:text-sm font-bold opacity-60 mt-1 ${isPrivacy ? 'privacy-blur' : ''}`}>{stats.topProduct.qty} حزمة مباعة</div>
              </div>
              <button onClick={() => navigate('/sales')} className="bg-emerald-600 hover:bg-emerald-500 text-white w-full lg:w-auto px-10 py-5 rounded-2xl font-black shadow-2xl transition-all active:scale-95 text-base md:text-xl flex items-center justify-center gap-3">
                 <span>💰</span> سجل مبيع جديد
              </button>
            </div>
          </div>
        </div>

        {/* Liquidity/Efficiency Widget */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-6 md:space-y-8 relative overflow-hidden transition-all hover:border-emerald-500/30">
           <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
           <div className="relative w-32 h-32 md:w-48 md:h-48">
              <svg className="w-full h-full transform -rotate-90">
                 <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800 lg:hidden" />
                 <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-800 hidden lg:block" />
                 
                 <circle cx="50%" cy="50%" r="40%" stroke="#10b981" strokeWidth="8" fill="transparent" strokeDasharray="251.2%" strokeDashoffset={`${251.2 - (251.2 * stats.liquidityRatio / 100)}%`} strokeLinecap="round" className="transition-all duration-1000 lg:hidden" />
                 <circle cx="50%" cy="50%" r="40%" stroke="#10b981" strokeWidth="12" fill="transparent" strokeDasharray="251.2%" strokeDashoffset={`${251.2 - (251.2 * stats.liquidityRatio / 100)}%`} strokeLinecap="round" className="transition-all duration-1000 hidden lg:block" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white leading-none">{stats.liquidityRatio.toFixed(0)}%</span>
              </div>
           </div>
           <div>
              <h4 className="text-lg md:text-3xl font-black dark:text-white">كفاءة التحصيل</h4>
              <p className="text-slate-500 font-bold max-w-xs mx-auto text-[10px] md:text-sm mt-2 leading-relaxed">المعدل اللحظي لتحويل الديون إلى نقد في الصندوق.</p>
           </div>
           <div className="w-full pt-6 border-t dark:border-slate-800 flex justify-around">
              <div className="text-center">
                 <div className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ديون عملاء</div>
                 <div className={`text-xs md:text-xl font-black text-rose-600 ${isPrivacy ? 'privacy-blur' : ''}`}>{stats.totalCustomerDebt.toLocaleString()}</div>
              </div>
              <div className="text-center">
                 <div className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ديون موردين</div>
                 <div className={`text-xs md:text-xl font-black text-amber-600 ${isPrivacy ? 'privacy-blur' : ''}`}>{stats.totalSupplierDebt.toLocaleString()}</div>
              </div>
           </div>
        </div>
      </div>

      {/* AI Intelligence Strip */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-700 p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl text-white flex flex-col md:flex-row items-center gap-6 md:gap-12 relative overflow-hidden group border-2 border-white/10">
        <div className="absolute -right-10 -bottom-10 text-[8rem] md:text-[15rem] opacity-10 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">🧠</div>
        <div className="w-16 h-16 md:w-32 md:h-32 bg-white/20 backdrop-blur-2xl rounded-[1.5rem] md:rounded-[3rem] flex items-center justify-center text-3xl md:text-7xl shadow-2xl shrink-0 animate-glow border border-white/30">
          {isAnalyzing ? "⌛" : "✨"}
        </div>
        <div className="flex-grow space-y-3 md:space-y-5 relative z-10 text-center md:text-right">
           <div className="flex items-center justify-center md:justify-start gap-4">
              <span className="bg-white/10 px-4 py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] border border-white/10">AI Smart Insight</span>
           </div>
           <p className="text-base md:text-3xl font-black leading-snug tracking-tight">{marketInsight}</p>
           <button onClick={fetchInsight} disabled={isAnalyzing} className="text-[10px] md:text-sm font-black bg-white text-indigo-700 px-6 md:px-10 py-2 md:py-3 rounded-full uppercase tracking-widest hover:scale-105 transition-all shadow-xl disabled:opacity-50 active:scale-95">تحديث التحليل الذكي ↺</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
