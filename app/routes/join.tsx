import { Form, redirect, useActionData, useNavigation } from "react-router";
import { FaUser, FaUserPlus } from "react-icons/fa6";
import type { Route } from "./+types/join";
import { addMember, getMembers, getTrip } from "~/api/trips";
import { getActiveTrip, setActiveTrip } from "~/utils/helpers";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Who are you?" }];
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { tripCode } = params;

  // Already identified on this trip → straight to the dashboard.
  const active = getActiveTrip();
  if (active?.tripCode === tripCode && active.profileId) {
    throw redirect(`/trip/${tripCode}`);
  }

  const trip = await getTrip(tripCode);
  if (!trip) {
    throw new Response(`Trip "${tripCode}" not found.`, { status: 404 });
  }

  const members = trip.members ?? {};
  const profiles = Object.entries(members).map(([id, m]) => ({
    id,
    name: m.name,
  }));
  return { tripCode, profiles };
}

export async function clientAction({ params, request }: Route.ClientActionArgs) {
  const { tripCode } = params;
  const form = await request.formData();
  const members = await getMembers(tripCode);

  // Selecting an existing profile.
  const profileId = String(form.get("profileId") ?? "");
  if (profileId) {
    const name = members[profileId]?.name;
    if (!name) return { error: "That profile no longer exists." };
    setActiveTrip({ tripCode, profileId, profileName: name });
    throw redirect(`/trip/${tripCode}`);
  }

  // Creating a new profile.
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Please enter your name." };

  const existing = Object.entries(members).find(
    ([, m]) => m.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    return { duplicate: { id: existing[0], name: existing[1].name } };
  }

  const newId = await addMember(tripCode, name);
  setActiveTrip({ tripCode, profileId: newId, profileName: name });
  throw redirect(`/trip/${tripCode}`);
}

export default function Join({ loaderData }: Route.ComponentProps) {
  const { tripCode, profiles } = loaderData;
  const result = useActionData<typeof clientAction>();
  const navigation = useNavigation();
  const isBusy = navigation.state !== "idle";

  return (
    <main className="bg-base-200 flex min-h-screen flex-col items-center justify-center p-6">
      <div className="card bg-base-100 w-full max-w-sm shadow-xl">
        <div className="card-body gap-4">
          <div>
            <h1 className="text-2xl font-bold">Who are you?</h1>
            <p className="text-base-content/60 text-sm">
              Trip <span className="font-mono">{tripCode}</span>
            </p>
          </div>

          {profiles.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="label-text">Pick your profile</span>
              {profiles.map((p) => (
                <Form method="post" key={p.id}>
                  <input type="hidden" name="profileId" value={p.id} />
                  <button
                    type="submit"
                    className="btn btn-outline btn-block justify-start"
                    disabled={isBusy}
                  >
                    <FaUser /> {p.name}
                  </button>
                </Form>
              ))}
              <div className="divider">or add yourself</div>
            </div>
          )}

          {result?.duplicate && (
            <div className="alert alert-warning">
              <span>
                "{result.duplicate.name}" already exists. Tap it to continue as
                that person.
              </span>
              <Form method="post">
                <input
                  type="hidden"
                  name="profileId"
                  value={result.duplicate.id}
                />
                <button className="btn btn-sm" disabled={isBusy}>
                  Use {result.duplicate.name}
                </button>
              </Form>
            </div>
          )}

          <Form method="post" className="flex flex-col gap-2">
            <input
              name="name"
              placeholder="Your name"
              aria-label="Your name"
              className="input input-bordered w-full"
              required
            />
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isBusy}
            >
              <FaUserPlus /> Join trip
            </button>
            {result?.error && (
              <span className="text-error text-sm">{result.error}</span>
            )}
          </Form>
        </div>
      </div>
    </main>
  );
}
