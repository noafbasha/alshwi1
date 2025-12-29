
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAgency } from '../context/AgencyContext';
import { useNotify } from '../context/NotificationContext';
import { QatType, Currency, Sale } from '../types';
import TransactionSuccessModal from './TransactionSuccessModal';
import { generateVoiceReminder } from '../services/ttsService';
import { convertAudioDataToBuffer } from '../services/audioUtils';
import SearchableSelect from './SearchableSelect';

type ViewMode = 'cards' | 'table';

const DebtsPage: React.FC = () => {
  const { debts, recordVoucher, customers, rates, sales } = useAgency();
  const { notify } = useNotify();
  const location = useLocation();
  
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; transaction: any } | null>(null);
  const [voucherData, setVoucherData] = useState({ 
    entityId: '', 
    entityType: 'customer' as 'customer' | 'supplier', 
    amount: 0, 
    currency: Currency.YER,
    notes: '' 
  });

  useEffect(() => {
    if (location.state?.openVoucher) {
      setIsVoucherOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.state]);

  const handleGenerateVoice = async (debt: any) => {
    setIsGeneratingVoice(true);
    try {
      const balanceText = Object.entries(debt.balances)
        .filter(([_, val]) => val !== 0)
        .map(([cur, val]) => `${(val as number).toLocaleString()} ${cur}`)
        .join(' و ');

      const prompt = `يا أستاذ ${debt.customerName}، حياك الله. تذكير ودي بخصوص رصيدك المتبقي وهو ${balanceText}. متى ما تيسر لك ننتظر تشريفك للتسديد. تسلم يا غالي.`;
      
      const audioData = await generateVoiceReminder(prompt);
      if (audioData) {
        // استخدام AudioContext لتشغيل بيانات PCM الخام (Raw PCM)
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await convertAudioDataToBuffer(audioData, audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
        
        notify('تم توليد وتشغيل المطالبة الصوتية بنجاح 🎙️', 'success');
      }
    } catch (e) {
      console.error(e);
      notify('فشل في توليد الصوت المخصص', 'error');
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const getAgingStatus = (lastActivity: string) => {
    const diff = Date.now() - new Date(lastActivity).getTime();
    const days = Math.floor(diff / (1000 * 3600 * 24));
    if (days < 3) return { label: 'جديد', color: 'bg-green-100 text-green-700', days };
    if (days < 15) return { label: 'نشط', color: 'bg-blue-100 text-blue-700', days };
    if (days < 30) return { label: 'متأخر', color: 'bg-amber-100 text-amber-700', days };
    return { label: 'راكد/خطر', color: 'bg-red-100 text-red-700', days };
  };

  const filteredDebts = useMemo(() => {
    return debts.filter(d => 
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    ).map(d => {
      const totalYer = (d.balances.YER || 0) + 
                       (d.balances.SAR || 0) * (rates.SAR || 430) + 
                       (d.balances.OMR || 0) * (rates.OMR || 425);
      return { ...d, totalYer };
    }).sort((a, b) => b.totalYer - a.totalYer);
  }, [debts, searchTerm, rates]);

  const handleVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherData.entityId || voucherData.amount <= 0) return notify('بيانات غير مكتملة', 'error');
    const customer = customers.find(c => c.id === voucherData.entityId);
    recordVoucher(voucherData.entityId, 'customer', voucherData.amount, 'receipt', voucherData.currency, voucherData.notes);
    setIsVoucherOpen(false);
    setSuccessModal({
      isOpen: true,
      transaction: {
        type: 'voucher', mood: 'joy', data: { phone: customer?.phone },
        title: 'سند قبض مالي (تسديد)', amount: voucherData.amount,
        currency: voucherData.currency, entityName: customer?.name || 'عميل غير معروف'
      }
    });
    notify(`تم تسجيل السند بنجاح`, 'success');
  };

  const totalGlobalYer = filteredDebts.reduce((sum, d) => sum + d.totalYer, 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      <TransactionSuccessModal isOpen={successModal?.isOpen || false} onClose={() => setSuccessModal(null)} transaction={successModal?.transaction || null} />

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 gap-6 transition-all print:hidden">
        <div className="flex items-center gap-6">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-5 rounded-3xl text-4xl shadow-inner">💰</div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-none">متابعة الديون والتحصيل</h2>
            <p className="text-slate-500 font-bold mt-1">إجمالي المديونية الحالية: <span className="text-rose-600">{totalGlobalYer.toLocaleString()} ر.ي</span></p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border dark:border-slate-700">
             <button 
                onClick={() => setViewMode('table')}
                className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-md' : 'text-slate-400'}`}
             >
               <span>📊</span> شبكة
             </button>
             <button 
                onClick={() => setViewMode('cards')}
                className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-md' : 'text-slate-400'}`}
             >
               <span>🗂️</span> بطاقات
             </button>
          </div>

          <div className="relative flex-grow">
            <input 
              type="text" 
              placeholder="ابحث عن عميل..." 
              className="w-full p-4 pr-12 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold border-2 focus:border-amber-500 dark:text-white transition-all shadow-inner text-right" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
          </div>

          <button onClick={() => setIsVoucherOpen(true)} className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-amber-700 transition flex items-center gap-2 whitespace-nowrap">
            <span>➕</span> قبض مالي
          </button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom duration-500">
           <div className="overflow-x-auto p-4">
              <table className="excel-table w-full border-2 border-slate-300 dark:border-slate-700">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="border border-slate-300 dark:border-slate-700 p-4 text-right">اسم العميل</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-4 text-center bg-slate-50/50">يمني (YER)</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-4 text-center bg-blue-50/30">سعودي (SAR)</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-4 text-center bg-indigo-50/30">عماني (OMR)</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-4 text-center bg-amber-50 dark:bg-amber-900/10 font-black text-amber-700">الإجمالي (باليمني)</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-4 text-center">الحالة</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-4 text-center print:hidden">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDebts.map(debt => {
                    const aging = getAgingStatus(debt.lastActivityDate);
                    return (
                      <tr key={debt.customerId} className="hover:bg-amber-50/30 dark:hover:bg-slate-800 transition-colors">
                        <td className="border border-slate-200 dark:border-slate-700 p-4 border-l">
                          <div className="font-black text-lg text-slate-900 dark:text-white">{debt.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-bold">آخر نشاط: {new Date(debt.lastActivityDate).toLocaleDateString('ar-YE')}</div>
                        </td>
                        <td className={`border border-slate-200 dark:border-slate-700 p-4 text-center font-black text-lg border-l ${debt.balances.YER > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-300'}`}>
                          {debt.balances.YER > 0 ? debt.balances.YER.toLocaleString() : '0'}
                        </td>
                        <td className={`border border-slate-200 dark:border-slate-700 p-4 text-center font-black text-lg border-l ${debt.balances.SAR > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                          {debt.balances.SAR > 0 ? debt.balances.SAR.toLocaleString() : '0'}
                        </td>
                        <td className={`border border-slate-200 dark:border-slate-700 p-4 text-center font-black text-lg border-l ${debt.balances.OMR > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                          {debt.balances.OMR > 0 ? debt.balances.OMR.toLocaleString() : '0'}
                        </td>
                        <td className="border border-slate-200 dark:border-slate-700 p-4 text-center bg-amber-50/30 dark:bg-amber-900/5 border-l">
                          <div className="font-black text-xl text-amber-700">{debt.totalYer.toLocaleString()}</div>
                          <span className="text-[9px] font-bold opacity-40">ريال يمني</span>
                        </td>
                        <td className="border border-slate-200 dark:border-slate-700 p-4 text-center border-l">
                          <span className={`px-4 py-1.5 rounded-xl font-black text-xs shadow-sm inline-block ${aging.color}`}>
                            {aging.label} ({aging.days} يوم)
                          </span>
                        </td>
                        <td className="border border-slate-200 dark:border-slate-700 p-4 text-center print:hidden">
                           <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => handleGenerateVoice(debt)}
                                className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition"
                                title="مطالبة صوتية"
                              >🎙️</button>
                              <button 
                                onClick={() => { setVoucherData({ ...voucherData, entityId: debt.customerId }); setIsVoucherOpen(true); }}
                                className="p-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-600 hover:text-white transition"
                                title="تحصيل مبلغ"
                              >📥</button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:hidden animate-in fade-in duration-500">
          {filteredDebts.map(debt => {
            const aging = getAgingStatus(debt.lastActivityDate);
            return (
              <div key={debt.customerId} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border-2 border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:border-amber-500 transition-all relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-br-[4rem] group-hover:scale-110 transition-transform"></div>
                 
                 <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:rotate-6 transition-transform">👤</div>
                      <span className={`px-4 py-1.5 rounded-full font-black text-[10px] shadow-sm ${aging.color}`}>{aging.label}</span>
                    </div>
                    
                    <div>
                      <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{debt.customerName}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">آخر نشاط: {new Date(debt.lastActivityDate).toLocaleDateString('ar-YE')}</p>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-transparent group-hover:border-amber-100 transition-all">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">صافي الرصيد المقيم باليمني</div>
                       <div className="text-4xl font-black text-rose-600 text-center tracking-tighter">
                          {debt.totalYer.toLocaleString()} <span className="text-sm font-normal">ر.ي</span>
                       </div>
                    </div>
                 </div>

                 <div className="mt-8 flex gap-3 relative z-10">
                    <button 
                      disabled={isGeneratingVoice}
                      onClick={() => handleGenerateVoice(debt)}
                      className="flex-grow bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 py-4 rounded-2xl font-black text-sm hover:bg-indigo-600 hover:text-white transition flex items-center justify-center gap-2"
                    >
                      {isGeneratingVoice ? '⏳' : '🎙️ مطالبة'}
                    </button>
                    <button onClick={() => { setVoucherData({ ...voucherData, entityId: debt.customerId }); setIsVoucherOpen(true); }} className="flex-grow bg-amber-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-amber-700 transition active:scale-95">📥 تحصيل</button>
                 </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Voucher Modal */}
      {isVoucherOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in border-4 border-amber-500/20 my-auto">
            <div className="p-10 bg-amber-600 text-white flex justify-between items-center">
              <h3 className="text-3xl font-black flex items-center gap-4"><span>📥</span> استلام دفعة مالية</h3>
              <button onClick={() => setIsVoucherOpen(false)} className="text-4xl hover:rotate-90 transition-transform">✕</button>
            </div>
            <form onSubmit={handleVoucherSubmit} className="p-10 space-y-8">
              <SearchableSelect 
                label="العميل المستلم منه"
                placeholder="-- اختر العميل --"
                options={customers}
                value={voucherData.entityId}
                onChange={(val) => setVoucherData({...voucherData, entityId: val})}
              />
              
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-4">العملة المسدد بها</label>
                <div className="flex gap-2">
                   {[Currency.YER, Currency.SAR, Currency.OMR].map(curr => (
                     <button
                        key={curr}
                        type="button"
                        onClick={() => setVoucherData({...voucherData, currency: curr})}
                        className={`flex-1 py-4 rounded-2xl font-black text-sm border-4 transition-all ${voucherData.currency === curr ? 'bg-amber-600 border-amber-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                     >
                       {curr}
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-4 text-center block">المبلغ المدفوع</label>
                <input type="number" required autoFocus className="w-full p-10 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border-4 border-transparent focus:border-amber-500 font-black text-6xl text-center dark:text-white shadow-inner" placeholder="0" value={voucherData.amount || ''} onChange={e => setVoucherData({...voucherData, amount: parseFloat(e.target.value) || 0})} />
              </div>

              <div className="space-y-4">
                 <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-4">ملاحظة (بيان السند)</label>
                 <input className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none font-bold dark:text-white focus:border-amber-500 shadow-inner" value={voucherData.notes} onChange={e => setVoucherData({...voucherData, notes: e.target.value})} placeholder="مثال: تسديد دفعة أمس.." />
              </div>

              <button type="submit" className="w-full bg-amber-600 text-white py-7 rounded-[2rem] font-black text-3xl shadow-2xl hover:bg-amber-700 transition active:scale-95 shadow-amber-600/30">
                ✅ اعتماد سند القبض
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtsPage;
