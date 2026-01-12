
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
  ListFilter, Download, HandCoins
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
    const totalOutflow = data.adminPayments.reduce((a, p) => a + p.amount, 0) + data.miscPayments.reduce((a, p) => a + p.amount, 0);
    const totalNewLoansDisbursed = data.loansIssued.reduce((acc, l) => acc + l.amount, 0);

    const activeLoans = isAdmin
      ? data.members.reduce((acc, m) => acc + m.currentLoanPrincipal, 0)
      : data.members.find(m => m.id === authUser.memberId)?.currentLoanPrincipal || 0;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyCollection = records
      .filter(r => r.month === currentMonth)
      .reduce((acc, r) => acc + r.savings + r.principalPaid + r.interestPaid + r.penalty, 0);

    const initialSavings = isAdmin ? (data.settings.initialGrowthSavings || 0) : 0;
    const initialCash = isAdmin ? (data.settings.initialNetFunds || 0) : 0;
    const newCollections = totalSavings + totalInterest + totalPenalty + totalPrincipalReturned;
    const adminNetFunds = initialCash + newCollections - totalOutflow - totalNewLoansDisbursed;

    return {
      totalFunds: isAdmin ? adminNetFunds : (totalSavings + totalInterest + totalPenalty + totalPrincipalReturned),
      activeLoans,
      interestEarned: totalInterest,
      monthlyCollection,
      growthSavings: initialSavings + totalSavings,
      expenses: totalOutflow
    };
  }, [data, authUser, isAdmin]);

  const chartData = useMemo(() => {
    const records = isAdmin ? data.records : data.records.filter(r => r.memberId === authUser.memberId);
    const months = Array.from(new Set(records.map(r => r.month))).sort();
    let cumulativeGrowth = isAdmin ? (data.settings.initialGrowthSavings || 0) : 0;
    
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

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {isAdmin ? data.settings.name : `Hello, ${authUser.name.split(' ')[0]}`}
            </h2>
            {isAdmin && (
              <button 
                onClick={() => { setNewName(data.settings.name); setIsRenaming(true); }}
                className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          <p className="text-slate-500 font-medium text-lg">
            {isAdmin ? 'System intelligence & portfolio health summary.' : 'Your financial overview for this cycle.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <>
              <button 
                onClick={onOpenReport}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded-2xl font-bold shadow-sm hover:border-slate-900 hover:text-slate-900 active:scale-95 transition-all"
              >
                <FileBarChart size={20} /> Report
              </button>
              <button 
                onClick={handleGetInsights}
                disabled={loadingInsights}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-bold shadow-xl shadow-emerald-200 active:scale-95 transition-all disabled:opacity-50"
              >
                <Sparkles size={20} className={loadingInsights ? 'animate-spin' : ''} />
                {loadingInsights ? 'Analyzing...' : 'AI Advisor'}
              </button>
            </>
          )}
        </div>
      </div>

      {insights && (
        <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-in slide-in-from-top-4">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120} /></div>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-500/20 p-2 rounded-xl"><Sparkles size={20} className="text-emerald-400" /></div>
            <h3 className="font-extrabold text-xl">Financial intelligence</h3>
          </div>
          <p className="text-slate-300 leading-relaxed font-medium text-lg whitespace-pre-wrap">{insights}</p>
          <button onClick={() => setInsights(null)} className="mt-8 px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Dismiss</button>
        </div>
      )}

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={TrendingUp} 
          label="Growth Savings" 
          value={`₹${stats.growthSavings.toLocaleString()}`} 
          trend="+4.2%" 
          color="emerald"
        />
        <StatCard 
          icon={Wallet} 
          label="Net Liquid Funds" 
          value={`₹${stats.totalFunds.toLocaleString()}`} 
          trend="Stable" 
          color="blue"
        />
        <StatCard 
          icon={Landmark} 
          label={isAdmin ? "Total Debt" : "My Active Loan"} 
          value={`₹${stats.activeLoans.toLocaleString()}`} 
          trend="- ₹1,200" 
          color="amber"
        />
        <StatCard 
          icon={AlertCircle} 
          label="Period Collection" 
          value={`₹${stats.monthlyCollection.toLocaleString()}`} 
          color="slate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm bento-card">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Growth Velocity</h3>
                <p className="text-slate-400 font-medium">Monthly vs Cumulative Savings Performance</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  Savings
                </div>
              </div>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="premiumEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                  <Tooltip 
                    cursor={{ stroke: '#10b981', strokeWidth: 2 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-800 text-white animate-in zoom-in-95">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{payload[0].payload.month}</p>
                            <p className="text-lg font-black text-emerald-400">₹{payload[0].value.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-slate-500">Monthly Contribution</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="growth" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#premiumEmerald)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Cards Area */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl bento-card relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform"><HandCoins size={80} /></div>
            <h3 className="text-xl font-extrabold mb-6 relative z-10">Debt Distribution</h3>
            <div className="h-[220px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={data.members.filter(m => m.currentLoanPrincipal > 0)} 
                    dataKey="currentLoanPrincipal" 
                    innerRadius={60} 
                    outerRadius={85} 
                    paddingAngle={8}
                    stroke="none"
                  >
                    {data.members.map((_, i) => <Cell key={`cell-${i}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ec4899'][i % 4]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', backgroundColor: '#1e293b', border: 'none', color: '#fff' }} 
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3 relative z-10">
               {data.members.filter(m => m.currentLoanPrincipal > 0).slice(0, 3).map((m, i) => (
                 <div key={m.id} className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'][i % 3] }}></div>
                     <span className="font-bold text-slate-300">{m.name}</span>
                   </div>
                   <span className="font-black">₹{m.currentLoanPrincipal.toLocaleString()}</span>
                 </div>
               ))}
               <button onClick={onNavigateToLoans} className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">View All Debt</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => {
  const themes: any = {
    emerald: 'bg-emerald-500 text-white shadow-emerald-100',
    blue: 'bg-blue-600 text-white shadow-blue-100',
    amber: 'bg-amber-500 text-white shadow-amber-100',
    slate: 'bg-slate-100 text-slate-900 shadow-slate-100',
  };

  const isSlate = color === 'slate';

  return (
    <div className={`p-7 rounded-[2rem] shadow-xl bento-card group flex flex-col justify-between min-h-[160px] ${isSlate ? 'bg-white border border-slate-100' : themes[color]}`}>
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-2xl ${isSlate ? 'bg-slate-100 text-slate-900' : 'bg-white/20 text-white'} transition-transform group-hover:scale-110`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className={`text-[10px] font-black px-2 py-1 rounded-full ${isSlate ? 'bg-emerald-100 text-emerald-700' : 'bg-white/20 text-white'}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isSlate ? 'text-slate-400' : 'text-white/70'}`}>{label}</p>
        <h4 className="text-2xl font-black tracking-tight">{value}</h4>
      </div>
    </div>
  );
};

export default Dashboard;
