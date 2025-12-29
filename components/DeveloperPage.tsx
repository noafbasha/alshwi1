
import React from 'react';
import { useNavigate } from 'react-router-dom';

const DeveloperPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-['Tajawal'] flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-4xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.2)] border-2 border-white dark:border-slate-800 overflow-hidden animate-in zoom-in duration-700">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-8 left-8 w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all z-20"
        >
          ✕
        </button>

        <div className="flex flex-col md:flex-row items-stretch">
          {/* Visual Profile Side */}
          <div className="md:w-1/3 bg-gradient-to-br from-emerald-600 to-green-800 p-12 flex flex-col items-center justify-center text-white text-center">
            <div className="w-40 h-40 md:w-56 md:h-56 bg-white/20 backdrop-blur-md rounded-[3.5rem] flex items-center justify-center text-7xl md:text-9xl mb-8 border-4 border-white/30 shadow-2xl animate-float">
              👨‍💻
            </div>
            <h2 className="text-4xl font-black mb-2 tracking-tighter">م. عبدالكريم الجعفري</h2>
            <p className="text-sm font-bold opacity-80 uppercase tracking-[0.2em]">Software Architect & AI Engineer</p>
          </div>

          {/* Details Side */}
          <div className="md:w-2/3 p-10 md:p-20 space-y-12 text-right">
            <div className="space-y-4">
              <span className="text-xs font-black text-emerald-600 dark:text-brandGreen uppercase tracking-[0.4em] block">About the Developer</span>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
                عبدالكريم <br/> الجعفري
              </h1>
              <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl">
                متخصص في بناء الأنظمة السحابية والذكاء الاصطناعي، أؤمن أن التكنولوجيا يجب أن تخدم الإنسان وتجعل حياته أسهل، بلمسة جمالية يمنية أصيلة.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ContactCard 
                icon="📱" 
                title="رقم التواصل" 
                value="779816860" 
                href="tel:779816860"
              />
              <ContactCard 
                icon="📧" 
                title="البريد الإلكتروني" 
                value="alkarime0@gmail.com" 
                href="mailto:alkarime0@gmail.com"
              />
            </div>

            <div className="flex flex-wrap gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
               <a 
                 href="https://wa.me/967779816860" 
                 className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-xl transition-all flex items-center justify-center gap-4 active:scale-95"
               >
                 <span>💬</span> راسلني على واتساب
               </a>
            </div>

            <div className="pt-4 text-center">
               <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.5em]">Crafted with passion by Al-Jafari Solutions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactCard = ({ icon, title, value, href }: any) => (
  <a 
    href={href} 
    className="block p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-transparent hover:border-emerald-500 transition-all group"
  >
    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</div>
    <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{value}</div>
  </a>
);

export default DeveloperPage;
