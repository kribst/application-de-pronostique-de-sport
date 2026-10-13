import { postRegister } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/register
 * Corps : { email, username, password, password_confirm }
 * Reussite : 200 { ok: true, redirectTo: "/auth/login?registered=1" }.
 *
 * Aucune session n'est ouverte : les tokens renvoyes par Django sont jetes
 * cote serveur, aucun cookie n'est pose. L'utilisateur passe par l'ecran de
 * connexion pour vraiment s'authentifier.
 */
export async function POST(request: Request) {
  let body: {
    email?: unknown;
    username?: unknown;
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

  const { email, username, password, password_confirm } = body;

  if (
    typeof email !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof password_confirm !== "string" ||
    email.trim() === "" ||
    username.trim() === "" ||
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

  if (username.trim().length < 6) {
    return Response.json(
      {
        ok: false,
        message: "Le nom d’utilisateur doit contenir au moins 6 caractères.",
        fieldErrors: { username: ["Le nom d’utilisateur doit contenir au moins 6 caractères."] },
      },
      { status: 400 }
    );
  }

  if (username.trim().length > 150) {
    return Response.json(
      {
        ok: false,
        message: "Le nom d’utilisateur ne peut pas dépasser 150 caractères.",
        fieldErrors: { username: ["Le nom d’utilisateur ne peut pas dépasser 150 caractères."] },
      },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return Response.json(
      {
        ok: false,
        message: "Le mot de passe doit contenir au moins 6 caractères.",
        fieldErrors: { password: ["Le mot de passe doit contenir au moins 6 caractères."] },
      },
      { status: 400 }
    );
  }

  return postRegister({
    email: email.trim(),
    username: username.trim(),
    password,
    password_confirm,
  });
}