export type Frequency = 'ONE_TIME' | 'WEEKLY' | 'MONTHLY' | 'ANNUAL';
export type IncomeType = 'SALARY' | 'COMMISSION' | 'PENSION' | 'OTHER';
export type StreakType = 'POSITIVE' | 'NEGATIVE';

export interface IncomeSource {
  id: string;
  name: string;
  type: IncomeType;
  amount: string;
  frequency: Frequency;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: string;
  frequency: Frequency;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface Goal {
  id: string;
  name: string;
  category: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string | null;
}

export interface Streak {
  id: string;
  name: string;
  type: StreakType;
  currentCount: number;
  longestCount: number;
  lastLoggedDate: string | null;
}

export interface LogEntry {
  id: string;
  date: string;
  mood: number | null;
  note: string | null;
  tags: string[] | null;
  value: string | null;
}

export interface MetricSnapshot {
  date: string;
  projectedMRR: string;
  totalIncome: string;
  totalExpenses: string;
  savingsRate: string;
  netCashFlow: string;
}

export interface ComputedMetrics {
  asOf: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  projectedMRR: number;
  netCashFlow: number;
  savingsRate: number;
  totalIncome: number;
  totalExpenses: number;
}

export interface ProjectionPoint {
  month: number;
  income: number;
  expenses: number;
  net: number;
}

export interface ProjectionScenario {
  label: 'baseline' | 'upside' | 'downside';
  horizonMonths: number;
  points: ProjectionPoint[];
  endingNet: number;
}

export type AccountKind =
  | 'CHECKING'
  | 'SAVINGS'
  | 'CASH'
  | 'CREDIT_CARD'
  | 'INVESTMENT'
  | 'LOAN'
  | 'OTHER';

export type TransactionKind = 'INFLOW' | 'OUTFLOW' | 'TRANSFER' | 'ADJUSTMENT';

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  // ISO-4217 code, account's native currency. Balances and transactions on this
  // account are denominated in this currency.
  currency: string;
  institution: string | null;
  openingBalance: string;
  openingDate: string;
  isActive: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  currentBalance: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  amount: string;
  kind: TransactionKind;
  category: string | null;
  description: string | null;
  sourceIncomeId: string | null;
  sourceExpenseId: string | null;
  transferToAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardPayload {
  asOf: string;
  monthStart: string;
  metrics: ComputedMetrics;
  scenarios: {
    baseline: ProjectionScenario;
    upside: ProjectionScenario;
    downside: ProjectionScenario;
  };
  snapshots: MetricSnapshot[];
  streaks: Streak[];
  recentLogs: LogEntry[];
  goals: Goal[];
  activeIncomeSources: IncomeSource[];
  activeExpenses: Expense[];
  accounts: Account[];
  monthTransactions: Transaction[];
}
