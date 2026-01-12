
import React, { useState, useEffect } from 'react';
import { Member, PaymentRecord, GroupSettings, GroupData, AuthUser, LoanIssuedRecord, AdminPayment, MiscellaneousPayment, InterestRateChangeRecord, MeetingNote, AppNotification } from './types';
import Dashboard from './components/Dashboard';
import MemberManager from './components/MemberManager';
import PaymentForm from './components/PaymentForm';
import LoanIssueForm from './components/LoanIssueForm';
import ExpenseManager from './components/ExpenseManager';
import SummaryView from './components/SummaryView';
import MeetingNotes from './components/MeetingNotes';
import MonthlyReport from './components/MonthlyReport';
import LoansList from './components/LoansList';
import NotificationCenter from './components/NotificationCenter';
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
  Home,
  RotateCcw,
  ListFilter,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Target,
  PlusCircle,
  Trash2,
  UserCog,
  Database,
  Sparkles,
  Key
} from 'lucide-react';

const STORAGE_KEY = 'group_finance_data_v1';
const AUTH_KEY = 'group_finance_auth_v1';

const INITIAL_DATA: GroupData = {
  settings: {
    name: 'Unity Savings Group',
    monthlySavingsAmount: 1000,
    defaultInterestRate: 12,
    dueDay: 10,
    initialGrowthSavings: 0,
    initialNetFunds: 0,
    adminPassword: 'admin'
  },
  members: [
    { id: '1', name: 'John Doe', phone: '9876543210', joiningDate: '2023-01-01', currentLoanPrincipal: 0, loanInterestRate: 12, loanCap: 50000 },
    { id: '2', name: 'Jane Smith', phone: '9988776655', joiningDate: '2023-01-15', currentLoanPrincipal: 5000, loanInterestRate: 12, loanCap: 25000 }
  ],
  records: [],
  loansIssued: [
    { id: 'init-1', memberId: '2', amount: 5000, interestRate: 12, date: '2023-11-01' }
  ],
  interestRateChanges: [],
  meetingNotes: [],
  adminPayments: [],
  miscPayments: [],
  notifications: [],
  monthlySavingsTargets: {}
};

const App: React.FC = () => {
  const [data, setData] = useState<GroupData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : INITIAL_DATA;
    if (!parsed.loansIssued) parsed.loansIssued = [];
    if (!parsed.interestRateChanges) parsed.interestRateChanges = [];
    if (!parsed.meetingNotes) parsed.meetingNotes = [];
    if (!parsed.adminPayments) parsed.adminPayments = [];
    if (!parsed.miscPayments) parsed.miscPayments = [];
    if (!parsed.notifications) parsed.notifications = [];
    if (!parsed.monthlySavingsTargets) parsed.monthlySavingsTargets = {};
    if (parsed.settings && parsed.settings.dueDay === undefined) parsed.settings.dueDay = 10;
    if (parsed.settings && parsed.settings.initialGrowthSavings === undefined) parsed.settings.initialGrowthSavings = 0;
    if (parsed.settings && parsed.settings.initialNetFunds === undefined) parsed.settings.initialNetFunds = 0;
    
    if (parsed.members) {
      parsed.members = parsed.members.map((m: any) => ({
        ...m,
        loanCap: m.loanCap !== undefined ? m.loanCap : 50000
      }));
    }
    return parsed;
  });

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [loginPhone, setLoginPhone] = useState('');
  const [loginStep, setLoginStep] = useState<'PHONE' | 'OTP' | 'ADMIN_LOGIN'>('PHONE');
  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [newAdminPass, setNewAdminPass] = useState('');
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));
  const [targetAmount, setTargetAmount] = useState<number>(data.settings.monthlySavingsAmount);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'payments' | 'loans' | 'loans-list' | 'expenses' | 'summary' | 'notes' | 'settings' | 'report' | 'notifications'>('dashboard');
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

  useEffect(() => {
    let interval: number | undefined;
    if (resendTimer > 0) {
      interval = window.setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [resendTimer]);

  const handleLogout = () => {
    setAuthUser(null);
    setLoginStep('PHONE');
    setLoginError(null);
    setActiveTab('dashboard');
  };

  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    if (loginPhone.length !== 10) {
      setLoginError('Please enter a valid 10-digit mobile number.');
      return;
    }
    const member = data.members.find(m => m.phone === loginPhone);
    if (member) {
      setIsSendingOtp(true);
      setTimeout(() => {
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(newOtp);
        setLoginStep('OTP');
        setIsSendingOtp(false);
        setResendTimer(60);
      }, 1200);
    } else {
      setLoginError('Mobile number not found. Contact Admin.');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (otpValue === generatedOtp) {
      const member = data.members.find(m => m.phone === loginPhone);
      if (member) {
        setAuthUser({ id: member.id, name: member.name, role: 'MEMBER', memberId: member.id });
      }
    } else {
      setLoginError('Invalid OTP.');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const savedPass = data.settings.adminPassword || 'admin';
    if (adminUsername === 'admin' && adminPassword === savedPass) {
      setAuthUser({ id: 'admin-0', name: 'Administrator', role: 'ADMIN' });
    } else {
      setLoginError('Invalid credentials.');
    }
  };

  const updateSettings = (settings: GroupSettings) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({ ...prev, settings }));
  };

  const handleUpdateAdminPassword = () => {
    if (!newAdminPass.trim() || newAdminPass.length < 4) {
      alert("Password must be at least 4 characters.");
      return;
    }
    updateSettings({ ...data.settings, adminPassword: newAdminPass.trim() });
    setNewAdminPass('');
    alert("Admin password updated successfully.");
  };

  const setMonthlySavingsTarget = (month: string, amount: number) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({
      ...prev,
      monthlySavingsTargets: { ...prev.monthlySavingsTargets, [month]: amount }
    }));
  };

  const removeMonthlySavingsTarget = (month: string) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => {
      const newTargets = { ...prev.monthlySavingsTargets };
      delete newTargets[month];
      return { ...prev, monthlySavingsTargets: newTargets };
    });
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
    const member = data.members.find(m => m.id === memberId);
    if (!member) return;

    const newLoan: LoanIssuedRecord = {
      id: Math.random().toString(36).substr(2, 9),
      memberId,
      amount,
      interestRate,
      date: new Date().toISOString()
    };

    const notification: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'LOAN_DISBURSED',
      message: `₹${amount.toLocaleString()} issued to ${member.name}.`,
      timestamp: new Date().toISOString(),
      read: false
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
      loansIssued: [...prev.loansIssued, newLoan],
      notifications: [notification, ...prev.notifications]
    }));
    setActiveTab('dashboard');
  };

  const markAllNotificationsRead = () => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true }))
    }));
  };

  const clearNotifications = () => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({ ...prev, notifications: [] }));
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
    setData(prev => ({ ...prev, meetingNotes: [note, ...prev.meetingNotes] }));
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
    setData(prev => ({ ...prev, meetingNotes: prev.meetingNotes.filter(n => n.id !== id) }));
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
      return { ...prev, members: updatedMembers, records: [...prev.records, record] };
    });
  };

  const addAdminPayment = (payment: AdminPayment) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({ ...prev, adminPayments: [...prev.adminPayments, payment] }));
  };

  const addMiscPayment = (payment: MiscellaneousPayment) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({ ...prev, miscPayments: [...prev.miscPayments, payment] }));
  };

  if (!authUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs for depth */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-emerald-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
        
        <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden relative z-10 border border-white/20">
          
          {loginStep === 'PHONE' && (
            <div className="animate-in slide-in-from-left-4 duration-300">
              <div className="text-center mb-10">
                <div className="bg-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-900/30">
                  <CircleDollarSign className="text-white" size={32} />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Finance Pro</h1>
                <p className="text-slate-500 font-medium mt-1">Access your group dashboard</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Member Mobile</label>
                  <div className="relative group">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input 
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit number"
                      className="w-full p-4 pl-12 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-semibold"
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
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 font-bold disabled:opacity-70"
                >
                  {isSendingOtp ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>Send Code <ArrowRight size={20} /></>
                  )}
                </button>
              </form>

              <div className="relative py-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-300 bg-white px-3">OR</div>
              </div>

              <button 
                onClick={() => setLoginStep('ADMIN_LOGIN')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/30 active:scale-[0.98] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-sm">Administrator</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Full system access</p>
                </div>
              </button>
            </div>
          )}

          {loginStep === 'OTP' && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => setLoginStep('PHONE')}
                className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-xs transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div className="text-center mb-8">
                <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="text-emerald-600" size={32} />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Identity Verification</h1>
                <p className="text-slate-500 font-medium mt-1">Verification code sent to <span className="text-slate-900 font-bold">...{loginPhone.slice(-4)}</span></p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="relative">
                  <input 
                    type="tel"
                    maxLength={6}
                    autoFocus
                    placeholder="000 000"
                    className="w-full p-5 text-center text-3xl tracking-[0.5rem] rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-black"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  />
                  {loginError && (
                    <div className="mt-3 flex justify-center items-center gap-2 text-red-500 text-xs font-bold animate-in slide-in-from-top-1">
                      <AlertCircle size={14} /> {loginError}
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center">
                  <p className="text-[10px] text-emerald-700 font-black uppercase tracking-widest mb-1">Demo Code</p>
                  <p className="text-sm font-bold text-emerald-900 tracking-widest">{generatedOtp}</p>
                </div>

                <button 
                  type="submit" 
                  disabled={otpValue.length !== 6}
                  className="w-full p-4 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-xl shadow-emerald-200 font-bold disabled:opacity-50"
                >
                  Verify & Continue
                </button>

                <div className="text-center text-xs text-slate-400 font-medium">
                  {resendTimer > 0 ? (
                    <span className="font-bold text-slate-500">Resend in {resendTimer}s</span>
                  ) : (
                    <button type="button" onClick={() => handleSendOtp()} className="text-emerald-600 font-black hover:underline">Resend OTP</button>
                  )}
                </div>
              </form>
            </div>
          )}

          {loginStep === 'ADMIN_LOGIN' && (
            <div className="animate-in slide-in-from-bottom-4 duration-300">
              <button 
                onClick={() => setLoginStep('PHONE')}
                className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-xs transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div className="text-center mb-8">
                <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-slate-900/30">
                  <Lock className="text-white" size={32} />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Console</h1>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
                  <input 
                    type="text"
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none transition-all font-semibold"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative group">
                    <input 
                      type={showAdminPass ? "text" : "password"}
                      className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none transition-all font-semibold"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showAdminPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full p-4 rounded-2xl bg-slate-900 text-white hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 font-bold"
                >
                  Confirm Credentials
                </button>
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
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
          isActive 
          ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-slate-800' : 'bg-transparent group-hover:bg-white'}`}>
          <Icon size={18} />
        </div>
        <span className={`font-semibold text-sm ${isActive ? 'translate-x-0.5' : ''} transition-transform`}>{label}</span>
        {badge !== undefined && badge > 0 ? (
          <span className="ml-auto bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
            {badge}
          </span>
        ) : isActive && <ChevronRight size={14} className="ml-auto text-slate-400" />}
      </button>
    );
  };

  const unreadNotificationsCount = data.notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <header className="md:hidden glass-panel px-4 py-4 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-2">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200">
            <CircleDollarSign className="text-white" size={20} />
          </div>
          <h1 className="font-extrabold text-lg tracking-tight text-slate-900">{data.settings.name}</h1>
        </button>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white rounded-xl shadow-sm text-slate-600">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <aside className={`fixed inset-0 z-[60] glass-panel w-72 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:bg-white md:border-r`}>
        <div className="p-8 h-full flex flex-col">
          <div className="hidden md:flex items-center gap-3 mb-10">
            <div className="bg-slate-900 p-2.5 rounded-2xl shadow-xl shadow-slate-200">
              <CircleDollarSign className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight leading-none text-slate-900">{data.settings.name}</h1>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 block">Pro Version</span>
            </div>
          </div>

          <div className="mb-8 p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100">
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${isAdmin ? 'bg-slate-900 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                {isAdmin ? <ShieldCheck size={16} /> : <UserIcon size={16} />}
              </div>
              <p className="font-bold text-xs text-slate-900 truncate">{authUser.name}</p>
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-11">{authUser.role}</p>
          </div>

          <nav className="space-y-1.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem id="notifications" icon={Bell} label="Alerts" hidden={!isAdmin} badge={unreadNotificationsCount} />
            <NavItem id="members" icon={Users} label="Membership" hidden={!isAdmin} />
            <NavItem id="payments" icon={CircleDollarSign} label="Collections" hidden={!isAdmin} />
            <NavItem id="loans" icon={HandCoins} label="Credit Ops" hidden={!isAdmin} />
            <NavItem id="loans-list" icon={ListFilter} label="Portfolio" hidden={!isAdmin} />
            <NavItem id="expenses" icon={Receipt} label="Expense Log" hidden={!isAdmin} />
            <NavItem id="notes" icon={MessageSquareText} label="Minutes" />
            <NavItem id="summary" icon={FileText} label={isAdmin ? "Reports" : "My History"} />
          </nav>

          <div className="pt-6 border-t mt-auto space-y-1.5">
            <NavItem id="settings" icon={Settings} label="Global Settings" hidden={!isAdmin} />
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
            >
              <div className="p-2 rounded-xl"><LogOut size={18} /></div>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard 
              data={data} 
              authUser={authUser} 
              onOpenReport={() => setActiveTab('report')} 
              onUpdateSettings={updateSettings}
              onNavigateToLoans={() => setActiveTab('loans-list')}
            />
          )}
          {activeTab === 'notifications' && isAdmin && (
            <NotificationCenter notifications={data.notifications} onMarkRead={markAllNotificationsRead} onClear={clearNotifications} />
          )}
          {activeTab === 'members' && isAdmin && (
            <MemberManager data={data} onAdd={addMember} onUpdate={updateMember} onDelete={deleteMember} onAdjustInterest={adjustInterestRate} />
          )}
          {activeTab === 'payments' && isAdmin && (
            <PaymentForm members={data.members} settings={data.settings} monthlySavingsTargets={data.monthlySavingsTargets || {}} onAdd={addRecord} />
          )}
          {activeTab === 'loans' && isAdmin && (
            <LoanIssueForm members={data.members} settings={data.settings} onIssue={issueLoan} />
          )}
          {activeTab === 'loans-list' && isAdmin && (
            <LoansList data={data} />
          )}
          {activeTab === 'notes' && (
            <MeetingNotes notes={data.meetingNotes} authUser={authUser} onAdd={addMeetingNote} onPublish={publishMeetingNote} onDelete={deleteMeetingNote} />
          )}
          {activeTab === 'expenses' && isAdmin && (
            <ExpenseManager 
              data={data}
              onAddAdminPayment={addAdminPayment}
              onAddMiscPayment={addMiscPayment}
            />
          )}
          {activeTab === 'summary' && <SummaryView data={data} authUser={authUser} />}
          {activeTab === 'report' && <MonthlyReport data={data} authUser={authUser} onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'settings' && isAdmin && (
            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
               {/* Identity & Policy Card */}
               <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="bg-slate-100 p-3 rounded-2xl text-slate-900"><Settings size={28} /></div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900">System Configuration</h2>
                      <p className="text-slate-500 font-medium">Global rules for your micro-finance group.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Group Identifier</label>
                          <input 
                            type="text" 
                            className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-slate-50 outline-none transition-all font-bold"
                            value={data.settings.name}
                            onChange={(e) => updateSettings({...data.settings, name: e.target.value})}
                          />
                       </div>
                       <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100">
                          <div className="flex items-center gap-2 mb-4">
                            <CalendarSearch className="text-emerald-600" size={20} />
                            <label className="text-sm font-black text-emerald-900 uppercase tracking-tighter">Collection Deadline</label>
                          </div>
                          <input 
                            type="number" 
                            className="w-full p-4 rounded-2xl border-2 border-emerald-100 focus:border-emerald-600 outline-none transition-all font-black text-3xl text-emerald-900 bg-white"
                            value={data.settings.dueDay}
                            onChange={(e) => updateSettings({...data.settings, dueDay: Number(e.target.value)})}
                          />
                          <p className="mt-3 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Day of month due</p>
                       </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100">
                       <div className="flex items-center gap-2 mb-6">
                         <Target size={20} className="text-emerald-600" />
                         <h3 className="font-extrabold text-slate-900">Schedule Overrides</h3>
                       </div>
                       <div className="flex gap-2 mb-4">
                          <input type="month" className="flex-1 p-3 rounded-xl border border-slate-200 text-xs font-bold" value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} />
                          <input type="number" className="w-24 p-3 rounded-xl border border-slate-200 text-xs font-bold" value={targetAmount} onChange={(e) => setTargetAmount(Number(e.target.value))} />
                          <button onClick={() => setMonthlySavingsTarget(targetMonth, targetAmount)} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-emerald-600 transition-all"><PlusCircle size={20}/></button>
                       </div>
                       <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                          {Object.entries(data.monthlySavingsTargets || {}).map(([m, v]) => (
                            <div key={m} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm animate-in slide-in-from-top-1">
                               <span className="font-black text-slate-400 text-[10px] uppercase">{m}</span>
                               <span className="font-extrabold text-slate-900">₹{v}</span>
                               <button onClick={() => removeMonthlySavingsTarget(m)} className="text-red-300 hover:text-red-500"><Trash2 size={14}/></button>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
               </div>

               {/* Access Security Card - ADDED SECTION */}
               <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-emerald-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-900"><Lock size={28} /></div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900">Access & Security</h2>
                      <p className="text-slate-500 font-medium">Manage administrative login credentials.</p>
                    </div>
                  </div>
                  <div className="max-w-md space-y-6">
                     <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">New Admin Password</label>
                        <div className="flex gap-3">
                          <div className="relative flex-1 group">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                            <input 
                              type="password" 
                              placeholder="Minimum 4 characters"
                              className="w-full p-4 pl-12 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold"
                              value={newAdminPass}
                              onChange={(e) => setNewAdminPass(e.target.value)}
                            />
                          </div>
                          <button 
                            onClick={handleUpdateAdminPassword}
                            disabled={!newAdminPass.trim() || newAdminPass.length < 4}
                            className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-slate-100 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                          >
                            Update
                          </button>
                        </div>
                        <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">This will change the password required for 'Administrator' login.</p>
                     </div>
                  </div>
               </div>

               {/* Legacy Migration Card */}
               <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-amber-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="bg-amber-100 p-3 rounded-2xl text-amber-900"><Database size={28} /></div>
                    <h2 className="text-2xl font-extrabold text-slate-900">Legacy Migration</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Base Growth Savings</label>
                        <input type="number" className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50/50 font-black text-xl" value={data.settings.initialGrowthSavings} onChange={(e) => updateSettings({...data.settings, initialGrowthSavings: Number(e.target.value)})}/>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Base Net Cash</label>
                        <input type="number" className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50/50 font-black text-xl" value={data.settings.initialNetFunds} onChange={(e) => updateSettings({...data.settings, initialNetFunds: Number(e.target.value)})}/>
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
