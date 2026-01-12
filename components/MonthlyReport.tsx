
import React, { useMemo, useState } from 'react';
import { GroupData, AuthUser, Member } from '../types';
import { 
  Printer, 
  ArrowLeft, 
  Wallet, 
  TrendingUp, 
  Receipt, 
  UserX, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  History,
  ArrowUpRight,
  Download
} from 'lucide-react';

interface MonthlyReportProps {
  data: GroupData;
  authUser: AuthUser;
  onBack: () => void;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({ data, authUser, onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const reportData = useMemo(() => {
    const records = data.records.filter(r => r.month === selectedMonth);
    const adminPays = data.adminPayments.filter(p => p.month === selectedMonth);
    const miscPays = data.miscPayments.filter(p => p.month === selectedMonth);

    const totals = records.reduce((acc, r) => ({
      savings: acc.savings + r.savings,
      principal: acc.principal + r.principalPaid,
      interest: acc.interest + r.interestPaid,
      penalty: acc.penalty + r.penalty,
    }), { savings: 0, principal: 0, interest: 0, penalty: 0 });

    const collectionSum = totals.savings + totals.principal + totals.interest + totals.penalty;
    const expenseSum = adminPays.reduce((a, b) => a + b.amount, 0) + miscPays.reduce((a, b) => a + b.amount, 0);

    // Outstanding Dues Analysis
    const monthSavingsTarget = (data.monthlySavingsTargets && data.monthlySavingsTargets[selectedMonth] !== undefined)
      ? data.monthlySavingsTargets[selectedMonth]
      : data.settings.monthlySavingsAmount;

    const dues = data.members.map(member => {
      const record = records.find(r => r.memberId === member.id);
      const isPaid = !!record;
      const savingsDue = isPaid ? 0 : monthSavingsTarget;
      const interestDue = isPaid ? 0 : (member.currentLoanPrincipal * member.loanInterestRate) / 100;
      const totalDue = savingsDue + interestDue;

      return {
        member,
        isPaid,
        savingsDue,
        interestDue,
        totalDue
      };
    }).filter(d => !d.isPaid && d.totalDue > 0);

    return {
      records,
      adminPays,
      miscPays,
      totals,
      collectionSum,
      expenseSum,
      dues,
      netFlow: collectionSum - expenseSum
    };
  }, [data, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = () => {
    const headers = ['Member Name', 'Savings', 'Principal Paid', 'Interest Paid', 'Penalty', 'Total', 'Date Recorded'];
    const rows = reportData.records.map(record => {
      const member = data.members.find(m => m.id === record.memberId);
      const total = record.savings + record.principalPaid + record.interestPaid + record.penalty;
      return [
        `"${member?.name || 'Unknown'}"`,
        record.savings,
        record.principalPaid,
        record.interestPaid,
        record.penalty,
        total,
        new Date(record.timestamp).toLocaleDateString()
      ];
    });

    // Add Expenses to CSV
    rows.push([]); // Empty row separator
    rows.push(['EXPENSES - Category', 'Description', 'Amount', 'Date']);
    reportData.adminPays.forEach(p => {
      rows.push(['Admin Reward', `"${p.description}"`, p.amount, new Date(p.timestamp).toLocaleDateString()]);
    });
    reportData.miscPays.forEach(p => {
      rows.push(['Misc Expense', `"${p.description}"`, p.amount, new Date(p.timestamp).toLocaleDateString()]);
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Group_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header - Hidden on Print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm mb-2 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h2 className="text-2xl font-black text-slate-900">Monthly Financial Report</h2>
          <p className="text-slate-500 font-medium italic">Consolidated statement for {new Date(selectedMonth + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="month" 
            className="p-3 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-emerald-500 transition-all"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <div className="flex gap-2">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-white border-2 border-slate-100 text-slate-600 px-5 py-3 rounded-2xl hover:bg-slate-50 transition-all font-bold shadow-sm"
            >
              <Download size={18} />
              Export CSV
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-xl shadow-slate-900/10"
            >
              <Printer size={18} />
              Print Report
            </button>
          </div>
        </div>
      </div>

      {/* Main Report Document */}
      <div className="bg-white rounded-[2.5rem] border shadow-sm p-8 md:p-12 print:shadow-none print:border-none print:p-0">
        <div className="border-b-4 border-slate-900 pb-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{data.settings.name}</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Official Monthly Financial Statement</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Reporting Period</p>
            <p className="text-xl font-bold text-slate-600">{new Date(selectedMonth + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Executive Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <SummaryCard 
            label="Total Collections" 
            value={`₹${reportData.collectionSum.toLocaleString()}`} 
            color="bg-emerald-50 text-emerald-600 border-emerald-100" 
            icon={TrendingUp}
            sub="Savings + Principal + Interest"
          />
          <SummaryCard 
            label="Total Outflows" 
            value={`₹${reportData.expenseSum.toLocaleString()}`} 
            color="bg-red-50 text-red-600 border-red-100" 
            icon={Receipt}
            sub="Admin Rewards + Misc Expenses"
          />
          <SummaryCard 
            label="Net Monthly Flow" 
            value={`₹${reportData.netFlow.toLocaleString()}`} 
            color="bg-slate-900 text-white border-slate-900" 
            icon={Wallet}
            sub="Liquidity Added to Corpus"
          />
        </div>

        <div className="space-y-12">
          {/* Detailed Collections */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b pb-2">
              <History size={20} className="text-emerald-600" />
              <h3 className="text-lg font-black uppercase tracking-tight">Collection Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Member</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Savings</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Principal</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Interest</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Penalty</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.records.map(record => {
                    const member = data.members.find(m => m.id === record.memberId);
                    const total = record.savings + record.principalPaid + record.interestPaid + record.penalty;
                    return (
                      <tr key={record.id}>
                        <td className="px-4 py-3 font-bold text-slate-800">{member?.name}</td>
                        <td className="px-4 py-3 text-right text-slate-500">₹{record.savings.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-500">₹{record.principalPaid.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-500">₹{record.interestPaid.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-red-500 font-bold">{record.penalty > 0 ? `₹${record.penalty}` : '-'}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">₹{total.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-black border-t-2 border-slate-200">
                    <td className="px-4 py-4">MONTHLY TOTALS</td>
                    <td className="px-4 py-4 text-right">₹{reportData.totals.savings.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right">₹{reportData.totals.principal.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right">₹{reportData.totals.interest.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right">₹{reportData.totals.penalty.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right text-emerald-600">₹{reportData.collectionSum.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Outstanding Dues */}
          <section className="bg-red-50/30 p-8 rounded-3xl border border-red-100 print:bg-white print:p-0 print:border-none">
            <div className="flex items-center justify-between mb-6 border-b border-red-100 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-600" />
                <h3 className="text-lg font-black uppercase tracking-tight text-red-900">Outstanding Dues Analysis</h3>
              </div>
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-100 px-3 py-1 rounded-full">
                {reportData.dues.length} Members Pending
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-red-900/50 border-b border-red-100">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black uppercase">Member</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-right">Savings Due</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-right">Interest Due</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-right">Estimated Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-50">
                  {reportData.dues.length > 0 ? reportData.dues.map(due => (
                    <tr key={due.member.id}>
                      <td className="px-4 py-3 font-bold text-red-900">{due.member.name}</td>
                      <td className="px-4 py-3 text-right text-red-700">₹{due.savingsDue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-red-700">₹{due.interestDue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-black text-red-600 underline underline-offset-4 decoration-2">₹{due.totalDue.toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-emerald-600 font-bold">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle2 size={18} />
                          All members have cleared their dues for this month!
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Outbound Expenses */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b pb-2">
              <Receipt size={20} className="text-slate-600" />
              <h3 className="text-lg font-black uppercase tracking-tight">Outgoing Payments (Outflows)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Category</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Description</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...reportData.adminPays, ...reportData.miscPays].map((pay, i) => (
                    <tr key={pay.id}>
                      <td className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">
                        {'periodMonths' in pay ? 'Admin Reward' : 'Misc Expense'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{pay.description}</td>
                      <td className="px-4 py-3 text-right font-black text-red-500">₹{pay.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {reportData.adminPays.length === 0 && reportData.miscPays.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No outflows recorded this month.</td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-black border-t-2 border-slate-200">
                    <td colSpan={2} className="px-4 py-4">TOTAL OUTFLOW</td>
                    <td className="px-4 py-4 text-right text-red-600">₹{reportData.expenseSum.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Footer Note */}
        <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-6 opacity-60">
          <div className="text-xs font-medium text-slate-400 space-y-1">
            <p>Generated by Group Finance Pro AI Engine</p>
            <p>Date Generated: {new Date().toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4">Official Authorization</p>
            <div className="w-48 h-1 bg-slate-200 ml-auto mb-1"></div>
            <p className="text-[8px] font-bold text-slate-400">ADMINISTRATOR SIGNATURE</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className={`p-8 rounded-[2rem] border-2 shadow-sm ${color}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-black uppercase tracking-widest opacity-70">{label}</span>
      <Icon size={24} className="opacity-70" />
    </div>
    <div className="text-3xl font-black">{value}</div>
    <p className="text-[10px] font-bold uppercase tracking-tighter mt-1 opacity-60">{sub}</p>
  </div>
);

export default MonthlyReport;
