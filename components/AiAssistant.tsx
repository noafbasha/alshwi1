
import React, { useState, useRef, useEffect } from 'react';
import { useAgency } from '../context/AgencyContext';
import { useLiveAssistant } from '../hooks/useLiveAssistant';
import { askBusinessAssistant, AssistantResponse } from '../services/geminiService';
import { Currency, PaymentStatus } from '../types';
import { useNotify } from '../context/NotificationContext';
import { formatDetailedStatement, formatInvoiceText, formatDailyReport, sendToWhatsApp } from '../services/messagingService';
import { useStats } from '../hooks/useStats';

const AiAssistant: React.FC = () => {
  const { sales, purchases, customers, suppliers, rates, vouchers, setIsAiOpen, addSale, updateCustomer, updateSupplier } = useAgency();
  const stats = useStats();
  const { notify } = useNotify();
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([{ id: '1', text: 'أهلاً يا مدير! اطلب مني إرسال كشف حساب، أو فاتورة، أو تسجيل مديونية سابقة.', sender: 'bot', timestamp: new Date() }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isLoading]);

  const handleActionDetected = (action: any) => setPendingAction(action);
  const { isLiveActive, startSession, stopSession } = useLiveAssistant(handleActionDetected);

  const executeAction = async () => {
    if (!pendingAction) return;
    const { name, args } = pendingAction;
    try {
      if (name === 'send_communication_command') {
        const entity = [...customers, ...suppliers].find(e => e.name.includes(args.entityName));
        if (entity) {
           const text = args.commType === 'كشف' ? formatDetailedStatement(entity.name, 'customer', []) : formatInvoiceText(sales[0]);
           sendToWhatsApp(entity.phone || '', text);
           notify(`تمت المعالجة والإرسال لـ ${entity.name}`, 'success');
        }
      }
      else if (name === 'add_sale_command') {
        await addSale({
          id: `ai-${Date.now()}`, date: new Date().toISOString(), customerName: args.customerName,
          qatType: args.qatType, quantity: args.quantity, unitPrice: args.unitPrice,
          total: args.quantity * args.unitPrice, currency: args.currency || Currency.YER,
          status: String(args.status).includes('آجل') ? PaymentStatus.Credit : PaymentStatus.Cash, customerId: ''
        });
        notify('تم تسجيل البيع الذكي ✅', 'success');
      }
    } catch (e) { notify('فشل التنفيذ الذكي', 'error'); }
    setPendingAction(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = { id: Date.now().toString(), text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true); setInput('');
    try {
      const result = await askBusinessAssistant(input, { stats, rates });
      if (result.functionCalls) result.functionCalls.forEach(handleActionDetected);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: result.text, sender: 'bot', timestamp: new Date() }]);
    } catch (error) { notify('خطأ في الاتصال الذكي', 'error'); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setIsAiOpen(false)}></div>
      <div className="relative w-full max-w-4xl h-full md:h-[85vh] bg-white dark:bg-slate-900 rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Chat Header - Responsive */}
        <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-2xl md:text-3xl ${isLiveActive ? 'bg-red-500 animate-pulse' : 'bg-emerald-600 shadow-lg shadow-emerald-600/20'}`}>
                {isLiveActive ? '🎙️' : '🧠'}
              </div>
              <div>
                <h3 className="text-lg md:text-2xl font-black">الشويع Smart Comm</h3>
                <p className="text-[9px] md:text-xs font-bold opacity-60 uppercase tracking-widest">{isLiveActive ? 'استماع مباشر...' : 'بانتظار أمرك يا مدير'}</p>
              </div>
           </div>
           <button onClick={() => setIsAiOpen(false)} className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl hover:bg-white/20 transition-all">✕</button>
        </div>

        {/* Chat Body */}
        <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar bg-slate-50 dark:bg-slate-950/20">
          {messages.map((msg: any) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-5 md:p-6 rounded-[1.8rem] md:rounded-[2.5rem] text-sm md:text-xl font-bold shadow-sm max-w-[85%] ${msg.sender === 'user' ? 'bg-emerald-700 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-brandGreen animate-pulse font-black px-4 text-xs md:text-lg">🧠 المستشار يحلل البيانات...</div>}
          <div ref={scrollRef}></div>
        </div>

        {/* Chat Input - Massive for Touch */}
        <div className="p-4 md:p-8 border-t dark:border-slate-800 bg-white dark:bg-slate-900 pb-10 md:pb-8">
          <div className="flex gap-3 md:gap-6 items-center">
             <button 
                onClick={() => isLiveActive ? stopSession() : startSession('أنت مساعد وكالة الشويع.')} 
                className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-xl transition-all active:scale-90 ${isLiveActive ? 'bg-red-500' : 'bg-emerald-700 text-white'}`}
             >
                {isLiveActive ? '⏹️' : '🎙️'}
             </button>
             <div className="flex-grow relative">
                <input 
                  className="w-full p-5 md:p-7 pr-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl md:rounded-3xl outline-none font-black text-base md:text-2xl dark:text-white focus:border-brandGreen transition-all" 
                  placeholder="اكتب أمرك هنا.." 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyPress={e => e.key === 'Enter' && handleSend()} 
                />
                <button onClick={handleSend} className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-950 dark:bg-emerald-600 text-white p-3 md:p-4 rounded-xl md:rounded-2xl font-black text-sm md:text-lg shadow-lg">إرسال</button>
             </div>
          </div>
        </div>

        {/* Confirmation Overlay */}
        {pendingAction && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 z-[300]">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-t-[10px] border-brandGreen animate-in zoom-in">
               <h3 className="text-xl md:text-3xl font-black mb-6 text-center">تأكيد العملية الذكية</h3>
               <div className="space-y-3 mb-8 bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700">
                  {Object.entries(pendingAction.args).map(([k, v]: any) => (
                    <div key={k} className="flex justify-between font-bold text-xs md:text-lg">
                       <span className="text-slate-400 capitalize">{k}:</span>
                       <span className="dark:text-white">{String(v)}</span>
                    </div>
                  ))}
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={executeAction} className="bg-brandGreen text-white py-5 rounded-2xl font-black text-lg md:text-2xl shadow-xl active:scale-95">تأكيد ✅</button>
                  <button onClick={() => setPendingAction(null)} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black text-lg">تجاهل</button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAssistant;
