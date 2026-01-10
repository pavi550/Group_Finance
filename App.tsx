
import React, { useState, useEffect } from 'react';
import { Member, PaymentRecord, GroupSettings, GroupData, AuthUser, LoanIssuedRecord, AdminPayment, MiscellaneousPayment, InterestRateChangeRecord, MeetingNote } from './types';
import Dashboard from './components/Dashboard';
import MemberManager from './components/MemberManager';
import PaymentForm from './components/PaymentForm';
import LoanIssueForm from './components/LoanIssueForm';
import AdminPaymentForm from './components/AdminPaymentForm';
import MiscPaymentForm from './components/MiscPaymentForm';
import SummaryView from './components/SummaryView';
import MeetingNotes from './components/MeetingNotes';
import MonthlyReport from './components/MonthlyReport';
import { 
  LayoutDashboard, 
  Users, 
  CircleDollarSign, 
  FileText, 
  Settings,
  ChevronRight,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  HandCoins,
  UserCog,
  Receipt,
  Info,
  CalendarDays,
  Smartphone,
  ArrowRight,
  AlertCircle,
  CalendarSearch,
  MessageSquareText,
  KeyRound,
  ArrowLeft,
  Loader2,
  FileBarChart,
  Home
} from 'lucide-react';

const STORAGE_KEY = 'group_finance_data_v1';
const AUTH_KEY = 'group_finance_auth_v1';

const INITIAL_DATA: GroupData = {
  settings: {
    name: 'Unity Savings Group',
    monthlySavingsAmount: 1000,
    defaultInterestRate: 2,
    dueDay: 10
  },
  members: [
    { id: '1', name: 'John Doe', phone: '9876543210', joiningDate: '2023-01-01', currentLoanPrincipal: 0, loanInterestRate: 2, loanCap: 50000 },
    { id: '2', name: 'Jane Smith', phone: '9988776655', joiningDate: '2023-01-15', currentLoanPrincipal: 5000, loanInterestRate: 2, loanCap: 25000 }
  ],
  records: [],
  loansIssued: [
    { id: 'init-1', memberId: '2', amount: 5000, interestRate: 2, date: '2023-11-01' }
  ],
  interestRateChanges: [],
  meetingNotes: [],
  adminPayments: [],
  miscPayments: []
};

const App: React.FC = () => {
  const [data, setData] = useState<GroupData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : INITIAL_DATA;
    // Migrations
    if (!parsed.loansIssued) parsed.loansIssued = [];
    if (!parsed.interestRateChanges) parsed.interestRateChanges = [];
    if (!parsed.meetingNotes) parsed.meetingNotes = [];
    if (!parsed.adminPayments) parsed.adminPayments = [];
    if (!parsed.miscPayments) parsed.miscPayments = [];
    if (parsed.settings && parsed.settings.dueDay === undefined) parsed.settings.dueDay = 10;
    
    // Member migration: ensure every member has a loanCap
    if (parsed.members) {
      parsed.members = parsed.members.map((m: any) => ({
        ...m,
        loanCap: m.loanCap !== undefined ? m.loanCap : 50000 // default 50k if missing
      }));
    }

    return parsed;
  });

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  // Login States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginStep, setLoginStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'payments' | 'loans' | 'admin-pays' | 'misc-pays' | 'summary' | 'notes' | 'settings' | 'report'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (authUser) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, [authUser]);

  const handleLogout = () => {
    setAuthUser(null);
    setLoginPhone('');
    setOtpValue('');
    setLoginStep('PHONE');
    setLoginError(null);
    setActiveTab('dashboard');
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (loginPhone.length !== 10) {
      setLoginError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const member = data.members.find(m => m.phone === loginPhone);
    if (member) {
      setIsSendingOtp(true);
      // Simulate SMS delay
      setTimeout(() => {
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(newOtp);
        setLoginStep('OTP');
        setIsSendingOtp(false);
        // In a real app, this would be sent via SMS. Here we log it.
        console.log(`[SIMULATION] OTP for ${loginPhone}: ${newOtp}`);
      }, 1200);
    } else {
      setLoginError('Mobile number not found. Please contact the administrator.');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (otpValue === generatedOtp) {
      const member = data.members.find(m => m.phone === loginPhone);
      if (member) {
        setAuthUser({
          id: member.id,
          name: member.name,
          role: 'MEMBER',
          memberId: member.id
        });
      }
    } else {
      setLoginError('Invalid OTP. Please try again.');
    }
  };

  const updateSettings = (settings: GroupSettings) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({ ...prev, settings }));
  };

  const addMember = (member: Member) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({ ...prev, members: [...prev.members, member] }));
  };

  const updateMember = (updatedMember: Member) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === updatedMember.id ? updatedMember : m)
    }));
  };

  const deleteMember = (id: string) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== id),
      records: prev.records.filter(r => r.memberId !== id),
      loansIssued: prev.loansIssued.filter(l => l.memberId !== id),
      interestRateChanges: prev.interestRateChanges.filter(l => l.memberId !== id)
    }));
  };

  const issueLoan = (memberId: string, amount: number, interestRate: number) => {
    if (authUser?.role !== 'ADMIN') return;
    const newLoan: LoanIssuedRecord = {
      id: Math.random().toString(36).substr(2, 9),
      memberId,
      amount,
      interestRate,
      date: new Date().toISOString()
    };
    setData(prev => ({
      ...prev,
      members: prev.members.map(m => {
        if (m.id === memberId) {
          return {
            ...m,
            currentLoanPrincipal: m.currentLoanPrincipal + amount,
            loanInterestRate: interestRate
          };
        }
        return m;
      }),
      loansIssued: [...prev.loansIssued, newLoan]
    }));
    setActiveTab('dashboard');
  };

  const adjustInterestRate = (memberId: string, newRate: number, reason: string) => {
    if (authUser?.role !== 'ADMIN') return;
    const member = data.members.find(m => m.id === memberId);
    if (!member) return;

    const changeRecord: InterestRateChangeRecord = {
      id: Math.random().toString(36).substr(2, 9),
      memberId,
      oldRate: member.loanInterestRate,
      newRate,
      reason,
      date: new Date().toISOString()
    };

    setData(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === memberId ? { ...m, loanInterestRate: newRate } : m),
      interestRateChanges: [...prev.interestRateChanges, changeRecord]
    }));
  };

  const addMeetingNote = (note: MeetingNote) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({
      ...prev,
      meetingNotes: [note, ...prev.meetingNotes]
    }));
  };

  const publishMeetingNote = (id: string) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({
      ...prev,
      meetingNotes: prev.meetingNotes.map(n => 
        n.id === id ? { ...n, publishedAt: new Date().toISOString() } : n
      )
    }));
  };

  const deleteMeetingNote = (id: string) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({
      ...prev,
      meetingNotes: prev.meetingNotes.filter(n => n.id !== id)
    }));
  };

  const addRecord = (record: PaymentRecord) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => {
      const updatedMembers = prev.members.map(m => {
        if (m.id === record.memberId) {
          return {
            ...m,
            currentLoanPrincipal: Math.max(0, m.currentLoanPrincipal - record.principalPaid)
          };
        }
        return m;
      });
      return {
        ...prev,
        members: updatedMembers,
        records: [...prev.records, record]
      };
    });
  };

  const addAdminPayment = (payment: AdminPayment) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({
      ...prev,
      adminPayments: [...prev.adminPayments, payment]
    }));
    setActiveTab('summary');
  };

  const addMiscPayment = (payment: MiscellaneousPayment) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({
      ...prev,
      miscPayments: [...prev.miscPayments, payment]
    }));
    setActiveTab('summary');
  };

  // Auth Screen
  if (!authUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden relative">
          
          {loginStep === 'PHONE' ? (
            <div className="animate-in slide-in-from-left-4 duration-300">
              <div className="text-center mb-10">
                <div className="bg-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-900/20">
                  <CircleDollarSign className="text-white" size={32} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Group Finance Pro</h1>
                <p className="text-slate-500 font-medium mt-1">Enter your mobile to get OTP</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Member Mobile Number</label>
                  <div className="relative group">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input 
                      type="tel"
                      maxLength={10}
                      placeholder="Enter 10-digit number"
                      className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 outline-none transition-all font-semibold"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  {loginError && (
                    <div className="mt-3 flex items-center gap-2 text-red-500 text-xs font-bold animate-in slide-in-from-top-1">
                      <AlertCircle size={14} />
                      {loginError}
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full flex items-center justify-center gap-2 p-5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 font-black disabled:opacity-70"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>

              <div className="relative py-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest text-slate-300 bg-white px-2">OR</div>
              </div>

              <button 
                onClick={() => setAuthUser({ id: 'admin-0', name: 'Administrator', role: 'ADMIN' })}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-emerald-600 hover:bg-emerald-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ShieldCheck size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900">Administrator Access</p>
                  <p className="text-xs text-slate-400 font-medium">Control group settings & collections</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => setLoginStep('PHONE')}
                className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Mobile
              </button>

              <div className="text-center mb-8">
                <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="text-emerald-600" size={32} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Verify Identity</h1>
                <p className="text-slate-500 font-medium mt-1">We've sent a 6-digit code to <span className="text-slate-900 font-bold">+91 {loginPhone}</span></p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <div className="relative group">
                    <input 
                      type="tel"
                      maxLength={6}
                      autoFocus
                      placeholder="Enter 6-digit OTP"
                      className="w-full p-5 text-center text-3xl tracking-[1rem] rounded-2xl border-2 border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 outline-none transition-all font-black"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  {loginError && (
                    <div className="mt-3 flex justify-center items-center gap-2 text-red-500 text-xs font-bold animate-in slide-in-from-top-1">
                      <AlertCircle size={14} />
                      {loginError}
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                  <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest mb-1">Demo Simulation</p>
                  <p className="text-xs font-bold text-amber-900">Use OTP: <span className="bg-white px-2 py-0.5 rounded-lg border border-amber-200">{generatedOtp}</span></p>
                </div>

                <button 
                  type="submit" 
                  disabled={otpValue.length !== 6}
                  className="w-full flex items-center justify-center gap-2 p-5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 font-black disabled:opacity-50 disabled:grayscale"
                >
                  Confirm & Login
                </button>

                <p className="text-center text-xs text-slate-400 font-medium">
                  Didn't receive the code? <button type="button" onClick={handleSendOtp} className="text-emerald-600 font-bold hover:underline">Resend OTP</button>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isAdmin = authUser.role === 'ADMIN';

  const NavItem = ({ id, icon: Icon, label, hidden = false, badge }: { id: typeof activeTab, icon: any, label: string, hidden?: boolean, badge?: number }) => {
    if (hidden) return null;
    return (
      <button
        onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          activeTab === id 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
        {badge ? (
          <span className="ml-auto bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {badge}
          </span>
        ) : activeTab === id && <ChevronRight size={16} className="ml-auto" />}
      </button>
    );
  };

  // Check for unread notes (published in last 3 days)
  const unreadNotesCount = data.meetingNotes.filter(n => {
    if (!n.publishedAt) return false;
    const pubDate = new Date(n.publishedAt).getTime();
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    return pubDate > threeDaysAgo;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 hover:opacity-75 transition-opacity"
        >
          <div className="bg-emerald-600 p-2 rounded-lg"><CircleDollarSign className="text-white" size={24} /></div>
          <h1 className="font-bold text-xl tracking-tight">{data.settings.name}</h1>
        </button>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <aside className={`fixed inset-0 z-40 bg-white border-r w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            className="hidden md:flex items-center gap-3 mb-10 hover:opacity-75 transition-opacity group text-left"
          >
            <div className="bg-emerald-600 p-2.5 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-emerald-600/10"><CircleDollarSign className="text-white" size={28} /></div>
            <div>
              <h1 className="font-bold text-lg leading-none">{data.settings.name}</h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Group Finance Pro</span>
            </div>
          </button>

          <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAdmin ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {isAdmin ? <ShieldCheck size={16} /> : <UserIcon size={16} />}
              </div>
              <p className="font-bold text-sm text-slate-900 truncate">{authUser.name}</p>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{authUser.role}</p>
          </div>

          <nav className="space-y-2 flex-1">
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem id="members" icon={Users} label="Group Members" hidden={!isAdmin} />
            <NavItem id="payments" icon={CircleDollarSign} label="Record Payment" hidden={!isAdmin} />
            <NavItem id="loans" icon={HandCoins} label="Issue Loan" hidden={!isAdmin} />
            <NavItem id="notes" icon={MessageSquareText} label="Meeting Minutes" badge={!isAdmin ? unreadNotesCount : 0} />
            <NavItem id="admin-pays" icon={UserCog} label="Admin Reward" hidden={!isAdmin} />
            <NavItem id="misc-pays" icon={Receipt} label="Misc Expense" hidden={!isAdmin} />
            <NavItem id="summary" icon={FileText} label={isAdmin ? "Group Summary" : "My History"} />
          </nav>

          <div className="pt-6 border-t mt-auto space-y-2">
            <NavItem id="settings" icon={Settings} label="Settings" hidden={!isAdmin} />
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard data={data} authUser={authUser} onOpenReport={() => setActiveTab('report')} />}
          {activeTab === 'members' && isAdmin && (
            <MemberManager data={data} onAdd={addMember} onUpdate={updateMember} onDelete={deleteMember} onAdjustInterest={adjustInterestRate} />
          )}
          {activeTab === 'payments' && isAdmin && (
            <PaymentForm members={data.members} settings={data.settings} onAdd={addRecord} />
          )}
          {activeTab === 'loans' && isAdmin && (
            <LoanIssueForm members={data.members} settings={data.settings} onIssue={issueLoan} />
          )}
          {activeTab === 'notes' && (
            <MeetingNotes 
              notes={data.meetingNotes} 
              authUser={authUser} 
              onAdd={addMeetingNote} 
              onPublish={publishMeetingNote} 
              onDelete={deleteMeetingNote} 
            />
          )}
          {activeTab === 'admin-pays' && isAdmin && (
            <AdminPaymentForm onAdd={addAdminPayment} />
          )}
          {activeTab === 'misc-pays' && isAdmin && (
            <MiscPaymentForm onAdd={addMiscPayment} />
          )}
          {activeTab === 'summary' && <SummaryView data={data} authUser={authUser} />}
          {activeTab === 'report' && <MonthlyReport data={data} authUser={authUser} onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'settings' && isAdmin && (
            <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white rounded-3xl p-8 border shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-slate-100 p-2.5 rounded-xl text-slate-600">
                    <Settings size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Global Financial Configuration</h2>
                    <p className="text-sm text-slate-500">Define how the group manages loans and monthly savings.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Group Name</label>
                      <input 
                        type="text" 
                        value={data.settings.name} 
                        onChange={(e) => updateSettings({...data.settings, name: e.target.value})} 
                        className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold" 
                        placeholder="e.g. Unity Savings Group"
                      />
                    </div>
                    
                    <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                      <label className="block text-sm font-black text-emerald-900 mb-2 flex items-center gap-2">
                        <CalendarSearch size={18} />
                        Monthly Loan Due Date
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">#</span>
                        <input 
                          type="number" 
                          min="1" 
                          max="28"
                          value={data.settings.dueDay} 
                          onChange={(e) => updateSettings({...data.settings, dueDay: Number(e.target.value)})} 
                          className="w-full p-4 pl-10 rounded-2xl border-2 border-emerald-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-black text-2xl text-emerald-900" 
                        />
                      </div>
                      <p className="mt-3 text-[11px] font-bold text-emerald-700 leading-tight">
                        Payments made after the {data.settings.dueDay}th of every month will be flagged as LATE. This applies to both savings and loan interest.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Monthly Savings Target</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input 
                          type="number" 
                          value={data.settings.monthlySavingsAmount} 
                          onChange={(e) => updateSettings({...data.settings, monthlySavingsAmount: Number(e.target.value)})} 
                          className="w-full p-4 pl-8 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-black text-xl" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 space-y-5">
                    <h3 className="font-bold text-slate-900 text-lg">System Behavior Policy</h3>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-emerald-200">1</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Fixed Monthly Cycle</p>
                          <p className="text-xs text-slate-500 mt-0.5">Regardless of when a loan is issued, interest and principal collections always fall on the {data.settings.dueDay}th.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-blue-200">2</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Dynamic Adjustments</p>
                          <p className="text-xs text-slate-500 mt-0.5">Admin can change contribution amounts at any time; changes reflect in future entries.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-amber-200">3</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Manual Interest Control</p>
                          <p className="text-xs text-slate-500 mt-0.5">While the system calculates interest based on the monthly rate, the Admin can override it during collection.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
