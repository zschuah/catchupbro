import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { FaArrowRight, FaPlane } from "react-icons/fa6";
import type { Route } from "./+types/home";
import { getTrip } from "~/api/trips";
import { CODE_REGEX } from "~/utils/constants";
import { clearActiveTrip, getActiveTrip, sanitizeCode } from "~/utils/helpers";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Splitwiser" },
    { name: "description", content: "Split trip expenses with friends." },
  ];
}

export async function clientLoader(_: Route.ClientLoaderArgs) {
  const active = getActiveTrip();
  if (!active) return { active: null };

  try {
    // Drop the stale identity (so we don't show a dead "Continue" button) when
    // either the trip was deleted, or our profile no longer exists within it.
    // On a network error we keep it — an outage isn't proof anything is gone.
    const trip = await getTrip(active.tripCode);
    if (!trip || !trip.members?.[active.profileId]) {
      clearActiveTrip();
      return { active: null };
    }
  } catch {
    // Server unreachable — leave the active trip untouched.
  }

  return { active };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { active } = loaderData;
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  const isValid = CODE_REGEX.test(code);

  const handleChangeCode = (value: string) => {
    setCode(value.toUpperCase());
    if (error) setError("");
  };

  const handleJoin = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clean = sanitizeCode(code);
    if (!CODE_REGEX.test(clean)) return;

    setError("");
    setIsChecking(true);
    try {
      const trip = await getTrip(clean);
      if (!trip) {
        setError(
          `Trip "${clean}" doesn't exist. Check the code and try again.`,
        );
        return;
      }
      navigate(`/trip/${clean}/join`);
    } catch {
      setError(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <main className="bg-base-200 flex min-h-screen flex-col items-center justify-center p-6">
      <div className="card bg-base-100 w-full max-w-sm shadow-xl">
        <div className="card-body gap-4">
          <div className="flex items-center justify-center gap-2">
            <FaPlane className="text-primary text-3xl" />
            <h1 className="text-3xl font-bold">Splitwiser</h1>
          </div>

          {active && (
            <>
              <Link
                to={`/trip/${active.tripCode}`}
                className="btn btn-primary btn-block"
              >
                Continue to trip {active.tripCode} as {active.profileName}
              </Link>
              <div className="divider">or join another</div>
            </>
          )}

          <form onSubmit={handleJoin} className="flex flex-col gap-2">
            <label className="flex flex-col">
              <span className="text-sm mb-1">Enter a trip code</span>
              <div className="join">
                <input
                  value={code}
                  onChange={(e) => handleChangeCode(e.target.value)}
                  placeholder="TRIPCODE"
                  aria-label="Trip code"
                  className="input input-primary w-full uppercase"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  disabled={isChecking}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary join-item"
                  disabled={!isValid || isChecking}
                  aria-label="Join trip"
                >
                  {isChecking ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <FaArrowRight />
                  )}
                </button>
              </div>
            </label>
            {code && !isValid && (
              <span className="text-error text-sm">
                Only uppercase letters and numbers.
              </span>
            )}
            {error && <span className="text-error text-sm">{error}</span>}
          </form>
        </div>
      </div>
    </main>
  );
}
