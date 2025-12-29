
import React, { useState } from 'react';
import { useAgency } from '../context/AgencyContext';
import { UserRole } from '../types';
import { useNotify } from '../context/NotificationContext';

const UsersPage: React.FC = () => {
  const { team, auditLogs, updateUserRole, profile, can } = useAgency();
  const { notify } = useNotify();
  const [activeTab, setActiveTab] = useState<'team' | 'logs'>('team');

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (userId === profile?.id) return notify('لا يمكنك تغيير دورك بنفسك!', 'warning');
    updateUserRole(userId, newRole);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32 px-2 md:px-0">
      <div className="bg-white dark:bg-slate-900 p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] shadow-xl border-b-8 border-indigo-600">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-6 text-right">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-5 rounded-3xl text-4xl shadow-inner">👥</div>
              <div>
                 <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white leading-none">إدارة الفريق والرقابة</h2>
                 <p className="text-sm md:text-xl text-slate-500 font-bold mt-2">تنظيم الصلاحيات وتتبع النشاطات اليومية</p>
              </div>
           </div>
           <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border dark:border-slate-700">
              <button onClick={() => setActiveTab('team')} className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${activeTab === 'team' ? 'bg-white dark:bg-slate-700 text-indigo-700 shadow-md' : 'text-slate-400'}`}>أعضاء الفريق</button>
              <button onClick={() => setActiveTab('logs')} className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${activeTab === 'logs' ? 'bg-white dark:bg-slate-700 text-indigo-700 shadow-md' : 'text-slate-400'}`}>سجل الرقابة</button>
           </div>
        </div>
      </div>

      {activeTab === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map(member => (
            <div key={member.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border-2 border-slate-100 dark:border-slate-800 group hover:border-indigo-500 transition-all relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-inner">👤</div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${member.role === UserRole.Admin ? 'bg-rose-100 text-rose-700' : member.role === UserRole.Accountant ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {member.role}
                  </span>
               </div>
               <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-1 text-right">{member.full_name}</h4>
               <p className="text-slate-400 font-bold text-sm mb-6 text-right">{member.email}</p>
               
               {can('manage_users') && (
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-right">تعديل الصلاحية</label>
                    <select 
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold dark:text-white"
                    >
                      <option value={UserRole.Admin}>مدير عام</option>
                      <option value={UserRole.Accountant}>محاسب</option>
                      <option value={UserRole.Salesperson}>موظف مبيعات</option>
                    </select>
                 </div>
               )}
            </div>
          ))}
          {can('manage_users') && (
            <button className="bg-slate-50 dark:bg-slate-800/30 border-4 border-dashed border-slate-200 dark:border-slate-700 p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-indigo-500 transition-all group">
               <span className="text-5xl group-hover:scale-110 transition-transform">➕</span>
               <span className="font-black text-slate-400 group-hover:text-indigo-600">إضافة موظف جديد</span>
            </button>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] shadow-xl border-2 border-slate-300 dark:border-slate-800 overflow-hidden">
           <div className="overflow-x-auto p-4">
              <table className="excel-table w-full">
                 <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                       <th className="p-4 text-right border">الوقت</th>
                       <th className="p-4 text-right border">المستخدم</th>
                       <th className="p-4 text-center border">الحدث</th>
                       <th className="p-4 text-right border">التفاصيل</th>
                    </tr>
                 </thead>
                 <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                         <td className="p-4 border font-bold text-slate-400 text-xs">{new Date(log.timestamp).toLocaleString('ar-YE')}</td>
                         <td className="p-4 border font-black text-indigo-600">{log.userName}</td>
                         <td className="p-4 border text-center">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[10px] font-black">{log.action}</span>
                         </td>
                         <td className="p-4 border font-bold dark:text-slate-200">{log.details}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
