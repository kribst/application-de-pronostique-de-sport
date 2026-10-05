import { postLogin } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 * Corps : { email, password }
 * Reussite : 200 { ok: true, user, redirectTo } + cookies httpOnly
 * sp_access / sp_refresh. Les tokens ne quittent jamais le serveur : le
 * navigateur ne recoit que `user`.
 */
export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, message: "Requête invalide." },
      { status: 400 }
    );
  }

  if (
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    body.email.trim() === "" ||
    body.password === ""
  ) {
    return Response.json(
      {
        ok: false,
        message: "Renseignez votre email et votre mot de passe.",
      },
      { status: 400 }
    );
  }

  return postLogin({
    email: body.email.trim(),
    password: body.password,
  });
}