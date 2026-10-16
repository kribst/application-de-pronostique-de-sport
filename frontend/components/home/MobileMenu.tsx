"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="mobile-menu-button"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        aria-controls="mobile-menu-panel"
        onClick={() => setOpen(!open)}
      >
        <span className="material-symbols-outlined">{open ? "close" : "menu"}</span>
      </button>

      {open && (
        <nav id="mobile-menu-panel" className="mobile-menu-panel">
          <a href="#fonctionnalites" onClick={() => setOpen(false)}>
            Fonctionnalités
          </a>
          <a href="#methode" onClick={() => setOpen(false)}>
            Méthodologie
          </a>
          <a href="#offres" onClick={() => setOpen(false)}>
            Offres
          </a>
          <a href="#jeu-responsable" onClick={() => setOpen(false)}>
            Jeu responsable
          </a>
          <Link href="/auth/login" onClick={() => setOpen(false)}>
            Se connecter
          </Link>
          <Link href="/auth/register" onClick={() => setOpen(false)}>
            Créer un compte
          </Link>
        </nav>
      )}
    </>
  );
}
