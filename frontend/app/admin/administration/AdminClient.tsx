"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
};

type AdminRecord = {
  id: string;
  [key: string]: unknown;
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

type FieldOption = { value: string; label: string };
type FieldType = "text" | "number" | "boolean" | "select" | "json" | "password";
type Field = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: FieldOption[];
};

type ResourceConfig = {
  title: string;
  description: string;
  endpoint: string;
  fields: Field[];
  columns: string[];
  readOnly?: boolean;
};

const navigation: { id: AdminSection; title: string; icon: string }[] = [
  { id: "dashboard", title: "Tableau de bord", icon: "space_dashboard" },
  { id: "users", title: "Utilisateurs", icon: "group" },
  { id: "login-history", title: "Historique des connexions", icon: "history" },
  { id: "sports", title: "Sports", icon: "sports_soccer" },
  { id: "countries", title: "Pays", icon: "public" },
  { id: "competitions", title: "Compétitions", icon: "emoji_events" },
  { id: "seasons", title: "Saisons", icon: "calendar_month" },
  { id: "rounds", title: "Journées", icon: "view_week" },
];

const booleanOptions: FieldOption[] = [
  { value: "true", label: "Oui" },
  { value: "false", label: "Non" },
];

function getCollection<T>(value: unknown, resource: string): Collection<T> {
  if (
    typeof value === "object" &&
    value !== null &&
    "count" in value &&
    typeof value.count === "number" &&
    "results" in value &&
    Array.isArray(value.results)
  ) {
    return { count: value.count, results: value.results as T[] };
  }
  throw new Error(`La réponse de la liste « ${resource} » est invalide.`);
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
  csrfToken?: string
): Promise<T> {
  const headers = new Headers(options.headers);
  if (csrfToken) headers.set("X-CSRFToken", csrfToken);
  if (options.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`/api/admin/${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const data: unknown = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "La requête d’administration a échoué.";
    throw new Error(message);
  }

  return data as T;
}

function displayValue(
  value: unknown,
  field: Field,
  allRecords: Record<string, AdminRecord[]>
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (field.type === "json") return JSON.stringify(value);
  if (field.type === "select" && field.options) {
    const option = field.options.find((item) => item.value === String(value));
    if (option) return option.label;
  }

  const relation = field.key === "user"
    ? allRecords.users?.find((item) => item.id === value)
    : field.key === "competition"
      ? allRecords.competitions?.find((item) => item.id === value)
      : field.key === "season"
        ? allRecords.seasons?.find((item) => item.id === value)
        : field.key === "sport"
          ? allRecords.sports?.find((item) => item.id === value)
          : field.key === "country"
            ? allRecords.countries?.find((item) => item.id === value)
            : undefined;
  if (relation) {
    return String(
      relation.email ??
        relation.name ??
        relation.label ??
        relation.id
    );
  }

  return String(value);
}

function initialFormValue(field: Field, record?: AdminRecord): string {
  const value = record?.[field.key];
  if (value === undefined || value === null) {
    if (field.type === "boolean") return "false";
    if (field.type === "json") return "{}";
    return "";
  }
  if (field.type === "json") return JSON.stringify(value, null, 2);
  if (field.type === "boolean") return value ? "true" : "false";
  return String(value);
}

function getFields(
  section: AdminSection,
  records: Record<string, AdminRecord[]>
): Field[] {
  const selectOptions = (
    recordsToUse: AdminRecord[],
    labelKey: string,
    emptyLabel?: string
  ): FieldOption[] => [
    ...(emptyLabel ? [{ value: "", label: emptyLabel }] : []),
    ...recordsToUse.map((record) => ({
      value: record.id,
      label: String(record[labelKey] ?? record.id),
    })),
  ];

  switch (section) {
    case "users":
      return [
        { key: "email", label: "Adresse e-mail", type: "text", required: true },
        { key: "username", label: "Nom d’utilisateur", type: "text", required: true },
        {
          key: "role",
          label: "Rôle applicatif",
          type: "select",
          options: [
            { value: "USER", label: "Utilisateur" },
            { value: "PREMIUM", label: "Premium" },
            { value: "MODERATOR", label: "Modérateur" },
            { value: "ADMIN", label: "Administrateur" },
          ],
        },
        {
          key: "locale",
          label: "Langue",
          type: "select",
          options: [
            { value: "fr", label: "Français" },
            { value: "en", label: "English" },
          ],
        },
        { key: "timezone", label: "Fuseau horaire", type: "text", required: true },
        { key: "is_verified", label: "E-mail vérifié", type: "boolean" },
        { key: "is_active", label: "Compte actif", type: "boolean" },
        { key: "is_staff", label: "Accès staff", type: "boolean" },
        { key: "password", label: "Mot de passe", type: "password" },
      ];
    case "sports":
      return [
        { key: "name", label: "Nom", type: "text", required: true },
        { key: "slug", label: "Identifiant URL", type: "text", required: true },
        {
          key: "sport_type",
          label: "Type",
          type: "select",
          options: [
            { value: "TEAM", label: "Sport collectif" },
            { value: "INDIVIDUAL", label: "Sport individuel" },
          ],
        },
        { key: "is_active", label: "Actif", type: "boolean" },
        { key: "position", label: "Position", type: "number", required: true },
        { key: "config", label: "Configuration JSON", type: "json" },
      ];
    case "countries":
      return [
        { key: "name", label: "Nom", type: "text", required: true },
        { key: "code", label: "Code", type: "text", required: true },
      ];
    case "competitions":
      return [
        {
          key: "sport",
          label: "Sport",
          type: "select",
          options: selectOptions(records.sports ?? [], "name"),
        },
        {
          key: "country",
          label: "Pays",
          type: "select",
          options: selectOptions(records.countries ?? [], "name", "International / aucun"),
        },
        { key: "name", label: "Nom", type: "text", required: true },
        { key: "slug", label: "Identifiant URL", type: "text", required: true },
        { key: "tier", label: "Niveau", type: "number", required: true },
        { key: "is_active", label: "Actif", type: "boolean" },
        { key: "external_ids", label: "Identifiants externes JSON", type: "json" },
      ];
    case "seasons":
      return [
        {
          key: "competition",
          label: "Compétition",
          type: "select",
          options: selectOptions(records.competitions ?? [], "name"),
        },
        { key: "year_start", label: "Année de début", type: "number", required: true },
        { key: "year_end", label: "Année de fin", type: "number", required: true },
        { key: "is_current", label: "Saison en cours", type: "boolean" },
      ];
    case "rounds":
      return [
        {
          key: "season",
          label: "Saison",
          type: "select",
          options: selectOptions(
            records.seasons ?? [],
            "label"
          ),
        },
        { key: "number", label: "Numéro", type: "number", required: true },
        { key: "name", label: "Nom", type: "text" },
      ];
    default:
      return [];
  }
}

function resourceConfig(
  section: AdminSection,
  records: Record<string, AdminRecord[]>
): ResourceConfig | null {
  const options = (key: string): FieldOption[] =>
    getFields(section, records).find((field) => field.key === key)?.options ?? [];
  switch (section) {
    case "users":
      return {
        title: "Utilisateurs",
        description: "Gestion des comptes, rôles et accès de la plateforme.",
        endpoint: "users",
        fields: getFields(section, records),
        columns: ["email", "username", "role", "is_verified", "is_active", "is_staff"],
      };
    case "login-history":
      return {
        title: "Historique des connexions",
        description: "Historique consultable des sessions de connexion.",
        endpoint: "login-history",
        fields: [
          { key: "user", label: "Utilisateur", type: "text" },
          { key: "user_email", label: "E-mail", type: "text" },
          { key: "ip", label: "Adresse IP", type: "text" },
          { key: "device", label: "Appareil", type: "text" },
          { key: "created_at", label: "Date", type: "text" },
        ],
        columns: ["user_email", "ip", "device", "created_at"],
        readOnly: true,
      };
    case "sports":
      return {
        title: "Sports",
        description: "Référentiel des sports et marchés disponibles.",
        endpoint: "sports",
        fields: getFields(section, records),
        columns: ["name", "slug", "sport_type", "is_active", "position"],
      };
    case "countries":
      return {
        title: "Pays",
        description: "Pays et codes utilisés par les compétitions.",
        endpoint: "countries",
        fields: getFields(section, records),
        columns: ["name", "code"],
      };
    case "competitions":
      return {
        title: "Compétitions",
        description: "Gestion des compétitions, rattachements et niveaux.",
        endpoint: "competitions",
        fields: getFields(section, records),
        columns: ["name", "sport", "country", "slug", "tier", "is_active"],
      };
    case "seasons":
      return {
        title: "Saisons",
        description: "Saisons associées aux compétitions.",
        endpoint: "seasons",
        fields: getFields(section, records),
        columns: ["competition", "label", "year_start", "year_end", "is_current"],
      };
    case "rounds":
      return {
        title: "Journées",
        description: "Journées et tours associés aux saisons.",
        endpoint: "rounds",
        fields: getFields(section, records),
        columns: ["season", "number", "name"],
      };
    default:
      return null;
  }
}

function valueFromRecord(
  record: AdminRecord,
  fieldKey: string,
  fields: Field[],
  records: Record<string, AdminRecord[]>
): string {
  const field = fields.find((item) => item.key === fieldKey) ?? {
    key: fieldKey,
    label: fieldKey,
    type: "text" as const,
  };
  return displayValue(record[fieldKey], field, records);
}

function makePayload(fields: Field[], form: Record<string, string>) {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const value = form[field.key] ?? "";
    if (field.type === "password" && !value) continue;
    if (field.type === "boolean") {
      payload[field.key] = value === "true";
    } else if (field.type === "number") {
      payload[field.key] = Number(value);
    } else if (field.type === "json") {
      payload[field.key] = JSON.parse(value);
    } else if (field.type !== "password" || value) {
      payload[field.key] = value;
    }
  }
  return payload;
}

function AdminLogin({
  csrfToken,
  onLogin,
}: {
  csrfToken: string;
  onLogin: (user: AdminUser, csrfToken: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setPending(true);
    const formData = new FormData(event.currentTarget);
    try {
      const result = await requestJson<{
        user: AdminUser;
        csrfToken: string;
      }>(
        "auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: String(formData.get("email") ?? "").trim(),
            password: String(formData.get("password") ?? ""),
          }),
        },
        csrfToken
      );
      onLogin(result.user, result.csrfToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Connexion impossible.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fa] px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f2c96d] text-2xl font-black text-[#17243a]">
          P
        </div>
        <p className="mt-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#9a741f]">
          Espace sécurisé
        </p>
        <h1 className="mt-2 text-center text-2xl font-black text-[#17243a]">
          Connexion administration
        </h1>
        <p className="mt-2 text-center text-sm leading-6 text-slate-500">
          Connectez-vous avec votre compte superutilisateur Django. Cette
          connexion est indépendante de votre session sur l’application.
        </p>
        <form className="mt-7 grid gap-5" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-bold text-[#17243a]">
            Adresse e-mail
            <input
              autoComplete="username"
              className="rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-[#a87916] focus:ring-2 focus:ring-[#f2c96d]/40"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-[#17243a]">
            Mot de passe
            <input
              autoComplete="current-password"
              className="rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-[#a87916] focus:ring-2 focus:ring-[#f2c96d]/40"
              name="password"
              required
              type="password"
            />
          </label>
          {message ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {message}
            </p>
          ) : null}
          <button
            className="rounded-xl bg-[#17243a] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#263e60] disabled:cursor-wait disabled:opacity-60"
            disabled={pending || !csrfToken}
            type="submit"
          >
            {pending ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <Link className="mt-6 block text-center text-sm font-semibold text-slate-500 hover:text-[#17243a]" href="/">
          Retour au site
        </Link>
      </section>
    </main>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
}) {
  const className =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-[#17243a] outline-none transition focus:border-[#a87916] focus:ring-2 focus:ring-[#f2c96d]/40";
  if (field.type === "boolean" || field.type === "select") {
    return (
      <select
        className={className}
        onChange={(event) => onChange(event.target.value)}
        required={field.required}
        value={value}
      >
        {!field.required && !field.options?.some((option) => option.value === "") ? (
          <option value="">— Sélectionner —</option>
        ) : null}
        {(field.type === "boolean" ? booleanOptions : field.options ?? []).map(
          (option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )
        )}
      </select>
    );
  }
  if (field.type === "json") {
    return (
      <textarea
        className={`${className} min-h-28 font-mono`}
        onChange={(event) => onChange(event.target.value)}
        required={field.required}
        value={value}
      />
    );
  }
  return (
    <input
      className={className}
      onChange={(event) => onChange(event.target.value)}
      required={field.required}
      type={field.type}
      value={value}
    />
  );
}

function ResourceEditor({
  section,
  config,
  rows,
  allRecords,
  onSave,
  onDelete,
}: {
  section: AdminSection;
  config: ResourceConfig;
  rows: AdminRecord[];
  allRecords: Record<string, AdminRecord[]>;
  onSave: (id: string | null, payload: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const fields = config.fields.filter(
    (field) => !(field.type === "password" && section !== "users")
  );
  const [editing, setEditing] = useState<AdminRecord | null | undefined>(undefined);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AdminRecord | null>(null);

  function openEditor(record: AdminRecord | null) {
    setError("");
    setForm(
      Object.fromEntries(
        fields.map((field) => [
          field.key,
          initialFormValue(field, record ?? undefined),
        ])
      )
    );
    setEditing(record);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSave(editing?.id ?? null, makePayload(fields, form));
      setEditing(undefined);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Enregistrement impossible."
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeRecord() {
    if (!confirmDelete) return;
    setError("");
    setBusy(true);
    try {
      await onDelete(confirmDelete.id);
      setConfirmDelete(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Suppression impossible."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {rows.length} entrée{rows.length === 1 ? "" : "s"} chargée{rows.length === 1 ? "" : "s"}
        </p>
        {!config.readOnly ? (
          <button
            className="rounded-xl bg-[#17243a] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#263e60]"
            onClick={() => openEditor(null)}
            type="button"
          >
            + Ajouter
          </button>
        ) : null}
      </div>
      {error && editing === undefined ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {config.columns.map((key) => (
                <th className="px-4 py-3 font-bold" key={key}>
                  {config.fields.find((field) => field.key === key)?.label ?? key}
                </th>
              ))}
              {!config.readOnly ? (
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((record) => (
              <tr key={record.id}>
                {config.columns.map((key) => {
                  const field = config.fields.find((item) => item.key === key) ?? {
                    key,
                    label: key,
                    type: "text" as const,
                  };
                  return (
                    <td className="max-w-64 px-4 py-3.5 text-slate-600" key={key}>
                      <span className="block truncate" title={String(record[key] ?? "")}>
                        {valueFromRecord(record, key, config.fields, allRecords)}
                      </span>
                    </td>
                  );
                })}
                {!config.readOnly ? (
                  <td className="px-4 py-3.5 text-right">
                    <button
                      className="mr-3 font-bold text-[#735614] hover:text-[#17243a]"
                      onClick={() => openEditor(record)}
                      type="button"
                    >
                      Modifier
                    </button>
                    <button
                      className="font-bold text-red-700 hover:text-red-900"
                      onClick={() => setConfirmDelete(record)}
                      type="button"
                    >
                      Supprimer
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-sm text-slate-500"
                  colSpan={config.columns.length + (config.readOnly ? 0 : 1)}
                >
                  Aucune donnée disponible.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {editing !== undefined ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#101827]/55 p-4">
          <section
            aria-labelledby="admin-edit-title"
            aria-modal="true"
            className="my-6 max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a741f]">
                  {editing ? "Modification" : "Nouvelle entrée"}
                </p>
                <h3 className="mt-2 text-xl font-black text-[#17243a]" id="admin-edit-title">
                  {config.title}
                </h3>
              </div>
              <button
                aria-label="Fermer"
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setEditing(undefined)}
                type="button"
              >
                ✕
              </button>
            </div>
            <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={save}>
              {fields.map((field) => (
                <label
                  className={`grid gap-2 text-sm font-bold text-[#17243a] ${
                    field.type === "json" ? "sm:col-span-2" : ""
                  }`}
                  key={field.key}
                >
                  {field.label}
                  {field.key === "password" && editing
                    ? <span className="text-xs font-normal text-slate-500">Laisser vide pour conserver le mot de passe actuel.</span>
                    : null}
                  <FieldInput
                    field={{
                      ...field,
                      required:
                        field.key === "password" && editing
                          ? false
                          : field.required,
                    }}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, [field.key]: value }))
                    }
                    value={form[field.key] ?? ""}
                  />
                </label>
              ))}
              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:col-span-2" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
                <button
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  onClick={() => setEditing(undefined)}
                  type="button"
                >
                  Annuler
                </button>
                <button
                  className="rounded-xl bg-[#17243a] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#263e60] disabled:opacity-60"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
      {confirmDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#101827]/55 p-4">
          <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <h3 className="text-xl font-black text-[#17243a]">Confirmer la suppression</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Cette action est définitive. Voulez-vous supprimer cette entrée ?
            </p>
            {error ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700"
                onClick={() => {
                  setConfirmDelete(null);
                  setError("");
                }}
                type="button"
              >
                Annuler
              </button>
              <button
                className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                disabled={busy}
                onClick={removeRecord}
                type="button"
              >
                {busy ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

export function AdminClient() {
  const [csrfToken, setCsrfToken] = useState("");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [records, setRecords] = useState<Record<string, AdminRecord[]>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  async function loadRecords() {
    const endpoints = [
      "sports",
      "countries",
      "competitions",
      "seasons",
      "rounds",
      "users",
      "login-history",
    ];
    const collections = await Promise.all(
      endpoints.map((endpoint) =>
        requestJson<Collection<AdminRecord>>(endpoint)
      )
    );
    setRecords(
      Object.fromEntries(
        endpoints.map((endpoint, index) => [
          endpoint,
          collections[index].results,
        ])
      )
    );
    setCounts(
      Object.fromEntries(
        endpoints.map((endpoint, index) => [endpoint, collections[index].count])
      )
    );
  }

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      try {
        const csrf = await requestJson<{ csrfToken: string }>("auth/csrf");
        if (cancelled) return;
        setCsrfToken(csrf.csrfToken);
        const session = await requestJson<{
          user: AdminUser;
          csrfToken: string;
        }>("auth/session");
        if (cancelled) return;
        setUser(session.user);
        setCsrfToken(session.csrfToken);
        await loadRecords();
      } catch (initializationError) {
        const status = initializationError instanceof Error
          ? initializationError.message
          : "Impossible de vérifier la session d’administration.";
        if (!cancelled && !status.includes("Connexion requise.")) {
          setError(status);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  const config = useMemo(
    () => resourceConfig(activeSection, records),
    [activeSection, records]
  );

  async function refreshResource(endpoint: string) {
    const collection = await requestJson<Collection<AdminRecord>>(endpoint);
    setRecords((current) => ({
      ...current,
      [endpoint]: collection.results,
    }));
    setCounts((current) => ({ ...current, [endpoint]: collection.count }));
  }

  async function saveRecord(
    endpoint: string,
    id: string | null,
    payload: Record<string, unknown>
  ) {
    await requestJson(
      id ? `${endpoint}/${id}` : endpoint,
      {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      },
      csrfToken
    );
    await refreshResource(endpoint);
    setError("");
  }

  async function deleteRecord(endpoint: string, id: string) {
    await requestJson(`${endpoint}/${id}`, { method: "DELETE" }, csrfToken);
    await refreshResource(endpoint);
    setError("");
  }

  async function logout() {
    setError("");
    setSigningOut(true);
    try {
      await requestJson("auth/logout", { method: "POST" }, csrfToken);
      setUser(null);
      setRecords({});
      setCsrfToken("");
      const csrf = await requestJson<{ csrfToken: string }>("auth/csrf");
      setCsrfToken(csrf.csrfToken);
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Déconnexion impossible.");
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f8fa]">
        <p className="text-sm font-semibold text-slate-500">Vérification de l’accès administration...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <>
        {error ? (
          <div className="fixed inset-x-4 top-4 z-10 mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800">
            {error}
          </div>
        ) : null}
        <AdminLogin
          csrfToken={csrfToken}
          onLogin={(loggedInUser, newCsrfToken) => {
            setUser(loggedInUser);
            setCsrfToken(newCsrfToken);
            setLoading(true);
            void loadRecords()
              .catch((loadError: unknown) => {
                setError(
                  loadError instanceof Error
                    ? loadError.message
                    : "Impossible de charger les données d’administration."
                );
                setUser(null);
              })
              .finally(() => setLoading(false));
          }}
        />
      </>
    );
  }

  const endpoint = config?.endpoint;

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#17243a]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[290px] shrink-0 flex-col bg-[#14243d] px-5 py-7 text-white lg:flex">
          <Link className="flex items-center gap-3 px-3" href="/admin/administration">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f2c96d] text-xl font-black text-[#17243a]">P</span>
            <span>
              <span className="block text-lg font-black tracking-wide">Pronostique</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Administration</span>
            </span>
          </Link>
          <p className="px-4 pb-3 pt-10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Gestion de la plateforme</p>
          <nav aria-label="Navigation administration" className="grid gap-1.5">
            {navigation.map((item) => (
              <button
                aria-current={activeSection === item.id ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  activeSection === item.id
                    ? "bg-[#f2c96d] text-[#17243a] shadow-sm"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
                key={item.id}
                onClick={() => {
                  setError("");
                  setActiveSection(item.id);
                }}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{item.icon}</span>
                {item.title}
              </button>
            ))}
          </nav>
          <div className="mt-auto border-t border-white/10 pt-5">
            <p className="truncate px-4 text-sm font-bold">{user.username}</p>
            <p className="mt-1 truncate px-4 text-xs text-white/50">{user.email} · Superutilisateur</p>
            <button
              className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
              disabled={signingOut}
              onClick={logout}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
              {signingOut ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a741f]">Espace superutilisateur</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#17243a]">
                {activeSection === "dashboard" ? "Tableau de bord" : config?.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {activeSection === "dashboard"
                  ? "Gestion des comptes et des référentiels de la plateforme."
                  : config?.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#17243a] transition hover:border-[#dfc173] hover:bg-[#fffaf0]" href="/">
                Retour au site
              </Link>
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#17243a] lg:hidden"
                onClick={logout}
                type="button"
              >
                Déconnexion
              </button>
            </div>
          </header>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {navigation.map((item) => (
              <button
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  activeSection === item.id ? "bg-[#17243a] text-white" : "bg-white text-slate-600"
                }`}
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                type="button"
              >
                {item.title}
              </button>
            ))}
          </div>

          {error ? (
            <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          {activeSection === "dashboard" ? (
            <div className="grid gap-6">
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["sports", "Sports référencés", "sports_soccer"],
                  ["countries", "Pays", "public"],
                  ["competitions", "Compétitions", "emoji_events"],
                  ["users", "Utilisateurs", "group"],
                ].map(([resource, label, icon]) => (
                  <button
                    className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#e3c477] hover:shadow-lg"
                    key={resource}
                    onClick={() => setActiveSection(resource as AdminSection)}
                    type="button"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">{label}</p>
                        <p className="mt-3 text-4xl font-black text-[#17243a]">
                          {(counts[resource] ?? 0).toLocaleString("fr-FR")}
                        </p>
                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#9a741f]">Gérer les données</p>
                      </div>
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fbf5e5] text-[#17243a]">
                        <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
                      </span>
                    </div>
                  </button>
                ))}
              </section>
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-black text-[#17243a]">Menu d’administration</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Les listes de sports, pays, compétitions, saisons, journées et utilisateurs peuvent être consultées et modifiées depuis leurs sections. L’historique des connexions reste en lecture seule.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {navigation.filter((item) => item.id !== "dashboard").map((item) => (
                    <button
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left text-sm font-bold transition hover:border-[#e3c477] hover:bg-[#fffaf0]"
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[#9a741f]" aria-hidden="true">{item.icon}</span>
                      {item.title}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : config && endpoint ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 border-b border-slate-100 pb-5">
                <h2 className="text-xl font-black text-[#17243a]">{config.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{config.description}</p>
              </div>
              <ResourceEditor
                allRecords={records}
                config={config}
                onDelete={(id) => deleteRecord(endpoint, id)}
                onSave={(id, payload) => saveRecord(endpoint, id, payload)}
                rows={records[endpoint] ?? []}
                section={activeSection}
              />
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
