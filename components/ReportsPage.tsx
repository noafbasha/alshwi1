
import React, { useState, useMemo } from 'react';
import { useAgency } from '../context/AgencyContext';
import { useNotify } from '../context/NotificationContext';
import { Currency, QatType, AiProvider } from '../types';
import { askAi } from '../services/multiAiService';
import { useStats } from '../hooks/useStats';
import { getFinancialForecast } from '../services/geminiService';

type ReportTab = 'overview' | 'analytics' | 'debts' | 'profits' | 'predictions' | 'export';

// مكون المخطط البياني للنمو
const AreaChart = ({ data, color, height = 150 }: { data: number[], color: string, height?: number }) => {
  const max = Math.max(...data, 1) * 1.1;
  const width = 500;
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - (d / max) * height
  }));
  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaData} fill={`url(#grad-${color})`} />
      <path d={pathData} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} className="transition-all hover:r-5 cursor-pointer" />
      ))}
    </svg>
  );
};

// مكون مخطط الدائرة لتوزيع الأصناف
const DonutChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <svg viewBox="-1 -1 2 2" className="w-48 h-48 md:w-64 md:h-64 transform -rotate-90">
      {data.map((slice, i) => {
        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
        cumulativePercent += slice.value / total;
        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
        const largeArcFlag = slice.value / total > 0.5 ? 1 : 0;
        const pathData = [
          `M ${startX} ${startY}`,
          `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          `L 0 0`,
        ].join(' ');
        return <path key={i} d={pathData} fill={slice.color} className="hover:opacity-80 transition-opacity cursor-pointer" />;
      })}
      <circle cx="0" cy="0" r="0.6" fill="white" className="dark:fill-slate-900" />
    </svg>
  );
};

const ReportsPage: React.FC = () => {
  const { sales, purchases, expenses, rates, socialSettings, qatTypes, debts, appSettings } = useAgency();
  const { notify } = useNotify();
  const stats = useStats();
  
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [forecast, setForecast] = useState<string | null>(null);
  
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const convertToYer = (amount: number, currency: Currency | string) => {
    const val = amount || 0;
    if (currency === Currency.SAR) return val * (rates.SAR || 430);
    if (currency === Currency.OMR) return val * (rates.OMR || 425);
    return val;
  };

  const reportStats = useMemo(() => {
    const fSales = sales.filter(s => s.date >= dateRange.start && s.date <= dateRange.end + 'T23:59:59');
    const fPurchases = purchases.filter(p => p.date >= dateRange.start && p.date <= dateRange.end + 'T23:59:59');
    const fExpenses = expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end + 'T23:59:59');
    
    const grossSales = fSales.reduce((sum, s) => sum + (convertToYer(s.total, s.currency) * (s.isReturn ? -1 : 1)), 0);
    const costOfGoods = fPurchases.reduce((sum, p) => sum + (convertToYer(p.totalCost, p.currency) * (p.isReturn ? -1 : 1)), 0);
    const totalExpenses = fExpenses.reduce((sum, e) => sum + convertToYer(e.amount, e.currency), 0);
    
    const cashSales = fSales.filter(s => s.status === 'نقدي').reduce((sum, s) => sum + convertToYer(s.total, s.currency), 0);
    const collectionRate = grossSales > 0 ? (cashSales / grossSales) * 100 : 0;

    const qatPerformance = qatTypes.reduce((acc, type) => {
        const fItemsSales = fSales.filter(s => s.qatType === type);
        const qty = fItemsSales.reduce((sum, s) => sum + s.quantity, 0);
        const revenue = fItemsSales.reduce((sum, s) => sum + (convertToYer(s.total, s.currency) * (s.isReturn ? -1 : 1)), 0);
        const cost = fPurchases.filter(p => p.qatType === type).reduce((sum, p) => sum + (convertToYer(p.totalCost, p.currency) * (p.isReturn ? -1 : 1)), 0);
        acc[type] = { qty, revenue, cost, profit: revenue - cost };
        return acc;
    }, {} as Record<string, {qty: number, revenue: number, cost: number, profit: number}>);

    // توليد بيانات المخطط الزمني
    const dailyTrend = Array.from({ length: 15 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (14 - i));
      const ds = d.toISOString().split('T')[0];
      return sales.filter(s => s.date.startsWith(ds)).reduce((sum, s) => sum + convertToYer(s.total, s.currency), 0);
    });

    return { 
      grossSales, costOfGoods, totalExpenses,
      netProfit: grossSales - costOfGoods - totalExpenses, 
      collectionRate, qatPerformance, dailyTrend,
      totalCustomerDebt: debts.reduce((s, d) => s + (d.balances.YER + d.balances.SAR * rates.SAR + d.balances.OMR * rates.OMR), 0)
    };
  }, [sales, purchases, expenses, dateRange, rates, qatTypes, debts]);

  const handleFetchForecast = async () => {
    setIsAnalyzing(true);
    try {
      const result = await getFinancialForecast({
        salesTrend: stats.salesTrend,
        topProduct: stats.topProduct,
        totalCustomerDebt: reportStats.totalCustomerDebt
      });
      setForecast(result);
      notify('تم تحديث التوقعات المالية بنجاح 🔮', 'success');
    } catch (err) {
      notify('فشل الاتصال بمحرك التوقعات', 'error');
    } finally { setIsAnalyzing(false); }
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `بصفتك مستشار مالي، حلل البيانات: مبيعات ${reportStats.grossSales}، ربح ${reportStats.netProfit}، تحصيل ${reportStats.collectionRate}%. قدم 3 نصائح بلهجة يمنية.`;
      const result = await askAi({ prompt, settings: socialSettings });
      setAiAnalysis(result);
    } catch (err) { notify('فشل التحليل الذكي', 'error'); } 
    finally { setIsAnalyzing(false); }
  };

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in duration-500 pb-32 px-2 md:px-0">
      {/* Header Container */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto text-right">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-indigo-600 text-white rounded-2xl md:rounded-[2rem] flex items-center justify-center text-3xl md:text-5xl shadow-2xl">📈</div>
            <div>
              <h2 className="text-xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">مركز ذكاء الأعمال</h2>
              <p className="text-[10px] md:text-xl text-slate-400 font-bold">التحليلات المالية والنمو الاستراتيجي</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-2xl w-full xl:w-auto border dark:border-slate-700">
             <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl font-black text-xs md:text-lg dark:text-white outline-none border border-slate-200 dark:border-slate-700" />
             <span className="text-slate-400 font-black">➔</span>
             <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl font-black text-xs md:text-lg dark:text-white outline-none border border-slate-200 dark:border-slate-700" />
          </div>
        </div>
      </div>

      <nav className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[1.5rem] md:rounded-[2.5rem] shadow-lg overflow-x-auto no-scrollbar gap-1 border border-slate-100 dark:border-slate-800">
        <ReportTabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="نظرة عامة" icon="🏠" />
        <ReportTabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} label="تحليل الأصناف" icon="📊" />
        <ReportTabButton active={activeTab === 'predictions'} onClick={() => setActiveTab('predictions')} label="التوقعات" icon="🔮" />
        <ReportTabButton active={activeTab === 'export'} onClick={() => setActiveTab('export')} label="تصدير" icon="📥" />
      </nav>

      {activeTab === 'overview' && (
        <div className="space-y-6 md:space-y-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
             <ReportCard title="إجمالي المبيعات" value={reportStats.grossSales} color="text-emerald-600" icon="💰" bg="bg-emerald-50/50 dark:bg-emerald-950/20" trend="+14%" isPrivacy={appSettings.appearance.privacyMode} />
             <ReportCard title="تكلفة التوريد" value={reportStats.costOfGoods} color="text-rose-600" icon="🚛" bg="bg-rose-50/50 dark:bg-rose-950/20" trend="-2%" isPrivacy={appSettings.appearance.privacyMode} />
             <ReportCard title="المصاريف" value={reportStats.totalExpenses} color="text-amber-600" icon="💸" bg="bg-amber-50/50 dark:bg-amber-950/20" trend="+1%" isPrivacy={appSettings.appearance.privacyMode} />
             <ReportCard title="صافي الربح" value={reportStats.netProfit} color="text-indigo-600" icon="📈" bg="bg-indigo-50/50 dark:bg-indigo-950/20" trend="+8%" isPrivacy={appSettings.appearance.privacyMode} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Growth Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-[300px] md:h-[450px]">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg md:text-3xl font-black text-slate-800 dark:text-white">نمو المبيعات (15 يوم)</h3>
                    <p className="text-[10px] md:text-sm text-slate-400 font-bold">معدل التدفق النقدي اللحظي</p>
                  </div>
                  <div className="text-left">
                     <span className="text-xl md:text-3xl font-black text-emerald-600">{(reportStats.dailyTrend.reduce((s,v)=>s+v,0)/15).toFixed(0).toLocaleString()}</span>
                     <span className="text-[8px] md:text-xs block text-slate-400 font-bold">المتوسط اليومي</span>
                  </div>
               </div>
               <div className="flex-grow flex items-end">
                  <AreaChart data={reportStats.dailyTrend} color="#10b981" />
               </div>
               <div className="flex justify-between mt-4 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>قبل أسبوعين</span>
                  <span>اليوم</span>
               </div>
            </div>

            {/* Qat Mix Donut */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
               <h3 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white mb-6">توزع القوة البيعية</h3>
               <DonutChart data={Object.entries(reportStats.qatPerformance).map(([type, d], i) => ({
                 label: type,
                 value: d.qty,
                 color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]
               }))} />
               <div className="grid grid-cols-2 gap-3 mt-8 w-full">
                  {Object.entries(reportStats.qatPerformance).map(([type, d], i) => (
                    <div key={type} className="flex items-center gap-2 text-[9px] md:text-xs font-black text-slate-500">
                       <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] }}></span>
                       <span className="truncate">{type}: {((d.qty / (Object.values(reportStats.qatPerformance).reduce((s,v)=>s+v.qty,0)||1))*100).toFixed(0)}%</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden">
           <div className="overflow-x-auto p-4 md:p-8">
              <table className="excel-table w-full text-right">
                 <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                       <th className="p-4 border-l dark:border-slate-700">نوع القات</th>
                       <th className="p-4 border-l dark:border-slate-700 text-center">الكمية المباعة</th>
                       <th className="p-4 border-l dark:border-slate-700 text-center">الإيرادات</th>
                       <th className="p-4 border-l dark:border-slate-700 text-center">التكاليف</th>
                       <th className="p-4 text-center font-black text-emerald-600">صافي الربح</th>
                    </tr>
                 </thead>
                 <tbody>
                    {Object.entries(reportStats.qatPerformance).map(([type, data]: any) => (
                       <tr key={type} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-4 border-l dark:border-slate-700 font-black">{type}</td>
                          <td className="p-4 border-l dark:border-slate-700 text-center font-bold">{data.qty.toLocaleString()}</td>
                          <td className="p-4 border-l dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">{data.revenue.toLocaleString()}</td>
                          <td className="p-4 border-l dark:border-slate-700 text-center text-slate-400">{data.cost.toLocaleString()}</td>
                          <td className="p-4 text-center font-black text-emerald-600">{data.profit.toLocaleString()}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="bg-slate-900 p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-[8rem] md:text-[15rem] rotate-12">🔮</div>
           <div className="relative z-10 space-y-6 md:space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                 <div>
                    <h3 className="text-2xl md:text-6xl font-black tracking-tighter">التوقعات المستقبلية</h3>
                    <p className="text-sm md:text-2xl text-slate-400 font-bold mt-2">رؤية معززة بالذكاء الاصطناعي للأيام القادمة.</p>
                 </div>
                 <button onClick={handleFetchForecast} disabled={isAnalyzing} className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black text-sm md:text-xl shadow-xl active:scale-95 disabled:opacity-50 transition-all">توليد التوقع الذكي ✨</button>
              </div>
              {forecast && (
                 <div className="p-6 md:p-10 bg-white/5 rounded-[2rem] border border-white/10 animate-in zoom-in duration-500">
                    <p className="text-base md:text-2xl leading-relaxed whitespace-pre-wrap font-tajawal">{forecast}</p>
                 </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="bg-white dark:bg-slate-900 p-10 md:p-20 rounded-[2.5rem] md:rounded-[4rem] shadow-xl text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
           <div className="text-6xl md:text-8xl mb-8">📦</div>
           <h3 className="text-2xl md:text-5xl font-black mb-4">تصدير البيانات المالية</h3>
           <p className="text-sm md:text-2xl text-slate-500 font-bold mb-10 md:mb-16">احصل على نسخة شاملة من سجلاتك بصيغ جاهزة للمحاسبين.</p>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button className="bg-emerald-600 text-white p-6 md:p-10 rounded-3xl font-black text-lg md:text-2xl shadow-xl hover:scale-105 transition-all">📊 إكسل (Excel)</button>
              <button className="bg-slate-900 text-white p-6 md:p-10 rounded-3xl font-black text-lg md:text-2xl shadow-xl hover:scale-105 transition-all">📄 بي دي إف (PDF)</button>
           </div>
        </div>
      )}
    </div>
  );
};

const ReportTabButton = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 md:gap-3 px-4 py-3 md:py-5 rounded-xl md:rounded-[2rem] font-black text-[10px] md:text-lg transition-all whitespace-nowrap ${active ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
     <span className="text-lg md:text-2xl">{icon}</span> {label}
  </button>
);

const ReportCard = ({ title, value, color, bg, trend, icon, isPrivacy }: any) => (
  <div className={`${bg} p-5 md:p-10 rounded-2xl md:rounded-[3rem] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm transition-all text-right`}>
    <div className="flex justify-between items-start mb-4">
      <span className="text-xl md:text-4xl opacity-20">{icon}</span>
      <span className="text-emerald-500 font-black text-[8px] md:text-xs bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">{trend}</span>
    </div>
    <div className="text-slate-400 font-black text-[8px] md:text-sm uppercase tracking-widest mb-1">{title}</div>
    <div className={`text-xl md:text-4xl font-black ${color} truncate ${isPrivacy ? 'privacy-blur' : ''}`}>
      {value.toLocaleString()} <span className="text-[10px] md:text-sm font-normal opacity-50">ر.ي</span>
    </div>
  </div>
);

export default ReportsPage;
