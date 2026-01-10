
import React, { useState } from 'react';
import { Member, GroupSettings } from '../types';
import { HandCoins, CheckCircle, Info, Landmark, CalendarClock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface LoanIssueFormProps {
  members: Member[];
  settings: GroupSettings;
  onIssue: (memberId: string, amount: number, interestRate: number) => void;
}

const LoanIssueForm: React.FC<LoanIssueFormProps> = ({ members, settings, onIssue }) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [interestRate, setInterestRate] = useState<number>(settings.defaultInterestRate);
  const [submitted, setSubmitted] = useState(false);

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const isOverCap = selectedMember && amount !== '' && (selectedMember.currentLoanPrincipal + Number(amount)) > selectedMember.loanCap;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !amount || amount <= 0 || isOverCap) return;

    onIssue(selectedMemberId, Number(amount), interestRate);

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedMemberId('');
      setAmount('');
      setInterestRate(settings.defaultInterestRate);
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-slate-900 p-2 rounded-xl text-white">
              <HandCoins size={24} />
            </div>
            <h2 className="text-2xl font-bold">Issue New Loan</h2>
          </div>
          <p className="text-slate-500">Grant credit to members within their defined borrowing limits.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Recipient Member</label>
              <select 
                required
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                <option value="">Select a member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} {m.currentLoanPrincipal > 0 ? `(Debt: ₹${m.currentLoanPrincipal.toLocaleString()})` : '(No debt)'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Loan Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input 
                  required 
                  type="number" 
                  placeholder="e.g. 5000"
                  className={`w-full p-3 pl-8 rounded-xl border outline-none focus:ring-2 ${isOverCap ? 'border-red-300 ring-red-50 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500'}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Interest (%)</label>
              <input 
                required 
                type="number" 
                step="0.1"
                placeholder="e.g. 2"
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
              />
            </div>
          </div>

          {isOverCap && (
            <div className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
              <AlertTriangle className="text-red-600 shrink-0" size={24} />
              <div>
                <p className="text-sm font-black text-red-900 uppercase tracking-tighter">Exceeds Loan Cap</p>
                <p className="text-xs text-red-700 font-medium leading-tight">
                  This loan would put the member ₹{((selectedMember!.currentLoanPrincipal + Number(amount)) - selectedMember!.loanCap).toLocaleString()} over their ₹{selectedMember!.loanCap.toLocaleString()} limit.
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-6 rounded-3xl border-2 border-dashed border-blue-200 flex items-start gap-4">
            <CalendarClock className="text-blue-600 shrink-0 mt-1" size={24} />
            <div>
              <p className="text-sm text-blue-900 font-black uppercase tracking-tighter">Fixed Repayment Schedule</p>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed font-medium">
                Note: Repayments are due on the <span className="font-black underline">{settings.dueDay}th of every month</span>. Interest starts accruing for the current cycle.
              </p>
            </div>
          </div>

          {selectedMember && (
            <div className={`space-y-3 p-6 rounded-2xl border transition-colors ${isOverCap ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-slate-700 text-sm">Loan Preview</h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase">
                  <ShieldCheck size={10} />
                  Limit: ₹{selectedMember.loanCap.toLocaleString()}
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Current Balance</span>
                <span className="font-semibold text-slate-700">₹{selectedMember.currentLoanPrincipal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">New Disbursement</span>
                <span className={`font-semibold ${isOverCap ? 'text-red-600' : 'text-emerald-600'}`}>+ ₹{Number(amount || 0).toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="font-bold text-slate-900">Projected Outstanding</span>
                <span className={`text-lg font-black ${isOverCap ? 'text-red-600' : 'text-slate-900'}`}>
                  ₹{(selectedMember.currentLoanPrincipal + Number(amount || 0)).toLocaleString()}
                </span>
              </div>
              
              {amount !== '' && (
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                   <div 
                    className={`h-full transition-all duration-500 ${isOverCap ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, ((selectedMember.currentLoanPrincipal + Number(amount)) / selectedMember.loanCap) * 100)}%` }}
                   />
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            disabled={!selectedMemberId || amount === '' || amount <= 0 || submitted || isOverCap}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
              submitted ? 'bg-emerald-500 cursor-default' : 
              (isOverCap ? 'bg-slate-300 cursor-not-allowed opacity-70' : 'bg-slate-900 hover:bg-slate-800 shadow-xl')
            }`}
          >
            {submitted ? (
              <><CheckCircle size={20} /> Loan Disbursed!</>
            ) : (
              isOverCap ? 'Cannot Exceed Limit' : 'Confirm & Issue Loan'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoanIssueForm;
