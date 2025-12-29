
import React, { useMemo, useState } from 'react';
import { useAgency } from '../context/AgencyContext';
import { ExpenseCategory, Currency } from '../types';
import { useNotify } from '../context/NotificationContext';

const InventoryPage: React.FC = () => {
  const { inventory, sales, purchases, addExpense, qatTypes, addQatType, socialSettings } = useAgency();
  const { notify } = useNotify();
  const [showWastageForm, setShowWastageForm] = useState(false);
  const [showAddQatModal, setShowAddQatModal] = useState(false);
  const [selectedTypeForLog, setSelectedTypeForLog] = useState<string | null>(null);
  const [newQatName, setNewQatName] = useState('');
  const [wastageData, setWastageData] = useState({ qatType: '', quantity: 0, notes: '' });

  const inventoryDetails = useMemo(() => {
    return qatTypes.map(type => {
      const regularIn = purchases.filter(p => p.qatType === type && !p.isReturn).reduce((s, p) => s + p.quantity, 0);
      const returnIn = sales.filter(s => s.qatType === type && s.isReturn).reduce((s, s1) => s + s1.quantity, 0);
      const totalIn = regularIn + returnIn;
      const regularOut = sales.filter(s => s.qatType === type && !s.isReturn).reduce((s, s1) => s + s1.quantity, 0);
      const returnOut = purchases.filter(p => p.qatType === type && p.isReturn).reduce((s, p) => s + p.quantity, 0);
      const totalOut = regularOut + returnOut;
      const current = totalIn - totalOut;
      const velocity = totalIn > 0 ? (regularOut / totalIn) : 0;
      
      const movements = [
        ...purchases.filter(p => p.qatType === type).map(p => ({ date: p.date, desc: p.isReturn ? 'مرتجع مورد' : `توريد من ${p.supplierName}`, qty: p.quantity, type: p.isReturn ? 'OUT' : 'IN' })),
        ...sales.filter(s => s.qatType === type).map(s => ({ date: s.date, desc: s.isReturn ? 'مرتجع عميل' : `بيع لـ ${s.customerName}`, qty: s.quantity, type: s.isReturn ? 'IN' : 'OUT' }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return { type, totalIn, totalOut, current, velocity, movements };
    });
  }, [inventory, sales, purchases, qatTypes]);

  const handleWastageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wastageData.quantity <= 0 || !wastageData.qatType) return notify('يرجى إدخال بيانات صحيحة', 'error');
    addExpense({
      id: `waste-${Date.now()}`, date: new Date().toISOString(), category: ExpenseCategory.Wastage, amount: 0, currency: Currency.YER,
      description: `إتلاف ${wastageData.quantity} حزم من نوع ${wastageData.qatType}. السبب: ${wastageData.notes}`
    });
    notify(`تم تسجيل توالف لـ ${wastageData.qatType} بنجاح ✅`, 'success');
    setWastageData({ qatType: '', quantity: 0, notes: '' });
    setShowWastageForm(false);
  };

  const handleAddQatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQatName.trim()) return notify('يرجى إدخال اسم الصنف', 'error');
    if (qatTypes.includes(newQatName.trim())) return notify('هذا الصنف موجود مسبقاً', 'warning');
    await addQatType(newQatName.trim());
    notify(`تمت إضافة الصنف "${newQatName}" بنجاح 🌿`, 'success');
    setNewQatName('');
    setShowAddQatModal(false);
  };

  return (
    <div className="space-y-8 md:space-y-16 animate-in fade-in duration-700 pb-32 px-2 md:px-0">
      <div className="bg-slate-900 md:bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-6 md:p-20 rounded-[2rem] md:rounded-[4rem] text-white shadow-2xl relative overflow-hidden text-right">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-[8rem] md:text-[15rem] animate-float rotate-12">🌿</div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-12">
          <div>
            <h2 className="text-3xl md:text-8xl font-black mb-2 md:mb-6 leading-tight">إدارة المخزن</h2>
            <p className="text-sm md:text-3xl opacity-70 font-bold max-w-2xl leading-relaxed">تتبع دقيق لكل حزمة قات في وكالتك.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <button onClick={() => setShowAddQatModal(true)} className="bg-emerald-600 hover:bg-emerald-50 text-white hover:text-emerald-900 px-6 py-4 rounded-2xl font-black text-sm md:text-2xl shadow-xl transition-all">🌿 إضافة صنف</button>
            <button onClick={() => setShowWastageForm(true)} className="bg-white/10 hover:bg-rose-600 px-6 py-4 rounded-2xl font-black text-sm md:text-2xl border border-white/10 transition-all">🗑️ تسجيل تالف</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
        {inventoryDetails.map(item => {
          const isCritical = item.current <= (socialSettings.notifications?.stockThreshold || 5);
          return (
            <div key={item.type} className={`group relative p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] border-4 md:border-[6px] transition-all overflow-hidden ${isCritical ? 'bg-rose-50/50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 hover:border-emerald-500 shadow-xl'}`}>
              <div className="flex justify-between items-start mb-6 md:mb-10 text-right">
                <div className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-3xl md:text-5xl shadow-inner ${isCritical ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>🌿</div>
                <button onClick={() => setSelectedTypeForLog(item.type)} className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">السجل 📑</button>
              </div>

              <h4 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 md:mb-8 text-right tracking-tight">{item.type}</h4>
              
              <div className="flex items-baseline justify-end gap-2 md:gap-4 mb-6 md:mb-12">
                 <span className="text-slate-400 font-bold text-lg md:text-2xl uppercase tracking-widest">حزمة</span>
                 <span className={`text-6xl md:text-8xl font-black tracking-tighter ${isCritical ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}`}>{item.current}</span>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                       <span>{(item.velocity * 100).toFixed(0)}%</span>
                       <span>سرعة التصريف</span>
                    </div>
                    <div className="w-full h-3 md:h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                       <div className={`h-full transition-all duration-1000 ${isCritical ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${item.velocity * 100}%` }}></div>
                    </div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedTypeForLog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setSelectedTypeForLog(null)}></div>
           <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in my-auto">
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center text-right">
                 <h3 className="text-2xl font-black">📜 سجل حركة: {selectedTypeForLog}</h3>
                 <button onClick={() => setSelectedTypeForLog(null)} className="text-3xl">✕</button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
                 {inventoryDetails.find(i => i.type === selectedTypeForLog)?.movements.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700">
                       <div className={`font-black text-lg ${m.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {m.type === 'IN' ? '+' : '-'}{m.qty}
                       </div>
                       <div className="text-right">
                          <div className="font-bold text-slate-800 dark:text-white">{m.desc}</div>
                          <div className="text-[10px] text-slate-400 uppercase">{new Date(m.date).toLocaleString('ar-YE')}</div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {showAddQatModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowAddQatModal(false)}></div>
           <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl my-auto text-right">
              <h3 className="text-xl md:text-3xl font-black mb-6 text-center">إضافة صنف جديد</h3>
              <form onSubmit={handleAddQatSubmit} className="space-y-4 md:space-y-6">
                 <input className="w-full p-4 md:p-6 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none font-black text-lg md:text-2xl text-center" placeholder="اسم الصنف.." value={newQatName} onChange={e => setNewQatName(e.target.value)} autoFocus />
                 <button type="submit" className="w-full bg-emerald-600 text-white py-4 md:py-6 rounded-2xl font-black text-lg md:text-xl shadow-xl transition-all">حفظ الصنف 🌿</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
export default InventoryPage;
