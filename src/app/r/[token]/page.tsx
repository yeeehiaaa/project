import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DoctorzBrand from "@/components/brand/DoctorzBrand";

export const dynamic = "force-dynamic";

async function getEmergencyData(token: string) {
  try {
    const found = await prisma.patient.findMany({
      where: { emergencyToken: token },
      include: { profile: true },
    });
    const patient = (found || []).find((p: any) => p.emergencyToken === token);
    if (!patient) {
      console.warn(
        `Emergency page: no patient for token ${String(token).slice(0, 6)}...`
      );
      return null;
    }
    return patient;
  } catch (err) {
    console.error(
      `Emergency page DB error (token ${String(token).slice(0, 6)}...). ` +
        `Did you run "npx prisma migrate deploy" + "npx prisma generate"?`,
      err
    );
    return null;
  }
}

export default async function EmergencyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token) notFound();

  const patient: any = await getEmergencyData(token);
  if (!patient) notFound();

  const profile = patient.profile || {};
  const fullName =
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Patient";
  const allergies: string[] = String(patient.allergies || "")
    .split(",")
    .map((a: string) => a.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-950 via-slate-950 to-slate-950 text-white flex flex-col items-center px-4 py-10">
      <DoctorzBrand isDark size={52} />

      <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-widest animate-pulse">
        Urgence médicale — Emergency
      </div>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-center">
        {fullName}
      </h1>
      <p className="mt-1 text-sm text-slate-400">
        Carte d'urgence DOCTORZ Co. — informations vitales
      </p>

      {/* Groupe sanguin */}
      <div className="mt-8 w-full max-w-md rounded-3xl border border-red-500/40 bg-red-600/15 p-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-red-300">
          Groupe sanguin — Blood type
        </p>
        <p className="mt-1 text-5xl font-black text-red-400">
          {patient.bloodType || "—"}
        </p>
      </div>

      {/* Allergies */}
      <div className="mt-4 w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Allergies connues
        </p>
        {allergies.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {allergies.map((a, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-bold"
              >
                {a}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">Aucune allergie déclarée.</p>
        )}
      </div>

      {/* Pathologies */}
      {patient.chronicConditions && (
        <div className="mt-4 w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pathologies chroniques
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-100">
            {patient.chronicConditions}
          </p>
          {patient.currentMedications && (
            <p className="mt-1 text-xs text-slate-400">
              Traitement : {patient.currentMedications}
            </p>
          )}
        </div>
      )}

      {/* Contact d'urgence */}
      <a
        href={
          patient.emergencyContactPhone
            ? `tel:${String(patient.emergencyContactPhone).replace(/[^+\d]/g, "")}`
            : undefined
        }
        className="mt-4 w-full max-w-md rounded-3xl border border-emerald-500/40 bg-emerald-600/15 p-6 block transition hover:bg-emerald-600/25 active:scale-[0.99]"
      >
        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
          Contact d'urgence — tap to call
        </p>
        <p className="mt-2 text-lg font-bold text-white">
          {patient.emergencyContactName || "Non renseigné"}
        </p>
        {patient.emergencyContactPhone && (
          <p className="mt-0.5 text-sm text-emerald-300 font-mono">
            {patient.emergencyContactPhone}
            {patient.emergencyContactRelation
              ? ` (${patient.emergencyContactRelation})`
              : ""}
          </p>
        )}
      </a>

      <p className="mt-8 max-w-md text-center text-[11px] leading-5 text-slate-500">
        Vérifiez l'identité du patient avant tout geste. Ces informations sont
        fournies par le patient via DOCTORZ Co. et ne remplacent pas un avis
        médical. En cas de doute, appelez les secours.
      </p>
    </div>
  );
}
