
import React, { useState } from 'react';
import { MiscellaneousPayment } from '../types';
import { Receipt, CheckCircle, Info, CreditCard, Calendar, ArrowRight } from 'lucide-react';

interface MiscPaymentFormProps {
  onAdd: (payment: MiscellaneousPayment) => void;
}

const MiscPaymentForm: React.FC<MiscPaymentFormProps> = ({ onAdd }) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0 || !description.trim()) return;

    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      month,
      amount: Number(amount),
      description: description.trim(),
      timestamp: new Date().toISOString()
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setAmount('');
      setDescription('');
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden bento-card">
        <div className="p-10 border-b bg-slate-50">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg shadow-slate-200">
              <Receipt size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Misc Expenditure</h2>
              <p className="text-slate-500 font-medium">Log group-related operational costs.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Spending Month</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required 
                  type="month" 
                  className="w-full p-4 pl-12 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Outflow Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</span>
                <input 
                  required 
                  type="number" 
                  placeholder="0"
                  className="w-full p-4 pl-10 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-black text-slate-900"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Purpose of Payment</label>
              <textarea 
                required
                className="w-full p-5 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all min-h-[120px] font-semibold text-slate-900"
                placeholder="e.g. Stationary, meeting hall rent, bank transactional charges..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-start gap-4">
            <div className="bg-white p-2 rounded-xl text-slate-400 shadow-sm">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-900 font-black uppercase tracking-tight">Funds Utilization</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                This transaction will immediately reduce the group's net liquid funds. Ensure physical receipts are stored for audit.
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={amount === '' || amount <= 0 || !description.trim() || submitted}
            className={`w-full py-5 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] ${
              submitted ? 'bg-emerald-600 shadow-emerald-100 cursor-default' : 'bg-slate-900 shadow-slate-200 hover:bg-black'
            }`}
          >
            {submitted ? (
              <><CheckCircle size={24} /> Expense Logged!</>
            ) : (
              <>Save Expenditure <ArrowRight size={24} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MiscPaymentForm;
