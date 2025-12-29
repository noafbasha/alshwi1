
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAgency } from '../context/AgencyContext';
import { useNotify } from '../context/NotificationContext';
import { Supplier, Currency } from '../types';
import EntityStatementModal from './EntityStatementModal';
import ConfirmModal from './ConfirmModal';
import SearchableSelect from './SearchableSelect';

const SuppliersPage: React.FC = () => {
  const { suppliers, supplierDebts, addSupplier, deleteSupplier, recordVoucher, rates } = useAgency();
  const { notify } = useNotify();
  const location = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEntityForStatement, setSelectedEntityForStatement] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [newSupplier, setNewSupplier] = useState({ 
    name: '', 
    phone: '', 
    category: 'تاجر',
    openingBalance: 0,
    openingBalanceDate: new Date().toISOString().split('T')[0]
  });

  // ميزة البحث عن مشابهات عند الإضافة
  const similarExisting = useMemo(() => {
    if (newSupplier.name.length < 2) return [];
    return suppliers.filter(s => s.name.includes(newSupplier.name)).slice(0, 3);
  }, [newSupplier.name, suppliers]);

  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [voucherData, setVoucherData] = useState({ 
    entityId: '', 
    type: 'payment' as 'payment' | 'receipt',
    amount: 0, 
    currency: Currency.YER,
    notes: '' 
  });

  useEffect(() => {
    if (location.state?.openVoucher) {
      setVoucherData(prev => ({ ...prev, type: location.state.type }));
      setIsVoucherOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (location.state?.showAdd) {
      setShowAddModal(true);
    }
  }, [location.state]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSupplier.name.length < 3) return notify('يرجى إدخال اسم مورد صحيح', 'error');
    
    setIsSubmitting(true);
    try {
      await addSupplier({
        id: `s-${Date.now()}`,
        ...newSupplier,
        openingBalanceDate: new Date(newSupplier.openingBalanceDate).toISOString()
      });
      setShowAddModal(false);
      setNewSupplier({ name: '', phone: '', category: 'تاجر', openingBalance: 0, openingBalanceDate: new Date().toISOString().split('T')[0] });
      notify('تمت إضافة المورد بنجاح ✅', 'success');
    } catch (err) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherData.entityId) return notify('يرجى اختيار مورد أولاً', 'error');
    if (voucherData.amount <= 0) return notify('يرجى إدخال مبلغ صحيح', 'error');
    
    try {
      await recordVoucher(voucherData.entityId, 'supplier', voucherData.amount, voucherData.type, voucherData.currency, voucherData.notes);
      notify(`تم تسجيل سند ${voucherData.type === 'payment' ? 'دفع' : 'قبض'} بنجاح ✅`, 'success');
      setIsVoucherOpen(false);
    } catch (err) {
    }
  };

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700 pb-32 max-w-7xl mx-auto px-2 md:px-0">
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={() => deleteId && deleteSupplier(deleteId)} 
        title="حذف المورد"
        message="هل أنت متأكد من حذف المورد؟ سيتم مسح كافة الفواتير والديون المرتبطة به."
      />

      {selectedEntityForStatement && (
        <EntityStatementModal 
          entityId={selectedEntityForStatement} 
          entityType="supplier" 
          onClose={() => setSelectedEntityForStatement(null)} 
        />
      )}

      {/* Header */}
      <div className="bg-slate-900 p-6 md:p-16 rounded-[2rem] md:rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute bottom-0 left-0 p-10 opacity-5 pointer-events-none text-[8rem] md:text-[12rem] animate-float rotate-12 hidden md:block">🚜</div>
        <div className="relative z-10 text-center md:text-right">
           <div className="bg-white/10 w-fit px-4 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 mb-4 mx-auto md:mx-0">Supply Chain</div>
           <h2 className="text-3xl md:text-7xl font-black mb-2 leading-tight">شركاء التوريد</h2>
           <p className="text-sm md:text-2xl opacity-70 font-tajawal max-w-lg leading-relaxed">إدارة حسابات التجار وتتبع الالتزامات المالية.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="w-full md:w-auto bg-white text-indigo-900 px-8 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-lg md:text-2xl shadow-xl transition-all active:scale-95">
          <span>➕</span> مورد جديد
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10">
        {suppliers.map(s => {
          const debt = supplierDebts.find(d => d.supplierId === s.id);
          const balYer = debt ? debt.balances.YER + (debt.balances.SAR * rates.SAR) + (debt.balances.OMR * rates.OMR) : 0;
          return (
            <div key={s.id} className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] shadow-xl border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all group relative overflow-hidden flex flex-col">
               <div className="flex justify-between items-start mb-6 md:mb-8 text-right">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-inner cursor-pointer" onClick={() => setSelectedEntityForStatement(s.id)}>🚜</div>
                  <div className={`px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-sm ${balYer > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {balYer > 0 ? 'مستحق له' : 'خالص'}
                  </div>
               </div>
               
               <button onClick={() => setSelectedEntityForStatement(s.id)} className="text-right block w-full group/name mb-2">
                 <h4 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight group-hover/name:text-indigo-600 transition-colors">{s.name}</h4>
               </button>
               <p className="text-sm md:text-xl text-slate-500 font-bold mb-6 md:mb-8 text-right">{s.phone}</p>
               
               <div className={`p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] text-center mb-8 transition-colors cursor-pointer ${balYer > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400' : 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'}`} onClick={() => setSelectedEntityForStatement(s.id)}>
                  <div className="text-[9px] md:text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest text-center">صافي الرصيد المستحق</div>
                  <div className="text-2xl md:text-4xl font-black tracking-tighter">{Math.abs(balYer).toLocaleString()} <span className="text-[10px] md:text-base font-normal opacity-50">ر.ي</span></div>
               </div>

               <div className="mt-auto grid grid-cols-2 gap-2 md:gap-4">
                  <button onClick={() => { setVoucherData({...voucherData, entityId: s.id, type: 'payment'}); setIsVoucherOpen(true); }} className="bg-rose-600 text-white py-4 md:py-5 rounded-xl md:rounded-[1.5rem] font-black text-xs md:text-lg shadow-lg active:scale-95 transition-all">📤 صرف له</button>
                  <button onClick={() => { setVoucherData({...voucherData, entityId: s.id, type: 'receipt'}); setIsVoucherOpen(true); }} className="bg-blue-600 text-white py-4 md:py-5 rounded-xl md:rounded-[1.5rem] font-black text-xs md:text-lg shadow-lg active:scale-95 transition-all">💰 قبض منه</button>
               </div>
               
               <button onClick={() => setDeleteId(s.id)} className="mt-4 text-[10px] font-black text-slate-300 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100 text-center">🗑️ حذف المورد</button>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in my-auto border-4 border-indigo-100 dark:border-indigo-900/20">
             <div className="p-6 md:p-10 bg-indigo-700 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl md:text-4xl">🚜</span>
                  <h3 className="text-xl md:text-3xl font-black">إضافة مورد جديد</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-3xl">✕</button>
             </div>
             <form onSubmit={handleAddSupplier} className="p-6 md:p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2 relative">
                    <label className="text-xs font-black text-slate-500 px-2 uppercase tracking-widest text-right block">اسم المورد</label>
                    <input 
                      type="text" required autoFocus
                      className="w-full p-4 text-base md:text-xl border-4 border-slate-50 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white outline-none focus:border-indigo-500 transition font-bold text-right shadow-inner"
                      value={newSupplier.name}
                      onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                    />

                    {/* عرض الموردين المشابهين */}
                    {similarExisting.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 rounded-2xl p-4 shadow-xl animate-in slide-in-from-top-2">
                         <p className="text-[10px] font-black text-indigo-600 mb-2 uppercase">⚠️ موردون مسجلون بأسماء مشابهة:</p>
                         <div className="space-y-2">
                            {similarExisting.map(s => (
                              <div key={s.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                 <span className="font-black text-sm dark:text-white">{s.name}</span>
                                 <span className="text-[10px] font-bold text-slate-400">{s.phone}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 px-2 uppercase tracking-widest text-right block">رقم الهاتف</label>
                    <input 
                      type="tel" required
                      className="w-full p-4 text-base md:text-xl border-4 border-slate-50 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white outline-none focus:border-indigo-500 transition font-bold text-right shadow-inner"
                      value={newSupplier.phone}
                      onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl md:rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-900/20 space-y-4">
                  <h4 className="text-sm md:text-lg font-black text-indigo-700 flex items-center gap-2"><span>📂</span> مديونية سابقة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        type="number"
                        className="w-full p-4 text-base border-2 border-white dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500 font-bold text-right shadow-sm"
                        value={newSupplier.openingBalance || ''}
                        onChange={e => setNewSupplier({...newSupplier, openingBalance: parseFloat(e.target.value) || 0})}
                        placeholder="المبلغ المستحق له.."
                      />
                    <input 
                        type="date"
                        className="w-full p-4 text-base border-2 border-white dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500 font-bold shadow-sm"
                        value={newSupplier.openingBalanceDate}
                        onChange={e => setNewSupplier({...newSupplier, openingBalanceDate: e.target.value})}
                      />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex-grow bg-indigo-700 text-white py-4 md:py-6 rounded-2xl font-black text-lg md:text-2xl hover:bg-indigo-800 transition shadow-xl disabled:opacity-50 active:scale-95"
                  >
                    حفظ البيانات ✅
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="px-6 md:px-10 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {isVoucherOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl md:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in my-auto border-4 border-slate-100 dark:border-slate-800">
             <div className={`p-6 md:p-10 ${voucherData.type === 'receipt' ? 'bg-blue-600' : 'bg-rose-600'} text-white flex justify-between items-center`}>
                <h3 className="text-lg md:text-3xl font-black">
                   {voucherData.type === 'receipt' ? 'استلام مبلغ (قبض)' : 'تسليم مبلغ (دفع)'}
                </h3>
                <button onClick={() => setIsVoucherOpen(false)} className="text-2xl">✕</button>
             </div>
             <form onSubmit={handleVoucherSubmit} className="p-6 md:p-10 space-y-6 md:space-y-8">
                <SearchableSelect 
                  label="المورد"
                  placeholder="-- اختر المورد --"
                  options={suppliers}
                  value={voucherData.entityId}
                  onChange={(val) => setVoucherData({...voucherData, entityId: val})}
                />

                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-500 px-2 uppercase tracking-widest text-center block">المبلغ بالأرقام</label>
                   <input 
                      type="number" required autoFocus
                      className="w-full p-6 md:p-8 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none focus:border-indigo-500 font-black text-4xl md:text-6xl text-center dark:text-white shadow-inner"
                      value={voucherData.amount || ''}
                      onChange={e => setVoucherData({...voucherData, amount: parseFloat(e.target.value) || 0})}
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-right">
                    <label className="text-xs font-black text-slate-500 px-2 uppercase tracking-widest text-right block">العملة</label>
                    <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl outline-none font-black dark:text-white text-right shadow-inner" value={voucherData.currency} onChange={e => setVoucherData({...voucherData, currency: e.target.value as Currency})}>
                        <option value={Currency.YER}>ريال يمني</option>
                        <option value={Currency.SAR}>ريال سعودي</option>
                        <option value={Currency.OMR}>ريال عماني</option>
                    </select>
                  </div>
                  <div className="space-y-2 text-right">
                    <label className="text-xs font-black text-slate-500 px-2 uppercase tracking-widest text-right block">البيان</label>
                    <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl outline-none font-bold dark:text-white text-right shadow-inner" placeholder="ملاحظة.." value={voucherData.notes} onChange={e => setVoucherData({...voucherData, notes: e.target.value})} />
                  </div>
                </div>

                <button type="submit" className={`w-full py-5 md:py-7 rounded-2xl font-black text-xl md:text-3xl text-white shadow-2xl transition active:scale-95 ${voucherData.type === 'receipt' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-rose-600 shadow-rose-500/20'}`}>
                   اعتماد وترحيل ✅
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
