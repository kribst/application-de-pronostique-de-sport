import Link from "next/link";

import type { AuthUser } from "@/lib/auth-types";

import { AdminSignOut } from "./AdminSignOut";

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

type AdminConsoleProps = {
  user: AuthUser;
  section: AdminSection;
  sports: Collection<Sport>;
  countries: Collection<Country>;
  competitions: Collection<Competition>;
  backendAdminUrl: string;
};

const navigation: {
  title: string;
  icon: string;
  section: AdminSection;
}[] = [
  { title: "Vue d’ensemble", icon: "dashboard", section: "dashboard" },
  { title: "Utilisateurs", icon: "group", section: "users" },
  {
    title: "Historique des connexions",
    icon: "history",
    section: "login-history",
  },
  { title: "Sports", icon: "fitness_center", section: "sports" },
  { title: "Pays", icon: "globe", section: "countries" },
  { title: "Compétitions", icon: "event", section: "competitions" },
  { title: "Saisons", icon: "calendar_month", section: "seasons" },
  { title: "Journées", icon: "view_week", section: "rounds" },
];

const sectionDetails: Record<
  AdminSection,
  { title: string; description: string; backendPath?: string }
> = {
  dashboard: {
    title: "Tableau de bord",
    description:
      "Vue d’ensemble des référentiels sportifs et des outils d’administration.",
  },
  users: {
    title: "Utilisateurs",
    description:
      "Comptes, rôles, vérification et statut d’accès des membres de la plateforme.",
    backendPath: "/users/customuser/",
  },
  "login-history": {
    title: "Historique des connexions",
    description:
      "Historique des connexions avec utilisateur, adresse IP, appareil et date.",
    backendPath: "/users/loginhistory/",
  },
  sports: {
    title: "Sports",
    description:
      "Référentiel des sports, type de pratique, disponibilité et ordre d’affichage.",
    backendPath: "/sports/sport/",
  },
  countries: {
    title: "Pays",
    description: "Pays et codes utilisés par le référentiel des compétitions.",
    backendPath: "/sports/country/",
  },
  competitions: {
    title: "Compétitions",
    description:
      "Compétitions, sport associé, pays, niveau et saison actuellement en cours.",
    backendPath: "/sports/competition/",
  },
  seasons: {
    title: "Saisons",
    description:
      "Les saisons sont gérées depuis la fiche de leur compétition dans le back-office.",
    backendPath: "/sports/competition/",
  },
  rounds: {
    title: "Journées",
    description:
      "Journées et tours associés aux saisons et compétitions.",
    backendPath: "/sports/round/",
  },
};

function NavigationItem({
  item,
  active,
}: {
  item: (typeof navigation)[number];
  active: boolean;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
        active
          ? "bg-[#f2c96d] text-[#17243a] shadow-sm"
          : "text-white/75 hover:bg-white/10 hover:text-white"
      }`}
      href={`/admin?section=${item.section}`}
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
        {item.icon}
      </span>
      <span>{item.title}</span>
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon,
  detail,
  href,
}: {
  label: string;
  value: number | string;
  icon: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      className="group rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a87916]"
      href={href}
    >
      <article className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#e3c477] group-hover:shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-[#17243a]">
              {typeof value === "number"
                ? value.toLocaleString("fr-FR")
                : value}
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#9a741f]">
              {detail}
            </p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fbf5e5] text-[#17243a] transition group-hover:bg-[#f2c96d]">
            <span className="material-symbols-outlined" aria-hidden="true">
              {icon}
            </span>
          </span>
        </div>
      </article>
    </Link>
  );
}

function BackendManagementLink({
  href,
  children = "Ouvrir la gestion complète",
}: {
  href: string;
  children?: string;
}) {
  return (
    <a
      className="inline-flex items-center gap-2 rounded-xl bg-[#17243a] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#263e60]"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
      <span className="material-symbols-outlined text-lg" aria-hidden="true">
        open_in_new
      </span>
    </a>
  );
}

function ReadOnlyNotice() {
  return (
    <p className="mt-4 rounded-xl border border-[#efe1b9] bg-[#fffaf0] px-4 py-3 text-sm leading-6 text-[#665321]">
      Consultation depuis cette interface. Pour ajouter, modifier ou supprimer
      des entrées, utilisez la gestion Django du backend.
    </p>
  );
}

function SportTable({ rows }: { rows: Sport[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3 font-bold">Sport</th>
            <th className="px-4 py-3 font-bold">Type</th>
            <th className="px-4 py-3 font-bold">Position</th>
            <th className="px-4 py-3 font-bold">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((sport) => (
            <tr key={sport.id}>
              <td className="px-4 py-4">
                <p className="font-bold text-[#17243a]">{sport.name}</p>
                <p className="mt-1 text-xs text-slate-500">{sport.slug}</p>
              </td>
              <td className="px-4 py-4 text-slate-600">
                {sport.sport_type === "TEAM" ? "Collectif" : "Individuel"}
              </td>
              <td className="px-4 py-4 text-slate-600">{sport.position}</td>
              <td className="px-4 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    sport.is_active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {sport.is_active ? "Actif" : "À venir"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CountryTable({ rows }: { rows: Country[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[460px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3 font-bold">Pays</th>
            <th className="px-4 py-3 font-bold">Code</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((country) => (
            <tr key={country.id}>
              <td className="px-4 py-4 font-bold text-[#17243a]">{country.name}</td>
              <td className="px-4 py-4 text-slate-600">{country.code}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompetitionTable({ rows }: { rows: Competition[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3 font-bold">Compétition</th>
            <th className="px-4 py-3 font-bold">Sport</th>
            <th className="px-4 py-3 font-bold">Pays</th>
            <th className="px-4 py-3 font-bold">Niveau</th>
            <th className="px-4 py-3 font-bold">Saison en cours</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((competition) => (
            <tr key={competition.id}>
              <td className="px-4 py-4">
                <p className="font-bold text-[#17243a]">{competition.name}</p>
                <p className="mt-1 text-xs text-slate-500">{competition.slug}</p>
              </td>
              <td className="px-4 py-4 text-slate-600">{competition.sport}</td>
              <td className="px-4 py-4 text-slate-600">
                {competition.country?.name ?? "International"}
              </td>
              <td className="px-4 py-4 text-slate-600">{competition.tier}</td>
              <td className="px-4 py-4 text-slate-600">
                {competition.current_season?.label ?? "Non renseignée"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CatalogSection({
  section,
  sports,
  countries,
  competitions,
  backendAdminUrl,
}: Pick<
  AdminConsoleProps,
  "section" | "sports" | "countries" | "competitions" | "backendAdminUrl"
>) {
  const details = sectionDetails[section];
  const target = details.backendPath
    ? `${backendAdminUrl}${details.backendPath}`
    : backendAdminUrl;

  if (section === "sports") {
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              {sports.count.toLocaleString("fr-FR")} sports référencés
              {sports.results.length < sports.count
                ? ` · ${sports.results.length} affichés`
                : ""}
            </p>
          </div>
          <BackendManagementLink href={target} />
        </div>
        <ReadOnlyNotice />
        <div className="mt-6">
          {sports.results.length ? (
            <SportTable rows={sports.results} />
          ) : (
            <p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-600">
              Aucun sport n&apos;est disponible.
            </p>
          )}
        </div>
      </>
    );
  }

  if (section === "countries") {
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {countries.count.toLocaleString("fr-FR")} pays référencés
            {countries.results.length < countries.count
              ? ` · ${countries.results.length} affichés`
              : ""}
          </p>
          <BackendManagementLink href={target} />
        </div>
        <ReadOnlyNotice />
        <div className="mt-6">
          {countries.results.length ? (
            <CountryTable rows={countries.results} />
          ) : (
            <p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-600">
              Aucun pays n&apos;est disponible.
            </p>
          )}
        </div>
      </>
    );
  }

  if (section === "competitions") {
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {competitions.count.toLocaleString("fr-FR")} compétitions visibles
            {competitions.results.length < competitions.count
              ? ` · ${competitions.results.length} affichées`
              : ""}
          </p>
          <BackendManagementLink href={target} />
        </div>
        <ReadOnlyNotice />
        <div className="mt-6">
          {competitions.results.length ? (
            <CompetitionTable rows={competitions.results} />
          ) : (
            <p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-600">
              Aucune compétition active n&apos;est disponible.
            </p>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="rounded-2xl border border-[#efe1b9] bg-[#fffaf0] p-6">
      <p className="text-sm leading-6 text-[#665321]">
        {details.description} La liste et les actions de gestion sont
        disponibles dans le back-office Django.
      </p>
      <div className="mt-5">
        <BackendManagementLink href={target} />
      </div>
    </div>
  );
}

export function AdminConsole({
  user,
  section,
  sports,
  countries,
  competitions,
  backendAdminUrl,
}: AdminConsoleProps) {
  const details = sectionDetails[section];
  const activeSports = sports.results.filter((sport) => sport.is_active).length;

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#17243a]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[290px] shrink-0 flex-col bg-[#14243d] px-5 py-7 text-white lg:flex">
          <Link className="flex items-center gap-3 px-3" href="/admin">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f2c96d] text-xl font-black text-[#17243a]">
              P
            </span>
            <span>
              <span className="block text-lg font-black tracking-wide">
                Pronostique
              </span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                Administration
              </span>
            </span>
          </Link>

          <div className="mt-10">
            <p className="px-4 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
              Gestion de la plateforme
            </p>
            <nav aria-label="Navigation administration" className="grid gap-1.5">
              {navigation.map((item) => (
                <NavigationItem
                  key={item.section}
                  item={item}
                  active={section === item.section}
                />
              ))}
            </nav>
          </div>

          <div className="mt-auto border-t border-white/10 pt-5">
            <div className="px-4 pb-3">
              <p className="truncate text-sm font-bold">{user.username}</p>
              <p className="mt-1 truncate text-xs text-white/50">{user.email}</p>
            </div>
            <AdminSignOut />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a741f]">
                Espace d’administration
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#17243a]">
                {details.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {details.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#17243a] transition hover:border-[#dfc173] hover:bg-[#fffaf0]"
                href="/dashboard"
              >
                Retour à l&apos;application
              </Link>
              <a
                className="hidden rounded-xl bg-[#17243a] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#263e60] sm:inline-flex"
                href={backendAdminUrl}
                rel="noreferrer"
                target="_blank"
              >
                Back-office Django
                <span className="material-symbols-outlined ml-2 text-lg" aria-hidden="true">
                  open_in_new
                </span>
              </a>
            </div>
          </header>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {navigation.map((item) => (
              <NavigationItem
                key={item.section}
                item={item}
                active={section === item.section}
              />
            ))}
          </div>

          {section === "dashboard" ? (
            <div className="grid gap-6">
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                 <StatCard
                   label="Sports référencés"
                   value={sports.count}
                   icon="fitness_center"
                   detail={`${activeSports} actifs`}
                   href="/admin?section=sports"
                 />
                 <StatCard
                   label="Pays"
                   value={countries.count}
                   icon="globe"
                   detail="Référentiel géographique"
                   href="/admin?section=countries"
                 />
                 <StatCard
                   label="Compétitions visibles"
                   value={competitions.count}
                   icon="event"
                   detail="Sports actifs uniquement"
                   href="/admin?section=competitions"
                 />
                <StatCard
                  label="Utilisateurs"
                  value="Gérer"
                  icon="group"
                  detail="Back-office Django"
                  href="/admin?section=users"
                />
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#9a741f]">
                      Référentiel sportif
                    </p>
                    <h2 className="mt-2 text-xl font-black text-[#17243a]">
                      Compétitions actives
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Données du catalogue utilisées par l&apos;application.
                    </p>
                  </div>
                  <Link
                    className="text-sm font-bold text-[#80601b] hover:text-[#17243a]"
                    href="/admin?section=competitions"
                  >
                    Voir toutes les compétitions →
                  </Link>
                </div>
                <div className="mt-5">
                  {competitions.results.length ? (
                    <CompetitionTable rows={competitions.results.slice(0, 6)} />
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-600">
                      Aucune compétition active n&apos;est disponible.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-[#efe1b9] bg-[#fffaf0] p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-[#17243a]">
                      Comptes, connexions et édition des données
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#665321]">
                      Les opérations de création et de modification restent
                      disponibles dans le back-office Django. Les catalogues
                      affichés ici sont consultables en lecture seule.
                    </p>
                  </div>
                  <BackendManagementLink href={backendAdminUrl}>
                    Ouvrir le back-office
                  </BackendManagementLink>
                </div>
              </section>
            </div>
          ) : (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
                <h2 className="text-xl font-black text-[#17243a]">
                  {details.title}
                </h2>
                <p className="text-sm leading-6 text-slate-500">
                  {details.description}
                </p>
              </div>
              <div className="pt-5">
                <CatalogSection
                  section={section}
                  sports={sports}
                  countries={countries}
                  competitions={competitions}
                  backendAdminUrl={backendAdminUrl}
                />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
