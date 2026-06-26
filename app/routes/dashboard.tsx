import { FaHouse, FaPlus } from "react-icons/fa6";
import { Form, Link, redirect } from "react-router";
import { addExpense, getTrip, rebalanceTrip } from "~/api/trips";
import { ExpenseRow } from "~/components/ExpenseRow";
import { DEFAULT_CURRENCY } from "~/utils/constants";
import {
  computeBalances,
  formatCurrency,
  getActiveTrip,
  groupExpensesByDate,
  suggestPayments,
  todayISO,
} from "~/utils/helpers";
import { createMeta } from "~/utils/meta";
import type { Expense } from "~/utils/types";
import type { Route } from "./+types/dashboard";

export function meta({ params }: Route.MetaArgs) {
  return createMeta({ title: `Trip ${params.tripCode}` });
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

  const members = trip.members ?? {};
  // Ordering/grouping happens in groupExpensesByDate on the client.
  const expenses = Object.entries(trip.expenses ?? {});
  const balances = computeBalances(trip);
  const settlements = suggestPayments(balances);

  return {
    tripCode,
    active,
    members,
    expenses,
    settlements,
    myBalance: balances[active.profileId] ?? 0,
    currency: trip.currency ?? DEFAULT_CURRENCY,
  };
}

export async function clientAction({
  params,
  request,
}: Route.ClientActionArgs) {
  const { tripCode } = params;
  const form = await request.formData();
  const from = String(form.get("from") ?? "");
  const to = String(form.get("to") ?? "");
  const amount = Number(form.get("amount"));

  if (!from || !to || !(amount > 0)) {
    return { error: "Invalid settlement." };
  }

  const payment: Expense = {
    description: "Settlement",
    amount,
    paidBy: from,
    splitAmong: { [to]: true },
    date: todayISO(),
    timestamp: Date.now(),
    isPayment: true,
  };
  await addExpense(tripCode, payment);
  await rebalanceTrip(tripCode);
  return { ok: true };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const {
    tripCode,
    active,
    members,
    expenses,
    settlements,
    myBalance,
    currency,
  } = loaderData;

  const expenseGroups = groupExpensesByDate(expenses);

  const balanceLabel =
    myBalance > 0.01
      ? `You are owed ${formatCurrency(myBalance, currency)}`
      : myBalance < -0.01
        ? `You owe ${formatCurrency(-myBalance, currency)}`
        : "You're all settled up";

  return (
    <main className="bg-base-200 min-h-screen pb-24">
      <header className="bg-base-100 sticky top-0 z-20 shadow-sm">
        <div className="mx-auto flex max-w-md items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold">Hi, {active.profileName}!</h1>
            <p className="text-base-content/60 text-sm">
              Trip <span className="font-mono">{tripCode}</span> ·{" "}
              {balanceLabel}
            </p>
          </div>
          <Link to="/" className="btn btn-ghost btn-sm" aria-label="Home">
            <FaHouse /> Home
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-md flex-col gap-6 p-4">
        {/* Suggested payments */}
        <section>
          <h2 className="mb-2 text-lg font-semibold">Suggested payments</h2>
          {settlements.length === 0 ? (
            <p className="text-base-content/60 rounded-box bg-base-100 p-4 text-sm">
              Everyone's settled up. 🎉
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {settlements.map((s) => {
                const fromName = members[s.from]?.name ?? "Unknown";
                const toName = members[s.to]?.name ?? "Unknown";
                // Only the debtor ("I paid") or creditor ("I received") may
                // record this payment — not an uninvolved third party.
                const isMine =
                  s.from === active.profileId || s.to === active.profileId;

                return (
                  <li
                    key={`${s.from}-${s.to}`}
                    className="bg-base-100 rounded-box flex items-center justify-between gap-3 p-3"
                  >
                    <span className="text-sm">
                      <span className="font-medium">{fromName}</span> owes{" "}
                      <span className="font-medium">{toName}</span>{" "}
                      <span className="font-semibold">
                        {formatCurrency(s.amount, currency)}
                      </span>
                    </span>
                    {isMine ? (
                      <Form method="post">
                        <input type="hidden" name="from" value={s.from} />
                        <input type="hidden" name="to" value={s.to} />
                        <input type="hidden" name="amount" value={s.amount} />
                        <button className="btn btn-success btn-sm">
                          Settle up
                        </button>
                      </Form>
                    ) : (
                      <div
                        className="tooltip tooltip-bottom tooltip-end"
                        data-tip={`Only ${fromName} or ${toName} can settle this`}
                      >
                        <button className="btn btn-success btn-sm" disabled>
                          Settle up
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Expenses */}
        <section>
          <h2 className="mb-2 text-lg font-semibold">Expenses</h2>
          {expenseGroups.length === 0 ? (
            <p className="text-base-content/60 rounded-box bg-base-100 p-4 text-sm">
              No expenses yet. Add the first one!
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {expenseGroups.map((group) => (
                <div key={group.date}>
                  <h3 className="text-base-content/60 sticky top-20 z-10 bg-base-200 py-1 px-1 text-xs font-semibold uppercase">
                    {group.label}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {group.items.map(([id, expense]) => (
                      <li key={id}>
                        <ExpenseRow
                          id={id}
                          expense={expense}
                          members={members}
                          currency={currency}
                          tripCode={tripCode}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add expense FAB */}
      <Link
        to={`/trip/${tripCode}/expense`}
        className="btn btn-primary btn-circle btn-lg fixed bottom-6 right-6 shadow-lg z-20"
        aria-label="Add expense"
      >
        <FaPlus className="text-xl" />
      </Link>
    </main>
  );
}
