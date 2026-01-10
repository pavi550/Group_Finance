
export type UserRole = 'ADMIN' | 'MEMBER';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  memberId?: string; // Links to a Member if role is MEMBER
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  joiningDate: string;
  currentLoanPrincipal: number;
  loanInterestRate: number; // monthly %
  loanCap: number; // Maximum amount this member can borrow
}

export interface PaymentRecord {
  id: string;
  memberId: string;
  month: string; // "YYYY-MM"
  savings: number;
  principalPaid: number;
  interestPaid: number;
  penalty: number;
  timestamp: string;
}

export interface LoanIssuedRecord {
  id: string;
  memberId: string;
  amount: number;
  interestRate: number;
  date: string;
}

export interface InterestRateChangeRecord {
  id: string;
  memberId: string;
  oldRate: number;
  newRate: number;
  reason: string;
  date: string;
}

export interface MeetingNote {
  id: string;
  month: string;
  content: string;
  publishedAt: string | null; // null if draft
  author: string;
  createdAt: string;
}

export interface AdminPayment {
  id: string;
  month: string; // The month the payment is recorded for
  amount: number;
  description: string;
  periodMonths: number; // Duration this payment covers
  timestamp: string;
}

export interface MiscellaneousPayment {
  id: string;
  month: string;
  amount: number;
  description: string;
  timestamp: string;
}

export interface GroupSettings {
  name: string;
  monthlySavingsAmount: number;
  defaultInterestRate: number;
  dueDay: number; // Day of month when payment is due (1-28)
}

export interface GroupData {
  settings: GroupSettings;
  members: Member[];
  records: PaymentRecord[];
  loansIssued: LoanIssuedRecord[];
  interestRateChanges: InterestRateChangeRecord[];
  meetingNotes: MeetingNote[];
  adminPayments: AdminPayment[];
  miscPayments: MiscellaneousPayment[];
}
