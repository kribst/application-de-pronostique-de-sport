import { AUTH_PATHS } from "@/lib/api";
import { postAuthAction } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { token?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Requête invalide." }, { status: 400 });
  }

  if (typeof body.token !== "string" || !body.token) {
    return Response.json(
      { ok: false, message: "Le lien de confirmation est incomplet." },
      { status: 400 }
    );
  }

  return postAuthAction(AUTH_PATHS.verifyEmail, { token: body.token });
}