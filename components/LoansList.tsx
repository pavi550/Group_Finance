
import React, { useMemo, useState } from 'react';
import { GroupData, Member } from '../types';
import { HandCoins, ArrowUpDown, ArrowUp, ArrowDown, Search, UserCircle, Calendar, ShieldAlert, FileText, X } from 'lucide-react';
import LoanLedger from './LoanLedger';

interface LoansListProps {
  data: GroupData;
}

type SortField = 'name' | 'amount' | 'date';
type SortDir = 'asc' | 'desc';

const LoansList: React.FC<LoansListProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('amount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedLedgerMember, setSelectedLedgerMember] = useState<Member | null>(null);

  const activeLoans = useMemo(() => {
    return data.members
      .filter(m => m.currentLoanPrincipal > 0)
      .map(member => {
        // Find the latest disbursement date for this member
        const latestDisbursement = [...data.loansIssued]
          .filter(l => l.memberId === member.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        return {
          ...member,
          disbursementDate: latestDisbursement?.date || member.joiningDate
        };
      });
  }, [data.members, data.loansIssued]);

  const sortedLoans = useMemo(() => {
    let result = activeLoans.filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'amount') {
        comparison = a.currentLoanPrincipal - b.currentLoanPrincipal;
      } else if (sortField === 'date') {
        comparison = new Date(a.disbursementDate).getTime() - new Date(b.disbursementDate).getTime();
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [activeLoans, searchTerm, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortButton = ({ field, label }: { field: SortField, label: string }) => (
    <button 
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1.5 hover:text-slate-900 transition-colors group"
    >
      {label}
      {sortField === field ? (
        sortDir === 'asc' ? <ArrowUp size={14} className="text-emerald-600" /> : <ArrowDown size={14} className="text-emerald-600" />
      ) : (
        <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 text-slate-300" />
      )}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Group Loans</h2>
          <p className="text-slate-500 font-medium">Consolidated view of all outstanding member credits.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100 font-black text-sm">
             Total Outstanding: ₹{activeLoans.reduce((acc, l) => acc + l.currentLoanPrincipal, 0).toLocaleString()}
           </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by member name..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <SortButton field="name" label="Member" />
              </th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <SortButton field="amount" label="Outstanding Principal" />
              </th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Rate & Limits
              </th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <SortButton field="date" label="Last Disbursed" />
              </th>
              <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedLoans.map(member => {
              const utilPercent = (member.currentLoanPrincipal / member.loanCap) * 100;
              return (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{member.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{member.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-lg font-black text-slate-900">₹{member.currentLoanPrincipal.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Current Debt</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                         <HandCoins size={12} />
                         {member.loanInterestRate}% / mo
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                         <ShieldAlert size={12} />
                         Cap: ₹{member.loanCap.toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <Calendar size={14} className="text-slate-300" />
                      {new Date(member.disbursementDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => setSelectedLedgerMember(member)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-bold transition-all"
                    >
                      <FileText size={14} />
                      Statement
                    </button>
                  </td>
                </tr>
              );
            })}
            {sortedLoans.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                      <HandCoins size={48} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-400">No active loans found.</h3>
                      <p className="text-sm text-slate-300">Start by issuing a new loan to a member.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

export default LoansList;
