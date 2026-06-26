import { redirect } from "react-router";
import type { Route } from "./+types/edit-expense";
import { ExpenseForm } from "~/components/ExpenseForm";
import {
  deleteExpense,
  getExpense,
  getTrip,
  rebalanceTrip,
  updateExpense,
} from "~/api/trips";
import { DEFAULT_CURRENCY } from "~/utils/constants";
import { expenseFromForm, getActiveTrip } from "~/utils/helpers";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Edit expense" }];
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { tripCode, expenseId } = params;

  const active = getActiveTrip();
  if (!active || active.tripCode !== tripCode || !active.profileId) {
    throw redirect(`/trip/${tripCode}/join`);
  }

  const trip = await getTrip(tripCode);
  if (!trip) {
    throw new Response(`Trip "${tripCode}" not found.`, { status: 404 });
  }

  const initial = trip.expenses?.[expenseId];
  if (!initial) {
    throw new Response("Expense not found.", { status: 404 });
  }

  return {
    tripCode,
    members: trip.members ?? {},
    currency: trip.currency ?? DEFAULT_CURRENCY,
    activeProfileId: active.profileId,
    initial,
  };
}

export async function clientAction({ params, request }: Route.ClientActionArgs) {
  const { tripCode, expenseId } = params;
  const form = await request.formData();

  if (form.get("intent") === "delete") {
    await deleteExpense(tripCode, expenseId);
    await rebalanceTrip(tripCode);
    throw redirect(`/trip/${tripCode}`);
  }

  const expense = expenseFromForm(form);
  if (!(expense.amount > 0) || Object.keys(expense.splitAmong).length === 0) {
    return { error: "Enter an amount and pick at least one person." };
  }

  // Preserve the original timestamp and payment flag from the stored expense.
  const existing = await getExpense(tripCode, expenseId);
  if (existing) {
    expense.timestamp = existing.timestamp;
    expense.isPayment = existing.isPayment;
  }

  await updateExpense(tripCode, expenseId, expense);
  await rebalanceTrip(tripCode);
  throw redirect(`/trip/${tripCode}`);
}

export default function EditExpense({ loaderData }: Route.ComponentProps) {
  const { tripCode, members, currency, activeProfileId, initial } = loaderData;
  return (
    <ExpenseForm
      mode="edit"
      tripCode={tripCode}
      members={members}
      currency={currency}
      activeProfileId={activeProfileId}
      initial={initial}
    />
  );
}
