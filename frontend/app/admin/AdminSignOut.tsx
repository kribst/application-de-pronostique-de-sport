"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminSignOut() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setError("");
    setIsSigningOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("La déconnexion n’a pas pu être effectuée.");
      }

      router.replace("/auth/login");
      router.refresh();
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "La déconnexion n’a pas pu être effectuée."
      );
      setIsSigningOut(false);
    }
  }

  return (
    <div>
      <button
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
        disabled={isSigningOut}
        onClick={signOut}
        type="button"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          logout
        </span>
        {isSigningOut ? "Déconnexion..." : "Se déconnecter"}
      </button>
      {error ? (
        <p className="px-4 pt-2 text-xs leading-5 text-red-200" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
