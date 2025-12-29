
import React, { useState, useMemo } from 'react';
import { useAgency } from '../context/AgencyContext';
import { Currency, VoucherType } from '../types';
import ConfirmModal from './ConfirmModal';

const JournalPage: React.FC = () => {
  const { sales, purchases, vouchers, expenses, rates, deleteSale, deletePurchase, deleteVoucher, deleteExpense } = useAgency();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<{ id: string, origin: string } | null>(null);

  const getYerAmount = (amount: number, currency: string) => {
    const rate = currency === Currency.SAR ? rates.SAR : currency === Currency.OMR ? rates.OMR : 1;
    return (amount || 0) * rate;
  };

  const allEntries = useMemo(() => {
    const entries: any[] = [
      ...sales.map(s => ({ 
        ...s, 
        origin: 'sale', 
        type: 'بيع', 
        status: s.isReturn ? 'عليه' : 'له',
        statusColor: s.isReturn ? 'text-rose-600' : 'text-emerald-600',
        yerAmount: getYerAmount(s.total, s.currency), 
        desc: `${s.customerName} - صنف: ${s.qatType}`, 
        timestamp: s.date, 
        receipt: s.receiptUrl 
      })),
      ...purchases.map(p => ({ 
        ...p, 
        origin: 'purchase', 
        type: 'شراء', 
        status: p.isReturn ? 'له' : 'عليه',
        statusColor: p.isReturn ? 'text-emerald-600' : 'text-rose-600',
        yerAmount: getYerAmount(p.totalCost, p.currency), 
        desc: `${p.supplierName} - صنف: ${p.qatType}`, 
        timestamp: p.date, 
        receipt: p.receiptUrl 
      })),
      ...vouchers.map(v => ({ 
        ...v, 
        origin: 'voucher', 
        type: v.type, 
        status: v.type === VoucherType.Receipt ? 'له' : 'عليه',
        statusColor: v.type === VoucherType.Receipt ? 'text-emerald-600' : 'text-rose-600',
        yerAmount: getYerAmount(v.amount, v.currency), 
        desc: v.notes || `${v.entityName} (${v.entityType === 'customer' ? 'عميل' : 'مورد'})`, 
        timestamp: v.date, 
        receipt: v.receiptUrl 
      })),
      ...expenses.map(e => ({ 
        ...e, 
        origin: 'expense', 
        type: 'مصروف', 
        status: 'عليه',
        statusColor: 'text-rose-600',
        yerAmount: getYerAmount(e.amount, e.currency), 
        desc: e.description, 
        timestamp: e.date, 
        receipt: e.receiptUrl 
      }))
    ];
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sales, purchases, vouchers, expenses, rates]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      const matchesSearch = entry.desc.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            entry.type.includes(searchTerm);
      const matchesType = filterType === 'all' || entry.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [allEntries, searchTerm, filterType]);

  const handleDelete = () => {
    if (!deleteConfig) return;
    const { id, origin } = deleteConfig;
    if (origin === 'sale') deleteSale(id);
    else if (origin === 'purchase') deletePurchase(id);
    else if (origin === 'voucher') deleteVoucher(id);
    else if (origin === 'expense') deleteExpense(id);
    setDeleteConfig(null);
  };

  const typeStyles: Record<string, string> = {
    'بيع': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'شراء': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    [VoucherType.Receipt]: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    [VoucherType.Payment]: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    'مصروف': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-24 max-w-7xl mx-auto px-2 md:px-0">
      <ConfirmModal 
        isOpen={!!deleteConfig} 
        onClose={() => setDeleteConfig(null)} 
        onConfirm={handleDelete} 
      />
      
      {/* Premium Header */}
      <div className="bg-slate-900 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 p-16 opacity-5 pointer-events-none text-[8rem] md:text-[10rem] animate-float hidden md:block">📑</div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-right">
             <h2 className="text-3xl md:text-6xl font-black mb-2">اليومية العامة</h2>
             <p className="text-sm md:text-xl opacity-70 font-bold">سجل العمليات المترابط والمدقق مالياً</p>
          </div>
          <button onClick={() => window.print()} className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black text-base shadow-xl transition-all border border-white/20">
             🖨️ طباعة السجل
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="md:col-span-2 relative group">
          <input 
            type="text" 
            placeholder="بحث في البيان أو الطرف..." 
            className="w-full p-4 pr-12 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold dark:text-white transition-all shadow-inner text-right"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl opacity-40">🔍</span>
        </div>
        
        <div className="md:col-span-2 flex overflow-x-auto no-scrollbar gap-2">
           {['all', 'بيع', 'شراء', 'مصروف', VoucherType.Receipt, VoucherType.Payment].map(type => (
             <button 
               key={type}
               onClick={() => setFilterType(type)}
               className={`whitespace-nowrap px-4 py-2 rounded-xl font-black text-[10px] transition-all flex-1 ${filterType === type ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
             >
               {type === 'all' ? 'الكل' : type}
             </button>
           ))}
        </div>
      </div>

      {/* Enhanced Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border-2 border-slate-300 dark:border-slate-800 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="excel-table w-full text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <th className="p-4 text-right border-l border-slate-300 dark:border-slate-700 w-44">التاريخ والوقت</th>
                <th className="p-4 text-center border-l border-slate-300 dark:border-slate-700 w-28">النوع</th>
                <th className="p-4 text-right border-l border-slate-300 dark:border-slate-700">بيان العملية (التفاصيل)</th>
                <th className="p-4 text-center border-l border-slate-300 dark:border-slate-700 w-24">الحالة</th>
                <th className="p-4 text-left border-l border-slate-300 dark:border-slate-700 w-40">المبلغ (يمني)</th>
                <th className="p-4 text-center w-28">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredEntries.map((entry, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4 border-l border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-600 dark:text-slate-400">{new Date(entry.timestamp).toLocaleDateString('ar-YE')}</div>
                    <div className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleTimeString('ar-YE', {hour: '2-digit', minute: '2-digit'})}</div>
                  </td>
                  <td className="p-4 text-center border-l border-slate-200 dark:border-slate-800">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${typeStyles[entry.type]}`}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="p-4 text-right border-l border-slate-200 dark:border-slate-800 font-black text-slate-800 dark:text-slate-200">
                    {entry.desc}
                  </td>
                  <td className="p-4 text-center border-l border-slate-200 dark:border-slate-800">
                    <span className={`font-black text-xs px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-950/50 border ${entry.statusColor.replace('text', 'border').replace('-600', '-200')} ${entry.statusColor}`}>
                      {entry.status === 'له' ? '📥 له' : '📤 عليه'}
                    </span>
                  </td>
                  <td className="p-4 text-left border-l border-slate-200 dark:border-slate-800">
                    <div className={`text-lg font-black ${entry.statusColor}`}>
                      {entry.yerAmount.toLocaleString()} <span className="text-[10px] font-normal">ر.ي</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      {entry.receipt && (
                        <button onClick={() => setViewingReceipt(entry.receipt)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">📎</button>
                      )}
                      <button onClick={() => setDeleteConfig({ id: entry.id, origin: entry.origin })} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Cards Layout */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
           {filteredEntries.map((entry, idx) => (
             <div key={idx} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                   <div className="flex gap-2 items-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black ${typeStyles[entry.type]}`}>{entry.type}</span>
                      <span className="text-[9px] text-slate-400 font-bold">{new Date(entry.timestamp).toLocaleDateString('ar-YE')}</span>
                   </div>
                   <span className={`font-black text-[10px] ${entry.statusColor}`}>{entry.status === 'له' ? 'له (إيراد)' : 'عليه (مصروف)'}</span>
                </div>
                <div className="font-black text-slate-800 dark:text-white text-sm">{entry.desc}</div>
                <div className="flex justify-between items-center pt-2">
                   <div className={`text-xl font-black ${entry.statusColor}`}>
                      {entry.yerAmount.toLocaleString()} <span className="text-xs">ر.ي</span>
                   </div>
                   <div className="flex gap-2">
                      {entry.receipt && <button onClick={() => setViewingReceipt(entry.receipt)} className="text-[10px] font-black text-indigo-500 border border-indigo-100 px-2 py-1 rounded">مرفق</button>}
                      <button onClick={() => setDeleteConfig({ id: entry.id, origin: entry.origin })} className="text-[10px] font-black text-rose-500 border border-rose-100 px-2 py-1 rounded">حذف</button>
                   </div>
                </div>
             </div>
           ))}
           {filteredEntries.length === 0 && (
              <div className="p-10 text-center opacity-30 italic">لا توجد عمليات تطابق البحث..</div>
           )}
        </div>
      </div>

      {/* Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setViewingReceipt(null)}></div>
          <div className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 my-auto">
             <div className="p-4 bg-slate-100 dark:bg-slate-800 flex justify-between items-center">
                <h3 className="font-black dark:text-white">📄 المرفق الرقمي</h3>
                <button onClick={() => setViewingReceipt(null)} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xl">✕</button>
             </div>
             <div className="p-4 bg-white dark:bg-black flex items-center justify-center min-h-[300px]">
                <img src={viewingReceipt} className="max-w-full max-h-[70vh] rounded-xl object-contain" alt="Receipt" />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalPage;
