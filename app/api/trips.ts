import { computeBalances } from "~/utils/helpers";
import type { Expense, Member, Trip } from "~/utils/types";
import { fbDelete, fbGet, fbPatch, fbPost, fbPut } from "./firebase";

/** All existing trip codes (shallow read of /trips). */
export async function listTripCodes(): Promise<string[]> {
  const map = await fbGet<Record<string, true>>("/trips", { shallow: true });
  return map ? Object.keys(map) : [];
}

/** True if a trip node already exists for this code. */
export async function tripExists(code: string): Promise<boolean> {
  const node = await fbGet<unknown>(`/trips/${code}`, { shallow: true });
  return node !== null;
}

/**
 * Create a new trip. Writes a concrete primitive (createdAt) plus the chosen
 * currency so the code durably persists and shows in the shallow list.
 */
export async function createTrip(
  code: string,
  currency: string,
): Promise<void> {
  await fbPut(`/trips/${code}`, { createdAt: Date.now(), currency });
}

export async function getTrip(code: string): Promise<Trip | null> {
  return fbGet<Trip>(`/trips/${code}`);
}

export async function getMembers(
  code: string,
): Promise<Record<string, Member>> {
  const members = await fbGet<Record<string, Member>>(`/trips/${code}/members`);
  return members ?? {};
}

/** Add a member; returns the generated profileId. */
export async function addMember(code: string, name: string): Promise<string> {
  const member: Member = { name, balance: 0 };
  const { name: profileId } = await fbPost(`/trips/${code}/members`, member);
  return profileId;
}

/** Add an expense; returns the generated expenseId. */
export async function addExpense(
  code: string,
  expense: Expense,
): Promise<string> {
  const { name: expenseId } = await fbPost(`/trips/${code}/expenses`, expense);
  return expenseId;
}

export async function updateExpense(
  code: string,
  expenseId: string,
  expense: Expense,
): Promise<void> {
  await fbPut(`/trips/${code}/expenses/${expenseId}`, expense);
}

export async function getExpense(
  code: string,
  expenseId: string,
): Promise<Expense | null> {
  return fbGet<Expense>(`/trips/${code}/expenses/${expenseId}`);
}

export async function deleteExpense(
  code: string,
  expenseId: string,
): Promise<void> {
  await fbDelete(`/trips/${code}/expenses/${expenseId}`);
}

/**
 * Persist recomputed balances onto each member node so the stored schema
 * field stays in sync with the expense-derived source of truth.
 */
export async function patchBalances(
  code: string,
  balances: Record<string, number>,
): Promise<void> {
  const updates: Record<string, number> = {};
  for (const [profileId, balance] of Object.entries(balances)) {
    updates[`${profileId}/balance`] = balance;
  }
  if (Object.keys(updates).length === 0) return;
  await fbPatch(`/trips/${code}/members`, updates);
}

/**
 * Re-fetch the trip, recompute balances from its expenses, and persist them
 * onto the member nodes. Call after any expense mutation.
 */
export async function rebalanceTrip(code: string): Promise<void> {
  const trip = await getTrip(code);
  if (!trip) return;
  await patchBalances(code, computeBalances(trip));
}
