
import React, { useState } from 'react';
import { GroupData, AdminPayment, MiscellaneousPayment } from '../types';
import AdminPaymentForm from './AdminPaymentForm';
import MiscPaymentForm from './MiscPaymentForm';
import { UserCog, Receipt, ListFilter, History, TrendingDown, Clock, Sparkles } from 'lucide-react';

interface ExpenseManagerProps {
  data: GroupData;
  onAddAdminPayment: (p: AdminPayment) => void;
  onAddMiscPayment: (p: MiscellaneousPayment) => void;
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ data, onAddAdminPayment, onAddMiscPayment }) => {
  const [activeSubTab, setActiveSubTab] = useState<'admin' | 'misc'>('admin');

  const totalAdminExp = data.adminPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalMiscExp = data.miscPayments.reduce((sum, p) => sum + p.amount, 0);

  const recentExpenses = [...data.adminPayments.map(p => ({ ...p, type: 'Admin Reward' })), 
                          ...data.miscPayments.map(p => ({ ...p, type: 'Misc Expense' }))]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Expense Ledger</h2>
          <p className="text-slate-500 font-medium">Managing group outflows and administrative rewards.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveSubTab('admin')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeSubTab === 'admin' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <UserCog size={18} />
            Admin Reward
          </button>
          <button 
            onClick={() => setActiveSubTab('misc')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeSubTab === 'misc' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Receipt size={18} />
            Misc Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          {activeSubTab === 'admin' ? (
            <AdminPaymentForm onAdd={onAddAdminPayment} />
          ) : (
            <MiscPaymentForm onAdd={onAddMiscPayment} />
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm bento-card">
            <h3 className="font-extrabold text-xl text-slate-900 mb-6 flex items-center gap-2">
              <TrendingDown size={20} className="text-red-500" />
              Outflow Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl text-slate-400 shadow-sm"><UserCog size={18} /></div>
                  <span className="text-sm font-bold text-slate-600">Total Admin Rewards</span>
                </div>
                <span className="font-black text-slate-900">₹{totalAdminExp.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl text-slate-400 shadow-sm"><Receipt size={18} /></div>
                  <span className="text-sm font-bold text-slate-600">Total Misc Expenses</span>
                </div>
                <span className="font-black text-slate-900">₹{totalMiscExp.toLocaleString()}</span>
              </div>
              <div className="pt-4 mt-2 border-t border-dashed border-slate-200 flex items-center justify-between px-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Aggregate Outflow</span>
                <span className="text-2xl font-black text-red-500">₹{(totalAdminExp + totalMiscExp).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Clock size={80} /></div>
            <h3 className="text-xl font-extrabold mb-6 flex items-center gap-2 relative z-10">
              <History size={20} />
              Recent Outflows
            </h3>
            <div className="space-y-4 relative z-10">
              {recentExpenses.length > 0 ? recentExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">{exp.type}</p>
                    <p className="font-bold text-sm truncate max-w-[150px]">{exp.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-400">₹{exp.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{exp.month}</p>
                  </div>
                </div>
              )) : (
                <p className="text-slate-500 text-sm font-medium italic py-10 text-center">No outflows recorded yet.</p>
              )}
            </div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-start gap-4">
            <Sparkles className="text-emerald-500 shrink-0" size={24} />
            <div>
              <p className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">Financial Tip</p>
              <p className="text-xs text-emerald-600 font-medium leading-relaxed">
                Aim to keep miscellaneous expenses under 5% of total interest earnings to maintain high group profitability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseManager;
