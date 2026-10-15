// Types partages entre le frontend d'administration et l'API Django.

export type Role = "USER" | "PREMIUM" | "MODERATOR" | "ADMIN";

export type StatutMessage =
  | "nouveau"
  | "en_cours"
  | "traite"
  | "archive";

export type StatutNewsletter = "actif" | "inactif";

export type StatutSiteContent = "active" | "inactive";

export interface CompanyInfo {
  nom: string;
  siret: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  email: string;
  telephone: string;
  siteWeb: string;
  logo: string;
  favicon: string;
  googleMaps: string;
  socialLinks: SocialLink[];
  legalNotes: string;
  contactPageNotes: string;
  aboutPageNotes: string;
  termsPageNotes: string;
}

export interface SocialLink {
  nom: string;
  url: string;
  icone: string;
}

export interface Service {
  id: string;
  titre: string;
  sousTitre: string;
  image: string;
  imageAlt: string;
  resume: string;
  description: string;
  keyPoints: string[];
  includes: string[];
  audience: string[];
  benefits: string[];
  useCases: string[];
  process: string[];
  relatedSlugs: string[];
}

export interface Statistic {
  id: string;
  valeur: string;
  libelle: string;
  description: string;
  icone: string;
}

export interface Testimonial {
  id: string;
  nom: string;
  role: string;
  quote: string;
  avatar: string;
}

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  ordre: number;
}

export interface SeoSettings {
  titre: string;
  description: string;
  motsCles: string[];
  canonicalUrl: string;
  noindex: boolean;
  nofollow: boolean;
  ogTitre: string;
  ogDescription: string;
  ogImage: string;
  twitterTitre: string;
  twitterDescription: string;
  twitterImage: string;
}

export interface ContactSection {
  accueil: string;
  formulaire: string;
  confirmation: string;
  messageEnvoye: string;
  emailRemplacement: string;
  subjectFormulaire: string;
}

export interface MapSection {
  cadre: string;
  adresse: string;
  neighbourhood: string;
  city: string;
  postcode: string;
  country: string;
}

export interface SiteContent {
  company: CompanyInfo;
  seo: SeoSettings;
  services: Service[];
  statistics: Statistic[];
  testimonials: Testimonial[];
  processSteps: ProcessStep[];
  contact: ContactSection;
  map: MapSection;
}

export interface SocialMedia {
  twitter: string;
  facebook: string;
  linkedin: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  discord: string;
  twitch: string;
}

export interface NewsletterSubscribers {
  id: string;
  email: string;
  nom: string;
  statut: StatutNewsletter;
  inscritsLe: string;
}

export interface DashboardStats {
  nouveau: number;
  en_cours: number;
  traite: number;
  archive: number;
  total: number;
  recent_messages: ContactMessage[];
}

export interface ContactMessage {
  id: string;
  nom: string;
  email: string;
  objet: string;
  message: string;
  statut: StatutMessage;
  creeLe: string;
  expiresLe: string;
}

export interface SiteContentDraft extends Omit<SiteContent, "id"> {
  id: string;
}

export interface SiteContentUpdateRequest {
  company: Partial<CompanyInfo>;
  seo: Partial<SeoSettings>;
  services: Partial<Service>[];
  statistics: Partial<Statistic>[];
  testimonials: Partial<Testimonial>[];
  processSteps: Partial<ProcessStep>[];
  contact: Partial<ContactSection>;
  map: Partial<MapSection>;
}

export interface DashboardStatsResponse {
  nouveau: number;
  en_cours: number;
  traite: number;
  archive: number;
  total: number;
  recent_messages: ContactMessage[];
}

export interface NewsletterStatsResponse {
  actifs: number;
  inactifs: number;
  total: number;
  inscrits: NewsletterSubscribers[];
}

export interface SiteContentResponse {
  id: string;
  content: SiteContent;
  version: number;
}

export interface MessageListResponse {
  messages: ContactMessage[];
  total: number;
}

export interface LoginResponse {
  ok: true;
  user: {
    id: string;
    email: string;
    username: string;
    role: Role;
    is_staff: boolean;
    is_superuser: boolean;
    is_active: boolean;
    date_joined: string;
  };
}

export interface LoginError {
  ok: false;
  message: string;
}

export interface RefreshResponse {
  ok: true;
  access: string;
  refresh: string;
}

export interface LogoutResponse {
  ok: true;
}

export interface NewsletterSubscribeRequest {
  email: string;
  nom: string;
}

export interface NewsletterSubscribeResponse {
  ok: true;
  message: string;
}

export interface NewsletterStatusUpdateRequest {
  statut: StatutNewsletter;
}

export interface SiteContentSaveRequest {
  id: string;
  content: SiteContent;
}
