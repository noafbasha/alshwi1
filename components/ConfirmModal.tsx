
import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
}

const ConfirmModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "تأكيد الحذف", 
  message = "هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذه العملية.",
  confirmLabel = "نعم، حذف نهائياً"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-t-[8px] border-rose-600 animate-in zoom-in duration-300 my-auto">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-4xl mx-auto text-rose-600 mb-4 animate-pulse">
            ⚠️
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
            {message}
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-6">
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="bg-rose-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-rose-700 active:scale-95 transition-all"
            >
              {confirmLabel}
            </button>
            <button 
              onClick={onClose}
              className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-2xl font-black text-lg transition-all"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
