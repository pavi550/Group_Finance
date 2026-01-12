
import React, { useState, useMemo } from 'react';
import { Member, GroupData } from '../types';
import { UserPlus, Search, Phone, Calendar, CreditCard, Trash2, Edit, FileText, X, Percent, CheckCircle, ShieldAlert, ArrowUpDown, ArrowUp, ArrowDown, CalendarClock } from 'lucide-react';
import LoanLedger from './LoanLedger';

interface MemberManagerProps {
  data: GroupData;
  onAdd: (m: Member) => void;
  onUpdate: (m: Member) => void;
  onDelete: (id: string) => void;
  onAdjustInterest: (memberId: string, newRate: number, reason: string) => void;
}

const MemberManager: React.FC<MemberManagerProps> = ({ data, onAdd, onUpdate, onDelete, onAdjustInterest }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adjustingMember, setAdjustingMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLedgerMember, setSelectedLedgerMember] = useState<Member | null>(null);
  const [sortDir, setSortDir] = useState<'none' | 'asc' | 'desc'>('none');
  
  const [formData, setFormData] = useState<Partial<Member>>({
    name: '',
    phone: '',
    currentLoanPrincipal: 0,
    loanInterestRate: data.settings.defaultInterestRate,
    loanCap: 50000,
    dueDay: undefined
  });

  const [adjustData, setAdjustData] = useState({
    rate: 0,
    reason: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate({ ...formData as Member, id: editingId });
      setEditingId(null);
    } else {
      onAdd({
        ...formData as Member,
        id: Math.random().toString(36).substr(2, 9),
        joiningDate: new Date().toISOString().split('T')[0],
        currentLoanPrincipal: 0,
        loanInterestRate: formData.loanInterestRate || data.settings.defaultInterestRate,
        loanCap: formData.loanCap || 50000,
        dueDay: formData.dueDay || undefined
      } as Member);
    }
    setFormData({ name: '', phone: '', currentLoanPrincipal: 0, loanInterestRate: data.settings.defaultInterestRate, loanCap: 50000, dueDay: undefined });
    setIsAdding(false);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustingMember) {
      onAdjustInterest(adjustingMember.id, adjustData.rate, adjustData.reason);
      setAdjustingMember(null);
      setAdjustData({ rate: 0, reason: '' });
    }
  };

  const startEdit = (m: Member) => {
    setFormData(m);
    setEditingId(m.id);
    setIsAdding(true);
  };

  const toggleSort = () => {
    if (sortDir === 'none') setSortDir('asc');
    else if (sortDir === 'asc') setSortDir('desc');
    else setSortDir('none');
  };

  const sortedMembers = useMemo(() => {
    let members = data.members.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.phone.includes(searchTerm)
    );

    if (sortDir !== 'none') {
      members = [...members].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return sortDir === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    }
    return members;
  }, [data.members, searchTerm, sortDir]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Group Roster</h2>
          <p className="text-slate-500 font-medium">Managing {data.members.length} active group participants.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ name: '', phone: '', currentLoanPrincipal: 0, loanInterestRate: data.settings.defaultInterestRate, loanCap: 50000, dueDay: undefined });
            setIsAdding(true);
          }}
          className="flex items-center gap-2 bg-slate-900 text-white px-7 py-3.5 rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
        >
          <UserPlus size={20} />
          Register Member
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search by identity or phone..." 
          className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all font-semibold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden bento-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <button onClick={toggleSort} className="flex items-center gap-1.5 hover:text-slate-900">
                    Member Identity
                    {sortDir === 'asc' ? <ArrowUp size={12} /> : sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUpDown size={12} />}
                  </button>
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Portfolio Balance</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Deadline</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Interest</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-lg shadow-sm">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-400 font-bold">+91 {member.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-black ${member.currentLoanPrincipal > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-400'}`}>
                      ₹{member.currentLoanPrincipal.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-slate-600 text-sm">
                    {member.dueDay || data.settings.dueDay}th
                  </td>
                  <td className="px-8 py-5 text-right font-black text-emerald-600 text-sm">
                    {member.loanInterestRate}%
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <ActionButton onClick={() => setSelectedLedgerMember(member)} icon={FileText} color="text-slate-400 hover:bg-slate-100" />
                      <ActionButton onClick={() => startEdit(member)} icon={Edit} color="text-blue-500 hover:bg-blue-50" />
                      <ActionButton onClick={() => onDelete(member.id)} icon={Trash2} color="text-red-400 hover:bg-red-50" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reused Ledgers and Modals benefit from global style improvements */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 border border-slate-100">
            <div className="p-10 border-b bg-slate-50/50">
              <h3 className="text-2xl font-extrabold text-slate-900">{editingId ? 'Update Record' : 'Member Onboarding'}</h3>
              <p className="text-slate-500 font-medium mt-1 text-sm">Identity and financial caps for this participant.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
               <div className="space-y-4">
                  <InputGroup label="Full Name" value={formData.name} onChange={(val) => setFormData({...formData, name: val})} />
                  <InputGroup label="Mobile" value={formData.phone} onChange={(val) => setFormData({...formData, phone: val.replace(/\D/g, '')})} type="tel" />
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Due Date" value={formData.dueDay || ''} onChange={(val) => setFormData({...formData, dueDay: Number(val)})} type="number" />
                    <InputGroup label="Loan Cap (₹)" value={formData.loanCap} onChange={(val) => setFormData({...formData, loanCap: Number(val)})} type="number" />
                  </div>
               </div>
               <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">Dismiss</button>
                  <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 active:scale-95 transition-all">
                    {editingId ? 'Commit Changes' : 'Initialize Member'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
      
      {selectedLedgerMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 relative border border-slate-100 custom-scrollbar">
            <button onClick={() => setSelectedLedgerMember(null)} className="absolute right-8 top-8 z-10 p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all"><X size={24}/></button>
            <div className="p-10"><LoanLedger member={selectedLedgerMember} data={data} onClose={() => setSelectedLedgerMember(null)} /></div>
          </div>
        </div>
      )}
    </div>
  );
};

const ActionButton = ({ onClick, icon: Icon, color }: any) => (
  <button onClick={onClick} className={`p-2.5 rounded-xl transition-all active:scale-90 ${color}`}>
    <Icon size={18} />
  </button>
);

const InputGroup = ({ label, value, onChange, type = "text" }: any) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
    <input 
      type={type} 
      className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold text-slate-900"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default MemberManager;