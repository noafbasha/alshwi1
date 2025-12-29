
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAgency } from '../context/AgencyContext';
import { useNotify } from '../context/NotificationContext';
import { Currency, Expense, RecurrenceFrequency } from '../types';
import ConfirmModal from './ConfirmModal';

const CATEGORY_ICONS: Record<string, string> = {
  'نقل وتوريد': '🚚',
  'إيجار': '🏠',
  'أجور وعمالة': '👥',
  'ضرائب وزكاة': '🏛️',
  'توالف وهالك': '🗑️',
  'أخرى': '📝',
};

const ExpensesPage: React.FC = () => {
  const { expenses, addExpense, deleteExpense, expenseCategories, addExpenseCategory, deleteExpenseCategory } = useAgency();
  const { notify } = useNotify();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecurringOnly, setShowRecurringOnly] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    category: '',
    amount: 0,
    currency: Currency.YER,
    description: '',
    isRecurring: false,
    frequency: RecurrenceFrequency.None
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expenseCategories.length > 0 && (!formData.category || !expenseCategories.includes(formData.category))) {
      setFormData(prev => ({ ...prev, category: expenseCategories[0] }));
    }
  }, [expenseCategories, isModalOpen]);

  useEffect(() => {
    if (location.state?.showAdd) {
      setIsModalOpen(true);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return notify('يرجى إدخال مبلغ صحيح', 'error');
    if (!formData.category) return notify('يرجى اختيار فئة أولاً', 'error');

    setIsSubmitting(true);
    try {
      await addExpense({ id: `exp-${Date.now()}`, date: new Date().toISOString(), ...formData });
      notify(`تم تسجيل المصروف بنجاح ✅`, 'success');
      setFormData(prev => ({ ...prev, amount: 0, description: '', isRecurring: false, frequency: RecurrenceFrequency.None }));
      setIsModalOpen(false);
    } catch (err) {} finally { setIsSubmitting(false); }
  };

  const filteredExpenses = useMemo(() => {
    let list = expenses.filter(e => 
      (e.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (showRecurringOnly) list = list.filter(e => e.isRecurring);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchTerm, showRecurringOnly]);

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-32 px-2 md:px-0">
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={() => deleteId && deleteExpense(deleteId)} 
      />

      {/* Header - Responsive */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] shadow-xl border border-slate-100 dark:border-slate-800 gap-6">
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
          <div className="bg-rose-100 dark:bg-rose-900/40 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] text-3xl md:text-5xl shadow-inner animate-float shrink-0">💸</div>
          <div>
            <h2 className="text-xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">دفتر المصروفات</h2>
            <p className="text-[10px] md:text-xl text-slate-500 font-bold">تتبع النفقات اليومية للوكالة</p>
          </div>
        </div>
        <div className="bg-rose-600 text-white px-8 py-4 md:px-12 md:py-6 rounded-2xl md:rounded-[2.5rem] shadow-xl text-center w-full md:w-auto">
           <div className="text-[9px] font-black opacity-80 uppercase mb-1">إجمالي المنصرفات</div>
           <div className="text-2xl md:text-4xl font-black">{totalExpenses.toLocaleString()} <span className="text-xs font-normal">ر.ي</span></div>
        </div>
      </div>

      {/* Control Bar - Responsive */}
      <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[1.5rem] md:rounded-[3rem] shadow-lg border border-slate-100 dark:border-slate-800">
         <div className="relative flex-grow group">
           <input 
             type="text" 
             placeholder="بحث في المصاريف..." 
             className="w-full p-4 pr-12 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-[2rem] outline-none font-bold dark:text-white border-2 border-transparent focus:border-rose-500 transition-all text-right"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
           <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
         </div>
         <div className="flex gap-2">
            <button onClick={() => setIsCatManagerOpen(true)} className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-sm" title="إدارة الأسماء">🏷️</button>
            <button onClick={() => setIsModalOpen(true)} className="flex-grow md:flex-none bg-rose-600 text-white px-6 md:px-10 rounded-xl md:rounded-[1.5rem] font-black text-sm md:text-xl shadow-lg active:scale-95 transition-all">➕ إضافة</button>
         </div>
      </div>

      {/* Grid View - Column for Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
         {filteredExpenses.map(exp => (
            <div key={exp.id} className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border-r-8 border-rose-500 flex justify-between items-center group active:scale-95 transition-all text-right">
               <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-rose-50 dark:bg-rose-900/30 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl shadow-inner shrink-0">
                     {CATEGORY_ICONS[exp.category] || '📝'}
                  </div>
                  <div>
                     <div className="flex items-center gap-2 mb-0.5 justify-end">
                        <span className="text-[8px] font-black bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full uppercase">{exp.category}</span>
                     </div>
                     <h4 className="text-base md:text-2xl font-black text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-xs">{exp.description}</h4>
                     <p className="text-[9px] text-slate-400 font-bold">{new Date(exp.date).toLocaleDateString('ar-YE')}</p>
                  </div>
               </div>
               <div className="text-left">
                  <div className="text-xl md:text-3xl font-black text-rose-600">{exp.amount.toLocaleString()}</div>
                  <button onClick={() => setDeleteId(exp.id)} className="text-[9px] font-black text-slate-300 hover:text-red-500 uppercase mt-1">🗑️ حذف</button>
               </div>
            </div>
         ))}
      </div>
      {filteredExpenses.length === 0 && <div className="p-10 text-center opacity-30 italic">لا توجد مصاريف..</div>}

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-t-[10px] border-rose-600 my-auto animate-in zoom-in">
              <h3 className="text-2xl md:text-3xl font-black mb-8 text-center dark:text-white">إضافة مصروف جديد</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-2 text-right">
                    <label className="text-xs font-black text-slate-500 px-2 uppercase tracking-widest">فئة المصروف</label>
                    <select className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none font-black text-lg text-right dark:text-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                        {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 px-2 uppercase tracking-widest text-center block">المبلغ المنصرف</label>
                    <input type="number" required autoFocus className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none text-4xl font-black text-center dark:text-white" placeholder="0" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} />
                 </div>
                 <div className="space-y-2 text-right">
                    <label className="text-xs font-black text-slate-500 px-2 uppercase tracking-widest">بيان المصروف (الوصف)</label>
                    <textarea className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none font-bold text-right dark:text-white" placeholder="اكتب تفاصيل المصروف هنا.." rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                 </div>
                 <button type="submit" className="w-full bg-rose-600 text-white py-5 md:py-6 rounded-2xl font-black text-xl md:text-2xl shadow-xl transition-all active:scale-95">💾 حفظ المصروف</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
