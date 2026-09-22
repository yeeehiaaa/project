// ============================================================
// Freemium DOCTORZ Co. : plans par rôle, quotas, droits.
// Prix en DA. Annuel = -20 %. Test mode : activation immédiate
// (webhook SATIM réel à brancher plus tard sans changer l'API).
// ============================================================

export type RoleKey = "PATIENT" | "DOCTOR" | "PHARMACIST" | "LABORATORY_STAFF";

export interface PlanDef {
  monthly: number;
  yearly: number;
  free: string[];
  premium: string[];
  enforced: string[];
}

export const FREE_VIDEO_PER_MONTH = 1;
export const FREE_LAB_PRODUCTS = 3;

export const PLANS: Record<RoleKey, PlanDef> = {
  PATIENT: {
    monthly: 500,
    yearly: 4800,
    free: [
      "1 téléconsultation / mois",
      "Recherche médecins & pharmacies",
      "Réservations pharmacie",
      "Carnet de vaccinations",
    ],
    premium: [
      "Téléconsultations illimitées",
      "Rappels SMS (bientôt)",
      "Carnet familial — 5 membres (bientôt)",
      "Support prioritaire",
    ],
    enforced: ["teleconsult"],
  },
  DOCTOR: {
    monthly: 2000,
    yearly: 19200,
    free: [
      "Profil public",
      "Rendez-vous & visio reçues",
      "Ordonnances & dossier patient",
    ],
    premium: [
      "Mise en avant dans la recherche",
      "Badge ★ Premium",
      "Statistiques cabinet (bientôt)",
      "Téléconsultations illimitées",
    ],
    enforced: ["featured"],
  },
  PHARMACIST: {
    monthly: 1500,
    yearly: 14400,
    free: ["Stock & catalogue", "Réservations patients", "Alertes"],
    premium: [
      "Mise en avant dans la recherche",
      "Badge « Vérifiée »",
      "Statistiques de vues (bientôt)",
    ],
    enforced: ["featured"],
  },
  LABORATORY_STAFF: {
    monthly: 5000,
    yearly: 48000,
    free: [
      "Fiche laboratoire",
      "3 produits publiés",
      "Notifications médecins ciblées",
    ],
    premium: [
      "Produits illimités",
      "Push nationale",
      "Statistiques de portée avancées",
    ],
    enforced: ["lab_products"],
  },
};

export function planFor(userType: string): PlanDef {
  const key = String(userType || "").toUpperCase() as RoleKey;
  return PLANS[key] || PLANS.PATIENT;
}

export function amountFor(userType: string, cycle: string): number {
  const plan = planFor(userType);
  return cycle === "YEARLY" ? plan.yearly : plan.monthly;
}

// Abonnement premium réellement actif ?
export function isPremiumActive(sub: any): boolean {
  if (!sub || sub.plan !== "PREMIUM") return false;
  if (sub.status !== "ACTIVE") return false;
  if (sub.expiresAt && new Date(sub.expiresAt).getTime() <= Date.now()) return false;
  return true;
}

export function monthStart(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
