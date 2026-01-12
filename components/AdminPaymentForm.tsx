
import React, { useState } from 'react';
import { AdminPayment } from '../types';
// Fixed: Added missing ArrowRight icon to the import list
import { UserCog, CheckCircle, Info, Landmark, Calendar, Sparkles, ArrowRight } from 'lucide-react';

interface AdminPaymentFormProps {
  onAdd: (payment: AdminPayment) => void;
}

const AdminPaymentForm: React.FC<AdminPaymentFormProps> = ({ onAdd }) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('Admin work reward');
  const [periodMonths, setPeriodMonths] = useState(1);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      month,
      amount: Number(amount),
      description,
      periodMonths,
      timestamp: new Date().toISOString()
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setAmount('');
      setDescription('Admin work reward');
      setPeriodMonths(1);
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden bento-card">
        <div className="p-10 border-b bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={80} /></div>
          <div className="flex items-center gap-4 mb-2 relative z-10">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
              <UserCog size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Maintenance Reward</h2>
              <p className="text-slate-400 font-medium">Log compensation for administrative services.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Processing Cycle</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required 
                  type="month" 
                  className="w-full p-4 pl-12 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Duration Period</label>
              <select 
                className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-900 appearance-none"
                value={periodMonths}
                onChange={(e) => setPeriodMonths(Number(e.target.value))}
              >
                <option value={1}>Single Month</option>
                <option value={3}>Quarterly (3 Months)</option>
                <option value={6}>Half-Yearly (6 Months)</option>
                <option value={12}>Annual (12 Months)</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Total Compensation (₹)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">₹</span>
                <input 
                  required 
                  type="number" 
                  placeholder="0.00"
                  className="w-full p-6 pl-12 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none transition-all font-black text-3xl text-slate-900"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Reference Note</label>
              <input 
                type="text" 
                className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                placeholder="e.g. Service fee for the period ending Dec 2024"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600 shrink-0">
              <Landmark size={20} />
            </div>
            <div>
              <p className="text-sm text-amber-900 font-black uppercase tracking-tight">Ledger Impact</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed font-medium">
                Submitting this will record a deduction from the group's net liquid cash. This is permanent and will reflect in the monthly audit report.
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={amount === '' || amount <= 0 || submitted}
            className={`w-full py-5 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] ${
              submitted ? 'bg-emerald-600 shadow-emerald-100 cursor-default' : 'bg-slate-900 shadow-slate-200 hover:bg-black'
            }`}
          >
            {submitted ? (
              <><CheckCircle size={24} /> Reward Recorded!</>
            ) : (
              <>Record Admin Reward <ArrowRight size={24} /></>
            )}
          </button>
        </form>
      </div>
      
      <div className="mt-8 p-6 bg-white rounded-[2rem] border border-slate-100 flex items-start gap-4 shadow-sm">
        <Info className="text-slate-300 shrink-0" size={20} />
        <p className="text-xs text-slate-500 leading-relaxed font-semibold italic">
          Best Practice: Rewards should be discussed during the monthly meeting and logged only after majority consensus. Ensure the corpus can support the payout without affecting loan liquidity.
        </p>
      </div>
    </div>
  );
};

export default AdminPaymentForm;
