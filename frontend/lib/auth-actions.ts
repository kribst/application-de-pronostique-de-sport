type ActionPayload = {
  ok?: boolean;
  detail?: string;
  message?: string;
};

export async function postAuthAction(
  endpoint: string,
  body: Record<string, string>
): Promise<{ ok: boolean; message?: string }> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as ActionPayload;

    if (!response.ok || payload.ok !== true) {
      return {
        ok: false,
        message: payload.message ?? payload.detail ?? "La demande a échoué. Réessaie.",
      };
    }

    return { ok: true, message: payload.detail };
  } catch {
    return {
      ok: false,
      message: "Impossible de joindre le serveur. Vérifie ta connexion puis réessaie.",
    };
  }
}