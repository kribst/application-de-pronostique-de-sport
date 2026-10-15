import type {
  ContactMessage,
  DashboardStats,
  DashboardStatsResponse,
  SiteContent,
  SiteContentResponse,
  SiteContentUpdateRequest,
  NewsletterStatsResponse,
  NewsletterSubscribers,
  StatutNewsletter,
} from "../../types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch("/api/admin/dashboard/stats", {
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Impossible de charger les statistiques.");
  }

  return response.json();
}

export async function getNewsletterStats(): Promise<NewsletterStatsResponse> {
  const response = await fetch("/api/admin/newsletter/stats", {
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Impossible de charger les statistiques de la newsletter.");
  }

  return response.json();
}

export async function getMessages(
  params?: { statut?: string; page?: number }
): Promise<{ messages: ContactMessage[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.statut) searchParams.set("statut", params.statut);
  if (params?.page) searchParams.set("page", String(params.page));

  const query = searchParams.toString();
  const response = await fetch(`/api/admin/messages?${query}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Impossible de charger les messages.");
  }

  return response.json();
}

export async function updateMessageStatus(
  id: string,
  statut: "nouveau" | "en_cours" | "traite" | "archive"
): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch(`/api/admin/messages/${id}/status/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statut }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      message: data.detail || "Impossible de mettre à jour le statut du message.",
    };
  }

  return data;
}

export async function getSiteContent(): Promise<SiteContentResponse> {
  const response = await fetch("/api/admin/content", {
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Impossible de charger le contenu.");
  }

  return response.json();
}

export async function saveSiteContent(
  content: SiteContent
): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch("/api/admin/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      message: data.detail || "Impossible d'enregistrer le contenu.",
    };
  }

  return data;
}

export async function resetSiteContent(): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch("/api/admin/content/reset", {
    method: "POST",
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      message: data.detail || "Impossible de réinitialiser le contenu.",
    };
  }

  return data;
}

export async function subscribeNewsletter(email: string, nom: string): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch("/api/admin/newsletter/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, nom }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      message: data.detail || "Impossible de s'abonner à la newsletter.",
    };
  }

  return data;
}

export async function updateNewsletterStatus(
  email: string,
  statut: StatutNewsletter
): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch(`/api/admin/newsletter/${email}/status/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statut }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      message: data.detail || "Impossible de mettre à jour le statut.",
    };
  }

  return data;
}
