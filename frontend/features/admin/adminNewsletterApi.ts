import type {
  NewsletterStatsResponse,
  NewsletterSubscribers,
  StatutNewsletter,
} from "../../types";

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
