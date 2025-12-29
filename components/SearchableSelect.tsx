
import React, { useState, useRef, useEffect } from 'react';

interface Option {
  id: string;
  name: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  className?: string;
}

const SearchableSelect: React.FC<Props> = ({ options, value, onChange, placeholder, label, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value);
  const filteredOptions = options.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: Option) => {
    onChange(option.id);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="text-[10px] font-black text-slate-400 uppercase px-2 mb-1 block">{label}</label>}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-800 border-2 md:border-4 border-transparent hover:border-emerald-500/30 rounded-2xl md:rounded-3xl outline-none font-black text-lg md:text-xl dark:text-white shadow-inner cursor-pointer flex justify-between items-center transition-all ${isOpen ? 'border-emerald-500 shadow-lg' : ''}`}
      >
        <span className={selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <input 
              autoFocus
              type="text"
              placeholder="ابحث هنا..."
              className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl outline-none font-bold dark:text-white border border-slate-200 dark:border-slate-700 focus:border-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto no-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div 
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  className={`p-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer font-black text-right transition-colors ${value === option.id ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400' : 'dark:text-slate-200'}`}
                >
                  {option.name}
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-400 font-bold italic">لا توجد نتائج مطابقة..</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
