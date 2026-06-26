import { useEffect, useState } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { FaPlane } from "react-icons/fa6";
import type { Route } from "./+types/admin";
import { createTrip, listTripCodes, tripExists } from "~/api/trips";
import { CODE_REGEX, CURRENCIES, DEFAULT_CURRENCY } from "~/utils/constants";
import { sanitizeCode } from "~/utils/helpers";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Admin · Trips" }];
}

export async function clientLoader(_: Route.ClientLoaderArgs) {
  const codes = await listTripCodes();
  return { codes: codes.sort() };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const form = await request.formData();
  const code = sanitizeCode(String(form.get("code") ?? ""));
  const currency = String(form.get("currency") ?? "").trim() || DEFAULT_CURRENCY;

  if (!code) return { error: "Please enter a trip code." };
  if (!CODE_REGEX.test(code)) {
    return { error: "Code must be uppercase letters and numbers only." };
  }
  if (await tripExists(code)) {
    return { error: `Trip "${code}" already exists.` };
  }

  await createTrip(code, currency);
  return { ok: true as const, code };
}

export default function Admin({ loaderData }: Route.ComponentProps) {
  const { codes } = loaderData;
  const result = useActionData<typeof clientAction>();
  const navigation = useNavigation();
  const isCreating = navigation.state !== "idle";

  // Auto-dismiss the toast a few seconds after each action result.
  const [toast, setToast] = useState<typeof result>(undefined);
  useEffect(() => {
    if (!result) return;
    setToast(result);
    const id = window.setTimeout(() => setToast(undefined), 3000);
    return () => window.clearTimeout(id);
  }, [result]);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <header className="mb-6 flex items-center gap-2">
        <FaPlane className="text-primary text-2xl" />
        <h1 className="text-2xl font-bold">Trips Admin</h1>
      </header>

      <Form method="post" className="mb-2 flex flex-wrap gap-2">
        <input
          name="code"
          placeholder="TRIPCODE"
          aria-label="New trip code"
          className="input input-bordered grow uppercase"
          autoCapitalize="characters"
          autoCorrect="off"
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.toUpperCase();
          }}
          required
        />
        <select
          name="currency"
          aria-label="Currency"
          defaultValue={DEFAULT_CURRENCY}
          className="select select-bordered w-24"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" disabled={isCreating}>
          {isCreating ? "Creating…" : "Create"}
        </button>
      </Form>
      <p className="text-base-content/60 mb-6 text-sm">
        Codes are uppercase letters and numbers only. Deletion is handled in the
        Firebase Console.
      </p>

      <h2 className="mb-2 text-lg font-semibold">
        Existing trips ({codes.length})
      </h2>
      {codes.length === 0 ? (
        <p className="text-base-content/60">No trips yet.</p>
      ) : (
        <ul className="menu bg-base-200 rounded-box">
          {codes.map((code) => (
            <li key={code}>
              <Link to={`/trip/${code}`} className="font-mono">
                {code}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {toast && (
        <div className="toast toast-top toast-end">
          <div className={`alert ${toast.error ? "alert-error" : "alert-success"}`}>
            <span>
              {toast.error ? toast.error : `Created trip ${toast.code}.`}
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
