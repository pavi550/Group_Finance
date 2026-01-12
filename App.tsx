
import React, { useState, useEffect } from 'react';
import { Member, PaymentRecord, GroupSettings, GroupData, AuthUser, LoanIssuedRecord, AdminPayment, MiscellaneousPayment, InterestRateChangeRecord, MeetingNote, AppNotification } from './types';
import Dashboard from './components/Dashboard';
import MemberManager from './components/MemberManager';
import PaymentForm from './components/PaymentForm';
import LoanIssueForm from './components/LoanIssueForm';
import AdminPaymentForm from './components/AdminPaymentForm';
import MiscPaymentForm from './components/MiscPaymentForm';
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
  UserCog
} from 'lucide-react';

const STORAGE_KEY = 'group_finance_data_v1';
const AUTH_KEY = 'group_finance_auth_v1';

const INITIAL_DATA: GroupData = {
  settings: {
    name: 'Unity Savings Group',
    monthlySavingsAmount: 1000,
    defaultInterestRate: 12, // Updated from 2 to 12
    dueDay: 10
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
    // Migrations
    if (!parsed.loansIssued) parsed.loansIssued = [];
    if (!parsed.interestRateChanges) parsed.interestRateChanges = [];
    if (!parsed.meetingNotes) parsed.meetingNotes = [];
    if (!parsed.adminPayments) parsed.adminPayments = [];
    if (!parsed.miscPayments) parsed.miscPayments = [];
    if (!parsed.notifications) parsed.notifications = [];
    if (!parsed.monthlySavingsTargets) parsed.monthlySavingsTargets = {};
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
  const [loginStep, setLoginStep] = useState<'PHONE' | 'OTP' | 'ADMIN_LOGIN'>('PHONE');
  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Admin Login States
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Password Change State
  const [newAdminPass, setNewAdminPass] = useState('');

  // Monthly Target Schedule States
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));
  const [targetAmount, setTargetAmount] = useState<number>(data.settings.monthlySavingsAmount);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'payments' | 'loans' | 'loans-list' | 'admin-pays' | 'misc-pays' | 'summary' | 'notes' | 'settings' | 'report' | 'notifications'>('dashboard');
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

  // Countdown timer effect
  useEffect(() => {
    let interval: number | undefined;
    if (resendTimer > 0) {
      interval = window.setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleLogout = () => {
    setAuthUser(null);
    setLoginPhone('');
    setOtpValue('');
    setAdminUsername('');
    setAdminPassword('');
    setLoginStep('PHONE');
    setLoginError(null);
    setResendTimer(0);
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
      // Simulate SMS delay
      setTimeout(() => {
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(newOtp);
        setLoginStep('OTP');
        setIsSendingOtp(false);
        setResendTimer(60); // Start 60s countdown
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

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const savedPass = data.settings.adminPassword || 'admin';
    if (adminUsername === 'admin' && adminPassword === savedPass) {
      setAuthUser({ id: 'admin-0', name: 'Administrator', role: 'ADMIN' });
    } else {
      setLoginError('Invalid administrator credentials.');
    }
  };

  const updateSettings = (settings: GroupSettings) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({ ...prev, settings }));
  };

  const handleUpdateAdminPassword = () => {
    if (!newAdminPass.trim() || newAdminPass.length < 4) {
      alert("Password must be at least 4 characters long.");
      return;
    }
    updateSettings({ ...data.settings, adminPassword: newAdminPass.trim() });
    setNewAdminPass('');
    alert("Administrator password updated successfully. Please remember it for your next login.");
  };

  const setMonthlySavingsTarget = (month: string, amount: number) => {
    if (authUser?.role !== 'ADMIN') return;
    setData(prev => ({
      ...prev,
      monthlySavingsTargets: {
        ...prev.monthlySavingsTargets,
        [month]: amount
      }
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
      message: `A new loan of ₹${amount.toLocaleString()} has been disbursed to ${member.name}.`,
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
          
          {loginStep === 'PHONE' && (
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
                onClick={() => setLoginStep('ADMIN_LOGIN')}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-emerald-600 hover:bg-emerald-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ShieldCheck size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900">Administrator Login</p>
                  <p className="text-xs text-slate-400 font-medium">Secure access with credentials</p>
                </div>
              </button>
            </div>
          )}

          {loginStep === 'OTP' && (
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

                <div className="text-center text-xs text-slate-400 font-medium space-y-2">
                  <p>Didn't receive the code?</p>
                  {resendTimer > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-slate-500 font-bold bg-slate-50 py-2 px-4 rounded-full w-fit mx-auto border border-slate-100">
                      <RotateCcw size={12} className="animate-spin-slow" />
                      Resend in {resendTimer}s
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => handleSendOtp()} 
                      className="text-emerald-600 font-black hover:bg-emerald-50 px-4 py-2 rounded-full transition-colors inline-flex items-center gap-1"
                    >
                      <RotateCcw size={14} />
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {loginStep === 'ADMIN_LOGIN' && (
            <div className="animate-in slide-in-from-bottom-4 duration-300">
              <button 
                onClick={() => setLoginStep('PHONE')}
                className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Mobile
              </button>

              <div className="text-center mb-10">
                <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-slate-900/20">
                  <Lock className="text-white" size={32} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Authentication</h1>
                <p className="text-slate-500 font-medium mt-1">Enter your credentials to manage the group</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                    <input 
                      type="text"
                      placeholder="Enter admin username"
                      className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-100 focus:border-slate-900 outline-none transition-all font-semibold"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                    <input 
                      type={showAdminPass ? "text" : "password"}
                      placeholder="Enter admin password"
                      className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-100 focus:border-slate-900 outline-none transition-all font-semibold"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showAdminPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {loginError && (
                    <div className="mt-3 flex items-center gap-2 text-red-500 text-xs font-bold animate-in slide-in-from-top-1">
                      <AlertCircle size={14} />
                      {loginError}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Standard Credentials</p>
                  <p className="text-xs font-bold text-slate-600">User: <span className="text-slate-900">admin</span> | Pass: <span className="text-slate-900">admin</span></p>
                </div>

                <button 
                  type="submit" 
                  className="w-full flex items-center justify-center gap-2 p-5 rounded-2xl bg-slate-900 text-white hover:bg-black transition-all shadow-xl shadow-slate-900/10 font-black"
                >
                  Verify Credentials
                  <ShieldCheck size={20} />
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
        {badge !== undefined && badge > 0 ? (
          <span className="ml-auto bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {badge}
          </span>
        ) : activeTab === id && <ChevronRight size={16} className="ml-auto" />}
      </button>
    );
  };

  const unreadNotificationsCount = data.notifications.filter(n => !n.read).length;

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
            <NavItem id="notifications" icon={Bell} label="Notifications" hidden={!isAdmin} badge={unreadNotificationsCount} />
            <NavItem id="members" icon={Users} label="Group Members" hidden={!isAdmin} />
            <NavItem id="payments" icon={CircleDollarSign} label="Record Payment" hidden={!isAdmin} />
            <NavItem id="loans" icon={HandCoins} label="Issue Loan" hidden={!isAdmin} />
            <NavItem id="loans-list" icon={ListFilter} label="All Loans" hidden={!isAdmin} />
            <NavItem id="notes" icon={MessageSquareText} label="Meeting Minutes" />
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
        <div className="max-width-6xl mx-auto">
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
            <NotificationCenter 
              notifications={data.notifications} 
              onMarkRead={markAllNotificationsRead} 
              onClear={clearNotifications} 
            />
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
            <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-2 space-y-8">
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
                      <label className="block text-sm font-bold text-slate-700 mb-2">Global Savings Target (Default)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input 
                          type="number" 
                          value={data.settings.monthlySavingsAmount} 
                          onChange={(e) => updateSettings({...data.settings, monthlySavingsAmount: Number(e.target.value)})} 
                          className="w-full p-4 pl-8 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-black text-xl" 
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Default amount used when no monthly override is set.</p>
                    </div>
                  </div>

                  {/* Monthly Override Schedule */}
                  <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={20} className="text-emerald-600" />
                      <h3 className="font-bold text-slate-900 text-lg">Monthly Schedule Overrides</h3>
                    </div>
                    
                    <div className="space-y-4">
                       <div className="flex flex-col sm:flex-row gap-2">
                         <input 
                           type="month" 
                           className="flex-1 p-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                           value={targetMonth}
                           onChange={(e) => setTargetMonth(e.target.value)}
                         />
                         <div className="relative flex-1">
                           <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">₹</span>
                           <input 
                             type="number" 
                             placeholder="Amount"
                             className="w-full p-2 pl-5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                             value={targetAmount}
                             onChange={(e) => setTargetAmount(Number(e.target.value))}
                           />
                         </div>
                         <button 
                           onClick={() => setMonthlySavingsTarget(targetMonth, targetAmount)}
                           className="bg-slate-900 text-white p-2 rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center"
                           title="Set Monthly Target"
                         >
                           <PlusCircle size={18} />
                         </button>
                       </div>

                       <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                         {Object.entries(data.monthlySavingsTargets || {}).length > 0 ? (
                           Object.entries(data.monthlySavingsTargets || {}).sort((a,b) => b[0].localeCompare(a[0])).map(([m, val]) => (
                             <div key={m} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-sm animate-in slide-in-from-top-1">
                               <div>
                                 <span className="font-black text-slate-400 text-[10px] uppercase tracking-tighter block leading-none">{new Date(m + "-01").toLocaleDateString(undefined, { year: 'numeric', month: 'short'})}</span>
                                 <span className="font-bold text-slate-900">₹{val.toLocaleString()}</span>
                               </div>
                               <button 
                                 onClick={() => removeMonthlySavingsTarget(m)}
                                 className="text-slate-300 hover:text-red-500 transition-colors"
                               >
                                 <Trash2 size={14} />
                               </button>
                             </div>
                           ))
                         ) : (
                           <p className="text-[10px] text-slate-400 italic text-center py-4">No monthly overrides set. Global default applies to all months.</p>
                         )}
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-white rounded-3xl p-8 border shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-red-50 p-2.5 rounded-xl text-red-600">
                    <Lock size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Security & Access</h2>
                    <p className="text-sm text-slate-500">Update your administrator login credentials.</p>
                  </div>
                </div>
                
                <div className="max-w-md space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">New Administrator Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={20} />
                      <input 
                        type="password" 
                        className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-100 focus:border-red-500 outline-none transition-all font-semibold" 
                        placeholder="Enter new secure password"
                        value={newAdminPass}
                        onChange={(e) => setNewAdminPass(e.target.value)}
                      />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Default is 'admin'. Choose something hard to guess.</p>
                  </div>
                  
                  <button 
                    onClick={handleUpdateAdminPassword}
                    className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                  >
                    <ShieldCheck size={20} />
                    Update Administrator Password
                  </button>
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
