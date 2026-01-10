
import React, { useState } from 'react';
import { AdminPayment } from '../types';
import { UserCog, CheckCircle, Info, Landmark } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-slate-900 p-2 rounded-xl text-white">
              <UserCog size={24} />
            </div>
            <h2 className="text-2xl font-bold">Admin Work Reward</h2>
          </div>
          <p className="text-slate-500">Record payments made to the group administrator for their service.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Processing Month</label>
              <input 
                required 
                type="month" 
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (Months)</label>
              <select 
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                value={periodMonths}
                onChange={(e) => setPeriodMonths(Number(e.target.value))}
              >
                <option value={1}>Monthly</option>
                <option value={3}>Quarterly (3 months)</option>
                <option value={6}>Half-Yearly (6 months)</option>
                <option value={12}>Yearly (12 months)</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Total Payment Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input 
                  required 
                  type="number" 
                  placeholder="e.g. 2000"
                  className="w-full p-3 pl-8 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description / Note</label>
              <input 
                type="text" 
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Annual admin fee 2024"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start gap-4">
            <Landmark className="text-amber-600 shrink-0" size={20} />
            <div>
              <p className="text-sm text-amber-800 font-bold">Corpus Deduction</p>
              <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                This amount will be deducted from the group's net liquid funds and recorded as an expense in the ledger.
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={amount === '' || amount <= 0 || submitted}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
              submitted ? 'bg-emerald-500 cursor-default' : 'bg-slate-900 hover:bg-slate-800 shadow-xl'
            }`}
          >
            {submitted ? (
              <><CheckCircle size={20} /> Payment Recorded!</>
            ) : (
              'Confirm Admin Payment'
            )}
          </button>
        </form>
      </div>
      
      <div className="mt-8 p-6 bg-slate-100 rounded-2xl border border-slate-200 flex items-start gap-4">
        <Info className="text-slate-400 shrink-0" size={20} />
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          Admin rewards are typically paid out of the group's interest earnings. Ensure the group consensus supports the payment amount and frequency.
        </p>
      </div>
    </div>
  );
};

export default AdminPaymentForm;
