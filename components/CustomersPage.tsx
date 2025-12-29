
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAgency } from '../context/AgencyContext';
import { useNotify } from '../context/NotificationContext';
import { Customer, Currency, PaymentStatus } from '../types';
import EntityStatementModal from './EntityStatementModal';
import ConfirmModal from './ConfirmModal';
import SearchableSelect from './SearchableSelect';

type ActiveTab = 'list' | 'openingBalances';

const CustomersPage: React.FC = () => {
  const { 
    customers, addCustomer, updateCustomer, debts, rates, recordVoucher, deleteCustomer 
  } = useAgency();
  const { notify } = useNotify();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEntityForStatement, setSelectedEntityForStatement] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [voucherData, setVoucherData] = useState({ 
    entityId: '', 
    type: 'receipt' as 'receipt' | 'payment',
    amount: 0, 
    currency: Currency.YER,
    notes: '' 
  });

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    openingBalance: 0,
    openingBalanceCurrency: Currency.YER,
    openingBalanceDate: new Date().toISOString().split('T')[0],
    openingBalanceNotes: ''
  });

  // ميزة البحث عن مشابهات عند الإضافة
  const similarExisting = useMemo(() => {
    if (newCustomer.name.length < 2) return [];
    return customers.filter(c => c.name.includes(newCustomer.name)).slice(0, 3);
  }, [newCustomer.name, customers]);

  useEffect(() => {
    if (location.state?.openVoucher) {
      setVoucherData(prev => ({ ...prev, type: location.state.type }));
      setIsVoucherOpen(true);
    }
    if (location.state?.showAdd) {
      setShowAddModal(true);
    }
  }, [location.state]);

  const enrichedCustomers = useMemo(() => {
    return customers.map(customer => {
      const debt = debts.find(d => d.customerId === customer.id);
      const balanceYer = debt ? (debt.balances.YER + (debt.balances.SAR * rates.SAR) + (debt.balances.OMR * rates.OMR)) : 0;
      
      let health = { label: 'ممتاز', color: 'text-green-600 bg-green-50', icon: '⭐' };
      if (balanceYer > 500000) health = { label: 'حرج', color: 'text-red-600 bg-red-50', icon: '🔴' };
      else if (balanceYer > 100000) health = { label: 'تنبيه', color: 'text-amber-600 bg-amber-50', icon: '⚠️' };
      else if (balanceYer > 0) health = { label: 'مستقر', color: 'text-blue-600 bg-blue-50', icon: '✅' };

      return { ...customer, balance: balanceYer, health };
    });
  }, [customers, debts, rates]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustomer.name.length < 3) return notify('يرجى إدخال اسم عميل صحيح', 'error');
    
    setIsSubmitting(true);
    try {
      const customer: Customer = {
        id: Math.random().toString(36).substr(2, 9),
        ...newCustomer,
        openingBalanceDate: new Date(newCustomer.openingBalanceDate).toISOString()
      };
      await addCustomer(customer);
      setNewCustomer({ name: '', phone: '', address: '', openingBalance: 0, openingBalanceCurrency: Currency.YER, openingBalanceDate: new Date().toISOString().split('T')[0], openingBalanceNotes: '' });
      setShowAddModal(false);
      notify(`تمت إضافة العميل ${customer.name} بنجاح ✅`, 'success');
    } catch (err) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = enrichedCustomers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-24 px-2 md:px-0">
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={() => deleteId && deleteCustomer(deleteId)} 
      />

      {selectedEntityForStatement && (
        <EntityStatementModal 
          entityId={selectedEntityForStatement} 
          entityType="customer" 
          onClose={() => setSelectedEntityForStatement(null)} 
        />
      )}

      {/* Header & Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 transition-all overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-center p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 gap-6">
          <div className="flex items-center gap-4 md:gap-6 text-right">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 md:p-5 rounded-2xl md:rounded-3xl text-2xl md:text-4xl shadow-inner">👥</div>
            <div>
              <h2 className="text-xl md:text-4xl font-black text-slate-900 dark:text-white">إدارة العملاء</h2>
              <p className="text-xs md:text-xl text-slate-500 font-bold">الحسابات والديون والأرصدة القديمة</p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
             <button onClick={() => setShowAddModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-green-700 text-white rounded-2xl font-black text-sm md:text-xl shadow-xl transition-all active:scale-95">
               <span>➕</span> عميل جديد
             </button>
          </div>
        </div>

        <div className="flex bg-slate-50 dark:bg-slate-800/50 p-2 gap-2">
           <button 
             onClick={() => setActiveTab('list')}
             className={`flex-1 py-4 rounded-xl font-black text-sm md:text-lg transition-all ${activeTab === 'list' ? 'bg-white dark:bg-slate-700 text-green-700 dark:text-green-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
             📊 قائمة الحسابات
           </button>
           <button 
             onClick={() => setActiveTab('openingBalances')}
             className={`flex-1 py-4 rounded-xl font-black text-sm md:text-lg transition-all ${activeTab === 'openingBalances' ? 'bg-white dark:bg-slate-700 text-green-700 dark:text-green-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
             📂 المديونيات القديمة
           </button>
        </div>
      </div>

      <div className="relative group">
         <input 
          type="text" 
          placeholder="البحث بالاسم..." 
          className="w-full p-5 md:p-7 pr-12 md:pr-16 bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-transparent focus:border-green-500 outline-none font-black text-base md:text-2xl dark:text-white transition-all shadow-sm text-right shadow-inner"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
         />
         <span className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-2xl md:text-3xl opacity-40">🔍</span>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10">
          {filteredCustomers.map(customer => (
            <div key={customer.id} className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-xl border-2 border-slate-100 dark:border-slate-800 hover:border-green-400 transition-all relative overflow-hidden group flex flex-col">
              <div className={`absolute top-0 right-0 p-3 md:p-5 rounded-bl-[2rem] flex items-center justify-center text-xl md:text-4xl shadow-inner ${customer.health.color}`}>
                {customer.health.icon}
              </div>

              <button onClick={() => setSelectedEntityForStatement(customer.id)} className="text-right block w-full mb-2">
                <h4 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white group-hover:text-green-600 transition-colors leading-tight">{customer.name}</h4>
              </button>
              <p className="text-sm md:text-2xl text-slate-500 font-bold mb-6 md:mb-10 text-right">{customer.phone}</p>
              
              <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-800 rounded-2xl md:rounded-[2rem] text-center mb-6 md:mb-10 cursor-pointer" onClick={() => setSelectedEntityForStatement(customer.id)}>
                 <span className="text-[10px] md:text-xs font-black text-slate-400 block mb-2 uppercase text-center">صافي الرصيد</span>
                 <span className={`text-2xl md:text-5xl font-black ${customer.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                   {customer.balance.toLocaleString()} <span className="text-xs md:text-base font-normal opacity-50">ر.ي</span>
                 </span>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-3 md:gap-6 pt-4 border-t dark:border-slate-800">
                <button onClick={() => { setVoucherData({ ...voucherData, entityId: customer.id, type: 'receipt' }); setIsVoucherOpen(true); }} className="bg-emerald-600 text-white py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95">📥 قبض</button>
                <button onClick={() => { setVoucherData({ ...voucherData, entityId: customer.id, type: 'payment' }); setIsVoucherOpen(true); }} className="bg-amber-600 text-white py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-xl shadow-lg hover:bg-amber-700 transition-all active:scale-95">💸 دفع</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl border-2 border-slate-300 dark:border-slate-800 overflow-hidden">
           <div className="overflow-x-auto p-4">
              <table className="excel-table w-full text-base">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="p-5 text-right border border-slate-300 dark:border-slate-700">العميل</th>
                    <th className="p-5 text-center border border-slate-300 dark:border-slate-700">تاريخ المديونية القديمة</th>
                    <th className="p-5 text-right border border-slate-300 dark:border-slate-700">البيان / السبب</th>
                    <th className="p-5 text-left border border-slate-300 dark:border-slate-700">المبلغ والعملة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredCustomers.filter(c => (c.openingBalance || 0) !== 0).map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-5 border-l border-slate-300 dark:border-slate-700 border-b">
                        <div className="font-black text-xl text-slate-800 dark:text-white">{c.name}</div>
                      </td>
                      <td className="p-5 text-center border-l border-slate-300 dark:border-slate-700 border-b font-bold text-slate-500">
                        {new Date(c.openingBalanceDate || '').toLocaleDateString('ar-YE')}
                      </td>
                      <td className="p-5 text-right border-l border-slate-300 dark:border-slate-700 border-b font-bold text-slate-600 dark:text-slate-400 italic">
                        {c.openingBalanceNotes || '---'}
                      </td>
                      <td className="p-5 text-left font-black text-2xl text-indigo-600 border-b">
                        {c.openingBalance?.toLocaleString()} <span className="text-xs font-normal opacity-50">{c.openingBalanceCurrency}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in my-auto border-4 border-green-100 dark:border-green-900/20">
             <div className="p-10 bg-green-700 text-white flex justify-between items-center">
                <h3 className="text-3xl font-black">👤 إضافة عميل جديد</h3>
                <button onClick={() => setShowAddModal(false)} className="text-4xl">✕</button>
             </div>
             <form onSubmit={handleAdd} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-right relative">
                    <label className="text-xs font-black text-slate-500 px-4 uppercase tracking-widest text-right block">اسم العميل</label>
                    <input 
                      type="text" required autoFocus 
                      className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl font-black text-xl dark:text-white text-right shadow-inner" 
                      value={newCustomer.name} 
                      onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                    />
                    
                    {/* عرض الأسماء المشابهة */}
                    {similarExisting.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-700 rounded-2xl p-4 shadow-xl animate-in slide-in-from-top-2">
                         <p className="text-[10px] font-black text-amber-600 mb-2 uppercase">⚠️ عملاء مشابهون مسجلون مسبقاً:</p>
                         <div className="space-y-2">
                            {similarExisting.map(c => (
                              <div key={c.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-amber-100 dark:border-amber-800">
                                 <span className="font-black text-sm dark:text-white">{c.name}</span>
                                 <span className="text-[10px] font-bold text-slate-400">{c.phone}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-right">
                    <label className="text-xs font-black text-slate-500 px-4 uppercase tracking-widest text-right block">رقم الهاتف</label>
                    <input type="tel" required className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl font-black text-xl dark:text-white text-right shadow-inner" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                  </div>
                </div>

                <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2.5rem] border-2 border-indigo-100 dark:border-indigo-900/30 space-y-6">
                  <h4 className="text-xl font-black text-indigo-700 flex items-center gap-2 text-right justify-end"><span>📂</span> تفاصيل المديونية السابقة (القديمة)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-indigo-400 px-4 uppercase text-center block">المبلغ</label>
                      <input type="number" className="w-full p-5 bg-white dark:bg-slate-900 border-2 rounded-2xl font-black text-2xl dark:text-white text-center shadow-sm" value={newCustomer.openingBalance || ''} onChange={e => setNewCustomer({...newCustomer, openingBalance: parseFloat(e.target.value) || 0})} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-indigo-400 px-4 uppercase text-right block">العملة</label>
                      <select className="w-full p-5 bg-white dark:bg-slate-900 border-2 rounded-2xl font-black text-xl dark:text-white text-right shadow-sm" value={newCustomer.openingBalanceCurrency} onChange={e => setNewCustomer({...newCustomer, openingBalanceCurrency: e.target.value as Currency})}>
                        <option value={Currency.YER}>يمني (YER)</option>
                        <option value={Currency.SAR}>سعودي (SAR)</option>
                        <option value={Currency.OMR}>عماني (OMR)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-black text-indigo-400 px-4 uppercase text-right block">تاريخ المديونية (كتابة يدوية)</label>
                    <input type="date" className="w-full p-5 bg-white dark:bg-slate-900 border-2 rounded-2xl font-black text-xl dark:text-white text-right shadow-sm" value={newCustomer.openingBalanceDate} onChange={e => setNewCustomer({...newCustomer, openingBalanceDate: e.target.value})} />
                  </div>

                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-black text-indigo-400 px-4 uppercase text-right block">بيان الرصيد (السبب)</label>
                    <input type="text" className="w-full p-5 bg-white dark:bg-slate-900 border-2 rounded-2xl font-bold text-lg dark:text-white text-right shadow-sm" placeholder="مثال: رصيد متبقي من عام 2023.." value={newCustomer.openingBalanceNotes} onChange={e => setNewCustomer({...newCustomer, openingBalanceNotes: e.target.value})} />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-green-700 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-green-800 transition shadow-green-700/20 active:scale-95">
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات العميل والمديونية ✅'}
                </button>
             </form>
          </div>
        </div>
      )}

      {isVoucherOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden my-auto border-4 border-slate-100 dark:border-slate-800">
             <div className={`p-8 ${voucherData.type === 'receipt' ? 'bg-emerald-600' : 'bg-amber-600'} text-white flex justify-between items-center`}>
                <h3 className="text-2xl font-black">{voucherData.type === 'receipt' ? 'قبض دفعة نقدية' : 'صرف دفعة نقدية'}</h3>
                <button onClick={() => setIsVoucherOpen(false)} className="text-3xl">✕</button>
             </div>
             <form onSubmit={async (e) => {
               e.preventDefault();
               await recordVoucher(voucherData.entityId, 'customer', voucherData.amount, voucherData.type, voucherData.currency, voucherData.notes);
               setIsVoucherOpen(false);
               notify('تم ترحيل السند بنجاح', 'success');
             }} className="p-8 space-y-6">
                <SearchableSelect 
                  label="العميل"
                  placeholder="-- اختر العميل --"
                  options={customers}
                  value={voucherData.entityId}
                  onChange={(val) => setVoucherData({...voucherData, entityId: val})}
                />

                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-500 px-4 uppercase text-center block">المبلغ بالأرقام</label>
                   <input type="number" required autoFocus className="w-full p-8 bg-slate-50 dark:bg-slate-800 border-2 rounded-3xl font-black text-5xl text-center dark:text-white shadow-inner" value={voucherData.amount || ''} onChange={e => setVoucherData({...voucherData, amount: parseFloat(e.target.value) || 0})} />
                </div>
                <button type="submit" className="w-full py-6 rounded-3xl font-black text-2xl text-white bg-slate-900 shadow-xl transition-all active:scale-95">ترحيل السند ✅</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
