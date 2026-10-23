"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";

import { hasPremiumAccess, roleLabel, type AuthUser } from "@/lib/auth-types";
import type { Sport } from "@/lib/referential";
import "@/app/dashboard/dashboard.css";

type NavItem = { icon: string; label: string; href?: string; pro?: boolean };

/** Les entrees sans `href` sont des modules des phases suivantes. */
const NAV_ITEMS: NavItem[] = [
  { icon: "query_stats", label: "Dashboard", href: "/dashboard" },
  { icon: "category", label: "Sports", href: "/sports" },
  { icon: "sports_soccer", label: "Matchs", href: "/matches" },
  { icon: "trophy", label: "Compétitions", href: "/competitions" },
  { icon: "shield", label: "Équipes", href: "/teams" },
  { icon: "trending_up", label: "Value bets", pro: true },
  { icon: "account_tree", label: "Combinaisons" },
  { icon: "filter_center_focus", label: "Cote cible" },
  { icon: "history", label: "Historique" },
];

function Icon({ children }: { children: ReactNode }) {
  return <span className="material-symbols-outlined">{children}</span>;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open, onClose]);

  return (
    <aside id="app-sidebar" className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-content">
        <div className="brand">
          <div className="brand-logo">
            <span className="brand-mark">P</span>
          </div>
          <div>
            <span className="brand-name">Pronostique</span>
            <span className="brand-subtitle">Quant Engine</span>
          </div>
        </div>

        <div className="sidebar-scroll">
          <div className="nav-section-title">Analytique Quantitative</div>
          <nav className="main-nav">
            {NAV_ITEMS.map((item) => {
              const body = (
                <>
                  <div className="nav-item-left">
                    <Icon>{item.icon}</Icon>
                    <span>{item.label}</span>
                  </div>
                  {item.pro && (
                    <span className="pro-badge">
                      <Icon>lock</Icon>Pro
                    </span>
                  )}
                </>
              );

              return item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`nav-item ${isActive(pathname, item.href) ? "active" : ""}`}
                >
                  {body}
                </Link>
              ) : (
                <div key={item.label} className="nav-item" aria-disabled="true">
                  {body}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}

/** Selecteur de sport alimente par l'API : les sports inactifs sont grises. */
function SportSwitcher({ sports }: { sports: Sport[] }) {
  const params = useSearchParams();
  const firstActive = sports.find((s) => s.is_active)?.slug;
  const current = params.get("sport") ?? firstActive;

  return (
    <div className="sport-switcher">
      {sports.slice(0, 4).map((sport) =>
        sport.is_active ? (
          <Link
            key={sport.id}
            href={`/competitions?sport=${sport.slug}`}
            className={sport.slug === current ? "sport-active" : ""}
          >
            {sport.slug === current && <span />}
            {sport.name}
          </Link>
        ) : (
          <button key={sport.id} type="button" disabled>
            {sport.name} <small>(Bientôt)</small>
          </button>
        )
      )}
    </div>
  );
}

type HeaderProps = {
  user: AuthUser;
  sports: Sport[];
  open: boolean;
  onMenuClick: () => void;
};

function Header({ user, sports, open, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-main">
        <div className="header-left">
          <button type="button" className="menu-button" aria-label="Ouvrir le menu" aria-expanded={open} aria-controls="app-sidebar" onClick={onMenuClick}>
            <Icon>menu</Icon>
          </button>
          <SportSwitcher sports={sports} />
        </div>
        <div className="header-right">
          <div className="profile">
            <div className="profile-info">
              <div className="profile-name">
                <strong>{user.username}</strong>
                <span>{roleLabel(user)}</span>
              </div>
            </div>
            {hasPremiumAccess(user) ? null : (
              <button className="premium-button" type="button">
                Passer Premium
              </button>
            )}
            <button
              className="signout-button"
              disabled={signingOut}
              onClick={signOut}
              title="Se déconnecter"
              type="button"
            >
              <Icon>logout</Icon>
              <span className="signout-label">
                {signingOut ? "Déconnexion..." : "Déconnexion"}
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="responsible-bar">
        <Icon>gavel</Icon>
        <span>
          Les pronostics sont des probabilités, jamais des certitudes. 18+ · Jouez de façon responsable.
        </span>
      </div>
    </header>
  );
}

export default function AppShell({
  user,
  sports,
  children,
}: {
  user: AuthUser;
  sports: Sport[];
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="dashboard">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="dashboard-content">
        <Header user={user} sports={sports} open={menuOpen} onMenuClick={() => setMenuOpen((v) => !v)} />
        <main className="main-content">
          <div className="dashboard-container">{children}</div>
        </main>
      </div>
    </div>
  );
}
