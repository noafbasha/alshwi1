
import React, { useState, useEffect } from 'react';
import { useAgency } from '../context/AgencyContext';
import { useNotify } from '../context/NotificationContext';

const ExchangePage: React.FC = () => {
  const { rates, rateHistory, updateRates } = useAgency();
  const { notify } = useNotify();
  
  const [formData, setFormData] = useState({ 
    SAR: rates?.SAR || 0, 
    OMR: rates?.OMR || 0 
  });

  const [calc, setCalc] = useState({
    yerAmount: 0,
    resultSAR: 0,
    resultOMR: 0
  });

  useEffect(() => {
    if (rates) {
      setFormData({ SAR: rates.SAR, OMR: rates.OMR });
    }
  }, [rates]);

  useEffect(() => {
    if (rates) {
      setCalc(prev => ({
        ...prev,
        resultSAR: prev.yerAmount / rates.SAR,
        resultOMR: prev.yerAmount / rates.OMR
      }));
    }
  }, [calc.yerAmount, rates]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateRates({
      ...formData,
      date: new Date().toLocaleDateString('en-CA')
    });
    notify('تم تحديث أسعار الصرف بنجاح 💱', 'success');
  };

  const getPriceTrend = (index: number, type: 'SAR' | 'OMR') => {
    if (index >= rateHistory.length - 1) return null;
    const current = rateHistory[index][type];
    const previous = rateHistory[index + 1][type];
    if (current > previous) return <span className="text-green-500 text-[8px] md:text-xs">▲</span>;
    if (current < previous) return <span className="text-red-500 text-[8px] md:text-xs">▼</span>;
    return <span className="text-slate-300 text-[8px] md:text-xs">▬</span>;
  };

  if (!rates) return <div className="p-20 text-center font-bold dark:text-slate-400">جاري تحميل البيانات...</div>;

  return (
    <div className="space-y-6 md:space-y-12 animate-in slide-in-from-top duration-500 max-w-7xl mx-auto pb-32 px-2 md:px-0">
      <div className="text-center space-y-2 md:space-y-4 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <h2 className="text-2xl md:text-5xl font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-4 transition-colors">
            <span className="text-3xl md:text-6xl">💱</span> إدارة أسعار الصرف
        </h2>
        <p className="text-sm md:text-2xl text-slate-500 dark:text-slate-400 font-medium font-bold">تحديث الأسعار وحساب العملات فوراً</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        <div className="space-y-6 md:space-y-10">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-800 p-6 md:p-10 text-white">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <span className="text-blue-200 text-xs md:text-lg font-black uppercase tracking-widest">الأسعار المعتمدة</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-[8px] md:text-xs font-bold">تحديث: {rates.date}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="text-center bg-white/10 p-3 md:p-4 rounded-xl md:rounded-2xl">
                  <div className="text-2xl md:text-4xl font-black mb-1">{rates.SAR.toLocaleString()}</div>
                  <div className="text-blue-200 text-[8px] md:text-sm font-bold">سعودي (SAR)</div>
                </div>
                <div className="text-center bg-white/10 p-3 md:p-4 rounded-xl md:rounded-2xl">
                  <div className="text-2xl md:text-4xl font-black mb-1">{rates.OMR.toLocaleString()}</div>
                  <div className="text-blue-200 text-[8px] md:text-sm font-bold">عماني (OMR)</div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10">
              <form onSubmit={handleUpdate} className="space-y-4 md:space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[8px] md:text-sm font-black text-slate-500 uppercase font-bold">السعودي</label>
                    <input 
                      type="number" 
                      className="w-full p-4 md:p-6 border-2 md:border-4 border-slate-50 dark:border-slate-800 rounded-xl md:rounded-2xl outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white transition-all text-xl md:text-3xl font-black"
                      value={formData.SAR || ''}
                      onChange={e => setFormData({...formData, SAR: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[8px] md:text-sm font-black text-slate-500 uppercase font-bold">العماني</label>
                    <input 
                      type="number" 
                      className="w-full p-4 md:p-6 border-2 md:border-4 border-slate-50 dark:border-slate-800 rounded-xl md:rounded-2xl outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white transition-all text-xl md:text-3xl font-black"
                      value={formData.OMR || ''}
                      onChange={e => setFormData({...formData, OMR: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-indigo-700 text-white py-4 md:py-6 rounded-xl md:rounded-2xl font-black text-sm md:text-xl hover:bg-indigo-800 transition active:scale-95">💾 اعتماد الأسعار</button>
              </form>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] shadow-2xl p-6 md:p-10 border border-slate-100 dark:border-slate-800 flex flex-col transition-colors">
            <h3 className="text-xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mb-4">⚖️ المحول السريع</h3>
            <div className="space-y-4 md:space-y-8">
                <div className="space-y-1">
                    <label className="block text-[10px] md:text-lg font-black text-slate-700 dark:text-slate-300 font-bold">المبلغ باليمني (YER)</label>
                    <input 
                        type="number"
                        className="w-full p-5 md:p-8 border-2 md:border-4 border-slate-50 dark:border-slate-800 rounded-xl md:rounded-[2rem] bg-slate-50 dark:bg-slate-800 text-3xl md:text-5xl font-black text-slate-900 dark:text-slate-100 focus:border-green-500 outline-none transition-all"
                        placeholder="0"
                        value={calc.yerAmount || ''}
                        onChange={e => setCalc({...calc, yerAmount: parseFloat(e.target.value) || 0})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-6">
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 md:p-8 rounded-xl md:rounded-[2rem] border-2 border-amber-100 dark:border-amber-900/30 text-center">
                        <span className="text-[8px] md:text-xs font-black text-amber-600 uppercase mb-1 block">سعودي</span>
                        <div className="text-lg md:text-3xl font-black text-amber-900 dark:text-amber-100 truncate">{calc.resultSAR.toFixed(2)}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 md:p-8 rounded-xl md:rounded-[2rem] border-2 border-blue-100 dark:border-blue-900/30 text-center">
                        <span className="text-[8px] md:text-xs font-black text-blue-600 uppercase mb-1 block">عماني</span>
                        <div className="text-lg md:text-3xl font-black text-blue-900 dark:text-blue-100 truncate">{calc.resultOMR.toFixed(2)}</div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* سجل الصرف التاريخي */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
           <div className="p-6 md:p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="text-lg md:text-2xl font-black text-slate-800 dark:text-slate-100">📋 سجل تاريخ الصرف</h3>
              <span className="text-[8px] md:text-xs font-bold text-slate-400 uppercase tracking-widest font-bold">Log History</span>
           </div>
           <div className="flex-grow overflow-y-auto max-h-[400px] md:max-h-[1000px] no-scrollbar">
              <table className="excel-table w-full">
                 <thead className="sticky top-0 z-10">
                    <tr>
                       <th className="text-right">التاريخ</th>
                       <th className="text-center">سعودي</th>
                       <th className="text-center">عماني</th>
                    </tr>
                 </thead>
                 <tbody>
                    {rateHistory.map((h, i) => (
                       <tr key={`${h.date}-${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-500 dark:text-slate-400 text-[10px] md:text-sm">{h.date}</td>
                          <td className="px-4 py-3 md:px-6 md:py-4 text-center font-black text-blue-900 dark:text-blue-400 text-sm md:text-xl">
                            <div className="flex items-center justify-center gap-1">
                              {h.SAR.toLocaleString()} {getPriceTrend(i, 'SAR')}
                            </div>
                          </td>
                          <td className="px-4 py-3 md:px-6 md:py-4 text-center font-black text-indigo-900 dark:text-indigo-400 text-sm md:text-xl font-bold">
                            <div className="flex items-center justify-center gap-1">
                              {h.OMR.toLocaleString()} {getPriceTrend(i, 'OMR')}
                            </div>
                          </td>
                       </tr>
                    ))}
                    {rateHistory.length === 0 && (
                       <tr>
                          <td colSpan={3} className="p-10 text-center text-slate-300 font-black italic">لا يوجد سجل حتى الآن.</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangePage;
