import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminClient } from "./AdminClient";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Administration | Pronostique",
  description: "Espace d’administration des données Pronostique.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAdministrationPage() {
  const user = await currentUser();

  if (!user) redirect("/auth/login?next=%2Fadmin%2Fadministration");
  if (!user.is_active) redirect("/dashboard");
  if (!user.is_staff) redirect("/dashboard");
  if (!user.is_superuser) redirect("/dashboard");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return <AdminClient />;
}
