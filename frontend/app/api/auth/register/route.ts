import { postRegister } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/register
 * Corps : { email, password, password_confirm }
 * Reussite : 200 { ok: true, redirectTo: "/auth/login?registered=1" }.
 *
 * Aucune session n'est ouverte : les tokens renvoyes par Django sont jetes
 * cote serveur, aucun cookie n'est pose. L'utilisateur passe par l'ecran de
 * connexion pour vraiment s'authentifier.
 */
export async function POST(request: Request) {
  let body: {
    email?: unknown;
    password?: unknown;
    password_confirm?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, message: "Requête invalide." },
      { status: 400 }
    );
  }

  const { email, password, password_confirm } = body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof password_confirm !== "string" ||
    email.trim() === "" ||
    password === "" ||
    password_confirm === ""
  ) {
    return Response.json(
      {
        ok: false,
        message: "Renseignez l'email et les deux mots de passe.",
      },
      { status: 400 }
    );
  }

  return postRegister({
    email: email.trim(),
    password,
    password_confirm,
  });
}