# Catch Up Bro

A lightweight, mobile-first Splitwise alternative for splitting expenses on group
trips. No accounts/auth — a trip is reached by its short **trip code**, and the
current user's identity lives in `localStorage`.

## Commands

```bash
npm run dev        # Vite dev server (HMR)
npm run build      # static SPA build
npm run typecheck  # react-router typegen && tsc  ← run after editing routes
```

There are no tests. `typecheck` is the gate — always run it after changes. The
typegen step regenerates `./+types/*` route types, so run it after adding/renaming
routes in `app/routes.ts`.

## Tech stack

- **React 19** + **React Router v8** in **framework mode**, but **SPA only**
  (`ssr: false` in `react-router.config.ts`). The app is 100% client-driven, so
  routes use `clientLoader` / `clientAction` (NOT `loader`/`action`).
- **Tailwind v4** + **DaisyUI v5** (configured in `app/app.css` via
  `@import "tailwindcss"; @plugin "daisyui";`).
- **Axios** for all Firebase REST calls. **No Firebase SDK** — raw REST only.
- **react-icons** (`react-icons/fa6`) for icons.
- **dayjs** for all date handling.
- Path alias `~/*` → `app/*`.

## Architecture

### Persistence — Firebase Realtime Database via REST

- Set `VITE_FIREBASE_DB_URL` in `.env` (gitignored) to the RTDB URL (no trailing
  slash). DB rules are open/test-mode — no auth token.
- [app/api/firebase.ts](app/api/firebase.ts): the axios instance + typed REST verbs
  (`fbGet`, `fbPut`, `fbPost`, `fbPatch`, `fbDelete`). They build `/path.json`
  URLs. **Firebase returns `null` (not 404) for a missing path** — existence checks
  rely on this; don't try/catch for 404.
- [app/api/trips.ts](app/api/trips.ts): all domain calls (`getTrip`, `createTrip`,
  `addMember`, `addExpense`, `updateExpense`, `deleteExpense`, `rebalanceTrip`,
  `listTripCodes`, `tripExists`, …). `fbPost` returns a Firebase **push-id** — that
  push-id IS the `profileId` / `expenseId` (we never assign ids ourselves).

### Identity — localStorage

- Key `activeTrip` = `{ tripCode, profileId, profileName }` (`ActiveTrip` type).
- Helpers in [app/utils/helpers.ts](app/utils/helpers.ts): `getActiveTrip`,
  `setActiveTrip`, `clearActiveTrip`.

### Balances — derived, not stored

- **Source of truth is the expense list.** `computeBalances(trip)` recomputes every
  member's net balance from expenses on each load. Positive = owed (creditor),
  negative = owes (debtor).
- `members.$id.balance` is a denormalized cache: after any expense mutation, the
  route calls `rebalanceTrip(code)` to PATCH the recomputed balances back. The UI
  always trusts the fresh computation.
- `suggestPayments(balances)` is a greedy settlement (largest debtor → largest
  creditor) returning `{ from, to, amount }[]`.
- **Settle up** just creates a normal expense with `isPayment: true` (debtor "pays"
  creditor); the next recompute zeroes their balances.

## Data schema (`/trips/$tripCode`)

```
currency: string            // display symbol only (one per trip), e.g. "$", "€"
createdAt: number
members:  { $profileId: { name: string, balance: number } }
expenses: { $expenseId: {
    category: string,               // category key, e.g. "food" — drives the icon
    description: string,            // optional free-text note ("" falls back to the category label)
    amount: number,
    paidBy: string,                 // profileId
    splitAmong: { $profileId: true },
    date: string,                   // "YYYY-MM-DD" — when it HAPPENED (user-picked)
    timestamp: number,              // ms epoch — when it was LOGGED
    isPayment: boolean              // true for settle-up transfers
} }
```

**`category` vs `description`:** `category` is the picked category key and is the
sole source of the icon (resolved via `categoryByKey`). `description` is an
optional free-text note available for **every** category — when blank the UI shows
the category's label instead (`resolveExpenseDisplay` returns `{ category, label }`).
"Other" is not special; it's just a category whose label reads "Other".

**`date` vs `timestamp`:** they differ on purpose. `date` is the day the expense
happened (date picker, can be backdated); `timestamp` is when it was logged. The
dashboard **groups by `date`** (newest day first) and uses `timestamp` only as the
intra-day tiebreaker. All money math is flat numbers — no currency conversion.

## Routes (`app/routes.ts`)

| Path                                 | File               | Purpose                                                        |
| ------------------------------------ | ------------------ | -------------------------------------------------------------- |
| `/`                                  | `home.tsx`         | "Continue" button (if `activeTrip`) + trip-code entry          |
| `/trip/:tripCode/join`               | `join.tsx`         | "Who are you?" — pick/create profile                           |
| `/trip/:tripCode`                    | `dashboard.tsx`    | expenses (grouped by day) + suggested payments                 |
| `/trip/:tripCode/expense`            | `expense.tsx`      | add expense                                                    |
| `/trip/:tripCode/expense/:expenseId` | `edit-expense.tsx` | edit/delete expense                                            |
| `/admin`                             | `admin.tsx`        | list trip codes, create a trip (+ currency). URL-only, no link |

Shared components in `app/components/`: `ExpenseForm` (used by add + edit via a
`mode` prop; submits `intent=save`/`intent=delete`), `CategoryPicker`, `ExpenseRow`.

### Key flows / edge cases already handled

- **Home code entry** looks up the trip first (spinner + inline error: "doesn't
  exist" vs "couldn't reach server") before navigating.
- **Stale identity cleanup**: on `/`, if the active trip was deleted OR the active
  profile no longer exists in it, `activeTrip` is cleared — but ONLY on a definitive
  `null` from Firebase, never on a network error (an outage isn't proof of deletion).
- **Join always asks** "who are you?" (no auto-redirect), so a different person can
  re-identify by entering the same code. Selecting a profile overwrites `activeTrip`.
- **Settle up** is only actionable by the debtor or creditor; for other rows the
  button is shown but disabled with a tooltip (UI-level guard; there's no real auth).
- **Admin** degrades gracefully if Firebase is unreachable (inline notice on load,
  toast on create) instead of throwing to the error page.

## Conventions (follow these)

- **Event handlers**: arrow-function consts prefixed `handle` — `const handleJoin = () => …`.
- **Booleans**: prefix `is`/`has` — `isBusy`, `isValid`, `isCreating`.
- **Form submit type**: use `SubmitEvent<HTMLFormElement>`, NOT `FormEvent`
  (deprecated in this React types version).
- **Route filenames**: single word, no dots (`dashboard.tsx`, not `trip.dashboard.tsx`).
- **DaisyUI v5**: do NOT use removed v4 classes — `form-control`, `label-text`,
  `input-bordered`, `select-bordered` are dead. Inputs/selects are bordered by
  default; use `flex flex-col` for stacking and `text-sm` for label text.
- **Dates**: always go through dayjs + the helpers (`todayISO`, `formatDayLabel`,
  `groupExpensesByDate`). Stored format is `"YYYY-MM-DD"`.
- **Markdown file references** in chat: use `[text](path)` links, not backticks.

## Folder map

```
app/
  api/        firebase.ts (axios + verbs), trips.ts (domain calls)
  utils/      types.ts, constants.ts (regex, currencies, categories), helpers.ts
  components/ ExpenseForm.tsx, CategoryPicker.tsx, ExpenseRow.tsx
  routes/     home, join, dashboard, expense, edit-expense, admin
  routes.ts   route table
react-router.config.ts   ssr: false
```
