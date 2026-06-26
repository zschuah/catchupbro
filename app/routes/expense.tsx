import { redirect } from "react-router";
import { addExpense, getTrip, rebalanceTrip } from "~/api/trips";
import { ExpenseForm } from "~/components/ExpenseForm";
import { DEFAULT_CURRENCY } from "~/utils/constants";
import { expenseFromForm, getActiveTrip } from "~/utils/helpers";
import { createMeta } from "~/utils/meta";
import type { Route } from "./+types/expense";

export function meta(_: Route.MetaArgs) {
  return createMeta({ title: "Add expense" });
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { tripCode } = params;

  const active = getActiveTrip();
  if (!active || active.tripCode !== tripCode || !active.profileId) {
    throw redirect(`/trip/${tripCode}/join`);
  }

  const trip = await getTrip(tripCode);
  if (!trip) {
    throw new Response(`Trip "${tripCode}" not found.`, { status: 404 });
  }

  return {
    tripCode,
    members: trip.members ?? {},
    currency: trip.currency ?? DEFAULT_CURRENCY,
    activeProfileId: active.profileId,
  };
}

export async function clientAction({
  params,
  request,
}: Route.ClientActionArgs) {
  const { tripCode } = params;
  const expense = expenseFromForm(await request.formData());

  if (!(expense.amount > 0) || Object.keys(expense.splitAmong).length === 0) {
    return { error: "Enter an amount and pick at least one person." };
  }

  await addExpense(tripCode, expense);
  await rebalanceTrip(tripCode);
  throw redirect(`/trip/${tripCode}`);
}

export default function AddExpense({ loaderData }: Route.ComponentProps) {
  const { tripCode, members, currency, activeProfileId } = loaderData;
  return (
    <ExpenseForm
      mode="add"
      tripCode={tripCode}
      members={members}
      currency={currency}
      activeProfileId={activeProfileId}
    />
  );
}
