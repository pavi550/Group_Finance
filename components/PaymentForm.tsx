
import React, { useState, useEffect } from 'react';
import { Member, PaymentRecord, GroupSettings } from '../types';
import { CheckCircle, Info, PiggyBank, ReceiptText, AlertTriangle, Landmark, CalendarClock, Target } from 'lucide-react';

interface PaymentFormProps {
  members: Member[];
  settings: GroupSettings;
  monthlySavingsTargets: Record<string, number>;
  onAdd: (record: PaymentRecord) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ members, settings, monthlySavingsTargets, onAdd }) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [savings, setSavings] = useState<number>(settings.monthlySavingsAmount);
  const [principal, setPrincipal] = useState(0);
  const [interest, setInterest] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // Determine current savings target based on selected month
  const currentTargetAmount = monthlySavingsTargets[month] !== undefined 
    ? monthlySavingsTargets[month] 
    : settings.monthlySavingsAmount;

  // Check if today is past the due date for the selected month
  const isLate = () => {
    if (!selectedMember) return false;
    
    const today = new Date();
    const currentMonthStr = today.toISOString().slice(0, 7);
    const dayOfMonth = today.getDate();
    
    // Prioritize member-specific due day over group setting
    const targetDueDay = selectedMember.dueDay || settings.dueDay;
    
    // If we are recording for the current month and today's day is past the due day
    return month === currentMonthStr && dayOfMonth > targetDueDay;
  };

  // When a member is selected, initialize the values based on their current profile
  useEffect(() => {
    if (selectedMember) {
      setSavings(currentTargetAmount);
      setPrincipal(0);
      setPenalty(0);
      const calculatedInterest = (selectedMember.currentLoanPrincipal * selectedMember.loanInterestRate) / 100;
      setInterest(calculatedInterest);
    } else {
      setInterest(0);
    }
  }, [selectedMemberId, members, month]); // Trigger when month changes too

  // Also specifically update savings when month changes if a member is selected
  useEffect(() => {
    if (selectedMemberId) {
       setSavings(currentTargetAmount);
    }
  }, [month]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      memberId: selectedMemberId,
      month,
      savings: savings,
      principalPaid: principal,
      interestPaid: interest,
      penalty: penalty,
      timestamp: new Date().toISOString()
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedMemberId('');
      setPrincipal(0);
      setPenalty(0);
      setInterest(0);
      setSavings(currentTargetAmount);
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-600 p-2 rounded-xl text-white">
              <ReceiptText size={24} />
            </div>
            <h2 className="text-2xl font-bold">Record Collection</h2>
          </div>
          <p className="text-slate-500">Log monthly savings, loan repayments, and penalties for members.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Member</label>
              <select 
                required
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                <option value="">Choose a member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} {m.currentLoanPrincipal > 0 ? `(Loan: ₹${m.currentLoanPrincipal.toLocaleString()})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Collection Month</label>
              <input 
                type="month" 
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              {monthlySavingsTargets[month] !== undefined && (
                <p className="flex items-center gap-1.5 mt-1 text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                  <Target size={12} />
                  Custom target set for this month
                </p>
              )}
            </div>
          </div>

          {selectedMember && isLate() && (
            <div className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
              <CalendarClock className="text-red-600 shrink-0" size={24} />
              <div>
                <p className="text-sm font-black text-red-900 uppercase tracking-tighter">Late Payment Warning</p>
                <p className="text-xs text-red-700 font-medium">Today is past the {selectedMember.dueDay || settings.dueDay}th. Consider adding a penalty below.</p>
              </div>
            </div>
          )}

          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <div className="flex items-start gap-4 mb-4">
              <PiggyBank className="text-emerald-600 shrink-0" size={20} />
              <div>
                <p className="text-sm text-emerald-800 font-bold">Monthly Savings Contribution</p>
                <p className="text-xs text-emerald-600 mt-0.5">Required savings for {new Date(month + "-01").toLocaleDateString(undefined, { month: 'long', year: 'numeric'})}.</p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700 font-bold">₹</span>
              <input 
                type="number" 
                className="w-full p-3 pl-8 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold text-emerald-900"
                value={savings}
                onChange={(e) => setSavings(Number(e.target.value))}
              />
            </div>
          </div>

          {selectedMember && (
            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border">
              <h3 className="font-bold text-slate-700">Loan & Penalty Particulars</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Interest Due (Editable)</label>
                  {selectedMember.currentLoanPrincipal > 0 ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input 
                        type="number"
                        className="w-full p-3 pl-7 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-white font-black text-slate-900"
                        value={interest}
                        onChange={(e) => setInterest(Number(e.target.value))}
                      />
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 ml-1">{selectedMember.loanInterestRate}% Standard Rate</p>
                    </div>
                  ) : (
                    <div className="bg-slate-100 p-3 rounded-xl border border-dashed flex items-center gap-2 text-slate-400 italic text-xs">
                      <Landmark size={14} />
                      No Active Loan
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Principal Repayment</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input 
                      type="number" 
                      placeholder="Amount"
                      max={selectedMember.currentLoanPrincipal}
                      disabled={selectedMember.currentLoanPrincipal === 0}
                      className="w-full p-3 pl-7 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-bold disabled:bg-slate-100 disabled:text-slate-400"
                      value={principal || ''}
                      onChange={(e) => setPrincipal(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Late Payment Penalty</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 font-bold">₹</span>
                    <input 
                      type="number" 
                      placeholder="Add penalty amount if paid after due date"
                      className={`w-full p-3 pl-7 rounded-xl border outline-none focus:ring-2 bg-white font-bold ${penalty > 0 ? 'border-red-500 ring-2 ring-red-50 text-red-600' : 'border-slate-200 focus:ring-emerald-500 text-slate-700'}`}
                      value={penalty || ''}
                      onChange={(e) => setPenalty(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t flex justify-between items-center">
                <div>
                  <span className="block font-bold text-slate-500 text-xs uppercase tracking-widest">Total Collection</span>
                  <p className="text-slate-400 text-[10px] font-medium italic">Member Due Date: {selectedMember.dueDay || settings.dueDay}th</p>
                </div>
                <span className="text-3xl font-black text-emerald-600">
                  ₹{(savings + principal + interest + penalty).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={!selectedMemberId || submitted}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
              submitted ? 'bg-emerald-500 cursor-default' : 'bg-slate-900 hover:bg-slate-800 shadow-xl'
            }`}
          >
            {submitted ? (
              <><CheckCircle size={20} /> Collection Recorded!</>
            ) : (
              'Confirm & Save Collection'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
