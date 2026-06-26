import {
  CATEGORIES,
  DEFAULT_CURRENCY,
  OTHER_CATEGORY_KEY,
  STORAGE_KEY,
} from "./constants";
import type { ActiveTrip, Expense, Settlement, Trip } from "./types";

// ----------------------------------------------------------------------------
// localStorage (active trip identity)
// ----------------------------------------------------------------------------

export function getActiveTrip(): ActiveTrip | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActiveTrip) : null;
  } catch {
    return null;
  }
}

export function setActiveTrip(value: ActiveTrip): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function clearActiveTrip(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// ----------------------------------------------------------------------------
// Formatting / validation
// ----------------------------------------------------------------------------

/** Normalize a typed trip code: trim + uppercase. */
export function sanitizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/** Prefix a flat amount with the trip's currency symbol (display only). */
export function formatCurrency(amount: number, symbol = DEFAULT_CURRENCY): string {
  const value = (Number.isFinite(amount) ? amount : 0).toFixed(2);
  // Multi-char codes (e.g. "SGD") read better with a space.
  return symbol.length > 1 ? `${symbol} ${value}` : `${symbol}${value}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ----------------------------------------------------------------------------
// Balances & settlement
// ----------------------------------------------------------------------------

/**
 * Net balance per profileId, derived purely from the expense list.
 * Positive => the member is owed money (creditor); negative => owes (debtor).
 * Settlement payments are ordinary expenses, so they net balances back toward 0.
 */
export function computeBalances(trip: Trip | null): Record<string, number> {
  const balances: Record<string, number> = {};
  // Seed every known member at 0 so people with no activity still appear.
  for (const id of Object.keys(trip?.members ?? {})) balances[id] = 0;

  for (const expense of Object.values(trip?.expenses ?? {})) {
    const participants = Object.keys(expense.splitAmong ?? {});
    if (participants.length === 0) continue;
    const share = expense.amount / participants.length;

    balances[expense.paidBy] = (balances[expense.paidBy] ?? 0) + expense.amount;
    for (const id of participants) {
      balances[id] = (balances[id] ?? 0) - share;
    }
  }

  for (const id of Object.keys(balances)) balances[id] = round2(balances[id]);
  return balances;
}

/**
 * Greedy settlement: repeatedly match the largest debtor to the largest
 * creditor until everyone nets to ~0. Returns "from owes to amount" rows.
 */
export function suggestPayments(balances: Record<string, number>): Settlement[] {
  const EPS = 0.01;
  const creditors = Object.entries(balances)
    .filter(([, b]) => b > EPS)
    .map(([id, b]) => ({ id, amount: b }));
  const debtors = Object.entries(balances)
    .filter(([, b]) => b < -EPS)
    .map(([id, b]) => ({ id, amount: -b }));

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = round2(Math.min(creditor.amount, debtor.amount));

    if (amount > 0) {
      settlements.push({ from: debtor.id, to: creditor.id, amount });
    }

    creditor.amount = round2(creditor.amount - amount);
    debtor.amount = round2(debtor.amount - amount);
    if (creditor.amount <= EPS) ci++;
    if (debtor.amount <= EPS) di++;
  }

  return settlements;
}

/**
 * Build an Expense from the fast-log form's submitted fields. The description is
 * the category label, or the custom text when the "Other" category is chosen.
 * `timestamp`/`isPayment` are defaulted here; callers may override (e.g. edits
 * preserve the original timestamp).
 */
export function expenseFromForm(form: FormData): Expense {
  const categoryKey = String(form.get("category") ?? "");
  const category = CATEGORIES.find((c) => c.key === categoryKey);
  let description = category?.label ?? "Other";
  if (categoryKey === OTHER_CATEGORY_KEY) {
    description = String(form.get("description") ?? "").trim() || "Other";
  }

  const splitAmong: Record<string, true> = {};
  for (const id of form.getAll("split")) splitAmong[String(id)] = true;

  return {
    description,
    amount: Number(form.get("amount")),
    paidBy: String(form.get("paidBy") ?? ""),
    splitAmong,
    timestamp: Date.now(),
    isPayment: false,
  };
}
