"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getSiteContent, saveSiteContent, resetSiteContent, type SiteContent, type SiteContentResponse } from "./siteContentApi";

interface SiteContentContextValue {
  content: SiteContent;
  isLoading: boolean;
  isSaving: boolean;
  success: string;
  error: string;
  saveContent: (content: SiteContent) => Promise<boolean>;
  resetContent: () => Promise<boolean>;
}

const SiteContentContext = createContext<SiteContentContextValue | undefined>(undefined);

interface SiteContentProviderProps {
  children: ReactNode;
}

export function SiteContentProvider({ children }: SiteContentProviderProps) {
  const [content, setContent] = useState<SiteContent>({
    company: {
      nom: "Pronostique",
      siret: "",
      adresse: "",
      codePostal: "",
      ville: "",
      pays: "",
      email: "",
      telephone: "",
      siteWeb: "",
      logo: "",
      favicon: "",
      googleMaps: "",
      socialLinks: [],
      legalNotes: "",
      contactPageNotes: "",
      aboutPageNotes: "",
      termsPageNotes: "",
    },
    seo: {
      titre: "",
      description: "",
      motsCles: [],
      canonicalUrl: "",
      noindex: false,
      nofollow: false,
      ogTitre: "",
      ogDescription: "",
      ogImage: "",
      twitterTitre: "",
      twitterDescription: "",
      twitterImage: "",
    },
    services: [],
    statistics: [],
    testimonials: [],
    processSteps: [],
    contact: {
      accueil: "",
      formulaire: "",
      confirmation: "",
      messageEnvoye: "",
      emailRemplacement: "",
      subjectFormulaire: "",
    },
    map: {
      cadre: "",
      adresse: "",
      neighbourhood: "",
      city: "",
      postcode: "",
      country: "",
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadContent() {
      try {
        const response = await getSiteContent();
        setContent(response.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger le contenu.");
      } finally {
        setIsLoading(false);
      }
    }
    loadContent();
  }, []);

  const saveContent = useCallback(async (newContent: SiteContent) => {
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      const result = await saveSiteContent(newContent);
      if (result.ok) {
        setSuccess("Contenu enregistré avec succès.");
        setContent(newContent);
        return true;
      } else {
        setError(result.message || "Erreur lors de l'enregistrement.");
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const resetContent = useCallback(async () => {
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      const result = await resetSiteContent();
      if (result.ok) {
        setSuccess("Contenu réinitialisé avec succès.");
        return true;
      } else {
        setError(result.message || "Erreur lors de la réinitialisation.");
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return (
    <SiteContentContext.Provider
      value={{ content, isLoading, isSaving, success, error, saveContent, resetContent }}
    >
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error("useSiteContent must be used within a SiteContentProvider");
  }
  return context;
}
