import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { FaArrowRight, FaPlane } from "react-icons/fa6";
import type { Route } from "./+types/home";
import { CODE_REGEX } from "~/utils/constants";
import { getActiveTrip, sanitizeCode } from "~/utils/helpers";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Splitwiser" },
    { name: "description", content: "Split trip expenses with friends." },
  ];
}

export async function clientLoader(_: Route.ClientLoaderArgs) {
  return { active: getActiveTrip() };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { active } = loaderData;
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const isValid = CODE_REGEX.test(code);

  const handleJoin = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clean = sanitizeCode(code);
    if (!CODE_REGEX.test(clean)) return;
    navigate(`/trip/${clean}/join`);
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
            <label className="form-control">
              <span className="label-text mb-1">Enter a trip code</span>
              <div className="join">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="TRIPCODE"
                  aria-label="Trip code"
                  className="input input-bordered join-item w-full uppercase"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary join-item"
                  disabled={!isValid}
                  aria-label="Join trip"
                >
                  <FaArrowRight />
                </button>
              </div>
            </label>
            {code && !isValid && (
              <span className="text-error text-sm">
                Only uppercase letters and numbers.
              </span>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
