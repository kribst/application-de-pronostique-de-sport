import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminConsole } from "@/app/admin/AdminConsole";
import { ADMIN_API_PATHS, API_URL } from "@/lib/api";
import { djangoFetch } from "@/lib/django";
import { currentUser, readTokens } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration | Pronostique",
  description: "Gestion de la plateforme Pronostique.",
  robots: { index: false, follow: false },
};

type Sport = {
  id: string;
  name: string;
  slug: string;
  sport_type: "TEAM" | "INDIVIDUAL";
  is_active: boolean;
  position: number;
};

type Country = {
  id: string;
  name: string;
  code: string;
};

type Competition = {
  id: string;
  name: string;
  slug: string;
  tier: number;
  sport: string;
  country: Country | null;
  current_season: { label: string } | null;
};

type Collection<T> = {
  count: number;
  results: T[];
};

type AdminSection =
  | "dashboard"
  | "users"
  | "login-history"
  | "sports"
  | "countries"
  | "competitions"
  | "seasons"
  | "rounds";

const sections: AdminSection[] = [
  "dashboard",
  "users",
  "login-history",
  "sports",
  "countries",
  "competitions",
  "seasons",
  "rounds",
];

function asCollection<T>(data: unknown, label: string): Collection<T> {
  if (Array.isArray(data)) {
    return { count: data.length, results: data as T[] };
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "results" in data &&
    Array.isArray(data.results) &&
    "count" in data &&
    typeof data.count === "number"
  ) {
    return { count: data.count, results: data.results as T[] };
  }

  throw new Error(`La réponse de la liste « ${label} » est invalide.`);
}

async function getCollection<T>(
  path: string,
  accessToken: string,
  label: string
): Promise<Collection<T>> {
  const { data } = await djangoFetch(path, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return asCollection<T>(data, label);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const user = await currentUser();

  if (!user) redirect("/auth/login?next=%2Fadmin");
  if (!user.is_active) redirect("/dashboard");
  if (!user.is_staff) redirect("/dashboard");
  if (!user.is_superuser) redirect("/dashboard");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const { section: requestedSection } = await searchParams;
  const section = sections.includes(requestedSection as AdminSection)
    ? (requestedSection as AdminSection)
    : "dashboard";
  const { access } = await readTokens();

  if (!access) redirect("/auth/login?next=%2Fadmin");

  const data = await Promise.all([
    getCollection<Sport>(ADMIN_API_PATHS.sports, access, "sports"),
    getCollection<Country>(ADMIN_API_PATHS.countries, access, "pays"),
    getCollection<Competition>(
      ADMIN_API_PATHS.competitions,
      access,
      "compétitions"
    ),
  ])
    .then(([sports, countries, competitions]) => ({
      ok: true as const,
      sports,
      countries,
      competitions,
    }))
    .catch((error: unknown) => ({
      ok: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Une erreur inattendue est survenue.",
    }));

  if (!data.ok) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] px-5 py-12">
        <section className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-700">
            Administration indisponible
          </p>
          <h1 className="mt-3 text-2xl font-black text-[#14243d]">
            Les données du back-office n&apos;ont pas pu être chargées.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {data.message}
          </p>
          <a
            className="mt-6 inline-flex rounded-xl bg-[#14243d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#213b61]"
            href="/admin"
          >
            Réessayer
          </a>
        </section>
      </main>
    );
  }

  return (
    <AdminConsole
      user={user}
      section={section}
      sports={data.sports}
      countries={data.countries}
      competitions={data.competitions}
      backendAdminUrl={`${API_URL}/admin`}
    />
  );
}
