
import React, { useState, useMemo } from 'react';
import { GroupData, AuthUser, Member } from '../types';
import { ArrowUpRight, TrendingUp, UserCog, History, Receipt, FileText, X } from 'lucide-react';
import LoanLedger from './LoanLedger';

const SummaryView: React.FC<{ data: GroupData; authUser: AuthUser }> = ({ data, authUser }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedLedgerMember, setSelectedLedgerMember] = useState<Member | null>(null);

  const isAdmin = authUser.role === 'ADMIN';

  const filteredRecords = useMemo(() => {
    let records = data.records;
    if (!isAdmin) {
      records = records.filter(r => r.memberId === authUser.memberId);
    }
    return records.filter(r => r.month === selectedMonth);
  }, [data.records, selectedMonth, authUser, isAdmin]);

  const filteredAdminPayments = useMemo(() => {
    if (!isAdmin) return [];
    return data.adminPayments.filter(p => p.month === selectedMonth);
  }, [data.adminPayments, selectedMonth, isAdmin]);

  const filteredMiscPayments = useMemo(() => {
    if (!isAdmin) return [];
    return data.miscPayments.filter(p => p.month === selectedMonth);
  }, [data.miscPayments, selectedMonth, isAdmin]);

  const monthTotals = useMemo(() => {
    const collTotals = filteredRecords.reduce((acc, r) => ({
      savings: acc.savings + r.savings,
      principal: acc.principal + r.principalPaid,
      interest: acc.interest + r.interestPaid,
      penalty: acc.penalty + r.penalty,
      total: acc.total + (r.savings + r.principalPaid + r.interestPaid + r.penalty)
    }), { savings: 0, principal: 0, interest: 0, penalty: 0, total: 0 });

    const adminExp = filteredAdminPayments.reduce((acc, p) => acc + p.amount, 0);
    const miscExp = filteredMiscPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalExp = adminExp + miscExp;

    return {
      ...collTotals,
      expenses: totalExp,
      netMonthlyChange: collTotals.total - totalExp
    };
  }, [filteredRecords, filteredAdminPayments, filteredMiscPayments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{isAdmin ? 'Monthly Group Summary' : 'My Financial Statements'}</h2>
          <p className="text-slate-500">{isAdmin ? 'Overview of all collections and expenses for the month.' : 'Detailed breakdown of your monthly contributions.'}</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border">
          <input 
            type="month" 
            className="p-2 border-none outline-none text-sm font-bold bg-transparent"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <SummaryCard label="Growth Savings" value={`₹${monthTotals.savings.toLocaleString()}`} icon={TrendingUp} color="text-emerald-600" sub="Savings Corpus" />
        <SummaryCard label="Interests" value={`₹${monthTotals.interest.toLocaleString()}`} icon={ArrowUpRight} color="text-amber-600" sub="Loan Earnings" />
        <SummaryCard label="Principal Repay" value={`₹${monthTotals.principal.toLocaleString()}`} icon={ArrowUpRight} color="text-blue-600" sub="Loan Returns" />
        {isAdmin && (
           <SummaryCard label="Total Outflow" value={`₹${monthTotals.expenses.toLocaleString()}`} icon={Receipt} color="text-red-500" sub="Rewards & Misc" />
        )}
        <SummaryCard label={isAdmin ? "Net Flow" : "Net Paid"} value={`₹${isAdmin ? monthTotals.netMonthlyChange.toLocaleString() : monthTotals.total.toLocaleString()}`} icon={History} sub={isAdmin ? "Month Net Balance" : "Total This Month"} color="text-slate-600" />
      </div>

      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-lg">{isAdmin ? 'Inbound Collections' : 'My Contributions'} - {selectedMonth}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Member</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Growth (Savings)</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Principal</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Interest</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Penalty</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRecords.length > 0 ? filteredRecords.map(record => {
                const member = data.members.find(m => m.id === record.memberId);
                const net = record.savings + record.principalPaid + record.interestPaid + record.penalty;
                return (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{member?.name || 'Unknown'}</span>
                        {isAdmin && member && (
                          <button 
                            onClick={() => setSelectedLedgerMember(member)}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
                            title="View Statement"
                          >
                            <FileText size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">₹{record.savings}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">₹{record.principalPaid}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">₹{record.interestPaid}</td>
                    <td className="px-6 py-4 text-sm text-red-500">{record.penalty > 0 ? `₹${record.penalty}` : '-'}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">₹{net.toLocaleString()}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No collections for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && (filteredAdminPayments.length > 0 || filteredMiscPayments.length > 0) && (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden border-red-100">
           <div className="p-6 border-b flex items-center justify-between bg-red-50/30">
            <h3 className="font-bold text-lg text-red-800 flex items-center gap-2">
              <Receipt size={20} />
              Outbound Payments (Expenses) - {selectedMonth}
            </h3>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
              <thead className="bg-red-50/10 border-b">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Type</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Description</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Details</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAdminPayments.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 font-bold text-xs text-red-600 uppercase">Admin Reward</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{p.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{p.periodMonths} Months</td>
                    <td className="px-6 py-4 text-right font-black text-red-600">₹{p.amount.toLocaleString()}</td>
                  </tr>
                ))}
                {filteredMiscPayments.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 font-bold text-xs text-slate-600 uppercase">Misc Expense</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{p.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">One-time</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">₹{p.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
             </table>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {selectedLedgerMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <div className="absolute right-6 top-6 z-10">
               <button onClick={() => setSelectedLedgerMember(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 max-h-[85vh] overflow-y-auto">
               <LoanLedger member={selectedLedgerMember} data={data} onClose={() => setSelectedLedgerMember(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
      {Icon && <Icon className={`${color}`} size={16} />}
    </div>
    <p className={`text-xl font-black ${color}`}>{value}</p>
    {sub && <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{sub}</p>}
  </div>
);

export default SummaryView;
