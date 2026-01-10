
import React, { useState } from 'react';
import { Member, GroupData } from '../types';
import { UserPlus, Search, Phone, Calendar, CreditCard, Trash2, Edit, FileText, X, Percent, CheckCircle, ShieldAlert } from 'lucide-react';
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
  
  const [formData, setFormData] = useState<Partial<Member>>({
    name: '',
    phone: '',
    currentLoanPrincipal: 0,
    loanInterestRate: 0,
    loanCap: 50000
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
        loanInterestRate: 0,
        loanCap: formData.loanCap || 50000
      } as Member);
    }
    setFormData({ name: '', phone: '', currentLoanPrincipal: 0, loanInterestRate: 0, loanCap: 50000 });
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

  const startAdjust = (m: Member) => {
    setAdjustingMember(m);
    setAdjustData({ rate: m.loanInterestRate, reason: 'Manual adjustment' });
  };

  const filteredMembers = data.members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Group Members</h2>
          <p className="text-slate-500">Manage membership and active loan profiles.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ name: '', phone: '', currentLoanPrincipal: 0, loanInterestRate: 0, loanCap: 50000 });
            setIsAdding(true);
          }}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <UserPlus size={18} />
          Add Member
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by name or phone..." 
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Member Info</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Current Balance</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Loan Cap</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Interest</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredMembers.map(member => (
              <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{member.name}</p>
                      <p className="text-sm text-slate-400">{member.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${member.currentLoanPrincipal > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    ₹{member.currentLoanPrincipal.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-1 text-slate-600 font-bold text-xs">
                     <ShieldAlert size={12} className="text-slate-400" />
                     ₹{member.loanCap.toLocaleString()}
                   </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">{member.loanInterestRate}% / mo</span>
                    {member.currentLoanPrincipal > 0 && (
                      <button onClick={() => startAdjust(member)} className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition-colors" title="Adjust Rate">
                        <Percent size={14} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setSelectedLedgerMember(member)} title="View Ledger" className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors">
                      <FileText size={16} />
                    </button>
                    <button onClick={() => startEdit(member)} title="Edit Member" className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => onDelete(member.id)} title="Delete Member" className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interest Adjust Modal */}
      {adjustingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b bg-emerald-50">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-emerald-600 p-2 rounded-xl text-white">
                  <Percent size={20} />
                </div>
                <h3 className="text-xl font-bold">Adjust Interest Rate</h3>
              </div>
              <p className="text-emerald-700 text-sm">Member: <span className="font-bold">{adjustingMember.name}</span></p>
            </div>
            <form onSubmit={handleAdjustSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">New Monthly Rate (%)</label>
                <input 
                  required 
                  type="number" 
                  step="0.1"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  value={adjustData.rate}
                  onChange={(e) => setAdjustData({...adjustData, rate: Number(e.target.value)})}
                />
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Current Rate: {adjustingMember.loanInterestRate}%</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Adjustment Reason</label>
                <textarea 
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px]"
                  placeholder="e.g. Loyalty discount, Special agreement..."
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({...adjustData, reason: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setAdjustingMember(null)}
                  className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all"
                >
                  Apply Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {selectedLedgerMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="absolute right-6 top-6 z-10">
               <button onClick={() => setSelectedLedgerMember(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 max-h-[85vh] overflow-y-auto">
               <LoanLedger member={selectedLedgerMember} data={data} />
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b bg-slate-50">
              <h3 className="text-xl font-bold">{editingId ? 'Edit Member' : 'New Member Registration'}</h3>
              <p className="text-slate-500 text-sm">Fill in the primary details to register or update a member.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Enter member name"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number</label>
                  <input 
                    required 
                    type="tel" 
                    placeholder="Enter mobile number"
                    className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 outline-none transition-all font-semibold"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Maximum Loan Cap (Limit)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input 
                      required 
                      type="number" 
                      placeholder="e.g. 50000"
                      className="w-full p-3 pl-8 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                      value={formData.loanCap}
                      onChange={(e) => setFormData({...formData, loanCap: Number(e.target.value)})}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Prevents issuing loans exceeding this amount.</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setIsAdding(false); setEditingId(null); }}
                  className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                >
                  {editingId ? 'Save Changes' : 'Register Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManager;
