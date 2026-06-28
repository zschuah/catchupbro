import type { IconType } from "react-icons";

/** A trip participant. Keyed in Firebase by a push-generated profileId. */
export interface Member {
  name: string;
  balance: number;
}

/**
 * A single expense (or a settlement payment when `isPayment` is true).
 * `paidBy` is a profileId; `splitAmong` maps profileIds -> true.
 */
export interface Expense {
  /** Category key, e.g. "food". Drives the icon. */
  category: string;
  /** Optional free-text note. When empty, the category label is shown instead. */
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: Record<string, true>;
  /** The day the expense happened, as "YYYY-MM-DD". */
  date: string;
  /** When the expense was logged (ms epoch) — used for intra-day ordering. */
  timestamp: number;
  isPayment: boolean;
}

/**
 * A trip node at /trips/$tripCode. `members`/`expenses` are optional because
 * Firebase omits empty children on read.
 */
export interface Trip {
  currency?: string;
  createdAt?: number;
  members?: Record<string, Member>;
  expenses?: Record<string, Expense>;
}

/** The top-level /trips node, keyed by tripCode. */
export type TripsMap = Record<string, Trip>;

/** Identity persisted in localStorage under STORAGE_KEY. */
export interface ActiveTrip {
  tripCode: string;
  profileId: string;
  profileName: string;
}

/** A suggested payment in the greedy settlement: `from` owes `to` `amount`. */
export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

/** Expenses for one day, grouped for the dashboard. `items` are [id, expense]. */
export interface ExpenseGroup {
  date: string;
  label: string;
  items: Array<[string, Expense]>;
}

/** An expense category rendered in the fast-log category grid. */
export interface Category {
  key: string;
  label: string;
  Icon: IconType;
}
