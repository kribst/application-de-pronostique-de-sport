import { AUTH_PATHS } from "@/lib/api";
import { postAuthAction } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { email?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Requête invalide." }, { status: 400 });
  }

  if (typeof body.email !== "string" || !body.email.trim()) {
    return Response.json(
      { ok: false, message: "Renseignez une adresse email valide." },
      { status: 400 }
    );
  }

  return postAuthAction(AUTH_PATHS.passwordReset, { email: body.email.trim() });
}