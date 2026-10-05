"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { AuthResponsePayload } from "./auth-types";

type FieldErrors = Record<string, string[]>;

/**
 * Hook partage par les formulaires de connexion et d'inscription.
 *
 * Appelle la route Next /api/auth/*, qui elle-meme appelle Django et pose les
 * cookies httpOnly. En cas d'echec, DjangoError.fieldErrors est reporte sous
 * le champ concerne ; le message global sert pour les erreurs non attachees
 * a un champ (identifiants invalides, quota de tentatives atteint).
 */
export function useAuthForm(endpoint: "/api/auth/login" | "/api/auth/register") {
  const router = useRouter();

  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearError = useCallback((field: string) => {
    setFieldErrors((current) => {
      if (!(field in current)) return current;

      const next = { ...current };
      delete next[field];

      return next;
    });
    setMessage(null);
  }, []);

  const submit = useCallback(
    async (body: Record<string, unknown>) => {
      setPending(true);
      setMessage(null);
      setFieldErrors({});

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const payload = (await response.json()) as AuthResponsePayload;

        if (!payload.ok) {
          setMessage(payload.message);
          if (payload.fieldErrors) setFieldErrors(payload.fieldErrors);

          return false;
        }

        // La route indique ou aller : /dashboard apres connexion,
        // /auth/login apres inscription (aucune session ouverte).
        router.replace(payload.redirectTo);
        router.refresh();

        return true;
      } catch {
        setMessage(
          "Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez."
        );

        return false;
      } finally {
        setPending(false);
      }
    },
    [endpoint, router]
  );

  return { pending, message, fieldErrors, submit, clearError };
}

/** Premier message d'erreur d'un champ, s'il y en a un. */
export function firstError(fieldErrors: FieldErrors, field: string): string | null {
  const messages = fieldErrors[field];

  return messages && messages.length > 0 ? messages[0] : null;
}