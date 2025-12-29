
import React, { useEffect, useState } from 'react';
import { Sale, Currency, PaymentStatus } from '../types';
import { formatSaleMessage, sendToWhatsApp } from '../services/messagingService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    type: 'sale' | 'voucher';
    mood: 'joy' | 'concern';
    data: any;
    title: string;
    amount: number;
    currency: Currency;
    entityName: string;
  } | null;
}

const Confetti: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: ['#4ade80', '#fbbf24', '#3b82f6', '#f87171'][Math.floor(Math.random() * 4)],
            animationDuration: `${Math.random() * 3 + 2}s`,
            opacity: 0.5
          }}
        />
      ))}
    </div>
  );
};

const TransactionSuccessModal: React.FC<Props> = ({ isOpen, onClose, transaction }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && transaction?.mood === 'joy') {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const handleWhatsApp = () => {
    let msg = "";
    if (transaction.type === 'sale') {
      msg = formatSaleMessage(transaction.data as Sale);
    } else {
      msg = `*🌿 وكالة الشويع للقات*\n*سند ${transaction.title}*\n--------------------------\n👤 *الجهة:* ${transaction.entityName}\n💰 *المبلغ:* ${transaction.amount.toLocaleString()} ${transaction.currency}\n📅 *التاريخ:* ${new Date().toLocaleString('ar-YE')}\n--------------------------\nتم قيد العملية بنجاح.`;
    }
    const phone = transaction.data?.phone || '777000000';
    sendToWhatsApp(phone, msg);
  };

  const getMoodStyles = () => {
    if (transaction.mood === 'joy') {
      return {
        bg: 'from-green-600 to-emerald-700',
        icon: '🥳',
        message: 'كفو يا مدير! 💰',
        border: 'border-green-500',
        animation: 'animate-bounce'
      };
    }
    return {
      bg: 'from-orange-500 to-amber-700',
      icon: '😟',
      message: 'انتبه! دين جديد 📋',
      border: 'border-orange-500',
      animation: 'animate-shake'
    };
  };

  const styles = getMoodStyles();

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border-4 ${styles.border} my-auto max-h-[90vh] overflow-y-auto no-scrollbar`}>
        {showConfetti && <Confetti />}

        <div className={`p-6 md:p-10 bg-gradient-to-br ${styles.bg} text-white text-center relative overflow-hidden`}>
          <div className="relative z-10">
            <div className={`w-16 h-16 md:w-24 md:h-24 bg-white/20 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-4xl md:text-6xl mx-auto mb-4 md:mb-6 shadow-2xl ${styles.animation}`}>
              {styles.icon}
            </div>
            <h3 className="text-xl md:text-3xl font-black mb-1 leading-tight">{styles.message}</h3>
            <p className="opacity-90 font-bold text-sm md:text-lg">{transaction.title}</p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6 md:space-y-8 relative z-10">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-2 border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-2 md:mb-4">
              <span className="text-slate-400 font-black text-[10px] md:text-xs uppercase tracking-widest">الجهة</span>
              <span className="text-base md:text-xl font-black dark:text-white truncate max-w-[150px]">{transaction.entityName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-black text-[10px] md:text-xs uppercase tracking-widest">المبلغ</span>
              <span className={`text-2xl md:text-4xl font-black ${transaction.mood === 'joy' ? 'text-green-600' : 'text-orange-600'}`}>
                {transaction.amount.toLocaleString()} <span className="text-xs md:text-sm font-normal">{transaction.currency}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={handleWhatsApp}
              className={`w-full ${transaction.mood === 'joy' ? 'bg-green-600' : 'bg-orange-600'} hover:opacity-90 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2 md:gap-3`}
            >
              <span>{transaction.mood === 'joy' ? '🟢' : '🟠'}</span> مشاركة واتساب
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => window.print()} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-3 md:py-4 rounded-xl md:rounded-2xl font-black hover:bg-slate-200 transition text-sm md:text-base">🖨️ طباعة</button>
              <button onClick={onClose} className="bg-slate-900 dark:bg-slate-700 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black hover:bg-black transition text-sm md:text-base">إغلاق</button>
            </div>
          </div>
        </div>

        <div className="p-3 text-center bg-slate-50 dark:bg-slate-800/30 text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          ذكاء وكالة الشويع المحاسبي ✨ {new Date().toLocaleTimeString('ar-YE')}
        </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default TransactionSuccessModal;
