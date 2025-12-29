
import React, { useState, useEffect, useRef } from 'react';
import { useAgency } from '../context/AgencyContext';
import { useNotify } from '../context/NotificationContext';
import { PaymentStatus, Purchase, Currency } from '../types';
import { scanInvoiceWithAi } from '../services/geminiService';
import { fileToBase64 } from '../services/audioUtils';
import ConfirmModal from './ConfirmModal';
import SearchableSelect from './SearchableSelect';

const PurchasesPage: React.FC = () => {
  const { suppliers, purchases, addPurchase, deletePurchase, qatTypes, rates } = useAgency();
  const { notify } = useNotify();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    supplierId: '',
    qatType: '',
    quantity: 0,
    costPrice: 0,
    currency: Currency.YER,
    status: PaymentStatus.Cash,
    notes: '',
    isReturn: false
  });

  useEffect(() => {
    if (qatTypes.length > 0 && !formData.qatType) {
      setFormData(prev => ({ ...prev, qatType: qatTypes[0] }));
    }
  }, [qatTypes]);

  const handleOcrScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    notify('جاري معالجة صورة الفاتورة ذكياً... 🔎', 'info');

    try {
      const base64 = await fileToBase64(file);
      const result = await scanInvoiceWithAi(base64);
      
      if (result.extractedData) {
        const data = result.extractedData;
        const foundSupplier = suppliers.find(s => s.name.includes(data.supplierName));
        
        setFormData(prev => ({
          ...prev,
          supplierId: foundSupplier?.id || '',
          quantity: data.quantity || 0,
          costPrice: data.totalCost ? (data.totalCost / (data.quantity || 1)) : 0,
          notes: `مسح ذكي: ${data.supplierName || 'غير معروف'}`,
          currency: (data.currency?.includes('SAR') ? Currency.SAR : data.currency?.includes('OMR') ? Currency.OMR : Currency.YER)
        }));
        notify('تم استخراج البيانات بنجاح! يرجى التأكد من صحتها قبل الحفظ.', 'success');
      }
    } catch (err) {
      notify('فشل المسح الذكي. يرجى إدخل البيانات يدوياً.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find(s => s.id === formData.supplierId);
    if (!supplier) return notify('يرجى اختيار مورد', 'error');
    if (!formData.qatType) return notify('يرجى اختيار صنف قات', 'error');
    
    const totalCost = formData.quantity * formData.costPrice;
    const newPurchase: Purchase = {
      id: `pur-${Date.now()}`,
      date: new Date().toISOString(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      ...formData,
      totalCost
    };

    await addPurchase(newPurchase);
    notify(`تم تسجيل ${formData.isReturn ? 'مرتجع للمورد' : 'توريد من'} ${supplier.name} بنجاح ✅`, 'success');
    setFormData({ ...formData, quantity: 0, costPrice: 0, notes: '', isReturn: false });
  };

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto px-2 md:px-0">
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={() => deleteId && deletePurchase(deleteId)} 
      />

      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[1.5rem] md:rounded-[3rem] shadow-sm border border-indigo-100 dark:border-indigo-900/30 gap-4 md:gap-6">
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 md:p-5 rounded-xl md:rounded-3xl text-2xl md:text-4xl shadow-inner animate-float shrink-0">📦</div>
          <div>
            <h2 className="text-xl md:text-4xl font-black text-slate-800 dark:text-white">المشتريات والتوريد</h2>
            <p className="text-[10px] md:text-xl text-slate-500 font-bold">تسجيل حمولات القات الواردة والمرتجعة</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <input type="file" ref={fileInputRef} onChange={handleOcrScan} accept="image/*" className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="flex-grow md:flex-grow-0 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-lg shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isScanning ? '⏳ جاري المسح..' : '✨ مسح الفاتورة'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 md:gap-10">
        <div className="xl:col-span-2">
          <div className={`bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[3rem] shadow-2xl p-6 md:p-10 border-t-[8px] md:border-t-[12px] sticky top-[72px] md:top-[130px] z-30 transition-all duration-500 ${formData.isReturn ? 'border-amber-600' : 'border-indigo-600'}`}>
            <div className="flex justify-between items-center mb-6 md:mb-8">
                <h3 className="text-lg md:text-2xl font-black flex items-center gap-3">
                  <span>{formData.isReturn ? '🔄' : '🚛'}</span> {formData.isReturn ? 'مرتجع للمورد' : 'توريد حمولة'}
                </h3>
                <button onClick={() => setFormData({...formData, isReturn: !formData.isReturn})} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-black">
                   {formData.isReturn ? 'إلغاء المرتجع' : 'هل هو مرتجع؟'}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <SearchableSelect 
                label="المورد (التاجر)"
                placeholder="-- اختر المورد --"
                options={suppliers}
                value={formData.supplierId}
                onChange={(val) => setFormData({...formData, supplierId: val})}
              />

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 px-2">الصنف</label>
                  <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl outline-none font-bold dark:text-white shadow-inner" value={formData.qatType} onChange={e => setFormData({...formData, qatType: e.target.value})} required>
                    {qatTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 px-2">الحالة</label>
                  <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl outline-none font-bold dark:text-white shadow-inner" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as PaymentStatus})}>
                    <option value={PaymentStatus.Cash}>نقداً</option>
                    <option value={PaymentStatus.Credit}>آجل</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 px-2 text-center block">الكمية</label>
                  <input type="number" required className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl outline-none font-black text-2xl text-center dark:text-white shadow-inner" value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 px-2 text-center block">سعر التكلفة</label>
                  <input type="number" required className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl outline-none font-black text-2xl text-center dark:text-white shadow-inner" value={formData.costPrice || ''} onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value) || 0})} />
                </div>
              </div>

              <div className={`p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-xl text-center ${formData.isReturn ? 'bg-amber-900 text-white' : 'bg-indigo-900 text-white'}`}>
                 <div className="text-2xl md:text-4xl font-black">{(formData.quantity * formData.costPrice).toLocaleString()} <span className="text-xs font-normal opacity-50">{formData.currency}</span></div>
              </div>

              <button type="submit" className={`w-full py-5 md:py-6 rounded-2xl font-black text-lg md:text-2xl text-white shadow-2xl transition-all active:scale-95 ${formData.isReturn ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-700 hover:bg-indigo-800'}`}>
                💾 اعتماد التوريد
              </button>
            </form>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4 md:space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 md:p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
               <h3 className="text-base md:text-xl font-black">📑 سجل التوريدات الأخيرة</h3>
            </div>
            
            <div className="hidden md:block overflow-x-auto p-4">
               <table className="excel-table w-full">
                  <thead>
                    <tr>
                      <th className="text-right border-l dark:border-slate-800">المورد</th>
                      <th className="text-right border-l dark:border-slate-800">البيان</th>
                      <th className="text-left border-l dark:border-slate-800">التكلفة</th>
                      <th className="text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.slice(0, 10).map(p => (
                      <tr key={p.id} className={`${p.isReturn ? 'bg-amber-50/40 dark:bg-amber-900/10' : 'hover:bg-indigo-50/30'} transition-colors group`}>
                        <td className="p-5 border-l dark:border-slate-800">
                           <div className="flex items-center gap-3">
                                <span className="text-xl">{p.isReturn ? '🔄' : '🚛'}</span>
                                <div className="font-black text-lg">{p.supplierName}</div>
                           </div>
                        </td>
                        <td className="p-5 border-l dark:border-slate-800">
                           <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg text-xs font-black">{p.qatType}</span>
                           <span className="text-slate-400 font-black text-sm mr-2">× {p.quantity} حزمة</span>
                        </td>
                        <td className="p-5 text-left font-black text-xl text-indigo-600 border-l dark:border-slate-800">
                            {p.totalCost.toLocaleString()} <span className="text-xs font-normal">{p.currency}</span>
                        </td>
                        <td className="p-5 text-center">
                           <button onClick={() => setDeleteId(p.id)} className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition shadow-sm font-black text-xs">🗑️ حذف</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>

            <div className="md:hidden divide-y dark:divide-slate-800">
              {purchases.slice(0, 10).map(p => (
                <div key={p.id} className={`p-4 ${p.isReturn ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}`}>
                   <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                         <span className="text-lg">{p.isReturn ? '🔄' : '🚛'}</span>
                         <div>
                            <div className="font-black text-slate-900 dark:text-white text-sm">{p.supplierName}</div>
                            <div className="text-[9px] text-slate-400 font-bold">{new Date(p.date).toLocaleDateString('ar-YE')}</div>
                         </div>
                      </div>
                      <div className="font-black text-indigo-600 text-base">
                         {p.totalCost.toLocaleString()} <span className="text-[10px]">{p.currency}</span>
                      </div>
                   </div>
                   <div className="flex justify-between items-center">
                      <div className="flex gap-2 items-center">
                         <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[9px] font-black">{p.qatType}</span>
                         <span className="text-slate-400 text-[9px] font-black">{p.quantity} حزمة</span>
                      </div>
                      <button onClick={() => setDeleteId(p.id)} className="p-2 bg-red-100 text-red-600 rounded-lg font-black text-xs">🗑️ حذف</button>
                   </div>
                </div>
              ))}
              {purchases.length === 0 && <div className="p-10 text-center opacity-30 italic">لا توجد توريدات..</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasesPage;
