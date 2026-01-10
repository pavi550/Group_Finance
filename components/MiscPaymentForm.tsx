
import React, { useState } from 'react';
import { MiscellaneousPayment } from '../types';
import { Receipt, CheckCircle, Info, CreditCard } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-slate-900 p-2 rounded-xl text-white">
              <Receipt size={24} />
            </div>
            <h2 className="text-2xl font-bold">Miscellaneous Payment</h2>
          </div>
          <p className="text-slate-500">Record any other group-related expenses or outgoing payments.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Record Month</label>
              <input 
                required 
                type="month" 
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input 
                  required 
                  type="number" 
                  placeholder="e.g. 500"
                  className="w-full p-3 pl-8 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description of Expense</label>
              <textarea 
                required
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                placeholder="e.g. Stationary, Meeting snacks, Bank charges..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border flex items-start gap-4">
            <CreditCard className="text-slate-400 shrink-0" size={20} />
            <div>
              <p className="text-sm text-slate-700 font-bold">Funds Usage</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Recording this payment will reduce the group's net liquid funds. Ensure you have the receipt or invoice for audit purposes.
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={amount === '' || amount <= 0 || !description.trim() || submitted}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
              submitted ? 'bg-emerald-500 cursor-default' : 'bg-slate-900 hover:bg-slate-800 shadow-xl'
            }`}
          >
            {submitted ? (
              <><CheckCircle size={20} /> Payment Logged!</>
            ) : (
              'Save Expense Record'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MiscPaymentForm;
