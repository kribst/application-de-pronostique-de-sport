import { AUTH_PATHS } from "@/lib/api";
import { postAuthAction } from "../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: {
    uid?: unknown;
    token?: unknown;
    password?: unknown;
    password_confirm?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Requête invalide." }, { status: 400 });
  }

  if (
    typeof body.uid !== "string" ||
    typeof body.token !== "string" ||
    typeof body.password !== "string" ||
    typeof body.password_confirm !== "string" ||
    !body.uid ||
    !body.token ||
    !body.password ||
    !body.password_confirm
  ) {
    return Response.json(
      { ok: false, message: "Le lien ou les informations du formulaire sont incomplets." },
      { status: 400 }
    );
  }

  return postAuthAction(AUTH_PATHS.passwordResetConfirm, {
    uid: body.uid,
    token: body.token,
    password: body.password,
    password_confirm: body.password_confirm,
  });
}