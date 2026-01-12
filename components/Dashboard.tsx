
import React, { useMemo, useState } from 'react';
import { GroupData, AuthUser, Member, GroupSettings } from '../types';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie, LineChart, Line, Legend
} from 'recharts';
import { 
  Wallet, Landmark, Receipt, AlertCircle, Sparkles, UserCircle, X, 
  TrendingUp, BarChart3, ChevronRight, FileText, UserCog, Clock, 
  AlertTriangle, CheckCircle2, FileBarChart, Edit2, Save, ArrowRight,
  ListFilter, Download
} from 'lucide-react';
import { getFinancialInsights } from '../services/geminiService';
import LoanLedger from './LoanLedger';

interface DashboardProps {
  data: GroupData;
  authUser: AuthUser;
  onOpenReport: () => void;
  onUpdateSettings: (settings: GroupSettings) => void;
  onNavigateToLoans?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, authUser, onOpenReport, onUpdateSettings, onNavigateToLoans }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [selectedLedgerMember, setSelectedLedgerMember] = useState<Member | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(data.settings.name);
  
  const isAdmin = authUser.role === 'ADMIN';

  const stats = useMemo(() => {
    const records = isAdmin 
      ? data.records 
      : data.records.filter(r => r.memberId === authUser.memberId);
    
    const totalSavings = records.reduce((acc, r) => acc + r.savings, 0);
    const totalInterest = records.reduce((acc, r) => acc + r.interestPaid, 0);
    const totalPenalty = records.reduce((acc, r) => acc + r.penalty, 0);
    const totalPrincipalReturned = records.reduce((acc, r) => acc + r.principalPaid, 0);
    
    const totalAdminExpenses = data.adminPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalMiscExpenses = data.miscPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalOutflow = totalAdminExpenses + totalMiscExpenses;
    
    const activeLoans = isAdmin
      ? data.members.reduce((acc, m) => acc + m.currentLoanPrincipal, 0)
      : data.members.find(m => m.id === authUser.memberId)?.currentLoanPrincipal || 0;

    const activeLoanCount = isAdmin
      ? data.members.filter(m => m.currentLoanPrincipal > 0).length
      : (data.members.find(m => m.id === authUser.memberId)?.currentLoanPrincipal || 0) > 0 ? 1 : 0;
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyCollection = records
      .filter(r => r.month === currentMonth)
      .reduce((acc, r) => acc + r.savings + r.principalPaid + r.interestPaid + r.penalty, 0);

    return {
      totalFunds: (totalSavings + totalInterest + totalPenalty + totalPrincipalReturned) - totalOutflow,
      activeLoans,
      activeLoanCount,
      interestEarned: totalInterest,
      monthlyCollection,
      growthSavings: totalSavings,
      expenses: totalOutflow
    };
  }, [data, authUser, isAdmin]);

  const chartData = useMemo(() => {
    const records = isAdmin 
      ? data.records 
      : data.records.filter(r => r.memberId === authUser.memberId);
      
    const months = Array.from(new Set(records.map(r => r.month))).sort();
    let cumulativeGrowth = 0;
    
    return months.map(m => {
      const monthlySavings = records.filter(r => r.month === m).reduce((a, b) => a + b.savings, 0);
      cumulativeGrowth += monthlySavings;
      return {
        month: m,
        growth: monthlySavings,
        cumulative: cumulativeGrowth,
        interest: records.filter(r => r.month === m).reduce((a, b) => a + b.interestPaid, 0),
      };
    });
  }, [data, authUser, isAdmin]);

  const paymentAlerts = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentDay = new Date().getDate();
    
    return data.members.map(member => {
      const hasPaidThisMonth = data.records.some(r => r.memberId === member.id && r.month === currentMonth);
      const isLoanActive = member.currentLoanPrincipal > 0;
      const targetDueDay = member.dueDay || data.settings.dueDay;
      
      let status: 'PAID' | 'PENDING' | 'OVERDUE' | 'NONE' = 'NONE';
      
      if (hasPaidThisMonth) {
        status = 'PAID';
      } else if (isLoanActive || data.settings.monthlySavingsAmount > 0) {
        status = currentDay > targetDueDay ? 'OVERDUE' : 'PENDING';
      }
      
      return { member, status, dueDay: targetDueDay };
    }).filter(alert => alert.status !== 'NONE' && (isAdmin || alert.member.id === authUser.memberId));
  }, [data, authUser, isAdmin]);

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    const res = await getFinancialInsights(data);
    setInsights(res);
    setLoadingInsights(false);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onUpdateSettings({ ...data.settings, name: newName.trim() });
    setIsRenaming(false);
  };

  const exportMasterData = () => {
    if (!isAdmin) return;

    const headers = ['Month', 'Member Name', 'Savings', 'Principal Paid', 'Interest Paid', 'Penalty', 'Total', 'Timestamp'];
    const rows = data.records.map(r => {
      const member = data.members.find(m => m.id === r.memberId);
      const total = r.savings + r.principalPaid + r.interestPaid + r.penalty;
      return [
        r.month,
        `"${member?.name || 'Deleted Member'}"`,
        r.savings,
        r.principalPaid,
        r.interestPaid,
        r.penalty,
        total,
        r.timestamp
      ];
    });

    rows.push([]);
    rows.push(['EXPENSE LOG']);
    rows.push(['Type', 'Month', 'Description', 'Amount', 'Timestamp']);
    data.adminPayments.forEach(p => {
      rows.push(['Admin Reward', p.month, `"${p.description}"`, p.amount, p.timestamp]);
    });
    data.miscPayments.forEach(p => {
      rows.push(['Misc Expense', p.month, `"${p.description}"`, p.amount, p.timestamp]);
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${data.settings.name}_Master_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="group relative">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isAdmin ? data.settings.name : `Welcome, ${authUser.name}`}
            </h2>
            {isAdmin && (
              <button 
                onClick={() => { setNewName(data.settings.name); setIsRenaming(true); }}
                className="p-2 bg-slate-100 text-slate-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-600 hover:text-white"
                title="Rename Group"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          <p className="text-slate-500 font-medium">
            {isAdmin ? 'Real-time group performance and savings growth.' : 'Your personal contributions and loan status.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <button 
                onClick={exportMasterData}
                className="flex items-center gap-2 bg-white border-2 border-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-semibold shadow-sm hover:bg-slate-50 transition-all"
              >
                <Download size={18} />
                Master Export
              </button>
              <button 
                onClick={onOpenReport}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-slate-900/10 transition-all"
              >
                <FileBarChart size={18} />
                Financial Report
              </button>
              <button 
                onClick={handleGetInsights}
                disabled={loadingInsights}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
              >
                <Sparkles size={18} />
                {loadingInsights ? 'Analyzing...' : 'AI Insights'}
              </button>
            </>
          )}
        </div>
      </div>

      {isRenaming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b bg-slate-50">
              <h3 className="text-xl font-bold">Rename Group</h3>
              <p className="text-slate-500 text-sm">Choose a new identifying name for your savings group.</p>
            </div>
            <form onSubmit={handleSaveName} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">New Group Name</label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 outline-none transition-all font-bold text-lg"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Unity Savings Group"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsRenaming(false)}
                  className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Update Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {insights && isAdmin && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 text-emerald-900 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={20} className="text-emerald-600" />
            <h3 className="font-bold">AI Financial Advisor</h3>
          </div>
          <div className="whitespace-pre-wrap leading-relaxed text-sm opacity-90">{insights}</div>
          <button onClick={() => setInsights(null)} className="mt-4 text-xs font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700">Dismiss</button>
        </div>
      )}

      {/* Payment Alerts Section */}
      <div className="bg-white rounded-3xl border shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-blue-500" />
            <h3 className="font-bold text-lg">Current Month Activity Alerts</h3>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tracking Deadlines</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentAlerts.filter(a => a.status !== 'PAID').length > 0 ? (
            paymentAlerts.filter(a => a.status !== 'PAID').map(alert => (
              <div 
                key={alert.member.id} 
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.02] cursor-default ${
                  alert.status === 'OVERDUE' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${alert.status === 'OVERDUE' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {alert.status === 'OVERDUE' ? <AlertTriangle size={18} /> : <Clock size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{alert.member.name}</p>
                    <p className={`text-[10px] font-black uppercase tracking-tighter ${alert.status === 'OVERDUE' ? 'text-red-500' : 'text-blue-500'}`}>
                      {alert.status} - {alert.member.currentLoanPrincipal > 0 ? 'Loan + Savings' : 'Savings Only'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Expected</span>
                  <span className="text-sm font-black text-slate-900 italic">By {alert.dueDay}th</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center gap-3 text-emerald-700">
              <CheckCircle2 size={24} />
              <p className="font-bold">All payments up to date for this month!</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={TrendingUp} label={isAdmin ? "Total Growth Savings" : "My Growth Savings"} value={`₹${stats.growthSavings.toLocaleString()}`} color="emerald" tooltip="Monthly savings contributed for group growth, separate from loan repayments." />
        <StatCard icon={Wallet} label={isAdmin ? "Total Net Funds" : "Net Contribution"} value={`₹${stats.totalFunds.toLocaleString()}`} color="blue" tooltip="Total liquid funds after all disbursements and expenses." />
        {isAdmin ? (
          <StatCard icon={Receipt} label="Total Outflow" value={`₹${stats.expenses.toLocaleString()}`} color="slate" tooltip="Total rewards and miscellaneous expenses paid out." />
        ) : (
          <StatCard icon={Landmark} label="My Active Loan" value={`₹${stats.activeLoans.toLocaleString()}`} color="amber" />
        )}
        <StatCard icon={AlertCircle} label={isAdmin ? "Collection This Month" : "Current Payment"} value={`₹${stats.monthlyCollection.toLocaleString()}`} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Monthly Growth Chart */}
          <div className="bg-white p-8 rounded-3xl border shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 size={20} className="text-emerald-600" />
                  Monthly Contribution Activity
                </h3>
                <p className="text-slate-400 text-sm italic">Growth savings vs Interest income per month</p>
              </div>
            </div>
            <div className="h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      formatter={(value: any) => [`₹${value.toLocaleString()}`, '']}
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Area name="Monthly Growth Savings" type="monotone" dataKey="growth" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
                    <Area name="Interest Earnings" type="monotone" dataKey="interest" stroke="#fbbf24" strokeWidth={2} fill="none" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">No data available for visualization.</div>
              )}
            </div>
          </div>

          {/* Cumulative Contribution Growth Trend Chart */}
          <div className="bg-white p-8 rounded-3xl border shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-600" />
                  Accumulated Savings Corpus
                </h3>
                <p className="text-slate-400 text-sm italic">Total Contribution Growth trend over time</p>
              </div>
            </div>
            <div className="h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      formatter={(value: any) => [`₹${value.toLocaleString()}`, '']}
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      name="Cumulative Growth Savings" 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#3b82f6" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">No growth history found.</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border shadow-sm flex flex-col items-center text-center">
          {isAdmin ? (
            <>
              <div className="flex items-center justify-between w-full mb-8">
                <h3 className="text-xl font-bold text-left">Loan Portfolio</h3>
                {onNavigateToLoans && (
                  <button 
                    onClick={onNavigateToLoans}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all group"
                    title="View All Active Loans"
                  >
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>

              {/* Loan Summary Grid for Admin */}
              <div className="grid grid-cols-2 gap-4 w-full mb-8 text-left">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-slate-100/50">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Loans</span>
                  <span className="text-2xl font-black text-slate-900">{stats.activeLoanCount}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-slate-100/50">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Principal</span>
                  <span className="text-lg font-black text-emerald-600">₹{stats.activeLoans.toLocaleString()}</span>
                </div>
              </div>

              <div className="h-[200px] w-full relative">
                {data.members.some(m => m.currentLoanPrincipal > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.members.filter(m => m.currentLoanPrincipal > 0)} dataKey="currentLoanPrincipal" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5}>
                        {data.members.map((_, index) => <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#64748b', '#ec4899'][index % 5]} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">No active loans.</div>
                )}
              </div>
              <div className="mt-4 w-full space-y-3">
                {data.members.filter(m => m.currentLoanPrincipal > 0).map((m, i) => (
                  <button 
                    key={m.id} 
                    onClick={() => setSelectedLedgerMember(m)}
                    className="w-full group flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="text-left">
                      <span className="block text-xs font-bold text-slate-700 truncate group-hover:text-emerald-600 transition-colors">{m.name}</span>
                      <span className="block text-[10px] text-slate-400 uppercase font-black tracking-tighter">View Ledger</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs">₹{m.currentLoanPrincipal.toLocaleString()}</span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
              {isAdmin && data.members.some(m => m.currentLoanPrincipal > 0) && (
                <button 
                  onClick={onNavigateToLoans}
                  className="mt-6 w-full py-3 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <ListFilter size={14} />
                  Detailed Loans Table
                </button>
              )}
            </>
          ) : (
            <div className="space-y-6 w-full">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                <UserCircle size={48} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{authUser.name}</h3>
                <p className="text-sm text-slate-400">Member since {data.members.find(m => m.id === authUser.memberId)?.joiningDate}</p>
              </div>
              <div className="pt-4 border-t w-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Growth Savings</span>
                  <span className="text-sm font-bold text-emerald-600">₹{stats.growthSavings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Loan Interest Rate</span>
                  <span className="text-sm font-bold text-slate-900">{data.members.find(m => m.id === authUser.memberId)?.loanInterestRate}% Monthly</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase">Status</span>
                  <span className="text-sm font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full">Active</span>
                </div>
                <button 
                  onClick={() => setSelectedLedgerMember(data.members.find(m => m.id === authUser.memberId) || null)}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
                >
                  <FileText size={16} />
                  My Loan Ledger
                </button>
              </div>
            </div>
          )}
        </div>
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

const StatCard = ({ icon: Icon, label, value, color, tooltip }: { icon: any, label: string, value: string, color: string, tooltip?: string }) => {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
      <div className={`w-12 h-12 rounded-2xl ${colorMap[color]} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
        <Icon size={24} />
      </div>
      <div className="flex items-center gap-1 mb-1">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</p>
        {tooltip && (
          <div className="group/tip relative inline-block cursor-help">
            <div className="w-3 h-3 rounded-full border border-slate-300 text-[8px] flex items-center justify-center text-slate-400">?</div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-20">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <h4 className="text-2xl font-black text-slate-900">{value}</h4>
    </div>
  );
};

export default Dashboard;
