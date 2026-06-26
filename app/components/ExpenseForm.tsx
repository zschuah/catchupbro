import { useState } from "react";
import { Form, Link, useNavigation } from "react-router";
import { FaArrowLeft } from "react-icons/fa6";
import { CategoryPicker } from "./CategoryPicker";
import { categoryForDescription, OTHER_CATEGORY_KEY } from "~/utils/constants";
import type { Expense, Member } from "~/utils/types";

interface ExpenseFormProps {
  tripCode: string;
  members: Record<string, Member>;
  currency: string;
  activeProfileId: string;
  mode: "add" | "edit";
  initial?: Expense;
}

export function ExpenseForm({
  tripCode,
  members,
  currency,
  activeProfileId,
  mode,
  initial,
}: ExpenseFormProps) {
  const memberEntries = Object.entries(members);

  const initialCategory = initial
    ? categoryForDescription(initial.description).key
    : "food";
  const [category, setCategory] = useState(initialCategory);
  const [customText, setCustomText] = useState(
    initial && initialCategory === OTHER_CATEGORY_KEY ? initial.description : "",
  );
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [paidBy, setPaidBy] = useState(initial?.paidBy ?? activeProfileId);

  // Set of currently-checked profileIds. For a new expense, everyone is
  // checked by default; for an edit, we seed from the saved splitAmong keys.
  const [split, setSplit] = useState<Set<string>>(
    () =>
      new Set(
        initial
          ? Object.keys(initial.splitAmong)
          : memberEntries.map(([id]) => id),
      ),
  );

  const navigation = useNavigation();
  const isBusy = navigation.state !== "idle";
  const isOther = category === OTHER_CATEGORY_KEY;
  const isValid =
    Number(amount) > 0 &&
    split.size > 0 &&
    (!isOther || customText.trim().length > 0);

  const handleToggleSplit = (id: string) => {
    setSplit((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <main className="bg-base-200 min-h-screen p-4">
      <div className="mx-auto max-w-md">
        <header className="mb-4 flex items-center gap-2">
          <Link
            to={`/trip/${tripCode}`}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <FaArrowLeft />
          </Link>
          <h1 className="text-xl font-bold">
            {mode === "edit" ? "Edit expense" : "Add expense"}
          </h1>
        </header>

        <Form method="post" className="flex flex-col gap-5">
          <input type="hidden" name="category" value={category} />

          {/* Amount */}
          <label className="form-control">
            <span className="label-text mb-1">Amount</span>
            <div className="input input-bordered flex items-center gap-2">
              <span className="text-base-content/60">{currency}</span>
              <input
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="grow"
                required
              />
            </div>
          </label>

          {/* Category */}
          <div className="form-control">
            <span className="label-text mb-1">Category</span>
            <CategoryPicker value={category} onChange={setCategory} />
            {isOther && (
              <input
                name="description"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Describe the expense"
                aria-label="Custom description"
                className="input input-bordered mt-2 w-full"
                required
              />
            )}
          </div>

          {/* Paid by */}
          <label className="form-control">
            <span className="label-text mb-1">Paid by</span>
            <select
              name="paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="select select-bordered w-full"
            >
              {memberEntries.map(([id, m]) => (
                <option key={id} value={id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          {/* Split among */}
          <div className="form-control">
            <span className="label-text mb-1">Split among</span>
            <div className="flex flex-col gap-1">
              {memberEntries.map(([id, m]) => (
                <label
                  key={id}
                  className="label cursor-pointer justify-start gap-3"
                >
                  <input
                    type="checkbox"
                    name="split"
                    value={id}
                    checked={split.has(id)}
                    onChange={() => handleToggleSplit(id)}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text">{m.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isBusy || !isValid}
          >
            {isBusy
              ? "Saving…"
              : mode === "edit"
                ? "Save changes"
                : "Add expense"}
          </button>
        </Form>
      </div>
    </main>
  );
}
