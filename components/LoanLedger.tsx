
import React, { useMemo } from 'react';
import { GroupData, Member } from '../types';
import { FileText, ArrowUpCircle, ArrowDownCircle, Info, Landmark, Percent, X } from 'lucide-react';

interface LoanLedgerProps {
  member: Member;
  data: GroupData;
  onClose?: () => void;
}

interface LedgerEntry {
  id: string;
  date: string;
  type: 'DISBURSEMENT' | 'REPAYMENT' | 'RATE_ADJUST';
  amount?: number;
  interest?: number;
  balance: number;
  description: string;
  meta?: any;
}

const LoanLedger: React.FC<LoanLedgerProps> = ({ member, data, onClose }) => {
  const ledgerEntries = useMemo(() => {
    const memberLoans = data.loansIssued.filter(l => l.memberId === member.id);
    const memberRepayments = data.records.filter(r => r.memberId === member.id && r.principalPaid > 0);
    const memberRateChanges = data.interestRateChanges.filter(c => c.memberId === member.id);

    const entries: LedgerEntry[] = [];
    let runningBalance = 0;

    // Combine and sort by date
    const allEvents = [
      ...memberLoans.map(l => ({ type: 'DISBURSEMENT', data: l, timestamp: new Date(l.date).getTime() })),
      ...memberRepayments.map(r => ({ type: 'REPAYMENT', data: r, timestamp: new Date(r.timestamp).getTime() })),
      ...memberRateChanges.map(c => ({ type: 'RATE_ADJUST', data: c, timestamp: new Date(c.date).getTime() }))
    ].sort((a, b) => a.timestamp - b.timestamp);

    allEvents.forEach(event => {
      if (event.type === 'DISBURSEMENT') {
        const l = event.data as any;
        runningBalance += l.amount;
        entries.push({
          id: l.id,
          date: l.date,
          type: 'DISBURSEMENT',
          amount: l.amount,
          balance: runningBalance,
          description: `Loan Issued (${l.interestRate}% Interest)`
        });
      } else if (event.type === 'REPAYMENT') {
        const r = event.data as any;
        runningBalance -= r.principalPaid;
        entries.push({
          id: r.id,
          date: r.timestamp,
          type: 'REPAYMENT',
          amount: r.principalPaid,
          interest: r.interestPaid,
          balance: runningBalance,
          description: `Repayment for ${r.month}`
        });
      } else if (event.type === 'RATE_ADJUST') {
        const c = event.data as any;
        entries.push({
          id: c.id,
          date: c.date,
          type: 'RATE_ADJUST',
          balance: runningBalance,
          description: `Interest Adjusted: ${c.oldRate}% → ${c.newRate}%`,
          meta: c.reason
        });
      }
    });

    return entries.reverse(); // Newest first
  }, [member, data]);

  return (
    <div className="bg-white rounded-2xl overflow-hidden border shadow-sm">
      <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
            <Landmark size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Loan Statement: {member.name}</h3>
            <p className="text-xs text-slate-500 font-medium">Historical transaction trail for all loan activities.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding Balance</p>
          <p className="text-xl font-black text-slate-900">₹{member.currentLoanPrincipal.toLocaleString()}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Amount (₹)</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">New Balance (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ledgerEntries.length > 0 ? ledgerEntries.map(entry => (
              <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-2 text-xs font-bold ${
                    entry.type === 'DISBURSEMENT' ? 'text-amber-600' : 
                    entry.type === 'REPAYMENT' ? 'text-emerald-600' : 'text-blue-600'
                  }`}>
                    {entry.type === 'DISBURSEMENT' ? <ArrowUpCircle size={14} /> : 
                     entry.type === 'REPAYMENT' ? <ArrowDownCircle size={14} /> : <Percent size={14} />}
                    {entry.type.replace('_', ' ')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-700">{entry.description}</p>
                  {entry.interest && entry.interest > 0 && (
                    <p className="text-[10px] text-slate-400 font-medium">+ ₹{entry.interest} Interest Paid</p>
                  )}
                  {entry.meta && (
                    <p className="text-[10px] text-blue-500 font-bold italic">Note: {entry.meta}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {entry.amount !== undefined ? (
                    <span className={`text-sm font-black ${entry.type === 'DISBURSEMENT' ? 'text-slate-900' : 'text-emerald-600'}`}>
                      {entry.type === 'DISBURSEMENT' ? '+' : '-'} ₹{entry.amount.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">Rate Update Only</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                  ₹{entry.balance.toLocaleString()}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                  No loan history available for this member.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-6 bg-slate-50 border-t flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-slate-400 mt-0.5 shrink-0" />
          <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
            Note: Monthly interest calculations are based on the principal at the time of collection. 
            Interest payments do not reduce the outstanding principal balance.
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            <X size={14} />
            Close Statement
          </button>
        )}
      </div>
    </div>
  );
};

export default LoanLedger;
